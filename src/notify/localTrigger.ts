/**
 * Layer 3 of the daily reminder: a notification scheduled locally, on the
 * device, with no server involved at all.
 *
 * This is the backstop. If the owner never deploys the sender (Layer 2), or
 * deploys it and it falls over, a Chromium browser can still buzz her at the
 * time she picked — because the notification was handed to the operating
 * system the last time she opened the app.
 *
 * It is a backstop and not the plan because Notification Triggers is a
 * Chromium-only API: no Firefox, no Safari, so no iPhone. It also only
 * reaches as far ahead as the last time she opened the app, which is why we
 * reschedule on every open. On everything else this module does nothing,
 * silently, and Layers 2 and 1 carry the feature.
 */

/**
 * `showTrigger`, `TimestampTrigger` and `includeTriggered` are all real, all
 * shipped in Chromium, and none of them are in TypeScript's DOM library. We
 * describe the slice we use and cast at the single point of contact — no
 * `any`, and the shape we depend on is written down rather than assumed.
 */
interface TimestampTriggerConstructor {
  new (timestamp: number): object
}

interface TriggerNotificationOptions extends NotificationOptions {
  showTrigger?: object
}

interface TriggerCapableRegistration {
  showNotification(title: string, options?: TriggerNotificationOptions): Promise<void>
  getNotifications(filter?: { tag?: string; includeTriggered?: boolean }): Promise<Notification[]>
}

/**
 * The same tag the service worker's push handler uses (public/push-sw.js).
 * Shared on purpose: if both layers ever fire on the same day, the second
 * replaces the first in the tray instead of buzzing her twice.
 */
export const REMINDER_TAG = 'english-nz-daily-reminder'

/**
 * Word-for-word what a pushed reminder says. She should not be able to tell
 * which layer reached her — and if she compares two days, they should not
 * read as two different features.
 */
const TITLE = 'English → NZ'
const OPTIONS: NotificationOptions = {
  body: 'Time for your daily English 🥝',
  icon: '/icon-192.png',
  badge: '/icon-192.png',
  tag: REMINDER_TAG,
  data: { url: '/' },
}

/** Chromium with Notification Triggers, a service worker, and a Notification API. */
export function supportsLocalTrigger(): boolean {
  return (
    typeof window !== 'undefined' &&
    'TimestampTrigger' in window &&
    typeof Notification !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator
  )
}

function timestampTrigger(): TimestampTriggerConstructor | null {
  if (!supportsLocalTrigger()) return null
  const ctor = (window as unknown as Record<string, unknown>).TimestampTrigger
  return typeof ctor === 'function' ? (ctor as TimestampTriggerConstructor) : null
}

/**
 * Close any reminder we previously scheduled, fired or not.
 *
 * Called before scheduling a new one (so a changed reminder time does not
 * leave yesterday's 19:00 queued alongside today's 07:30), and called on its
 * own whenever Layer 2 takes over or she switches reminders off.
 *
 * Never throws. A browser without triggers has nothing to close.
 */
export async function cancelLocalReminder(): Promise<void> {
  if (!supportsLocalTrigger()) return
  try {
    const registration = (await navigator.serviceWorker.ready) as unknown as TriggerCapableRegistration
    const pending = await registration.getNotifications({ tag: REMINDER_TAG, includeTriggered: true })
    for (const notification of pending) notification.close()
  } catch {
    // Nothing to report and nothing to fix — the worst case is one stale
    // notification that shares our tag and will be replaced, not duplicated.
  }
}

/**
 * Hand the operating system one reminder, for the instant `at`.
 *
 * Returns whether it was actually scheduled, so the caller can say honestly
 * which layer is covering her. Every "no" is quiet:
 *
 * - not Chromium, or no service worker → `false`
 * - permission not granted → `false` (we never prompt from here; Settings
 *   owns the one prompt, tied to her tapping the switch)
 * - `at` already in the past → `false`, rather than a notification that fires
 *   the moment she opens the app
 * - anything thrown → `false`
 */
export async function scheduleLocalReminder(at: number, now: number): Promise<boolean> {
  const Trigger = timestampTrigger()
  if (!Trigger) return false
  if (Notification.permission !== 'granted') return false
  if (!Number.isFinite(at) || at <= now) return false

  try {
    const registration = (await navigator.serviceWorker.ready) as unknown as TriggerCapableRegistration
    await cancelLocalReminder()
    await registration.showNotification(TITLE, { ...OPTIONS, showTrigger: new Trigger(at) })
    return true
  } catch {
    return false
  }
}
