import type { AppState } from '../types'
import { dayKey } from './time'

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
