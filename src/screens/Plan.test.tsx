import { describe, it, expect } from 'vitest'
import { currentPlanWeek } from './Plan'
import { DAY } from '../core/time'

describe('currentPlanWeek', () => {
  const startedAt = 1_700_000_000_000

  it('is week 1 the moment she starts', () => {
    expect(currentPlanWeek(startedAt, startedAt)).toBe(1)
  })

  it('is still week 1 one millisecond before the week-2 boundary', () => {
    expect(currentPlanWeek(startedAt + 7 * DAY - 1, startedAt)).toBe(1)
  })

  it('rolls over to week 2 exactly at the boundary', () => {
    expect(currentPlanWeek(startedAt + 7 * DAY, startedAt)).toBe(2)
  })

  it('clamps to week 8 long after the plan ends', () => {
    expect(currentPlanWeek(startedAt + 52 * 7 * DAY, startedAt)).toBe(8)
  })

  it('clamps to week 1 rather than week 0 under clock skew (now before startedAt)', () => {
    expect(currentPlanWeek(startedAt - 7 * DAY, startedAt)).toBe(1)
  })
})
