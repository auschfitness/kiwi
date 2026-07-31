import { describe, it, expect } from 'vitest'
import { mergeSnapshots } from './merge'
import type { AppState, CardState } from '../types'

const DAY = 86_400_000
const T = 1_700_000_000_000

function snap(over: Partial<AppState> = {}): AppState {
  return {
    profileName: 'Ana', syncCode: null, cefrLevel: 1, unlockedLevel: 1, placed: true,
    cards: {}, skills: {
      vocab: { correct: 0, total: 0 }, listening: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
    },
    dailyGoal: 20, newPerSession: 8, accent: 'en-NZ',
    showPortuguese: true, autoPlayAudio: true, speechRate: 0.95,
    streak: 0, lastStudyDay: null, doneToday: 0, doneDate: null, bestDay: 0,
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
    const local = snap({ streak: 3, bestDay: 40, unlockedLevel: 2, cefrLevel: 1 })
    const remote = snap({ streak: 7, bestDay: 12, unlockedLevel: 1, cefrLevel: 3 })
    const m = mergeSnapshots(local, remote)
    expect(m.streak).toBe(7)
    expect(m.bestDay).toBe(40)
    expect(m.unlockedLevel).toBe(2)
    expect(m.cefrLevel).toBe(3)
  })

  it('keeps placement once either side has been placed', () => {
    expect(mergeSnapshots(snap({ placed: false }), snap({ placed: true })).placed).toBe(true)
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
