import type { CardState, Deck, Rating } from '../types'
import { DAY, HOUR, MIN } from './time'

export const RATINGS: readonly Rating[] = [0, 1, 2, 3]

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

/**
 * Short human label for a gap in time: under an hour "Nm", under a day "Nh",
 * otherwise "Nd". Never rounds down to a bare "0".
 *
 * Exported so the format rule can be tested on its own. No rating the current
 * engine produces lands in the hours band, but the band has to exist: the
 * moment someone adds a "1h" step, the buttons should say so without anyone
 * remembering to come back here.
 */
export function formatDelta(ms: number): string {
  const gap = Math.max(0, ms)
  if (gap < HOUR) return `${Math.max(1, Math.round(gap / MIN))}m`
  if (gap < DAY) return `${Math.max(1, Math.round(gap / HOUR))}h`
  return `${Math.max(1, Math.round(gap / DAY))}d`
}

/**
 * What each of the four buttons would actually do to this card, as a label she
 * can read before she taps: { 0: '10m', 1: '10m', 2: '1d', 3: '4d' }.
 *
 * Derived by running the real scheduler once per rating rather than restating
 * its arithmetic, so the numbers on the buttons can never drift away from the
 * numbers the engine goes on to use.
 */
export function previewIntervals(state: CardState | undefined, now: number): Record<Rating, string> {
  const out = {} as Record<Rating, string>
  for (const rating of RATINGS) {
    out[rating] = formatDelta(schedule(state, rating, now).due - now)
  }
  return out
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
