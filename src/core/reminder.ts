import type { AppState } from '../types'
import { dayKey } from './time'

/** What she asked for: `"HH:MM"`, 24-hour, zero-padded. `"07:05"`, `"19:00"`. */
const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/

export type NudgeState = Pick<
  AppState,
  'reminderEnabled' | 'reminderTime' | 'doneToday' | 'doneDate'
>

/** Minutes past local midnight for `now`. */
function minutesOfDay(now: number): number {
  const d = new Date(now)
  return d.getHours() * 60 + d.getMinutes()
}

/**
 * Minutes past midnight that `"HH:MM"` names, or `null` if it isn't a time.
 *
 * A `<input type="time">` always hands us the padded 24-hour form, but this
 * string also arrives from localStorage and from a merged cloud snapshot, so
 * it can be anything at all — including `undefined` from a profile that
 * somehow escaped the migration. Parsing, not trusting, is the job here.
 */
function parseHhMm(value: string): number | null {
  const m = HH_MM.exec(value ?? '')
  if (!m) return null
  return Number(m[1]) * 60 + Number(m[2])
}

/**
 * Should we nudge her right now?
 *
 * True only when all three hold: reminders are on, she has not studied today,
 * and her local clock has reached the time she picked.
 *
 * A malformed `reminderTime` answers **false** — we never nudge. The
 * alternative (guessing a time, or nudging immediately) means an interruption
 * she never asked for at an hour she never chose, and there is no reading of
 * a broken time that is more honest than staying quiet. She can always see
 * and fix the time in Settings; a wrongly-timed buzz she cannot explain is
 * the worse failure. It never throws either way.
 *
 * Pure: `now` is a parameter. Nothing in `src/core/` reads the clock itself.
 */
export function shouldNudge(state: NudgeState, now: number): boolean {
  if (!state.reminderEnabled) return false

  // Studied today already — the streak is safe, so there is nothing to nudge
  // about. `doneDate` is the same local day key the streak counter writes
  // (src/core/streak.ts), so this agrees with what Home shows her.
  const studiedToday = state.doneDate === dayKey(now) && state.doneToday > 0
  if (studiedToday) return false

  const target = parseHhMm(state.reminderTime)
  if (target === null) return false

  return minutesOfDay(now) >= target
}

/**
 * The next moment `reminderTime` comes round, strictly after `now`.
 *
 * `null` for a time we cannot parse — same rule as `shouldNudge`: a time we
 * do not understand buys silence, never a guess.
 *
 * Used by Layer 3 (the locally scheduled notification), which needs an actual
 * timestamp rather than a yes/no. "Strictly after" matters there: scheduling
 * a trigger for a moment that has already passed fires it instantly, which
 * from her side is the app buzzing for no reason the second she opens it. If
 * today's time has gone, the answer is tomorrow's.
 *
 * Pure: `now` is a parameter, and the arithmetic is calendar arithmetic on
 * that instant — DST-safe, because `Date`'s day/hour setters do the shifting.
 */
export function nextReminderAt(reminderTime: string, now: number): number | null {
  const target = parseHhMm(reminderTime)
  if (target === null) return null

  const d = new Date(now)
  const at = new Date(
    d.getFullYear(), d.getMonth(), d.getDate(),
    Math.floor(target / 60), target % 60, 0, 0,
  )
  if (at.getTime() <= now) at.setDate(at.getDate() + 1)
  return at.getTime()
}
