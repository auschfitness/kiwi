import { describe, it, expect } from 'vitest'
import { DECKS, ALL_CARDS, CARD_INDEX, DIALOGUES, PLAN, decksForLevel, levelOfCard } from './index'

describe('generated content', () => {
  it('has the full v1 corpus', () => {
    expect(DECKS.length).toBeGreaterThanOrEqual(25)
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(425)
    expect(DIALOGUES).toHaveLength(7)
    expect(PLAN).toHaveLength(8)
  })

  it('gives every card a unique id', () => {
    const ids = ALL_CARDS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(CARD_INDEX)).toHaveLength(ids.length)
  })

  it('never leaves a card field empty', () => {
    for (const c of ALL_CARDS) {
      expect(c.en, c.id).toBeTruthy()
      expect(c.pt, c.id).toBeTruthy()
      expect(c.exampleHtml, c.id).toBeTruthy()
      expect(c.examplePt, c.id).toBeTruthy()
      expect(c.pos, c.id).toBeTruthy()
      expect(c.deckId, c.id).toBeTruthy()
    }
  })

  it('assigns every deck a level in 1..4', () => {
    for (const d of DECKS) expect([1, 2, 3, 4]).toContain(d.level)
  })

  it('puts emergency vocabulary at A1', () => {
    expect(DECKS.find(d => d.id === 'emergency')?.level).toBe(1)
  })

  it('filters decks by unlocked level', () => {
    expect(decksForLevel(1).every(d => d.level === 1)).toBe(true)
    expect(decksForLevel(4)).toHaveLength(DECKS.length)
  })

  it('resolves a card back to its deck level', () => {
    expect(levelOfCard('survival_0')).toBe(1)
    expect(levelOfCard('nope_99')).toBeUndefined()
  })

  it('gives every dialogue line a speaker and both languages', () => {
    for (const d of DIALOGUES) {
      expect(d.lines.length).toBeGreaterThan(0)
      for (const l of d.lines) {
        expect(l.who).toBeTruthy()
        expect(l.en).toBeTruthy()
        expect(l.pt).toBeTruthy()
      }
    }
  })
})
