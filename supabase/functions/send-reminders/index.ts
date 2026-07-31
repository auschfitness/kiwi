// English → NZ — the daily reminder sender (Layer 2's server half).
//
// A Supabase Edge Function, Deno, meant to run on a schedule of roughly every
// fifteen minutes. Each run it asks one question of every stored push
// subscription: "is it her reminder time, where she is, and has she not
// already been reminded today?" — and pushes to the ones that say yes.
//
// NOT DEPLOYED. The app works without it (see src/notify/delivery.ts: Layer 3
// then Layer 1), and nothing in the client breaks while this does not exist.
// The runbook for deploying it is in .superpowers/sdd/a4b-report.md and,
// in plain language, in the README.
//
// SECRETS IT NEEDS (set with `supabase secrets set`, never committed):
//   VAPID_PUBLIC_KEY   — the same key the app builds with as VITE_VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY  — its pair. Secret. Only ever lives here.
//   VAPID_SUBJECT      — a contact URL or mailto:, e.g. mailto:you@example.com
// Generate the pair once with:  npx web-push generate-vapid-keys
//
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the platform.
// The service role is required and correct here: the tables have RLS on with
// no anon policies, and this is the one caller that legitimately reads across
// all rows. It runs server-side only; the key never reaches a browser.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface PushSubscriptionRow {
  code: string | null
  endpoint: string
  keys: { p256dh?: string; auth?: string }
  reminder_time: string
  tz: string
  last_sent: string | null
}

/**
 * How late a reminder may still go out.
 *
 * The schedule is every ~15 minutes and can drift, so "her local time equals
 * reminder_time" would miss almost every reminder. Instead we send once the
 * moment has arrived and is less than an hour old. `last_sent` guarantees
 * exactly one send per local day, so a wide window costs nothing.
 *
 * The known gap: a reminder set in the last hour before midnight can be
 * missed if every scheduled run in that window fails, because the window does
 * not wrap past midnight — deliberately, since a "yesterday's reminder"
 * arriving at 00:30 is worse than none.
 */
const WINDOW_MINUTES = 60

/** `"HH:MM"` → minutes past midnight, or null if it is not a time. */
function parseHhMm(value: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value ?? '')
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

/** Local wall-clock minutes past midnight for `now` in IANA zone `tz`. */
function minutesOfDayIn(tz: string, now: Date): number | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(now)
    const hour = parts.find(p => p.type === 'hour')?.value
    const minute = parts.find(p => p.type === 'minute')?.value
    if (hour === undefined || minute === undefined) return null
    // en-GB renders midnight as "24" in some ICU builds.
    return (Number(hour) % 24) * 60 + Number(minute)
  } catch {
    // An unknown timezone string. Skip the row rather than guess at UTC and
    // buzz her at the wrong hour.
    return null
  }
}

/** ISO `YYYY-MM-DD` for `now` in zone `tz` — what goes into `last_sent`. */
function isoDateIn(tz: string, now: Date): string | null {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now)
  } catch {
    return null
  }
}

/**
 * The app's own local day key, e.g. `2026-7-31` — no zero padding.
 *
 * This must stay byte-identical to `dayKey` in src/core/time.ts, because it
 * is compared against `doneDate` as the app wrote it. Padding it would make
 * every comparison false and turn the studied-today check into a no-op that
 * still looks like it works.
 */
function appDayKeyIn(tz: string, now: Date): string | null {
  const iso = isoDateIn(tz, now)
  if (!iso) return null
  const [y, m, d] = iso.split('-')
  return `${Number(y)}-${Number(m)}-${Number(d)}`
}

/** Has she already done her cards today, in her own timezone? */
async function studiedToday(
  supabase: ReturnType<typeof createClient>,
  code: string | null,
  tz: string,
  now: Date,
): Promise<boolean> {
  // No sync code means no progress to look at. Best-effort means best-effort:
  // we send, because the reminder is still more likely to help than not.
  if (!code) return false

  const dayKey = appDayKeyIn(tz, now)
  if (!dayKey) return false

  try {
    const { data, error } = await supabase.rpc('load_progress', { p_code: code })
    if (error || !data) return false
    const state = data as { doneDate?: string | null; doneToday?: number }
    return state.doneDate === dayKey && (state.doneToday ?? 0) > 0
  } catch {
    // A reminder sent to someone who already studied is a small annoyance.
    // Failing to send because the lookup wobbled is the bigger loss, so an
    // error here means "we don't know", which means "send".
    return false
  }
}

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT')

  if (!supabaseUrl || !serviceRoleKey || !publicKey || !privateKey || !subject) {
    // Loud on purpose: this one only ever happens to the owner, during setup,
    // and naming the missing piece saves an hour of guessing.
    return new Response(
      JSON.stringify({
        error: 'Missing configuration',
        need: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT']
          .filter(name => !Deno.env.get(name)),
      }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    )
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const now = new Date()
  const { data: rows, error } = await supabase
    .from('push_subscriptions')
    .select('code, endpoint, keys, reminder_time, tz, last_sent')

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { 'content-type': 'application/json' },
    })
  }

  const payload = JSON.stringify({
    title: 'English → NZ',
    body: 'Time for your daily English 🥝',
    url: '/',
  })

  let sent = 0
  let skipped = 0
  let pruned = 0

  for (const row of (rows ?? []) as PushSubscriptionRow[]) {
    const target = parseHhMm(row.reminder_time)
    const localMinutes = minutesOfDayIn(row.tz, now)
    const localDate = isoDateIn(row.tz, now)
    if (target === null || localMinutes === null || localDate === null) { skipped += 1; continue }

    const delta = localMinutes - target
    if (delta < 0 || delta >= WINDOW_MINUTES) { skipped += 1; continue }

    // One per local day, whatever the schedule does. `last_sent` is a date
    // column, so Supabase hands it back as `YYYY-MM-DD` — the same shape
    // isoDateIn produces.
    if (row.last_sent && row.last_sent >= localDate) { skipped += 1; continue }

    if (await studiedToday(supabase, row.code, row.tz, now)) {
      // She has already done the work. Nagging afterwards is worse than
      // staying quiet — but mark the day as handled, so we do not re-check
      // her on every run for the rest of the hour.
      await supabase.from('push_subscriptions').update({ last_sent: localDate }).eq('endpoint', row.endpoint)
      skipped += 1
      continue
    }

    try {
      await webpush.sendNotification(
        { endpoint: row.endpoint, keys: { p256dh: row.keys?.p256dh ?? '', auth: row.keys?.auth ?? '' } },
        payload,
      )
      await supabase.from('push_subscriptions').update({ last_sent: localDate }).eq('endpoint', row.endpoint)
      sent += 1
    } catch (err) {
      // 404/410 is the push service saying this endpoint is gone for good —
      // the app was uninstalled, or the browser rotated it. Prune it rather
      // than retry it forever.
      const statusCode = (err as { statusCode?: number }).statusCode
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint)
        pruned += 1
      } else {
        skipped += 1
      }
    }
  }

  return new Response(JSON.stringify({ sent, skipped, pruned, at: now.toISOString() }), {
    headers: { 'content-type': 'application/json' },
  })
})
