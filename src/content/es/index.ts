import type { Deck } from '../../types'
import { ES_BASIC_DECKS } from './basics'
import { ES_CONVERSATION_DECKS } from './conversation'
import { ES_GRAMMAR_DECKS } from './grammar'
import { ES_WORK_DECKS } from './work'
import { ES_EVERYDAY_DECKS } from './everyday'
import { ES_DISCOURSE_DECKS } from './discourse'
import { ES_VERB_DECKS } from './verbs'

/** Ordered easiest-first: the session introduces new cards by deck level. */
export const ES_DECKS: Deck[] = [
  ...ES_BASIC_DECKS,
  ...ES_EVERYDAY_DECKS,
  ...ES_WORK_DECKS,
  ...ES_CONVERSATION_DECKS,
  ...ES_VERB_DECKS,
  ...ES_GRAMMAR_DECKS,
  ...ES_DISCOURSE_DECKS,
]
