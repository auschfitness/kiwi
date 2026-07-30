import { describe, it, expect } from 'vitest'
import { buildChoices, shuffleWords } from './options'

function seeded(seed = 1) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}

describe('buildChoices', () => {
  const pool = ['water', 'fire', 'earth', 'air', 'stone', 'wood']

  it('returns four distinct options including the answer', () => {
    const out = buildChoices('water', pool, seeded())
    expect(out).toHaveLength(4)
    expect(new Set(out).size).toBe(4)
    expect(out).toContain('water')
  })

  it('never repeats the answer as a distractor', () => {
    const out = buildChoices('water', pool, seeded())
    expect(out.filter(o => o === 'water')).toHaveLength(1)
  })

  it('degrades gracefully when the pool is tiny', () => {
    const out = buildChoices('water', ['water', 'fire'], seeded())
    expect(out).toContain('water')
    expect(out.length).toBeLessThanOrEqual(4)
    expect(new Set(out).size).toBe(out.length)
  })

  it('is deterministic for a given rand', () => {
    expect(buildChoices('water', pool, seeded(3))).toEqual(buildChoices('water', pool, seeded(3)))
  })
})

describe('shuffleWords', () => {
  it('keeps every word', () => {
    const words = ['I', 'want', 'water', 'please']
    expect(shuffleWords(words, seeded()).slice().sort()).toEqual(words.slice().sort())
  })

  it('never hands back the original order', () => {
    const words = ['I', 'want', 'water', 'please']
    expect(shuffleWords(words, seeded())).not.toEqual(words)
  })

  it('handles a single word without looping forever', () => {
    expect(shuffleWords(['hi'], seeded())).toEqual(['hi'])
  })

  it('handles repeated words', () => {
    const words = ['no', 'no']
    expect(shuffleWords(words, seeded()).slice().sort()).toEqual(['no', 'no'])
  })
})
