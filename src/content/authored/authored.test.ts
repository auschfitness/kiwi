import { describe, it, expect } from 'vitest'
import { IRREGULAR_DECK, IRREGULAR_TABLE } from './irregular'
import { isSentence, isTypable, exampleWords } from '../../core/text'
import { B2_DECKS } from './b2'
import { DECKS, ALL_CARDS, ROLEPLAYS } from '../index'

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

describe('role-play scenarios', () => {
  it('has the six scenes, each a conversation of six to ten turns', () => {
    expect(ROLEPLAYS).toHaveLength(6)
    expect(new Set(ROLEPLAYS.map(r => r.id)).size).toBe(6)
    for (const rp of ROLEPLAYS) {
      expect(rp.turns.length, rp.id).toBeGreaterThanOrEqual(6)
      expect(rp.turns.length, rp.id).toBeLessThanOrEqual(10)
      expect(rp.context, rp.id).toBeTruthy()
      expect(rp.emoji, rp.id).toBeTruthy()
    }
  })

  it('alternates speakers, opening with them and ending with her', () => {
    for (const rp of ROLEPLAYS) {
      expect(rp.turns[0].speaker, rp.id).toBe('them')
      expect(rp.turns.at(-1)!.speaker, rp.id).toBe('you')
      rp.turns.forEach((t, i) => {
        expect(t.speaker, `${rp.id}[${i}]`).toBe(i % 2 === 0 ? 'them' : 'you')
      })
    }
  })

  it('gives every line Portuguese, and every line of hers two to four accept variants', () => {
    for (const rp of ROLEPLAYS) {
      for (const t of rp.turns) {
        expect(t.en, rp.id).toBeTruthy()
        expect(t.pt, rp.id).toBeTruthy()
        if (t.speaker !== 'you') continue
        const accept = t.accept ?? []
        expect(accept.length, `${rp.id}: ${t.en}`).toBeGreaterThanOrEqual(2)
        expect(accept.length, `${rp.id}: ${t.en}`).toBeLessThanOrEqual(4)
      }
    }
  })

  it('keeps her lines short enough to say in one breath', () => {
    for (const rp of ROLEPLAYS) {
      for (const t of rp.turns) {
        if (t.speaker !== 'you') continue
        const words = t.en.trim().split(/\s+/).length
        expect(words, `${rp.id}: ${t.en}`).toBeLessThanOrEqual(8)
      }
    }
  })
})
