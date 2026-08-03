import { describe, it, expect } from 'vitest'
import { ES_DECKS } from './index'
import { ES_ROLEPLAYS } from './roleplays'
import { ES_DIALOGUES } from './dialogues'
import { isTypable, isSentence, DEFAULT_TYPABLE_POS } from '../../core/text'
import { supportedModalities } from '../../core/modality'
import type { PartOfSpeech } from '../../types'

const ES_CARDS = ES_DECKS.flatMap(d => d.cards)

const ES_RULES = {
  modalities: ['type', 'build', 'dictate', 'speak'] as const,
  typablePos: new Set<PartOfSpeech>([...DEFAULT_TYPABLE_POS, 'phrase']),
  typableMaxChars: 24,
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
    const untypable = ES_CARDS.filter(c => !isTypable(c, ES_RULES.typablePos, ES_RULES.typableMaxChars))
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

describe('Spanish practice material', () => {
  it('ships scenes and conversations', () => {
    expect(ES_ROLEPLAYS.length).toBeGreaterThanOrEqual(6)
    expect(ES_DIALOGUES.length).toBeGreaterThanOrEqual(6)
  })

  /**
   * Every `you` line has to be sayable in one breath. A long expected answer
   * fails him constantly and teaches nothing — the same rule the English table
   * learned the hard way.
   */
  it('keeps his lines short enough to say on a first try', () => {
    for (const play of ES_ROLEPLAYS) {
      for (const turn of play.turns) {
        if (turn.speaker !== 'you') continue
        const words = turn.en.trim().split(/\s+/).length
        expect(words, `${play.id}: ${turn.en}`).toBeLessThanOrEqual(6)
      }
    }
  })

  // `matchesExpected` allows contractions, containment and a fuzzy near-miss,
  // so these only need to cover genuinely different phrasings — but a line
  // with none at all accepts exactly one wording and will feel broken.
  it('gives every line of his some other way to be right', () => {
    for (const play of ES_ROLEPLAYS) {
      for (const turn of play.turns) {
        if (turn.speaker !== 'you') continue
        expect(turn.accept?.length ?? 0, `${play.id}: ${turn.en}`).toBeGreaterThan(0)
      }
    }
  })

  it('opens and closes every scene with the other person speaking first', () => {
    for (const play of ES_ROLEPLAYS) {
      expect(play.turns[0].speaker, play.id).toBe('them')
      expect(play.turns.length, play.id).toBeGreaterThanOrEqual(8)
    }
  })

  it('translates every dialogue line', () => {
    for (const d of ES_DIALOGUES) {
      expect(d.lines.length, d.id).toBeGreaterThanOrEqual(6)
      for (const line of d.lines) {
        expect(line.en.trim(), d.id).not.toBe('')
        expect(line.pt.trim(), d.id).not.toBe('')
        expect(line.who.trim(), d.id).not.toBe('')
      }
    }
  })

  it('uses no peninsular conjugation in the practice material either', () => {
    const all = [
      ...ES_ROLEPLAYS.flatMap(p => p.turns.map(t => t.en)),
      ...ES_DIALOGUES.flatMap(d => d.lines.map(l => l.en)),
    ]
    expect(all.filter(line => /\bvosotros\b|\bvuestro/i.test(line))).toEqual([])
  })
})
