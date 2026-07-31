import { describe, it, expect } from 'vitest'
import { nextReminderAt, shouldNudge, type NudgeState } from './reminder'
import { dayKey } from './time'

/**
 * Built with the local-time `Date` constructor on purpose: `reminderTime` is
 * a wall-clock time in *her* timezone, so these cases must mean the same
 * thing whether the suite runs in Auckland, São Paulo or CI's UTC.
 */
function at(hour: number, minute: number, day = 30): number {
  return new Date(2026, 6, day, hour, minute, 0, 0).getTime()
}

function state(over: Partial<NudgeState> = {}): NudgeState {
  return {
    reminderEnabled: true,
    reminderTime: '19:00',
    doneToday: 0,
    doneDate: null,
    ...over,
  }
}

describe('shouldNudge', () => {
  it('stays quiet when reminders are switched off, even long past the time', () => {
    expect(shouldNudge(state({ reminderEnabled: false }), at(23, 30))).toBe(false)
  })

  it('stays quiet before the time she picked', () => {
    expect(shouldNudge(state({ reminderTime: '19:00' }), at(18, 59))).toBe(false)
  })

  it('nudges after the time when she has not studied today', () => {
    expect(shouldNudge(state({ reminderTime: '19:00' }), at(19, 1))).toBe(true)
  })

  it('nudges exactly on the minute she picked — "at or past", not "past"', () => {
    expect(shouldNudge(state({ reminderTime: '19:00' }), at(19, 0))).toBe(true)
  })

  it('stays quiet after the time when she has already studied today', () => {
    const now = at(21, 0)
    expect(shouldNudge(state({ doneToday: 6, doneDate: dayKey(now) }), now)).toBe(false)
  })

  it('nudges when the only study on record is from an earlier day', () => {
    const now = at(20, 0, 30)
    expect(shouldNudge(state({ doneToday: 20, doneDate: dayKey(at(20, 0, 29)) }), now)).toBe(true)
  })

  it('stays quiet — and does not throw — on a malformed reminder time', () => {
    // A time we cannot read is not a licence to guess one. Nudging on a
    // broken value would interrupt her at an hour she never chose.
    for (const bad of ['', 'nineteen', '7pm', '19', '19:', ':00', '25:00', '19:60', '9:5', '19:00:00']) {
      expect(() => shouldNudge(state({ reminderTime: bad }), at(23, 59))).not.toThrow()
      expect(shouldNudge(state({ reminderTime: bad }), at(23, 59))).toBe(false)
    }
  })

  it('does not throw when reminderTime is missing entirely (a profile that dodged the migration)', () => {
    const broken = state({ reminderTime: undefined as unknown as string })
    expect(() => shouldNudge(broken, at(23, 59))).not.toThrow()
    expect(shouldNudge(broken, at(23, 59))).toBe(false)
  })

  it('reads midnight and one-minute-to-midnight correctly', () => {
    expect(shouldNudge(state({ reminderTime: '00:00' }), at(0, 0))).toBe(true)
    expect(shouldNudge(state({ reminderTime: '23:59' }), at(23, 58))).toBe(false)
    expect(shouldNudge(state({ reminderTime: '23:59' }), at(23, 59))).toBe(true)
  })

  it('handles a zero-padded morning time', () => {
    expect(shouldNudge(state({ reminderTime: '07:05' }), at(7, 4))).toBe(false)
    expect(shouldNudge(state({ reminderTime: '07:05' }), at(7, 5))).toBe(true)
  })

  it('treats a stale doneDate with a stale count as "not studied today"', () => {
    // doneToday is only ever reset by the next day's first tick, so a count
    // left over from yesterday must not silence today's nudge.
    const now = at(19, 30, 30)
    expect(shouldNudge(state({ doneToday: 40, doneDate: '2026-7-29' }), now)).toBe(true)
  })
})

describe('nextReminderAt', () => {
  it('gives today when her time is still ahead', () => {
    expect(nextReminderAt('19:00', at(9, 0))).toBe(at(19, 0))
  })

  it('gives tomorrow when her time has already gone by', () => {
    expect(nextReminderAt('19:00', at(21, 30))).toBe(at(19, 0, 31))
  })

  it('gives tomorrow on the exact minute, never a trigger that fires instantly', () => {
    // "Strictly after": scheduling a notification for right now means the app
    // buzzing the second she opens it, for no reason she can see.
    expect(nextReminderAt('19:00', at(19, 0))).toBe(at(19, 0, 31))
  })

  it('crosses the month boundary correctly', () => {
    // 31 July -> 1 August. Date's setDate does the carry; we never do it.
    const lateOnTheLastOfJuly = new Date(2026, 6, 31, 23, 0).getTime()
    expect(nextReminderAt('07:30', lateOnTheLastOfJuly)).toBe(new Date(2026, 7, 1, 7, 30).getTime())
  })

  it('returns null for a time it cannot read, the same as shouldNudge', () => {
    for (const bad of ['', 'nineteen', '7pm', '19', '25:00', '19:60', '9:5']) {
      expect(nextReminderAt(bad, at(9, 0))).toBeNull()
    }
  })
})
