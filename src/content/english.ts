import type { Card, Deck } from '../types'
import { GENERATED_DECKS } from './decks.generated'
import { IRREGULAR_DECK } from './authored/irregular'
import { B2_DECKS } from './authored/b2'
import { PHONETICS } from './authored/phonetics'
import { PHOTOS } from './authored/photos'

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

/**
 * The English course's decks, with pronunciation and photographs attached.
 *
 * Exported from here rather than from ./index.ts so that src/courses/ can
 * import it without importing ./index.ts, which imports src/courses/ back.
 */
export const ENGLISH_DECKS: Deck[] = RAW_DECKS.map(deck => ({
  ...deck,
  cards: deck.cards.map(card => ({
    ...card,
    phonetic: PHONETICS[card.id] ?? card.phonetic,
    photo: photoSrc(card.id) ?? card.photo,
  })),
}))

export const ENGLISH_CARDS: Card[] = ENGLISH_DECKS.flatMap(d => d.cards)
