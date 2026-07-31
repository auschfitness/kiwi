import { describe, it, expect } from 'vitest'
import {
  EAR_SESSION_LENGTH,
  buildEarSession,
  isEarAnswerCorrect,
  pickEarQuestion,
  quizzablePairs,
  spokenWord,
  wordOf,
} from './minimalPairs'
import type { EarPair, EarQuestion } from './minimalPairs'
import { MINIMAL_PAIRS, PAIR_GROUPS } from '../content/authored/minimalPairs'

/** Deterministic pseudo-random in [0,1) — same shape placement.test.ts uses. */
function seeded(seed = 1) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}

const FAKE: EarPair[] = [
  { a: 'pen', b: 'pin', note: 'one' },
  { a: 'bad', b: 'bed', note: 'two' },
  { a: 'bear', b: 'beer', note: 'merged', merged: true },
]

describe('wordOf / spokenWord', () => {
  it('reads the side of a pair', () => {
    expect(wordOf(FAKE[0], 'a')).toBe('pen')
    expect(wordOf(FAKE[0], 'b')).toBe('pin')
  })

  it('speaks the side the question actually played', () => {
    const q: EarQuestion = { pair: FAKE[0], side: 'b' }
    expect(spokenWord(q)).toBe('pin')
  })
})

describe('quizzablePairs', () => {
  it('drops the pairs Kiwis genuinely merge', () => {
    expect(quizzablePairs(FAKE).map(p => p.a)).toEqual(['pen', 'bad'])
  })

  it('keeps a pair that never says merged at all', () => {
    expect(quizzablePairs([{ a: 'x', b: 'y', note: 'n' }])).toHaveLength(1)
  })

  it('never offers a merged pair from the real table to the quiz', () => {
    const pool = quizzablePairs(MINIMAL_PAIRS)
    expect(pool.every(p => p.merged === false)).toBe(true)
    expect(pool.length).toBeLessThan(MINIMAL_PAIRS.length)
  })
})

describe('pickEarQuestion', () => {
  it('is deterministic under a seed', () => {
    const a = pickEarQuestion(MINIMAL_PAIRS, seeded(42))
    const b = pickEarQuestion(MINIMAL_PAIRS, seeded(42))
    expect(a).toEqual(b)
  })

  it('never picks a merged pair', () => {
    const rand = seeded(3)
    for (let i = 0; i < 300; i++) {
      expect(pickEarQuestion(MINIMAL_PAIRS, rand)?.pair.merged).toBe(false)
    }
  })

  it('returns null when nothing is quizzable', () => {
    expect(pickEarQuestion([{ a: 'air', b: 'ear', note: 'n', merged: true }], seeded())).toBeNull()
  })

  it('plays both sides over many draws', () => {
    const rand = seeded(11)
    const sides = new Set(
      Array.from({ length: 60 }, () => pickEarQuestion(MINIMAL_PAIRS, rand)?.side),
    )
    expect(sides).toEqual(new Set(['a', 'b']))
  })
})

describe('buildEarSession', () => {
  it('deals a full round by default', () => {
    expect(buildEarSession(MINIMAL_PAIRS, seeded())).toHaveLength(EAR_SESSION_LENGTH)
    expect(EAR_SESSION_LENGTH).toBe(10)
  })

  it('gives the very same round back for the very same seed', () => {
    const a = buildEarSession(MINIMAL_PAIRS, seeded(2024))
    const b = buildEarSession(MINIMAL_PAIRS, seeded(2024))
    expect(a).toEqual(b)
  })

  it('gives a different round for a different seed', () => {
    const a = buildEarSession(MINIMAL_PAIRS, seeded(1))
    const b = buildEarSession(MINIMAL_PAIRS, seeded(999))
    expect(a).not.toEqual(b)
  })

  it('never repeats a pair while the pool still has fresh ones', () => {
    const rand = seeded(5)
    for (let round = 0; round < 20; round++) {
      const session = buildEarSession(MINIMAL_PAIRS, rand)
      const words = session.map(q => `${q.pair.a}/${q.pair.b}`)
      expect(new Set(words).size).toBe(words.length)
    }
  })

  it('refills the bag when the round is longer than the pool', () => {
    const session = buildEarSession(FAKE, seeded(8), 6)
    expect(session).toHaveLength(6)
    expect(session.every(q => q.pair.merged !== true)).toBe(true)
  })

  it('returns nothing for an empty pool or a zero-length round', () => {
    expect(buildEarSession([], seeded())).toEqual([])
    expect(buildEarSession(MINIMAL_PAIRS, seeded(), 0)).toEqual([])
  })
})

