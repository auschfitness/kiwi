import { describe, it, expect } from 'vitest'
import { buildPlacementTest, scorePlacement, seedKnownCards } from './placement'
import type { Card, Level } from '../types'

const DAY = 86_400_000
const NOW = 1_700_000_000_000

/** Deterministic pseudo-random in [0,1). */
function seeded(seed = 1) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}

function makeCards(level: Level, n: number): Card[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `L${level}_${i}`, deckId: `d${level}`,
    en: `en${level}${i}`, pt: `pt${level}${i}`,
    exampleHtml: `I want <b>en${level}${i}</b> now.`, examplePt: 'x y z',
    pos: 'noun' as const,
  }))
}

const pool: Record<Level, Card[]> = { 1: makeCards(1, 20), 2: makeCards(2, 20), 3: makeCards(3, 20), 4: makeCards(4, 20) }

describe('buildPlacementTest', () => {
  it('produces 17 questions across four bands', () => {
    const qs = buildPlacementTest(pool, seeded())
    expect(qs).toHaveLength(17)
    const counts = qs.reduce<Record<number, number>>((a, q) => { a[q.band] = (a[q.band] ?? 0) + 1; return a }, {})
    expect(counts).toEqual({ 1: 5, 2: 5, 3: 5, 4: 2 })
  })

  it('orders questions by ascending difficulty', () => {
    const bands = buildPlacementTest(pool, seeded()).map(q => q.band)
    expect(bands).toEqual([...bands].sort((a, b) => a - b))
  })

  it('gives every multiple-choice question four distinct options containing the answer', () => {
    for (const q of buildPlacementTest(pool, seeded())) {
      if (q.kind !== 'choice') continue
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options)).toHaveLength(4)
      expect(q.options).toContain(q.answer)
    }
  })

  it('includes typed questions at the hard end only', () => {
    const qs = buildPlacementTest(pool, seeded())
    const typed = qs.filter(q => q.kind === 'type')
    expect(typed.length).toBeGreaterThanOrEqual(3)
    expect(typed.every(q => q.band >= 3)).toBe(true)
  })

  it('never repeats a card', () => {
    const ids = buildPlacementTest(pool, seeded()).map(q => q.cardId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is deterministic for a given rand', () => {
    expect(buildPlacementTest(pool, seeded(7))).toEqual(buildPlacementTest(pool, seeded(7)))
  })
})

describe('scorePlacement', () => {
  const qs = buildPlacementTest(pool, seeded())

  function answerBands(passing: Level[]): Record<string, boolean> {
    return Object.fromEntries(qs.map(q => [q.id, passing.includes(q.band)]))
  }

  it('places a total beginner at level 1', () => {
    expect(scorePlacement(qs, answerBands([])).startLevel).toBe(1)
  })

  it('places someone who passes band 1 only at level 1', () => {
    expect(scorePlacement(qs, answerBands([1])).startLevel).toBe(1)
  })

  it('places someone who passes bands 1 and 2 at level 2', () => {
    expect(scorePlacement(qs, answerBands([1, 2])).startLevel).toBe(2)
  })

  it('places a strong learner at level 4', () => {
    expect(scorePlacement(qs, answerBands([1, 2, 3, 4])).startLevel).toBe(4)
  })

  it('requires consecutive bands — a gap stops the climb', () => {
    expect(scorePlacement(qs, answerBands([1, 3, 4])).startLevel).toBe(1)
  })

  it('passes a band at exactly 60 percent', () => {
    const band1 = qs.filter(q => q.band === 1)
    const answers = Object.fromEntries(qs.map(q => [q.id, false]))
    band1.slice(0, 3).forEach(q => { answers[q.id] = true }) // 3/5 = 60%
    expect(scorePlacement(qs, answers).byBand[1]).toEqual({ correct: 3, total: 5 })
    expect(scorePlacement(qs, answers).startLevel).toBe(1)
  })

  it('reports per-band tallies', () => {
    const result = scorePlacement(qs, answerBands([1, 2]))
    expect(result.byBand[1].total).toBe(5)
    expect(result.byBand[4].correct).toBe(0)
  })
})

describe('seedKnownCards', () => {
  it('marks cards as known but reviewable', () => {
    const seeded1 = seedKnownCards(['a', 'b', 'c'], NOW, seeded())
    for (const s of Object.values(seeded1)) {
      expect(s.reps).toBe(2)
      expect(s.interval).toBe(2)
      expect(s.ease).toBe(2.5)
      expect(s.due).toBeGreaterThanOrEqual(NOW + DAY)
      expect(s.due).toBeLessThanOrEqual(NOW + 4 * DAY)
    }
  })

  it('spreads due dates rather than stacking them on one day', () => {
    const many = seedKnownCards(Array.from({ length: 40 }, (_, i) => 'c' + i), NOW, seeded())
    const days = new Set(Object.values(many).map(s => Math.round((s.due - NOW) / DAY)))
    expect(days.size).toBeGreaterThan(1)
  })

  it('returns an empty map for no cards', () => {
    expect(seedKnownCards([], NOW, seeded())).toEqual({})
  })
})
