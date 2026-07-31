import { describe, it, expect } from 'vitest'
import { buildQueue, requeueWrong } from './queue'
import type { Card, CardState, QueueItem } from '../types'

const NOW = 1_700_000_000_000
const DAY = 86_400_000

function card(id: string, level = 1): Card & { level: number } {
  return {
    id, deckId: 'd' + level, en: 'word' + id, pt: 'pt' + id,
    exampleHtml: 'I want <b>word</b> now.', examplePt: 'x y z',
    pos: 'noun', level,
  } as Card & { level: number }
}

function studied(due: number, reps = 3): CardState {
  return { due, interval: 5, ease: 2.5, reps, lapses: 0 }
}

const levelOf = (cards: (Card & { level: number })[]) => (id: string) =>
  cards.find(c => c.id === id)?.level ?? 1

describe('buildQueue', () => {
  it('includes every due card', () => {
    const cards = [card('a'), card('b')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1), b: studied(NOW - 1) },
      now: NOW, newPerSession: 0, cap: 20, canSpeak: false,
      levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId).sort()).toEqual(['a', 'b'])
  })

  it('excludes cards that are not yet due when there is nothing to backfill for', () => {
    const cards = [card('a'), card('b')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1), b: studied(NOW + DAY) },
      now: NOW, newPerSession: 0, cap: 1, canSpeak: false,
      levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId)).toEqual(['a'])
  })

  it('caps new cards at newPerSession', () => {
    const cards = [card('a'), card('b'), card('c'), card('d')]
    const q = buildQueue({
      cards, states: {}, now: NOW, newPerSession: 2, cap: 20,
      canSpeak: false, levelOf: levelOf(cards),
    })
    // Only two cards are *introduced*. The queue is longer than two items
    // because the recognition pass below adds a recall check for each of them
    // — but it never introduces a third card.
    expect(q.filter(i => i.modality === 'learn')).toHaveLength(2)
    expect(new Set(q.map(i => i.cardId))).toEqual(new Set(['a', 'b']))
  })

  // This used to read "prefers new cards at the learner current level", and
  // sorted by distance from a separately measured starting band. That band no
  // longer exists — everyone climbs from A1 — so the only sensible order for
  // new material is easiest first.
  it('introduces new cards easiest first, by deck level ascending', () => {
    const cards = [card('far', 4), card('mid', 3), card('near', 2), card('first', 1)]
    const q = buildQueue({
      cards, states: {}, now: NOW, newPerSession: 2, cap: 20,
      canSpeak: false, levelOf: levelOf(cards),
    })
    expect(q.filter(i => i.modality === 'learn').map(i => i.cardId)).toEqual(['first', 'near'])
  })

  it('keeps authored order within a level — the sort is stable', () => {
    const cards = [card('b', 1), card('a', 1), card('c', 1)]
    const q = buildQueue({
      cards, states: {}, now: NOW, newPerSession: 3, cap: 20,
      canSpeak: false, levelOf: levelOf(cards),
    })
    expect(q.filter(i => i.modality === 'learn').map(i => i.cardId)).toEqual(['b', 'a', 'c'])
  })

  it('interleaves new cards instead of stacking them at the front', () => {
    const cards = [card('n1'), card('n2'), card('r1'), card('r2'), card('r3'), card('r4')]
    const q = buildQueue({
      cards,
      states: { r1: studied(NOW - 1), r2: studied(NOW - 1), r3: studied(NOW - 1), r4: studied(NOW - 1) },
      now: NOW, newPerSession: 2, cap: 20, canSpeak: false,
      levelOf: levelOf(cards),
    })
    const newPositions = q.map((i, idx) => (i.modality === 'learn' ? idx : -1)).filter(i => i >= 0)
    expect(newPositions).toHaveLength(2)
    expect(newPositions[0]).not.toBe(0)
    expect(newPositions[1] - newPositions[0]).toBeGreaterThan(1)
  })

  it('respects the session cap', () => {
    const cards = Array.from({ length: 40 }, (_, i) => card('c' + i))
    const states = Object.fromEntries(cards.map(c => [c.id, studied(NOW - 1)]))
    const q = buildQueue({
      cards, states, now: NOW, newPerSession: 0, cap: 22,
      canSpeak: false, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(22)
  })

  it('backfills a thin session with studied cards that are not yet due', () => {
    const cards = [card('n1'), card('s1'), card('s2'), card('s3')]
    const q = buildQueue({
      cards,
      states: { s1: studied(NOW + DAY), s2: studied(NOW + 2 * DAY), s3: studied(NOW + 3 * DAY) },
      now: NOW, newPerSession: 1, cap: 3, canSpeak: false,
      levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(3)
    expect(q.map(i => i.cardId)).toContain('n1')
    expect(q.map(i => i.cardId)).toContain('s1')
  })

  it('backfills soonest-due first', () => {
    const cards = [card('s1'), card('s2')]
    const q = buildQueue({
      cards,
      states: { s1: studied(NOW + 5 * DAY), s2: studied(NOW + DAY) },
      now: NOW, newPerSession: 0, cap: 1, canSpeak: false,
      levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId)).toEqual(['s2'])
  })

  it('returns an empty queue when there is genuinely nothing', () => {
    expect(buildQueue({
      cards: [], states: {}, now: NOW, newPerSession: 8, cap: 20,
      canSpeak: false, levelOf: () => 1,
    })).toEqual([])
  })

  it('assigns a non-learn modality to review cards', () => {
    const cards = [card('a')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1, 1) }, now: NOW, newPerSession: 0,
      cap: 20, canSpeak: false, levelOf: levelOf(cards),
    })
    expect(q[0].modality).not.toBe('learn')
  })

  it('still introduces new cards when the due backlog fills the cap', () => {
    const dueCards = Array.from({ length: 30 }, (_, i) => card('r' + i))
    const newCards = [card('n1'), card('n2'), card('n3')]
    const cards = [...dueCards, ...newCards]
    const states = Object.fromEntries(dueCards.map(c => [c.id, studied(NOW - 1)]))
    const q = buildQueue({
      cards, states, now: NOW, newPerSession: 3, cap: 20,
      canSpeak: false, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(20)
    expect(q.filter(i => i.modality === 'learn')).toHaveLength(3)
  })

  it('does not stack new cards at the head when they outnumber reviews', () => {
    const cards = [card('r1'), card('r2'), ...Array.from({ length: 8 }, (_, i) => card('n' + i))]
    const q = buildQueue({
      cards, states: { r1: studied(NOW - 1), r2: studied(NOW - 1) },
      now: NOW, newPerSession: 8, cap: 20, canSpeak: false,
      levelOf: levelOf(cards),
    })
    expect(q[0].modality).not.toBe('learn')
    // r1/r2 are studied with reps=3; supportedModalities for these cards is
    // ['recognize','listen','type','build','dictate'], so reps % 5 === 3 -> 'build'.
    const lastReviewAt = q.map(i => i.modality).lastIndexOf('build')
    expect(lastReviewAt).toBeGreaterThan(0)
  })
})

describe('buildQueue — day one', () => {
  // Every profile now begins exactly here: A1, no card states at all, so no
  // due pool and no backfill pool. Before the recognition pass this produced 8
  // items, all 'learn': eight taps of "Got it" and not one question.
  const cards = Array.from({ length: 30 }, (_, i) => card('n' + i))
  const dayOne = () => buildQueue({
    cards, states: {}, now: NOW, newPerSession: 8, cap: 22,
    canSpeak: false, levelOf: levelOf(cards),
  })

  it('is no longer a queue of nothing but learn items', () => {
    const q = dayOne()
    expect(q.every(i => i.modality === 'learn')).toBe(false)
    expect(q.some(i => i.modality === 'learn')).toBe(true)
    expect(q.some(i => i.modality === 'recognize')).toBe(true)
  })

  it('tests every new card it introduced, in the order it introduced them', () => {
    const q = dayOne()
    const learned = q.filter(i => i.modality === 'learn').map(i => i.cardId)
    const recalled = q.filter(i => i.modality === 'recognize').map(i => i.cardId)
    expect(learned).toHaveLength(8)
    expect(recalled).toEqual(learned)
  })

  it('puts the recall check after the teaching, never before it', () => {
    const q = dayOne()
    for (const id of new Set(q.map(i => i.cardId))) {
      const positions = q.map((it, idx) => (it.cardId === id ? idx : -1)).filter(i => i >= 0)
      expect(q[positions[0]].modality).toBe('learn')
    }
  })

  it('stays within the cap', () => {
    const many = Array.from({ length: 40 }, (_, i) => card('m' + i))
    const q = buildQueue({
      cards: many, states: {}, now: NOW, newPerSession: 20, cap: 22,
      canSpeak: false, levelOf: levelOf(many),
    })
    expect(q.length).toBeLessThanOrEqual(22)
    expect(q).toHaveLength(22)
    expect(dayOne().length).toBeLessThanOrEqual(22)
  })

  it('does not shadow a card the session already reviews in another modality', () => {
    const cs = [card('n1'), card('r1')]
    const q = buildQueue({
      cards: cs, states: { r1: studied(NOW - 1, 5) }, now: NOW, newPerSession: 1,
      cap: 20, canSpeak: false, levelOf: levelOf(cs),
    })
    expect(q.filter(i => i.cardId === 'r1')).toHaveLength(1)
    expect(q.filter(i => i.cardId === 'n1').map(i => i.modality)).toEqual(['learn', 'recognize'])
  })

  it('adds nothing when the session is already full', () => {
    const cs = Array.from({ length: 30 }, (_, i) => card('d' + i))
    const states = Object.fromEntries(cs.map(c => [c.id, studied(NOW - 1)]))
    const q = buildQueue({
      cards: cs, states, now: NOW, newPerSession: 0, cap: 22,
      canSpeak: false, levelOf: levelOf(cs),
    })
    expect(q).toHaveLength(22)
    expect(q.some(i => i.modality === 'learn')).toBe(false)
  })
})

describe('buildQueue — weak-skill bias', () => {
  // 30 mature cards, each supporting all six modalities, ordered by due date so
  // the queue is deterministic. reps cycles 1..6 so the unbiased rotation
  // spreads evenly.
  const cards = Array.from({ length: 30 }, (_, i) => card('c' + i))
  const states = Object.fromEntries(cards.map((c, i) => [
    c.id, { due: NOW - (30 - i) * 1000, interval: 5, ease: 2.5, reps: (i % 6) + 1, lapses: 0 },
  ]))
  const build = (bias?: 'speaking' | 'listening' | 'vocab' | 'grammar') => buildQueue({
    cards, states, now: NOW, newPerSession: 0, cap: 22,
    canSpeak: true, levelOf: levelOf(cards), bias,
  })

  it('is a nudge, not a takeover', () => {
    const plain = build()
    const biased = build('speaking')
    expect(biased).toHaveLength(22)

    const before = plain.filter(i => i.modality === 'speak').length
    const after = biased.filter(i => i.modality === 'speak').length

    // More than she would have got without the nudge...
    expect(after).toBeGreaterThan(before)
    // ...but never a session of nothing but the microphone. Before this fix
    // this was 22 of 22.
    expect(after).toBeLessThanOrEqual(Math.ceil(biased.length / 2))
    // ...and the session is still a language lesson, not one drill.
    expect(new Set(biased.map(i => i.modality)).size).toBeGreaterThanOrEqual(3)
  })

  it('touches at most one in three review items', () => {
    for (const bias of ['speaking', 'listening', 'vocab', 'grammar'] as const) {
      const plain = build()
      const biased = build(bias)
      const changed = biased.filter((it, i) => it.modality !== plain[i].modality).length
      expect(changed).toBeLessThanOrEqual(Math.floor(biased.length / 3))
      expect(new Set(biased.map(i => i.modality)).size).toBeGreaterThanOrEqual(3)
    }
  })

  it('leaves the order and the cards themselves alone', () => {
    expect(build('vocab').map(i => i.cardId)).toEqual(build().map(i => i.cardId))
  })

  it('never rewrites a teaching item', () => {
    const mixed = [...cards.slice(0, 4), card('fresh')]
    const q = buildQueue({
      cards: mixed, states, now: NOW, newPerSession: 1, cap: 22,
      canSpeak: true, levelOf: levelOf(mixed), bias: 'speaking',
    })
    expect(q.find(i => i.cardId === 'fresh')?.modality).toBe('learn')
  })
})

describe('requeueWrong', () => {
  const base: QueueItem[] = [
    { cardId: 'a', modality: 'type' },
    { cardId: 'b', modality: 'listen' },
  ]

  it('appends a recognition repeat to the end', () => {
    const out = requeueWrong(base, 0)
    expect(out).toHaveLength(3)
    expect(out[2]).toEqual({ cardId: 'a', modality: 'recognize', repeat: true })
  })

  it('does not queue a second repeat for the same card', () => {
    const once = requeueWrong(base, 0)
    expect(requeueWrong(once, 0)).toHaveLength(3)
  })

  it('does not mutate the queue it is given', () => {
    requeueWrong(base, 0)
    expect(base).toHaveLength(2)
  })
})
