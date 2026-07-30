import type { CardState, Level } from '../types'

export const UNLOCK_THRESHOLD = 0.8

export const LEVEL_NAMES: Record<Level, string> = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' }
export const LEVEL_EMOJI: Record<Level, string> = { 1: '🌱', 2: '🌿', 3: '🌳', 4: '🏔️' }
export const LEVEL_TITLES: Record<Level, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Upper-intermediate',
}

/** Fraction of a level's cards seen at least twice. 0 for an empty level. */
export function levelProgress(cardIds: string[], states: Record<string, CardState>): number {
  if (cardIds.length === 0) return 0
  const solid = cardIds.filter(id => (states[id]?.reps ?? 0) >= 2).length
  return solid / cardIds.length
}

/** The level to unlock next, or null. */
export function shouldUnlockNext(
  unlockedLevel: Level,
  cardIdsAtLevel: string[],
  states: Record<string, CardState>,
): Level | null {
  if (unlockedLevel >= 4) return null
  if (cardIdsAtLevel.length === 0) return null
  if (levelProgress(cardIdsAtLevel, states) < UNLOCK_THRESHOLD) return null
  return (unlockedLevel + 1) as Level
}
