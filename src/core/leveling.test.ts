import { describe, it, expect } from 'vitest'
import { levelProgress, shouldUnlockNext, UNLOCK_THRESHOLD, LEVEL_NAMES } from './leveling'
import type { CardState } from '../types'

const known = (reps: number): CardState => ({ due: 0, interval: 1, ease: 2.5, reps, lapses: 0 })

function statesFor(ids: string[], reps: number): Record<string, CardState> {
  return Object.fromEntries(ids.map(id => [id, known(reps)]))
}

describe('levelProgress', () => {
  it('is zero for an untouched level', () => {
    expect(levelProgress(['a', 'b'], {})).toBe(0)
  })

  it('ignores cards seen only once', () => {
    expect(levelProgress(['a', 'b'], statesFor(['a', 'b'], 1))).toBe(0)
  })

  it('counts cards with two or more reps', () => {
    expect(levelProgress(['a', 'b', 'c', 'd'], statesFor(['a', 'b'], 2))).toBe(0.5)
  })

  it('is zero for an empty level rather than NaN', () => {
    expect(levelProgress([], {})).toBe(0)
  })
})

describe('shouldUnlockNext', () => {
  it('unlocks at the threshold', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    expect(shouldUnlockNext(1, ids, statesFor(['a', 'b', 'c', 'd'], 2))).toBe(2)
  })

  it('does not unlock below the threshold', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    expect(shouldUnlockNext(1, ids, statesFor(['a', 'b', 'c'], 2))).toBeNull()
  })

  it('never unlocks past level 4', () => {
    expect(shouldUnlockNext(4, ['a'], statesFor(['a'], 5))).toBeNull()
  })

  it('does not unlock an empty level', () => {
    expect(shouldUnlockNext(1, [], {})).toBeNull()
  })

  it('uses an 80 percent threshold', () => {
    expect(UNLOCK_THRESHOLD).toBe(0.8)
  })
})

describe('LEVEL_NAMES', () => {
  it('maps levels to CEFR labels', () => {
    expect(LEVEL_NAMES).toEqual({ 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' })
  })
})
