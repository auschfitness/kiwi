import { describe, it, expect } from 'vitest'
import { mergeSnapshots } from './merge'
import type { AppState, CardState } from '../types'

const DAY = 86_400_000
const T = 1_700_000_000_000

function snap(over: Partial<AppState> = {}): AppState {
  return {
    profileName: 'Ana', syncCode: null, unlockedLevel: 1,
    cards: {}, skills: {
      vocab: { correct: 0, total: 0 }, listening: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
    },
    dailyGoal: 20, newPerSession: 8, accent: 'en-NZ',
    showPortuguese: true, autoPlayAudio: true, speechRate: 0.95,
    reminderEnabled: false, reminderTime: '19:00',
    streak: 0, lastStudyDay: null, doneToday: 0, doneDate: null, bestDay: 0,
    studyLog: {},
    startedAt: T, updatedAt: T, ...over,
  }
}

const cs = (due: number, reps: number): CardState => ({ due, interval: 1, ease: 2.5, reps, lapses: 0 })

describe('mergeSnapshots', () => {
  it('keeps the card state with the later review', () => {
    const local = snap({ cards: { a: cs(T, 2) } })
    const remote = snap({ cards: { a: cs(T + DAY, 3) } })
    expect(mergeSnapshots(local, remote).cards.a.reps).toBe(3)
  })

  it('breaks a due tie by rep count', () => {
    const local = snap({ cards: { a: cs(T, 5) } })
    const remote = snap({ cards: { a: cs(T, 2) } })
    expect(mergeSnapshots(local, remote).cards.a.reps).toBe(5)
  })

  it('unions cards that exist on only one side', () => {
    const local = snap({ cards: { a: cs(T, 1) } })
    const remote = snap({ cards: { b: cs(T, 1) } })
    expect(Object.keys(mergeSnapshots(local, remote).cards).sort()).toEqual(['a', 'b'])
  })

  it('takes the max of each skill counter', () => {
    const local = snap({ skills: { ...snap().skills, vocab: { correct: 10, total: 20 } } })
    const remote = snap({ skills: { ...snap().skills, vocab: { correct: 4, total: 30 } } })
    expect(mergeSnapshots(local, remote).skills.vocab).toEqual({ correct: 10, total: 30 })
  })

  it('takes the higher streak, best day and unlocked level', () => {
    const local = snap({ streak: 3, bestDay: 40, unlockedLevel: 2 })
    const remote = snap({ streak: 7, bestDay: 12, unlockedLevel: 1 })
    const m = mergeSnapshots(local, remote)
    expect(m.streak).toBe(7)
    expect(m.bestDay).toBe(40)
    expect(m.unlockedLevel).toBe(2)
  })

  it('never lowers an unlocked level, whichever side is newer', () => {
    // A level is earned by working through the one below it, so a merge must
    // never take it away — not even from the more recently updated device.
    const earned = snap({ updatedAt: T, unlockedLevel: 3 })
    const behind = snap({ updatedAt: T + DAY, unlockedLevel: 1 })
    expect(mergeSnapshots(earned, behind).unlockedLevel).toBe(3)
    expect(mergeSnapshots(behind, earned).unlockedLevel).toBe(3)
  })

  it('returns exactly the fields AppState declares — no more, no fewer', () => {
    // The invariant merge.ts's own docstring makes. It has survived three
    // field additions; this is the removal that must not break it.
    const reference = snap()
    expect(Object.keys(mergeSnapshots(snap(), snap())).sort()).toEqual(Object.keys(reference).sort())
  })

  it('takes preferences from the more recently updated snapshot', () => {
    const local = snap({ updatedAt: T, profileName: 'Old', dailyGoal: 20, accent: 'en-NZ' })
    const remote = snap({ updatedAt: T + 1000, profileName: 'New', dailyGoal: 30, accent: 'en-AU' })
    const m = mergeSnapshots(local, remote)
    expect(m.profileName).toBe('New')
    expect(m.dailyGoal).toBe(30)
    expect(m.accent).toBe('en-AU')
  })

  it('keeps the earliest start date and the latest update', () => {
    const local = snap({ startedAt: T, updatedAt: T + 5 })
    const remote = snap({ startedAt: T - DAY, updatedAt: T })
    const m = mergeSnapshots(local, remote)
    expect(m.startedAt).toBe(T - DAY)
    expect(m.updatedAt).toBe(T + 5)
  })

  it('sums nothing and loses nothing when merging a snapshot with itself', () => {
    const s = snap({ cards: { a: cs(T, 3) }, streak: 4, skills: { ...snap().skills, vocab: { correct: 5, total: 9 } } })
    expect(mergeSnapshots(s, s)).toEqual(s)
  })

  it('is order independent for cards, skills and maxima', () => {
    const local = snap({ updatedAt: T + 1, cards: { a: cs(T + DAY, 3), b: cs(T, 1) }, streak: 5 })
    const remote = snap({ updatedAt: T, cards: { a: cs(T, 9), c: cs(T, 2) }, streak: 2 })
    const ab = mergeSnapshots(local, remote)
    const ba = mergeSnapshots(remote, local)
    expect(ab.cards).toEqual(ba.cards)
    expect(ab.skills).toEqual(ba.skills)
    expect(ab.streak).toBe(ba.streak)
  })

  it('keeps the daily count from the newer day', () => {
    const local = snap({ updatedAt: T, doneToday: 30, doneDate: '2026-7-29' })
    const remote = snap({ updatedAt: T + 1, doneToday: 4, doneDate: '2026-7-30' })
    const m = mergeSnapshots(local, remote)
    expect(m.doneDate).toBe('2026-7-30')
    expect(m.doneToday).toBe(4)
  })

  it('takes the higher count when both snapshots are from the same day', () => {
    const local = snap({ updatedAt: T, doneToday: 30, doneDate: '2026-7-30' })
    const remote = snap({ updatedAt: T + 1, doneToday: 4, doneDate: '2026-7-30' })
    expect(mergeSnapshots(local, remote).doneToday).toBe(30)
  })

  it('resolves a full card tie identically in both directions', () => {
    const a: CardState = { due: T, interval: 9, ease: 2.5, reps: 3, lapses: 0 }
    const b: CardState = { due: T, interval: 4, ease: 1.9, reps: 3, lapses: 2 }
    const local = snap({ cards: { x: a } })
    const remote = snap({ cards: { x: b } })
    expect(mergeSnapshots(local, remote).cards.x).toEqual(mergeSnapshots(remote, local).cards.x)
  })

  it('keeps the more progressed state when due and reps tie', () => {
    const strong: CardState = { due: T, interval: 9, ease: 2.5, reps: 3, lapses: 0 }
    const weak: CardState = { due: T, interval: 4, ease: 1.9, reps: 3, lapses: 2 }
    expect(mergeSnapshots(snap({ cards: { x: weak } }), snap({ cards: { x: strong } })).cards.x).toEqual(strong)
  })

  it('keeps the newer device daily count across a single-digit day boundary', () => {
    const older = snap({ updatedAt: T, doneToday: 30, doneDate: '2026-7-9' })
    const newer = snap({ updatedAt: T + 1000, doneToday: 4, doneDate: '2026-7-10' })
    const merged = mergeSnapshots(older, newer)
    expect(merged.doneDate).toBe('2026-7-10')
    expect(merged.doneToday).toBe(4)
  })

  it('resolves a tied-timestamp day conflict identically in both directions', () => {
    const x = snap({ updatedAt: 1000, doneToday: 10, doneDate: '2026-7-9' })
    const y = snap({ updatedAt: 1000, doneToday: 10, doneDate: '2026-7-15' })
    const xy = mergeSnapshots(x, y)
    const yx = mergeSnapshots(y, x)
    expect(xy.doneDate).toBe(yx.doneDate)
    expect(xy.doneToday).toBe(yx.doneToday)
  })

  it('picks scalar preferences identically in both directions on a timestamp tie', () => {
    const x = snap({ updatedAt: 1000, profileName: 'Ana', accent: 'en-NZ', dailyGoal: 20 })
    const y = snap({ updatedAt: 1000, profileName: 'Bia', accent: 'en-AU', dailyGoal: 30 })
    const xy = mergeSnapshots(x, y)
    const yx = mergeSnapshots(y, x)
    expect(xy.profileName).toBe(yx.profileName)
    expect(xy.accent).toBe(yx.accent)
    expect(xy.dailyGoal).toBe(yx.dailyGoal)
  })

  it('prefers the later calendar day regardless of digit width', () => {
    const older = snap({ updatedAt: 5000, doneToday: 30, doneDate: '2026-7-9' })
    const later = snap({ updatedAt: 1000, doneToday: 4, doneDate: '2026-7-10' })
    expect(mergeSnapshots(older, later).doneDate).toBe('2026-7-10')
  })

  it('takes the reminder settings from the more recently updated snapshot', () => {
    const local = snap({ updatedAt: T, reminderEnabled: false, reminderTime: '19:00' })
    const remote = snap({ updatedAt: T + 1000, reminderEnabled: true, reminderTime: '07:30' })
    const m = mergeSnapshots(local, remote)
    expect(m.reminderEnabled).toBe(true)
    expect(m.reminderTime).toBe('07:30')
  })

  it('resolves a reminder-only tie identically in both directions', () => {
    // The tie-break must be total over every field `preferred` supplies. If
    // scalarKey ignored the reminder fields, these two snapshots — identical
    // on every ranking signal and differing only here — would compare equal
    // and the answer would depend on argument order.
    const base = { updatedAt: 1000, bestDay: 5, streak: 3, doneToday: 10, doneDate: '2026-7-9' } as const
    const x = snap({ ...base, reminderEnabled: true, reminderTime: '07:30' })
    const y = snap({ ...base, reminderEnabled: false, reminderTime: '21:15' })
    const xy = mergeSnapshots(x, y)
    const yx = mergeSnapshots(y, x)
    expect(xy.reminderEnabled).toBe(yx.reminderEnabled)
    expect(xy.reminderTime).toBe(yx.reminderTime)
  })

  it('resolves a total tie identically in both directions', () => {
    const base = {
      updatedAt: 1000, bestDay: 5, streak: 3, doneToday: 10,
      doneDate: '2026-7-9', profileName: 'Ana',
    } as const
    const x = snap({ ...base, dailyGoal: 20, syncCode: 'AAA', accent: 'en-NZ' })
    const y = snap({ ...base, dailyGoal: 99, syncCode: 'ZZZ', accent: 'en-AU' })
    const xy = mergeSnapshots(x, y)
    const yx = mergeSnapshots(y, x)
    expect(xy.dailyGoal).toBe(yx.dailyGoal)
    expect(xy.syncCode).toBe(yx.syncCode)
    expect(xy.accent).toBe(yx.accent)
  })
})

