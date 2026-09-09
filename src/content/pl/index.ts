import type { Deck } from '../../types'
import { PL_HELLO_DECK } from './greetings'
import { PL_NUMBERS_DECK } from './numbers'
import { PL_VERBS_DECK } from './verbs'
import { PL_PEOPLE_DECK } from './people'
import { PL_EMERGENCY_DECK } from './emergency'
import { PL_FEELINGS_DECK } from './feelings'
import { PL_QUESTIONS_DECK } from './questions'
import { PL_BASICS_DECK } from './basics'
import { PL_FOOD_DECK } from './food'
import { PL_SHOPPING_DECK } from './shopping'
import { PL_HOUSE_DECK } from './house'
import { PL_CLOTHES_DECK } from './clothes'
import { PL_BODY_DECK } from './body'
import { PL_TOWN_DECK } from './town'
import { PL_VERBS2_DECK } from './verbs2'
import { PL_POWER_DECK } from './power'
import { PL_MONEY_DECK } from './money'
import { PL_HOUSING_DECK } from './housing'
import { PL_HEALTH_DECK } from './health'
import { PL_TRANSPORT_DECK } from './transport'
import { PL_WORK_DECK } from './work'
import { PL_SMALLTALK_DECK } from './smalltalk'
import { PL_ADMIN_DECK } from './admin'
import { PL_AIRPORT_DECK } from './airport'
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
  PL_FOOD_DECK,
  PL_SHOPPING_DECK,
  PL_HOUSE_DECK,
  PL_CLOTHES_DECK,
  PL_BODY_DECK,
  PL_TOWN_DECK,
  PL_VERBS2_DECK,
  PL_POWER_DECK,
  PL_MONEY_DECK,
  PL_HOUSING_DECK,
  PL_HEALTH_DECK,
  PL_TRANSPORT_DECK,
  PL_WORK_DECK,
  PL_SMALLTALK_DECK,
  PL_ADMIN_DECK,
  PL_AIRPORT_DECK,
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
