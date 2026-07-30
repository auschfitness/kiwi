export const MIN = 60_000
export const DAY = 86_400_000

/** Local calendar day key, e.g. "2026-7-30". Used for streaks and daily counters. */
export function dayKey(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
