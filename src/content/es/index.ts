import type { Deck } from '../../types'
import { ES_CONVERSATION_DECKS } from './conversation'
import { ES_GRAMMAR_DECKS } from './grammar'
import { ES_WORK_DECKS } from './work'
import { ES_EVERYDAY_DECKS } from './everyday'

export const ES_DECKS: Deck[] = [
  ...ES_CONVERSATION_DECKS,
  ...ES_EVERYDAY_DECKS,
  ...ES_WORK_DECKS,
  ...ES_GRAMMAR_DECKS,
]
