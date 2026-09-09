import { describe, it, expect } from 'vitest'
import { PL_DECKS } from './index'
import { isSentence } from '../../core/text'

const PL_CARDS = PL_DECKS.flatMap(d => d.cards)

describe('Polish corpus', () => {
  it('ships an A1+A2+B1 floor worth studying', () => {
    expect(PL_CARDS.length).toBeGreaterThanOrEqual(340)
  })

  it('has grown past Phase 2 alone — 24 decks now, not 16', () => {
    expect(PL_DECKS.length).toBeGreaterThanOrEqual(24)
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
  it('puts each deck at the level matching the CEFR label the UI actually shows for it', () => {
    const LEVEL_BY_DECK: Record<string, number> = {
      pl_hello: 1, pl_numbers: 1, pl_verbs: 1, pl_people: 1,
      pl_emergency: 1, pl_feelings: 1, pl_questions: 1, pl_basics: 1,
      pl_food: 2, pl_shopping: 2, pl_house: 2, pl_clothes: 2,
      pl_body: 2, pl_town: 2, pl_verbs2: 2, pl_power: 2,
      pl_money: 3, pl_housing: 3, pl_health: 3, pl_transport: 3,
      pl_work: 3, pl_smalltalk: 3, pl_admin: 3, pl_airport: 3,
    }
    for (const deck of PL_DECKS) {
      expect(deck.level, deck.id).toBe(LEVEL_BY_DECK[deck.id])
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
