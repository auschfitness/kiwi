import type { Deck } from '../../types'
import { ES_BASIC_DECKS } from './basics'
import { ES_CONVERSATION_DECKS } from './conversation'
import { ES_GRAMMAR_DECKS } from './grammar'
import { ES_WORK_DECKS } from './work'
import { ES_EVERYDAY_DECKS } from './everyday'
import { ES_DISCOURSE_DECKS } from './discourse'
import { ES_VERB_DECKS } from './verbs'
import { PHOTOS_ES } from '../authored/photosEs'
import { photoSrc } from '../photoSrc'

const RAW_DECKS: Deck[] = [
  ...ES_BASIC_DECKS,
  ...ES_EVERYDAY_DECKS,
  ...ES_WORK_DECKS,
  ...ES_CONVERSATION_DECKS,
  ...ES_VERB_DECKS,
  ...ES_GRAMMAR_DECKS,
  ...ES_DISCOURSE_DECKS,
]

/**
 * Photographs attached the same way english.ts attaches PHOTOS: written by
 * `node scripts/fetch-photos.mjs --course=es`, merged here rather than baked
 * into the deck files so those stay hand-authored and readable. A card
 * missing from PHOTOS_ES just renders without one — most of this course does,
 * on purpose, since it teaches phrases, verbs and grammar a camera can't show.
 *
 * Ordered easiest-first: the session introduces new cards by deck level.
 */
export const ES_DECKS: Deck[] = RAW_DECKS.map(deck => ({
  ...deck,
  cards: deck.cards.map(card => ({
    ...card,
    photo: photoSrc(PHOTOS_ES, card.id) ?? card.photo,
  })),
}))
