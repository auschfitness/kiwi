import type { Card, Deck, Level } from '../types'
import { ACTIVE_COURSE } from '../courses'

export { PLAN } from './plan'
export { IRREGULAR_TABLE } from './authored/irregular'
export { PHONETICS } from './authored/phonetics'
export { PHOTOS } from './authored/photos'
export { PHOTO_CREDITS } from './authored/photoCredits'
export { MINIMAL_PAIRS, PAIR_GROUPS } from './authored/minimalPairs'
export type { MinimalPair, PairGroup, PairGroupInfo } from './authored/minimalPairs'
export type { Roleplay, RoleplayTurn } from './authored/roleplays'

/** The active course's scripted scenes and listen-along conversations. */
export const ROLEPLAYS = ACTIVE_COURSE.roleplays
export const DIALOGUES = ACTIVE_COURSE.dialogues
export { ENGLISH_DECKS, ENGLISH_CARDS } from './english'

/**
 * The decks of whichever course this device is studying.
 *
 * Everything downstream — the session, Home, the dashboard — reads the corpus
 * through here and never learns that more than one course exists. That works
 * because the active course cannot change while the page is open: switching
 * writes the preference and reloads (see src/courses/active.ts). A course that
 * could change under a running app would make every one of these constants a
 * lie.
 *
 * Note what stays English above: DIALOGUES, ROLEPLAYS, MINIMAL_PAIRS and
 * PHONETICS are all New Zealand material. The Practice screens built on them
 * are hidden in the Spanish course rather than shown full of Auckland cafés —
 * see `Course.hasPractice`.
 */
export const DECKS: Deck[] = ACTIVE_COURSE.decks

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
