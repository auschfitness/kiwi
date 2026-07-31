import { useEffect } from 'react'
import { useStore } from '../store/useStore'
import { nextReminderAt } from '../core/reminder'
import { disablePush, enablePush } from '../sync/push'
import { cancelLocalReminder, scheduleLocalReminder } from './localTrigger'

/**
 * The ordering rule, in one place.
 *
 * Three layers, best first:
 *
 *   2. **Web Push** — a real server sends it, so it reaches her whether or
 *      not she has opened the app, on any browser that supports push.
 *   3. **A locally scheduled notification** — Chromium only, and only as far
 *      ahead as the last time she opened the app, but it needs no backend at
 *      all. This is what covers her while the sender is undeployed.
 *   1. **The in-app nudge** — always there, needs nothing, and is the whole
 *      feature on iPhone-in-a-tab and anywhere else the other two cannot go.
 *
 * The rule is: take the best one available, and *only* that one. Layer 1 is
 * not in this file — it costs nothing and cannot double up, because it only
 * ever appears inside the running app; a toast she is already looking at is
 * not a second buzz. Layers 2 and 3 both put a notification in the system
 * tray, so exactly one of them may be armed at a time. Being reminded twice
 * for the same day is how a helpful app becomes a deleted one.
 */

/** Which layer ended up covering her — returned so callers can be honest. */
export type ReminderCoverage =
  /** Reminders are switched off. Nothing is armed. */
  | 'off'
  /** Layer 2. A push subscription is stored; the sender will do the rest. */
  | 'push'
  /** Layer 3. Tomorrow's notification is queued on this device. */
  | 'local'
  /** Neither background layer is available — Layer 1 alone, and that's fine. */
  | 'in-app'

export interface ReminderPrefs {
  reminderEnabled: boolean
  reminderTime: string
  syncCode: string | null
}

/**
 * Bring the background layers into line with what she has asked for.
 *
 * Safe to call as often as you like — both layers are idempotent (the push
 * subscription upserts on its endpoint; the local trigger cancels its own tag
 * before scheduling). Called on every app open, whenever her reminder
 * settings change, and again from Settings the moment a permission prompt
 * comes back, since permission can arrive *after* the preference did.
 *
 * Never throws, and never surfaces anything to her. The worst outcome is
 * `'in-app'`, which is exactly the app she has today.
 */
export async function refreshReminderDelivery(
  prefs: ReminderPrefs,
  now: number,
): Promise<ReminderCoverage> {
  try {
    if (!prefs.reminderEnabled) {
      await cancelLocalReminder()
      await disablePush()
      return 'off'
    }

    // Layer 2 first. 'subscribed' is the only answer that means a server will
    // reach her; everything else ('unconfigured' while the owner has not
    // deployed the sender, 'unsupported', 'denied', 'error') falls through.
    const outcome = await enablePush({ code: prefs.syncCode, reminderTime: prefs.reminderTime })
    if (outcome === 'subscribed') {
      // Stand Layer 3 down. If push is working, a local trigger for the same
      // day is a second buzz for one reminder.
      await cancelLocalReminder()
      return 'push'
    }

    const at = nextReminderAt(prefs.reminderTime, now)
    if (at === null) {
      // An unparseable time buys silence, never a guess — same rule as the
      // in-app nudge (src/core/reminder.ts).
      await cancelLocalReminder()
      return 'in-app'
    }

    return (await scheduleLocalReminder(at, now)) ? 'local' : 'in-app'
  } catch {
    return 'in-app'
  }
}

/**
 * Mount once, at the top of the app. Re-runs whenever the three things the
 * background layers depend on change — whether reminders are on, what time
 * she picked, and which sync code her progress lives under.
 *
 * Deliberately fire-and-forget: nothing renders off the result, so a slow
 * push service cannot hold a paint, and a failed one cannot show her an error
 * about a feature she never sees fail.
 */
export function useReminders(): void {
  const reminderEnabled = useStore(s => s.reminderEnabled)
  const reminderTime = useStore(s => s.reminderTime)
  const syncCode = useStore(s => s.syncCode)

  useEffect(() => {
    void refreshReminderDelivery({ reminderEnabled, reminderTime, syncCode }, Date.now())
  }, [reminderEnabled, reminderTime, syncCode])
}
