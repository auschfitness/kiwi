import { describe, it, expect } from 'vitest'
import { skillSummary, weakestSkill, recordSkill, levelBreakdown } from './stats'
import type { Skills, CardState, Level } from '../types'

const empty: Skills = {
  vocab: { correct: 0, total: 0 },
  listening: { correct: 0, total: 0 },
  grammar: { correct: 0, total: 0 },
  speaking: { correct: 0, total: 0 },
}

describe('recordSkill', () => {
  it('counts a correct answer', () => {
    const s = recordSkill(empty, 'vocab', true)
    expect(s.vocab).toEqual({ correct: 1, total: 1 })
  })

  it('counts a wrong answer against the total only', () => {
    const s = recordSkill(empty, 'listening', false)
    expect(s.listening).toEqual({ correct: 0, total: 1 })
  })

  it('ignores an ungraded modality', () => {
    expect(recordSkill(empty, null, true)).toEqual(empty)
  })

  it('does not mutate its input', () => {
    recordSkill(empty, 'vocab', true)
    expect(empty.vocab.total).toBe(0)
  })
})

describe('skillSummary', () => {
  it('reports accuracy as null for an untouched skill', () => {
    const rows = skillSummary(empty)
    expect(rows).toHaveLength(4)
    expect(rows.every(r => r.accuracy === null)).toBe(true)
  })

  it('computes accuracy as a percentage', () => {
    const skills: Skills = { ...empty, vocab: { correct: 8, total: 10 } }
    expect(skillSummary(skills).find(r => r.skill === 'vocab')!.accuracy).toBe(80)
  })
})

describe('weakestSkill', () => {
  it('returns null when nothing has been practised', () => {
    expect(weakestSkill(empty)).toBeNull()
  })

  it('ignores skills that were never practised', () => {
    const skills: Skills = {
      ...empty,
      vocab: { correct: 9, total: 10 },
      listening: { correct: 5, total: 10 },
    }
    expect(weakestSkill(skills)).toBe('listening')
  })

  it('does not nominate speaking on a device that cannot record', () => {
    const skills: Skills = {
      ...empty,
      vocab: { correct: 5, total: 10 },
      speaking: { correct: 0, total: 0 },
    }
    expect(weakestSkill(skills)).toBe('vocab')
  })
})

describe('levelBreakdown', () => {
  it('counts known cards per level', () => {
    const states: Record<string, CardState> = {
      a: { due: 0, interval: 1, ease: 2.5, reps: 2, lapses: 0 },
      b: { due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0 },
    }
    const byLevel = { 1: ['a', 'b'], 2: [], 3: [], 4: [] } as Record<Level, string[]>
    expect(levelBreakdown(states, byLevel)[1]).toEqual({ known: 1, total: 2 })
  })
})
