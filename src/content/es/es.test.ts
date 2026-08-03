import { describe, it, expect } from 'vitest'
import { ES_DECKS } from './index'
import { isTypable, isSentence, DEFAULT_TYPABLE_POS } from '../../core/text'
import { supportedModalities } from '../../core/modality'
import type { PartOfSpeech } from '../../types'

const ES_CARDS = ES_DECKS.flatMap(d => d.cards)

const ES_RULES = {
  modalities: ['type', 'build', 'dictate', 'speak'] as const,
  typablePos: new Set<PartOfSpeech>([...DEFAULT_TYPABLE_POS, 'phrase']),
}

describe('Spanish corpus', () => {
  it('ships a course worth studying', () => {
    expect(ES_CARDS.length).toBeGreaterThanOrEqual(150)
  })

  it('gives every card the fields a session needs', () => {
    for (const c of ES_CARDS) {
      expect(c.id, c.id).toBeTruthy()
      expect(c.en.trim(), c.id).not.toBe('')
      expect(c.pt.trim(), c.id).not.toBe('')
      expect(c.examplePt.trim(), c.id).not.toBe('')
      expect(c.exampleHtml, c.id).toContain('<b>')
    }
  })

  it('keeps every card inside the deck that owns it', () => {
    for (const deck of ES_DECKS) {
      for (const c of deck.cards) expect(c.deckId, c.id).toBe(deck.id)
    }
  })

  /**
   * The whole point of the course. A card that cannot be typed cannot exercise
   * production, which is the one thing he is missing — so this is the test that
   * says the corpus is fit for its purpose rather than merely well-formed.
   */
  it('makes every card typable under the Spanish rules', () => {
    const untypable = ES_CARDS.filter(c => !isTypable(c, ES_RULES.typablePos))
    expect(untypable.map(c => `${c.id}: ${c.en}`)).toEqual([])
  })

  // Sentence building and dictation both need an example of three to nine
  // words. Most cards should reach them; a handful falling outside is fine.
  it('gives most cards a sentence to build and dictate', () => {
    const withSentence = ES_CARDS.filter(isSentence).length
    expect(withSentence / ES_CARDS.length).toBeGreaterThan(0.8)
  })

  it('leaves no card without an exercise', () => {
    for (const c of ES_CARDS) {
      expect(supportedModalities(c, false, ES_RULES).length, c.id).toBeGreaterThan(0)
    }
  })

  // Latin American Spanish: `ustedes`, never the peninsular `vosotros`.
  it('uses no peninsular conjugation', () => {
    const peninsular = ES_CARDS.filter(c =>
      /\bvosotros\b|\bvuestro/i.test(`${c.en} ${c.exampleHtml}`),
    )
    expect(peninsular.map(c => c.id)).toEqual([])
  })
})
