import type { Deck } from '../../types'
import { PL_HELLO_DECK } from './greetings'
import { PL_NUMBERS_DECK } from './numbers'
import { PL_VERBS_DECK } from './verbs'
import { PL_PEOPLE_DECK } from './people'
import { PL_EMERGENCY_DECK } from './emergency'
import { PL_FEELINGS_DECK } from './feelings'
import { PL_QUESTIONS_DECK } from './questions'
import { PL_BASICS_DECK } from './basics'
import { PHONETICS_PL } from '../authored/phoneticsPl'
import { PHOTOS_PL } from '../authored/photosPl'
import { photoSrc } from '../photoSrc'

const RAW_DECKS: Deck[] = [
  PL_HELLO_DECK,
  PL_NUMBERS_DECK,
  PL_VERBS_DECK,
  PL_PEOPLE_DECK,
  PL_EMERGENCY_DECK,
  PL_FEELINGS_DECK,
  PL_QUESTIONS_DECK,
  PL_BASICS_DECK,
]

/**
 * The Polish course's decks, with pronunciation and photographs attached —
 * the same merge english.ts and content/es/index.ts each do for their own
 * course. PHONETICS_PL is hand-authored (see
 * authored/PHONETICS-CONVENTION.md §9); PHOTOS_PL is written by
 * `node scripts/fetch-photos.mjs --course=pl` (Task 13) and starts empty, so
 * this file is correct before that script has ever run.
 */
export const PL_DECKS: Deck[] = RAW_DECKS.map(deck => ({
  ...deck,
  cards: deck.cards.map(card => ({
    ...card,
    phonetic: PHONETICS_PL[card.id] ?? card.phonetic,
    photo: photoSrc(PHOTOS_PL, card.id) ?? card.photo,
  })),
}))
