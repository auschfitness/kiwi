import type { Card, Deck, Level } from '../types'
import { GENERATED_DECKS } from './decks.generated'

export { DIALOGUES } from './dialogues.generated'
export { PLAN } from './plan'

export const DECKS: Deck[] = [...GENERATED_DECKS]

export const ALL_CARDS: Card[] = DECKS.flatMap(d => d.cards)

export const CARD_INDEX: Record<string, Card> = Object.fromEntries(
  ALL_CARDS.map(c => [c.id, c] as const),
)

export function cardById(id: string): Card | undefined {
  return CARD_INDEX[id]
}

export function deckById(id: string): Deck | undefined {
  return DECKS.find(d => d.id === id)
}

/** Decks the learner may study at a given unlocked level. */
export function decksForLevel(max: Level): Deck[] {
  return DECKS.filter(d => d.level <= max)
}

export function levelOfCard(id: string): Level | undefined {
  const card = CARD_INDEX[id]
  return card ? deckById(card.deckId)?.level : undefined
}
