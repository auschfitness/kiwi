import { describe, it, expect } from 'vitest'
import {
  addStudyMs, mergeStudyLogs, studySummary, formatDuration, formatCompact,
  type StudyLog,
} from './studyTime'
import { dayKey, DAY, MIN, HOUR } from './time'

const T = new Date(2026, 7, 4, 15, 0, 0).getTime() // 4 Aug 2026, 15:00 local
const today = dayKey(T)
const yesterday = dayKey(T - DAY)

describe('addStudyMs', () => {
  it('opens an entry for today and adds to it after that', () => {
    const once = addStudyMs({}, T, 15 * 1000)
    expect(once).toEqual({ [today]: 15_000 })
    expect(addStudyMs(once, T, 15_000)).toEqual({ [today]: 30_000 })
  })

  it('starts a new entry when the day turns, leaving yesterday alone', () => {
    const log = addStudyMs({ [yesterday]: 10 * MIN }, T, 5 * MIN)
    expect(log[yesterday]).toBe(10 * MIN)
    expect(log[today]).toBe(5 * MIN)
  })

  it('ignores a non-positive amount rather than writing a zero day', () => {
    // A zero-length day would count towards `daysStudied` and drag the average
    // down for a day she never studied.
    expect(addStudyMs({}, T, 0)).toEqual({})
    expect(addStudyMs({}, T, -1)).toEqual({})
  })

  it('does not mutate the log it was given', () => {
    const before: StudyLog = { [today]: MIN }
    addStudyMs(before, T, MIN)
    expect(before).toEqual({ [today]: MIN })
  })
})

describe('mergeStudyLogs', () => {
  it('keeps every day either side knows about', () => {
    const merged = mergeStudyLogs({ [yesterday]: MIN }, { [today]: 2 * MIN })
    expect(merged).toEqual({ [yesterday]: MIN, [today]: 2 * MIN })
  })

  it('takes the larger of two versions of the same day', () => {
    expect(mergeStudyLogs({ [today]: 5 * MIN }, { [today]: 20 * MIN })[today]).toBe(20 * MIN)
  })

  it('is order-independent', () => {
    const a = { [today]: 5 * MIN, [yesterday]: MIN }
    const b = { [today]: 20 * MIN }
    expect(mergeStudyLogs(a, b)).toEqual(mergeStudyLogs(b, a))
  })

  it('is idempotent, which summing would not be', () => {
    // The case this protects: a phone and a laptop that pull from each other
    // more than once in a day must not keep doubling the day.
    const a = { [today]: 20 * MIN }
    const once = mergeStudyLogs(a, a)
    expect(mergeStudyLogs(once, a)).toEqual(a)
  })
})

describe('studySummary', () => {
  it('reads all zeros on a profile that has never studied', () => {
    const s = studySummary({}, T)
    expect(s.todayMs).toBe(0)
    expect(s.totalMs).toBe(0)
    expect(s.daysStudied).toBe(0)
    expect(s.bestDayMs).toBe(0)
    // Not NaN: 0/0 is the shape this has to survive on day one.
    expect(s.averageMs).toBe(0)
  })

  it('separates today, the week and the whole history', () => {
    const log = {
      [dayKey(T - 30 * DAY)]: HOUR,
      [dayKey(T - 3 * DAY)]: 20 * MIN,
      [yesterday]: 10 * MIN,
      [today]: 25 * MIN,
    }
    const s = studySummary(log, T)
    expect(s.todayMs).toBe(25 * MIN)
    expect(s.weekMs).toBe(55 * MIN) // the 30-day-old hour is outside the window
    expect(s.totalMs).toBe(HOUR + 55 * MIN)
    expect(s.daysStudied).toBe(4)
    expect(s.bestDayMs).toBe(HOUR)
  })

  it('averages over the days she studied, not over the calendar', () => {
    // Two days of an hour each, a month apart. The honest answer is an hour a
    // day, not two minutes a day.
    const log = { [dayKey(T - 30 * DAY)]: HOUR, [today]: HOUR }
    expect(studySummary(log, T).averageMs).toBe(HOUR)
  })

  it('gives the week strip seven entries, oldest first, zeros included', () => {
    const s = studySummary({ [today]: 5 * MIN }, T)
    expect(s.week).toHaveLength(7)
    expect(s.week[6]).toEqual({ key: today, ms: 5 * MIN })
    expect(s.week[5]).toEqual({ key: yesterday, ms: 0 })
    expect(s.week[0].key).toBe(dayKey(T - 6 * DAY))
  })
})

describe('formatDuration', () => {
  it('never answers "0 min" to a session that happened', () => {
    expect(formatDuration(40 * 1000)).toBe('< 1 min')
    expect(formatDuration(0)).toBe('0 min')
  })

  it('reads minutes under the hour and hours above it', () => {
    expect(formatDuration(45 * MIN)).toBe('45 min')
    expect(formatDuration(HOUR)).toBe('1 h')
    expect(formatDuration(HOUR + 20 * MIN)).toBe('1 h 20 min')
    expect(formatDuration(3 * HOUR + 5 * MIN)).toBe('3 h 5 min')
  })
})

describe('formatCompact', () => {
  it('fits a stat tile', () => {
    expect(formatCompact(0)).toBe('0m')
    expect(formatCompact(30 * 1000)).toBe('<1m')
    expect(formatCompact(45 * MIN)).toBe('45m')
    expect(formatCompact(2 * HOUR)).toBe('2h')
    expect(formatCompact(HOUR + 5 * MIN)).toBe('1h05')
  })
})
