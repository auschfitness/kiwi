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
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId).sort()).toEqual(['a', 'b'])
  })

  it('excludes cards that are not yet due when there is nothing to backfill for', () => {
    const cards = [card('a'), card('b')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1), b: studied(NOW + DAY) },
      now: NOW, newPerSession: 0, cap: 1, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId)).toEqual(['a'])
  })

  it('caps new cards at newPerSession', () => {
    const cards = [card('a'), card('b'), card('c'), card('d')]
    const q = buildQueue({
      cards, states: {}, now: NOW, newPerSession: 2, cap: 20,
      canSpeak: false, cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(2)
    expect(q.every(i => i.modality === 'learn')).toBe(true)
  })

  it('prefers new cards at the learner current level', () => {
    const cards = [card('far', 4), card('near', 2), card('mid', 3)]
    const q = buildQueue({
      cards, states: {}, now: NOW, newPerSession: 1, cap: 20,
      canSpeak: false, cefrLevel: 2, levelOf: levelOf(cards),
    })
    expect(q[0].cardId).toBe('near')
  })

  it('interleaves new cards instead of stacking them at the front', () => {
    const cards = [card('n1'), card('n2'), card('r1'), card('r2'), card('r3'), card('r4')]
    const q = buildQueue({
      cards,
      states: { r1: studied(NOW - 1), r2: studied(NOW - 1), r3: studied(NOW - 1), r4: studied(NOW - 1) },
      now: NOW, newPerSession: 2, cap: 20, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
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
      canSpeak: false, cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(22)
  })

  it('backfills a thin session with studied cards that are not yet due', () => {
    const cards = [card('n1'), card('s1'), card('s2'), card('s3')]
    const q = buildQueue({
      cards,
      states: { s1: studied(NOW + DAY), s2: studied(NOW + 2 * DAY), s3: studied(NOW + 3 * DAY) },
      now: NOW, newPerSession: 1, cap: 3, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
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
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId)).toEqual(['s2'])
  })

  it('returns an empty queue when there is genuinely nothing', () => {
    expect(buildQueue({
      cards: [], states: {}, now: NOW, newPerSession: 8, cap: 20,
      canSpeak: false, cefrLevel: 1, levelOf: () => 1,
    })).toEqual([])
  })

  it('assigns a non-learn modality to review cards', () => {
    const cards = [card('a')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1, 1) }, now: NOW, newPerSession: 0,
      cap: 20, canSpeak: false, cefrLevel: 1, levelOf: levelOf(cards),
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
      canSpeak: false, cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(20)
    expect(q.filter(i => i.modality === 'learn')).toHaveLength(3)
  })

  it('does not stack new cards at the head when they outnumber reviews', () => {
    const cards = [card('r1'), card('r2'), ...Array.from({ length: 8 }, (_, i) => card('n' + i))]
    const q = buildQueue({
      cards, states: { r1: studied(NOW - 1), r2: studied(NOW - 1) },
      now: NOW, newPerSession: 8, cap: 20, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q[0].modality).not.toBe('learn')
    // r1/r2 are studied with reps=3; supportedModalities for these cards is
    // ['recognize','listen','type','build','dictate'], so reps % 5 === 3 -> 'build'.
    const lastReviewAt = q.map(i => i.modality).lastIndexOf('build')
    expect(lastReviewAt).toBeGreaterThan(0)
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