/**
 * `loadProgress` casts the JSON that comes back off the network straight to
 * `AppState` — no shape check anywhere. A snapshot written by an older build
 * is genuinely missing the fields that build did not have, and if it wins on
 * `updatedAt` those `undefined`s go into `replaceState` and out to
 * `setDefaultRate(undefined)` and `shouldNudge`. `speechRate: undefined` is
 * the sharp one: it made every `speak()` in the app throw a TypeError.
 *
 * The cast is what makes these tests possible and is exactly the situation
 * being defended against — the type says these fields are always there, and
 * for anything the app itself wrote they are.
 */
function preToday(over: Partial<AppState> = {}): AppState {
  const {
    speechRate: _rate, reminderEnabled: _on, reminderTime: _at, studyLog: _log, ...older
  } = snap(over)
  return older as AppState
}

describe('mergeSnapshots and the study log', () => {
  it('keeps every day either device knows about', () => {
    const local = snap({ studyLog: { '2026-8-1': 20 * 60_000 } })
    const remote = snap({ studyLog: { '2026-8-2': 30 * 60_000 } })
    expect(mergeSnapshots(local, remote).studyLog).toEqual({
      '2026-8-1': 20 * 60_000, '2026-8-2': 30 * 60_000,
    })
  })

  it('takes the longer version of a day both devices saw', () => {
    const local = snap({ studyLog: { '2026-8-1': 5 * 60_000 } })
    const remote = snap({ studyLog: { '2026-8-1': 25 * 60_000 } })
    expect(mergeSnapshots(local, remote).studyLog['2026-8-1']).toBe(25 * 60_000)
  })

  it('is not a field the more recent snapshot simply overwrites', () => {
    // The failure this rules out: an hour studied on her phone erased by a
    // laptop that happened to save a preference change one second later.
    const phone = snap({ updatedAt: T, studyLog: { '2026-8-1': 60 * 60_000 } })
    const laptop = snap({ updatedAt: T + 1000, studyLog: {} })
    expect(mergeSnapshots(phone, laptop).studyLog['2026-8-1']).toBe(60 * 60_000)
  })

  it('reads a snapshot written before the clock existed as no hours, not a crash', () => {
    const old = preToday({ updatedAt: T + 1000 })
    const mine = snap({ studyLog: { '2026-8-1': 60_000 } })
    expect(mergeSnapshots(mine, old).studyLog).toEqual({ '2026-8-1': 60_000 })
  })
})

