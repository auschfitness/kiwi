import { describe, it, expect } from 'vitest'
import { PL_DECKS } from './index'
import { isSentence } from '../../core/text'

const PL_CARDS = PL_DECKS.flatMap(d => d.cards)

describe('Polish corpus', () => {
  it('ships an A1+A2 floor worth studying', () => {
    expect(PL_CARDS.length).toBeGreaterThanOrEqual(220)
  })

  it('has grown past Phase 1 alone — 16 decks now, not 8', () => {
    expect(PL_DECKS.length).toBeGreaterThanOrEqual(16)
  })

  it('gives every card the fields a session needs', () => {
    for (const c of PL_CARDS) {
      expect(c.id, c.id).toBeTruthy()
      expect(c.en.trim(), c.id).not.toBe('')
      expect(c.pt.trim(), c.id).not.toBe('')
      expect(c.examplePt.trim(), c.id).not.toBe('')
      expect(c.exampleHtml, c.id).toContain('<b>')
    }
  })

  it('keeps every card inside the deck that owns it', () => {
    for (const deck of PL_DECKS) {
      for (const c of deck.cards) expect(c.deckId, c.id).toBe(deck.id)
    }
  })

  it('gives every card a unique id', () => {
    const ids = PL_CARDS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // LEVEL_NAMES/LEVEL_TITLES (src/core/leveling.ts) are shared across every
  // course and hardcode level 1 = "A1", level 2 = "A2" in the UI — a course
  // can't put A2 content at level 1 without the Home screen mislabelling it
  // "A1" (which is exactly what Phase 2 shipped, and this test is the fix).
  it('puts A1 decks at level 1 and A2 decks at level 2, matching the CEFR labels the UI actually shows', () => {
    const A1_DECK_IDS = new Set([
      'pl_hello', 'pl_numbers', 'pl_verbs', 'pl_people',
      'pl_emergency', 'pl_feelings', 'pl_questions', 'pl_basics',
    ])
    for (const deck of PL_DECKS) {
      expect(deck.level, deck.id).toBe(A1_DECK_IDS.has(deck.id) ? 1 : 2)
    }
  })

  it('gives most cards a sentence to build and dictate', () => {
    const withSentence = PL_CARDS.filter(isSentence).length
    expect(withSentence / PL_CARDS.length).toBeGreaterThan(0.6)
  })

  it('gives every card a pronunciation', () => {
    const missing = PL_CARDS.filter(c => !c.phonetic?.trim())
    expect(missing.map(c => c.id)).toEqual([])
  })
})
