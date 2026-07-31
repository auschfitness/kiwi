import { describe, it, expect } from 'vitest'
import { DECKS, ALL_CARDS, CARD_INDEX, PHONETICS, cardById } from './index'
import { GENERATED_DECKS } from './decks.generated'

/** Levels 1 and 2 (which includes the authored `irregular` deck). */
const A1_A2 = DECKS.filter(d => d.level <= 2).flatMap(d => d.cards)

/** Levels 3 and 4: the B1 decks plus the six authored B2 decks. */
const B1_B2 = DECKS.filter(d => d.level >= 3).flatMap(d => d.cards)

/** Vowels a Brazilian reads as a vowel, accents included. */
const VOWELS = 'aáàâãeéêẽiíîoóôõuúûy'

describe('phonetics merge', () => {
  it('reaches the cards through DECKS, ALL_CARDS and CARD_INDEX alike', () => {
    expect(DECKS.find(d => d.id === 'survival')?.cards[0]?.phonetic).toBe('halôu')
    expect(ALL_CARDS.find(c => c.id === 'survival_0')?.phonetic).toBe('halôu')
    expect(CARD_INDEX.survival_0?.phonetic).toBe('halôu')
    expect(cardById('numbers_3')?.phonetic).toBe('fó')
  })

  it('keeps the owner’s own examples', () => {
    // "go → went" transcribes both forms, per the brief.
    expect(cardById('irregular_0')?.phonetic).toBe('gôu → uént')
  })

  it('leaves the generated corpus untouched', () => {
    // decks.generated.ts must stay free of hand edits: the field is still empty
    // there, and only the merge in index.ts fills it in.
    const generated = GENERATED_DECKS.flatMap(d => d.cards)
    expect(generated.every(c => c.phonetic === undefined)).toBe(true)
  })

  it('never keys a phonetic to an id that does not exist', () => {
    const ids = new Set(ALL_CARDS.map(c => c.id))
    for (const id of Object.keys(PHONETICS)) expect(ids.has(id), id).toBe(true)
  })
})

describe('phonetics coverage', () => {
  it('covers every level 1 and 2 card, with no gap', () => {
    const missing = A1_A2.filter(c => !c.phonetic?.trim()).map(c => c.id)
    expect(missing).toEqual([])
    expect(A1_A2).toHaveLength(317)
  })

  it('covers every level 3 and 4 card, with no gap', () => {
    const missing = B1_B2.filter(c => !c.phonetic?.trim()).map(c => c.id)
    expect(missing).toEqual([])
    expect(B1_B2).toHaveLength(264)
  })

  it('leaves no card in the whole corpus without a pronunciation', () => {
    expect(ALL_CARDS).toHaveLength(581)
    expect(ALL_CARDS.filter(c => !c.phonetic?.trim()).map(c => c.id)).toEqual([])
  })

  it('covers the irregular deck on both sides of the arrow', () => {
    const irregular = A1_A2.filter(c => c.deckId === 'irregular')
    expect(irregular).toHaveLength(14)
    for (const c of irregular) expect(c.phonetic, c.id).toMatch(/\S+ → \S+/)
  })
})

describe('phonetics convention (PHONETICS-CONVENTION.md)', () => {
  const entries = Object.entries(PHONETICS)

  it('is non-rhotic: every r is followed by a vowel', () => {
    const bad = entries.filter(([, p]) => new RegExp(`r(?![${VOWELS}])`, 'i').test(p))
    expect(bad).toEqual([])
  })

  it('avoids spellings that trigger Portuguese-only sounds', () => {
    // nh/lh = palatals, rr = guttural r, x/qu/ç = ambiguous readings.
    const bad = entries.filter(([, p]) => /nh|lh|rr|x|qu|ç/i.test(p))
    expect(bad).toEqual([])
  })

  it('marks the stressed vowel of every entry', () => {
    // The two exceptions are the grammar cards for the articles, whose whole
    // point is that they are unstressed: "a / an", "the".
    const unstressed = ['grammar_3', 'grammar_4']
    const bad = entries
      .filter(([id]) => !unstressed.includes(id))
      .filter(([, p]) => !/[áâãéêíóôõú]/.test(p))
      .map(([id]) => id)
    expect(bad).toEqual([])
  })

  it('encodes the NZ short-front-vowel shift: bad is é, bed is ê', () => {
    expect(cardById('basics_12')?.phonetic).toBe('béd') // bad
    expect(cardById('house_4')?.phonetic).toBe('bêd') // bed
  })

  it('stays short enough to sit under a word on a phone', () => {
    for (const [id, p] of entries) expect(p.length, id).toBeLessThanOrEqual(40)
  })
})
