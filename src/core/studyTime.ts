import { DAY, dayKey } from './time'

/**
 * How long she has studied, one entry per local calendar day.
 *
 * Milliseconds, keyed by the same `dayKey` the streak uses, so a day that
 * counts for the streak is the same day that counts for the hours. Days with
 * no study are simply absent — the log is a sparse record of what happened,
 * not a calendar with holes in it.
 *
 * Why a log and not a running total: a total can only ever answer "how much
 * altogether", and the question she actually asks is "have I done my bit
 * today" and "was last week better than this one". Everything else on this
 * page is derived from the log, so there is exactly one number to be wrong.
 */
export type StudyLog = Record<string, number>

/**
 * How often the clock in `src/store/useStudyClock.ts` adds to the log, and
 * therefore the granularity of every number here.
 *
 * 15 seconds is a deliberate compromise. Shorter would write to localStorage
 * (and bump `updatedAt`, and so the sync snapshot) several times a minute for
 * no gain: nobody reads "hours studied" to a finer resolution than a minute.
 * Longer would lose a real short session — a two-minute review on the bus is
 * exactly the kind of study this is meant to notice.
 */
export const STUDY_TICK_MS = 15_000

/** A day of practice, for the week strip. */
export interface StudyDay {
  /** `dayKey` format, e.g. `2026-8-4`. */
  key: string
  ms: number
}

export interface StudySummary {
  todayMs: number
  /** Today and the six days before it. */
  weekMs: number
  totalMs: number
  /** Days with any practice at all — the denominator of `averageMs`. */
  daysStudied: number
  bestDayMs: number
  /**
   * The mean over the days she actually studied, not over the calendar. A week
   * off does not retroactively make her a worse student, and averaging over
   * empty days would say exactly that.
   */
  averageMs: number
  /** Always seven entries, oldest first, zeros included. */
  week: StudyDay[]
}

/** Add time to today. A non-positive amount is not an edit. */
export function addStudyMs(log: StudyLog, now: number, ms: number): StudyLog {
  if (!(ms > 0)) return log
  const key = dayKey(now)
  return { ...log, [key]: (log[key] ?? 0) + ms }
}

/**
 * Merge two logs the way the rest of the sync merge works: never destructive,
 * order-independent, and idempotent.
 *
 * Per day it takes the larger of the two, and not the sum. Summing looks
 * right for the case of two devices in one day, and is wrong for the case that
 * actually happens: the same day merged twice — a phone and a laptop pulling
 * from each other — would double, then double again. Taking the larger can
 * under-count a genuinely split day, and never invents time she did not spend.
 */
export function mergeStudyLogs(a: StudyLog, b: StudyLog): StudyLog {
  const out: StudyLog = {}
  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[key] = Math.max(a[key] ?? 0, b[key] ?? 0)
  }
  return out
}

/** The last seven day keys, oldest first, today last. */
function weekKeys(now: number): string[] {
  const keys: string[] = []
  for (let i = 6; i >= 0; i--) keys.push(dayKey(now - i * DAY))
  return keys
}

export function studySummary(log: StudyLog, now: number): StudySummary {
  // The type says this is always here, and for anything the app wrote it is.
  // The guard is for what the app did not write: a hand-repaired or
  // half-written blob that claims the current version and so never reaches
  // `migrate`. The same case `scalar()` exists for in src/core/merge.ts.
  const safe = log ?? {}
  const week = weekKeys(now).map(key => ({ key, ms: safe[key] ?? 0 }))
  const values = Object.values(safe).filter(ms => ms > 0)
  const totalMs = values.reduce((sum, ms) => sum + ms, 0)
  const daysStudied = values.length

  return {
    todayMs: safe[dayKey(now)] ?? 0,
    weekMs: week.reduce((sum, d) => sum + d.ms, 0),
    totalMs,
    daysStudied,
    bestDayMs: values.reduce((max, ms) => Math.max(max, ms), 0),
    averageMs: daysStudied === 0 ? 0 : Math.round(totalMs / daysStudied),
    week,
  }
}

function parts(ms: number): { h: number; m: number } {
  const m = Math.round(ms / 60_000)
  return { h: Math.floor(m / 60), m: m % 60 }
}

/**
 * Prose, for a line she reads: `1 h 20 min`, `45 min`, `< 1 min`.
 *
 * Anything above zero but under a minute reads "< 1 min" rather than "0 min":
 * she did open the app and do something, and a tracker that answers "nothing"
 * to that is a tracker she stops believing.
 */
export function formatDuration(ms: number): string {
  if (!(ms > 0)) return '0 min'
  if (ms < 60_000) return '< 1 min'
  const { h, m } = parts(ms)
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}

/** Compact, for a stat tile with a third of a phone to live in: `1h20`, `45m`. */
export function formatCompact(ms: number): string {
  if (!(ms > 0)) return '0m'
  if (ms < 60_000) return '<1m'
  const { h, m } = parts(ms)
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}
