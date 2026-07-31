import type { Card, Deck, Level } from '../types'
import { GENERATED_DECKS } from './decks.generated'
import { IRREGULAR_DECK } from './authored/irregular'
import { B2_DECKS } from './authored/b2'
import { PHONETICS } from './authored/phonetics'
import { PHOTOS } from './authored/photos'

export { DIALOGUES } from './dialogues.generated'
export { PLAN } from './plan'
export { IRREGULAR_TABLE } from './authored/irregular'
export { PHONETICS } from './authored/phonetics'
export { PHOTOS } from './authored/photos'
export { PHOTO_CREDITS } from './authored/photoCredits'
export { MINIMAL_PAIRS, PAIR_GROUPS } from './authored/minimalPairs'
export type { MinimalPair, PairGroup, PairGroupInfo } from './authored/minimalPairs'

const RAW_DECKS: Deck[] = [...GENERATED_DECKS, IRREGULAR_DECK, ...B2_DECKS]

/** Pronunciation and photographs are both kept beside the decks rather than
 * in them, because decks.generated.ts is machine-written and must not be
 * hand-edited: PHONETICS is authored by hand (see
 * authored/PHONETICS-CONVENTION.md), PHOTOS is written by
 * scripts/fetch-photos.mjs. A card missing from either table just renders
 * without that piece. */
/** PHOTOS stores root-absolute paths (`/photos/x.webp`), which is right when
 * the app is served from the root of a domain. Hosted in a subfolder — the
 * `base` case the README describes — it has to become `/english/photos/x.webp`
 * or every picture 404s. BASE_URL is `/` unless someone sets `base`, so this
 * is a no-op in the normal deploy and in tests. */
const BASE = import.meta.env.BASE_URL

function photoSrc(id: string): string | undefined {
  const p = PHOTOS[id]
  return p === undefined ? undefined : BASE + p.replace(/^\//, '')
}

export const DECKS: Deck[] = RAW_DECKS.map(deck => ({
  ...deck,
  cards: deck.cards.map(card => ({
    ...card,
    phonetic: PHONETICS[card.id] ?? card.phonetic,
    photo: photoSrc(card.id) ?? card.photo,
  })),
}))

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
