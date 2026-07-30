import { describe, it, expect } from 'vitest'
import { IRREGULAR_DECK, IRREGULAR_TABLE } from './irregular'
import { isSentence, isTypable, exampleWords } from '../../core/text'

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
