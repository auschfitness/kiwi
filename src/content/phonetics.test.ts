import { describe, it, expect } from 'vitest'
import { DECKS, ALL_CARDS, CARD_INDEX, PHONETICS, cardById } from './index'
import { GENERATED_DECKS } from './decks.generated'

/** Levels 1 and 2 (which includes the authored `irregular` deck). */
const A1_A2 = DECKS.filter(d => d.level <= 2).flatMap(d => d.cards)

/** Levels 3 and 4: the B1 decks plus the six authored B2 decks. */
const B1_B2 = DECKS.filter(d => d.level >= 3).flatMap(d => d.cards)

describe('phonetics merge', () => {
  it('reaches the cards through DECKS, ALL_CARDS and CARD_INDEX alike', () => {
    expect(DECKS.find(d => d.id === 'survival')?.cards[0]?.phonetic).toBe('halôu')
    expect(ALL_CARDS.find(c => c.id === 'survival_0')?.phonetic).toBe('halôu')
    expect(CARD_INDEX.survival_0?.phonetic).toBe('halôu')
    expect(cardById('numbers_3')?.phonetic).toBe('fór')
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

  it('is rhotic: the r English spells at the end of a syllable is written', () => {
    expect(cardById('food_0')?.phonetic).toBe('uóter') // water
    expect(cardById('transport_5')?.phonetic).toBe('cár') // car
    expect(cardById('numbers_8')?.phonetic).toBe('fêrst') // first
    expect(cardById('town_2')?.phonetic).toBe('córner') // corner
    expect(cardById('numbers_3')?.phonetic).toBe('fór') // four
  })

  it('spells NEAR and SQUARE with an r, not with the non-rhotic ía/éa', () => {
    // Two entries where ía is genuinely two vowels in a row and not a NEAR
    // vowel: `kia ora` is te reo Māori, and *idea* really is [aɪˈdiə].
    const twoVowels = new Set(['kiwi_0', 'power_13'])
    const bad = entries
      .filter(([id]) => !twoVowels.has(id))
      .filter(([, p]) => /ía|éa/.test(p))
      .map(([id]) => id)
    expect(bad).toEqual([])
  })

  it('gives the BATH words the short American a, not the long British one', () => {
    expect(cardById('verbs2_6')?.phonetic).toBe('ta ésk') // to ask
    expect(cardById('numbers_14')?.phonetic).toBe('íts héf pést tú') // half past two
    expect(cardById('grammar_16')?.phonetic).toBe('kén / ként') // can / can't
    expect(cardById('phrasal_2')?.phonetic).toBe('lúk éfter') // look after
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

  it('keeps bad and bed apart: bad is é, bed is ê', () => {
    expect(cardById('basics_12')?.phonetic).toBe('béd') // bad
    expect(cardById('house_4')?.phonetic).toBe('bêd') // bed
  })

  it('keeps her and hair apart, now that both carry an r', () => {
    expect(cardById('grammar_7')?.phonetic).toContain('hêr') // her
    expect(cardById('body_13')?.phonetic).toBe('hér') // hair
  })

  it('stays short enough to sit under a word on a phone', () => {
    for (const [id, p] of entries) expect(p.length, id).toBeLessThanOrEqual(40)
  })
})
