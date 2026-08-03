import type { Deck } from '../../types'
import { ES_CONVERSATION_DECKS } from './conversation'
import { ES_GRAMMAR_DECKS } from './grammar'

export const ES_DECKS: Deck[] = [...ES_CONVERSATION_DECKS, ...ES_GRAMMAR_DECKS]
