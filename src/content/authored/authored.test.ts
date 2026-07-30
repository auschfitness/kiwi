import { describe, it, expect } from 'vitest'
import { IRREGULAR_DECK, IRREGULAR_TABLE } from './irregular'
import { isSentence, isTypable, exampleWords } from '../../core/text'
import { B2_DECKS } from './b2'
import { DECKS, ALL_CARDS } from '../index'

describe('irregular verbs deck', () => {
  it('has fourteen cards at level 2', () => {
    expect(IRREGULAR_DECK.cards).toHaveLength(14)
    expect(IRREGULAR_DECK.level).toBe(2)
  })

  it('marks every card as grammar so it is never typed', () => {
    for (const c of IRREGULAR_DECK.cards) {
      expect(c.pos, c.id).toBe('grammar')
      expect(isTypable(c), c.id).toBe(false)
    }
  })

  it('gives every card a buildable example sentence', () => {
    for (const c of IRREGULAR_DECK.cards) {
      expect(isSentence(c), c.id).toBe(true)
      expect(exampleWords(c).length, c.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('bolds the past form in the example', () => {
    for (const c of IRREGULAR_DECK.cards) {
      const bolded = /<b>(.*?)<\/b>/.exec(c.exampleHtml)?.[1] ?? ''
      const past = c.en.split('→')[1]!.trim()
      expect(past.split(' / ').some(p => bolded.includes(p)), c.id).toBe(true)
    }
  })

  it('uses sequential ids', () => {
    IRREGULAR_DECK.cards.forEach((c, i) => expect(c.id).toBe(`irregular_${i}`))
  })

  it('has a conjugation table covering every card', () => {
    expect(IRREGULAR_TABLE).toHaveLength(14)
    for (const row of IRREGULAR_TABLE) {
      expect(row.base).toBeTruthy()
      expect(row.past).toBeTruthy()
      expect(row.participle).toBeTruthy()
      expect(row.pt).toBeTruthy()
    }
  })
})

describe('B2 content', () => {
  it('has six decks, all at level 4', () => {
    expect(B2_DECKS).toHaveLength(6)
    for (const d of B2_DECKS) expect(d.level, d.id).toBe(4)
  })

  it('adds between 130 and 160 cards', () => {
    const n = B2_DECKS.reduce((sum, d) => sum + d.cards.length, 0)
    expect(n).toBeGreaterThanOrEqual(130)
    expect(n).toBeLessThanOrEqual(160)
  })

  it('gives every B2 card the full tuple and a bolded example', () => {
    for (const d of B2_DECKS) {
      for (const c of d.cards) {
        expect(c.en, c.id).toBeTruthy()
        expect(c.pt, c.id).toBeTruthy()
        expect(c.examplePt, c.id).toBeTruthy()
        expect(c.exampleHtml, c.id).toMatch(/<b>.+<\/b>/)
        expect(c.deckId, c.id).toBe(d.id)
      }
    }
  })

  it('numbers ids sequentially within each deck', () => {
    for (const d of B2_DECKS) {
      d.cards.forEach((c, i) => expect(c.id).toBe(`${d.id}_${i}`))
    }
  })

  it('keeps every card id unique across the whole app', () => {
    const ids = ALL_CARDS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives level 4 real substance', () => {
    const level4 = DECKS.filter(d => d.level === 4).flatMap(d => d.cards)
    expect(level4.length).toBeGreaterThanOrEqual(130)
  })
})
