import type { CardState, Deck, Rating } from '../types'
import { DAY, MIN } from './time'

export function newCardState(now: number): CardState {
  return { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 }
}

/** Pure SM-2 lite. Returns a new state; never mutates the input. */
export function schedule(state: CardState | undefined, rating: Rating, now: number): CardState {
  const c: CardState = state ? { ...state } : newCardState(now)

  if (rating === 0) {
    c.reps = Math.max(1, c.reps)
    c.lapses += 1
    c.interval = 0
    c.ease = Math.max(1.3, c.ease - 0.2)
    c.due = now + 10 * MIN
    return c
  }

  c.reps += 1
  if (c.reps === 1) {
    c.interval = rating === 1 ? 0.007 : rating === 2 ? 1 : 4
  } else if (c.reps === 2) {
    c.interval = rating === 1 ? 1 : rating === 2 ? 3 : 6
  } else {
    const factor = rating === 1 ? 1.2 : rating === 2 ? c.ease : c.ease * 1.3
    c.interval = Math.max(1, Math.round(c.interval * factor))
  }

  if (rating === 1) c.ease = Math.max(1.3, c.ease - 0.15)
  if (rating === 3) c.ease = c.ease + 0.1

  c.due = now + Math.round(c.interval * DAY)
  return c
}

export function isNew(state: CardState | undefined): boolean {
  return !state || state.reps === 0
}

export function isDue(state: CardState | undefined, now: number): boolean {
  return !!state && state.due <= now
}

export function deckProgress(
  deck: Deck,
  cards: Record<string, CardState>,
  now: number,
): { learned: number; due: number; total: number } {
  let learned = 0
  let due = 0
  for (const card of deck.cards) {
    const s = cards[card.id]
    if (!s) continue
    if (s.reps > 0) learned += 1
    if (s.due <= now) due += 1
  }
  return { learned, due, total: deck.cards.length }
}

export function totalKnown(cards: Record<string, CardState>): number {
  return Object.values(cards).filter(s => s.reps > 0).length
}

export function totalDue(cards: Record<string, CardState>, now: number): number {
  return Object.values(cards).filter(s => s.due <= now).length
}