describe('isEarAnswerCorrect', () => {
  it('accepts the side that was played and rejects the other', () => {
    const q: EarQuestion = { pair: FAKE[0], side: 'a' }
    expect(isEarAnswerCorrect(q, 'a')).toBe(true)
    expect(isEarAnswerCorrect(q, 'b')).toBe(false)
  })

  it('grades every question of a seeded round the same way twice', () => {
    const session = buildEarSession(MINIMAL_PAIRS, seeded(7))
    for (const q of session) {
      expect(isEarAnswerCorrect(q, q.side)).toBe(true)
      expect(isEarAnswerCorrect(q, q.side === 'a' ? 'b' : 'a')).toBe(false)
    }
  })
})

describe('the authored pair table', () => {
  it('has enough pairs to be worth a screen', () => {
    expect(MINIMAL_PAIRS.length).toBeGreaterThanOrEqual(24)
  })

  it('gives every pair two different real words and a note', () => {
    for (const p of MINIMAL_PAIRS) {
      const id = `${p.a}/${p.b}`
      expect(p.a.trim(), id).toBeTruthy()
      expect(p.b.trim(), id).toBeTruthy()
      expect(p.note.trim(), id).toBeTruthy()
      expect(p.a, id).not.toBe(p.b)
      // Single plain-letter words only: these get read out by TTS and printed
      // on a 44px button, so no phrases, no punctuation, no invented spellings.
      expect(p.a, id).toMatch(/^[a-z]+$/)
      expect(p.b, id).toMatch(/^[a-z]+$/)
    }
  })

  it('writes a note she can actually read in one breath', () => {
    for (const p of MINIMAL_PAIRS) {
      expect(p.note.length, `${p.a}/${p.b}`).toBeGreaterThan(30)
      expect(p.note.length, `${p.a}/${p.b}`).toBeLessThan(260)
    }
  })

  it('never lists the same pair twice', () => {
    const keys = MINIMAL_PAIRS.map(p => `${p.a}/${p.b}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('files every pair under a heading Compare can show', () => {
    const known = new Set(PAIR_GROUPS.map(g => g.id))
    for (const p of MINIMAL_PAIRS) expect(known.has(p.group), `${p.a}/${p.b}`).toBe(true)
    for (const g of PAIR_GROUPS) {
      expect(MINIMAL_PAIRS.some(p => p.group === g.id), g.id).toBe(true)
      expect(g.title).toBeTruthy()
      expect(g.blurb).toBeTruthy()
    }
  })

  it('marks the NEAR/SQUARE merges and only those', () => {
    for (const p of MINIMAL_PAIRS) {
      expect(p.merged, `${p.a}/${p.b}`).toBe(p.group === 'near-square')
    }
  })

  it('covers the shifts a newcomer to New Zealand actually trips over', () => {
    const has = (a: string, b: string) => MINIMAL_PAIRS.some(p => p.a === a && p.b === b)
    // DRESS raising, TRAP raising, KIT centralising, the long/short i she has
    // no equivalent for in Portuguese, the NEAR/SQUARE merge, and the two
    // classic Portuguese-speaker consonant errors.
    expect(has('pen', 'pin')).toBe(true)
    expect(has('bad', 'bed')).toBe(true)
    expect(has('bit', 'but')).toBe(true)
    expect(has('sheep', 'ship')).toBe(true)
    expect(has('bear', 'beer')).toBe(true)
    expect(has('three', 'tree')).toBe(true)
    expect(has('very', 'berry')).toBe(true)
  })

  it('leaves a quiz pool big enough that a round is all different pairs', () => {
    expect(quizzablePairs(MINIMAL_PAIRS).length).toBeGreaterThan(EAR_SESSION_LENGTH)
  })
})
