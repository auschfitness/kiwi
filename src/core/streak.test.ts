import { describe, it, expect } from 'vitest'
import { applyStudyTick, visibleStreak, visibleDoneToday, type Tick } from './streak'
import { dayKey, DAY } from './time'

const NOW = new Date('2026-07-30T10:00:00').getTime()
const YESTERDAY = NOW - DAY
const TWO_DAYS_AGO = NOW - 2 * DAY

const blank = { streak: 0, lastStudyDay: null, doneToday: 0, doneDate: null, bestDay: 0 }

describe('applyStudyTick', () => {
  it('starts a streak on the very first item', () => {
    const s = applyStudyTick(blank, NOW)
    expect(s.streak).toBe(1)
    expect(s.doneToday).toBe(1)
    expect(s.lastStudyDay).toBe(dayKey(NOW))
    expect(s.doneDate).toBe(dayKey(NOW))
  })

  it('does not advance the streak twice in one day', () => {
    let s = applyStudyTick(blank, NOW)
    s = applyStudyTick(s, NOW + 1000)
    expect(s.streak).toBe(1)
    expect(s.doneToday).toBe(2)
  })

  it('extends the streak when yesterday was studied', () => {
    const prev = { streak: 4, lastStudyDay: dayKey(YESTERDAY), doneToday: 20, doneDate: dayKey(YESTERDAY), bestDay: 20 }
    const s = applyStudyTick(prev, NOW)
    expect(s.streak).toBe(5)
    expect(s.doneToday).toBe(1)
  })

  it('resets the streak after a missed day', () => {
    const prev = { streak: 9, lastStudyDay: dayKey(TWO_DAYS_AGO), doneToday: 12, doneDate: dayKey(TWO_DAYS_AGO), bestDay: 12 }
    expect(applyStudyTick(prev, NOW).streak).toBe(1)
  })

  it('resets the daily counter on a new day', () => {
    const prev = { streak: 2, lastStudyDay: dayKey(YESTERDAY), doneToday: 30, doneDate: dayKey(YESTERDAY), bestDay: 30 }
    expect(applyStudyTick(prev, NOW).doneToday).toBe(1)
  })

  it('tracks the best day ever', () => {
    let s: Tick = { streak: 1, lastStudyDay: dayKey(NOW), doneToday: 40, doneDate: dayKey(NOW), bestDay: 40 }
    s = applyStudyTick(s, NOW)
    expect(s.bestDay).toBe(41)
  })

  it('never lowers the best day', () => {
    const prev = { streak: 2, lastStudyDay: dayKey(YESTERDAY), doneToday: 50, doneDate: dayKey(YESTERDAY), bestDay: 50 }
    expect(applyStudyTick(prev, NOW).bestDay).toBe(50)
  })

  it('does not mutate its input', () => {
    const prev = { ...blank }
    applyStudyTick(prev, NOW)
    expect(prev).toEqual(blank)
  })
})

describe('visibleStreak', () => {
  it('shows the streak when she already studied today', () => {
    expect(visibleStreak({ streak: 5, lastStudyDay: dayKey(NOW) }, NOW)).toBe(5)
  })

  it('shows the streak when yesterday was the last study day (not broken yet)', () => {
    expect(visibleStreak({ streak: 5, lastStudyDay: dayKey(YESTERDAY) }, NOW)).toBe(5)
  })

  it('shows 0 once a day has been missed, even before she studies again', () => {
    expect(visibleStreak({ streak: 5, lastStudyDay: dayKey(TWO_DAYS_AGO) }, NOW)).toBe(0)
  })

  it('shows 0 for a profile that has never studied', () => {
    expect(visibleStreak({ streak: 0, lastStudyDay: null }, NOW)).toBe(0)
  })
})

describe('visibleDoneToday', () => {
  it('shows the count when it was set today', () => {
    expect(visibleDoneToday({ doneToday: 3, doneDate: dayKey(NOW) }, NOW)).toBe(3)
  })

  it('shows 0 once the day has rolled over, even before she studies again', () => {
    expect(visibleDoneToday({ doneToday: 103, doneDate: dayKey(YESTERDAY) }, NOW)).toBe(0)
  })

  it('shows 0 for a profile that has never studied', () => {
    expect(visibleDoneToday({ doneToday: 0, doneDate: null }, NOW)).toBe(0)
  })
})
