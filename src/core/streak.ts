import type { AppState } from '../types'
import { dayKey, DAY } from './time'

export type Tick = Pick<AppState, 'streak' | 'lastStudyDay' | 'doneToday' | 'doneDate' | 'bestDay'>

/** Call once per graded item. */
export function applyStudyTick(state: Tick, now: number): Tick {
  const today = dayKey(now)
  const yesterday = dayKey(now - 86_400_000)

  const doneToday = state.doneDate === today ? state.doneToday + 1 : 1

  let streak = state.streak
  if (state.lastStudyDay !== today) {
    streak = state.lastStudyDay === yesterday ? state.streak + 1 : 1
  }

  return {
    streak,
    lastStudyDay: today,
    doneToday,
    doneDate: today,
    bestDay: Math.max(state.bestDay, doneToday),
  }
}

/**
 * What Home/Dashboard should show right now — not always the raw stored
 * value, since `streak` only updates on a graded tick (`applyStudyTick`,
 * above). Without this, a streak earned days ago would sit on screen as
 * today's until she studies again. Stays visible while `lastStudyDay` is
 * today or yesterday (not broken yet — she can still extend it today), and
 * reads 0 the moment more than one day has been missed. Derives only; the
 * actual write still happens exclusively via `applyStudyTick`.
 */
export function visibleStreak(state: Pick<Tick, 'streak' | 'lastStudyDay'>, now: number): number {
  const today = dayKey(now)
  const yesterday = dayKey(now - DAY)
  if (state.lastStudyDay === today || state.lastStudyDay === yesterday) return state.streak
  return 0
}

/**
 * Same idea as `visibleStreak` but for the daily goal count: `doneToday`
 * only updates on a tick, so a stale `doneDate` would otherwise show
 * yesterday's (or an older day's) count until she studies today. Mirrors
 * the "studied today" check `shouldNudge` already does in
 * `src/core/reminder.ts`.
 */
export function visibleDoneToday(state: Pick<Tick, 'doneToday' | 'doneDate'>, now: number): number {
  return state.doneDate === dayKey(now) ? state.doneToday : 0
}
