import { getClient, isSyncConfigured } from './client'

/**
 * Layer 2 of the daily reminder: a real Web Push subscription, so her phone
 * can buzz at the time she picked even when the app is closed.
 *
 * Structured like `client.ts` next door: read the environment, answer
 * "configured?" honestly, and make every exported call a no-op rather than a
 * throw when the answer is no. Nothing here ever rejects — the caller
 * (src/notify/useReminders.ts) decides what to fall back to, and the app must
 * be exactly as it is today when this is all switched off.
 */

/**
 * Read lazily rather than into a module-level `const` the way `client.ts`
 * does. The reason is testability: `vi.stubEnv` patches `import.meta.env`
 * after the module has been imported, and a `const` captured at import time
 * would never see it. Behaviour is identical in the browser, where the value
 * is inlined at build time either way.
 */
function vapidPublicKey(): string | undefined {
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  return key && key.length > 0 ? key : undefined
}

/**
 * True only when the whole chain exists: a Supabase project to store the
 * subscription in, *and* a VAPID public key to sign it with. Either one
 * missing means the owner has not finished the (optional) push setup, and
 * the honest response is to leave push alone entirely — no subscribe attempt,
 * no console noise, no permission prompt she cannot benefit from.
 */
export function isPushConfigured(): boolean {
  return isSyncConfigured() && vapidPublicKey() !== undefined
}

/** What a browser needs before `pushManager.subscribe` is even meaningful. */
export function isPushSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    typeof window !== 'undefined' &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  )
}

/**
 * Every way this can end, named. `error` is the only unhappy one that
 * deserves a retry; the rest are ordinary facts about her device or the
 * owner's setup, and each one falls through to Layer 3 and then Layer 1.
 */
export type PushOutcome =
  /** No Supabase project or no VAPID key — the owner has not set push up. */
  | 'unconfigured'
  /** This browser has no service worker, no PushManager, or no Notification. */
  | 'unsupported'
  /** She has not granted notification permission (or has refused it). */
  | 'denied'
  /** Subscribed and stored. Layer 2 is live; Layer 3 must stand down. */
  | 'subscribed'
  /** Something went wrong — network, the RPC, the push service. */
  | 'error'

export interface EnablePushInput {
  /** Her sync code, so the sender can skip a nudge she has already earned.
   *  `null` is fine — she may use push without ever setting up cloud sync;
   *  the sender then just cannot check whether she studied today. */
  code: string | null
  /** `"HH:MM"`, 24-hour, exactly as stored in `AppState.reminderTime`. */
  reminderTime: string
}

/**
 * The browser hands us a base64url VAPID key; `pushManager.subscribe` wants
 * bytes. Standard conversion — padding restored, URL-safe alphabet undone.
 *
 * The return type is spelled `Uint8Array<ArrayBuffer>` rather than the bare
 * `Uint8Array`, which since TypeScript 5.7 means `Uint8Array<ArrayBufferLike>`
 * and so might be backed by a `SharedArrayBuffer` — something `BufferSource`
 * does not accept. Pinning it is the honest fix; casting at the call site
 * would only hide the same question.
 */
function urlBase64ToUint8Array(base64UrlKey: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64UrlKey.length % 4)) % 4)
  const base64 = (base64UrlKey + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i)
  return bytes
}

/** The device's own IANA zone, e.g. `America/Chicago`. UTC if it refuses. */
function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/** The `{ p256dh, auth }` pair, in the shape `toJSON()` actually returns. */
function subscriptionKeys(sub: PushSubscription): Record<string, string> {
  const json = sub.toJSON()
  return json.keys ?? {}
}

/**
 * Subscribe this device (idempotently) and store the subscription.
 *
 * Order matters, and every gate is a quiet return rather than a throw:
 *
 * 1. Not configured → `'unconfigured'`. **Before anything else**, so an empty
 *    `.env` never reaches a Supabase client, a service worker or a
 *    permission prompt.
 * 2. Browser can't do push → `'unsupported'`.
 * 3. Permission not already granted → `'denied'`. We never ask here; Settings
 *    owns the one prompt, tied to her tapping the switch.
 * 4. Reuse an existing subscription if there is one, otherwise subscribe.
 * 5. Upsert it — endpoint, keys, her time, her timezone, her code.
 *
 * Re-running this after she changes the reminder time is the *intended* way
 * to update it: the upsert is keyed on the endpoint, so it rewrites the row
 * rather than adding a second one.
 */
export async function enablePush({ code, reminderTime }: EnablePushInput): Promise<PushOutcome> {
  if (!isPushConfigured()) return 'unconfigured'
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission !== 'granted') return 'denied'

  const key = vapidPublicKey()
  if (key === undefined) return 'unconfigured'

  const supabase = getClient()
  if (!supabase) return 'unconfigured'

  try {
    const registration = await navigator.serviceWorker.ready
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      }))

    const { error } = await supabase.rpc('upsert_push_subscription', {
      p_code: code,
      p_endpoint: subscription.endpoint,
      p_keys: subscriptionKeys(subscription),
      p_reminder_time: reminderTime,
      p_tz: deviceTimeZone(),
    })
    if (error) return 'error'

    return 'subscribed'
  } catch {
    // A push service that is down, a service worker that never becomes
    // ready, a subscribe the browser refuses — none of these are hers to
    // fix, and none of them may take the in-app reminder down with them.
    return 'error'
  }
}

/**
 * Undo it: drop the row first, then unsubscribe locally.
 *
 * That order is deliberate. Deleting first means that if only the second step
 * fails, the row is already gone and nothing can push at her again. The other
 * order risks a live row whose endpoint we can no longer name.
 *
 * The delete gets its own `try` so that a failed one — she is offline, the
 * project is down — does not skip the unsubscribe. She asked for this off,
 * and a local unsubscribe alone still achieves it: the endpoint dies, the
 * next send gets a 410, and the sender prunes the stale row itself (see
 * supabase/functions/send-reminders/index.ts).
 *
 * Best-effort throughout: never throws, and does nothing at all when push was
 * never configured.
 */
export async function disablePush(): Promise<void> {
  if (!isPushSupported()) return

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    if (!subscription) return

    const supabase = isPushConfigured() ? getClient() : null
    if (supabase) {
      try {
        await supabase.rpc('delete_push_subscription', { p_endpoint: subscription.endpoint })
      } catch {
        // Fall through to the unsubscribe — see above.
      }
    }
    await subscription.unsubscribe()
  } catch {
    // Nothing to tell her: the preference is already off, and there is no
    // action she could take that would help.
  }
}