describe('mergeSnapshots with a snapshot from an older build', () => {
  it('never hands back an undefined speech rate, reminder flag or reminder time', () => {
    // The remote snapshot is newer, so it wins every scalar — including three
    // fields it does not have.
    const local = snap({ updatedAt: T, speechRate: 0.75, reminderEnabled: true, reminderTime: '07:30' })
    const remote = preToday({ updatedAt: T + DAY })

    const merged = mergeSnapshots(local, remote)

    // Her local values survive rather than being overwritten with nothing.
    expect(merged.speechRate).toBe(0.75)
    expect(merged.reminderEnabled).toBe(true)
    expect(merged.reminderTime).toBe('07:30')
  })

  it('falls back to the defaults when neither side has them', () => {
    const merged = mergeSnapshots(preToday({ updatedAt: T }), preToday({ updatedAt: T + DAY }))
    expect(merged.speechRate).toBe(0.95)
    expect(merged.reminderEnabled).toBe(false)
    expect(merged.reminderTime).toBe('19:00')
  })

  it('produces a rate speak() can actually use', () => {
    const merged = mergeSnapshots(snap({ updatedAt: T }), preToday({ updatedAt: T + DAY }))
    expect(Number.isFinite(merged.speechRate)).toBe(true)
    expect(Number.isFinite(Math.min(1.2, Math.max(0.5, merged.speechRate)))).toBe(true)
  })

  it('still lets a newer snapshot that does have them win', () => {
    const local = snap({ updatedAt: T, speechRate: 0.75, reminderEnabled: false, reminderTime: '07:30' })
    const remote = snap({ updatedAt: T + DAY, speechRate: 1.1, reminderEnabled: true, reminderTime: '21:15' })
    const merged = mergeSnapshots(local, remote)
    expect(merged.speechRate).toBe(1.1)
    expect(merged.reminderEnabled).toBe(true)
    expect(merged.reminderTime).toBe('21:15')
  })

  it('stays order-independent when a field is missing on one side', () => {
    const local = snap({ updatedAt: T + DAY, speechRate: 0.75 })
    const remote = preToday({ updatedAt: T + DAY })
    expect(mergeSnapshots(local, remote).speechRate)
      .toBe(mergeSnapshots(remote, local).speechRate)
  })
})
