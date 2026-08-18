import { describe, it, expect } from 'vitest'
import { isTrapAnswer, buildInterferenceProfile, shouldShowPortuguese, remedialDue } from './interference'
import { DAY } from './time'
import type { Card, Skills } from '../types'

const NOW = 1_700_000_000_000

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: 'es_false_0', deckId: 'es_false', en: 'embarazada', pt: 'grávida',
    exampleHtml: 'x', examplePt: 'x', pos: 'adj',
    interference: { type: 'false-friend', trap: 'envergonhada' },
    ...overrides,
  }
}

describe('isTrapAnswer', () => {
  it('is true when the typed answer is the Portuguese trap', () => {
    expect(isTrapAnswer(card(), 'envergonhada')).toBe(true)
  })

  it('tolerates case and accents the way looseMatch always does', () => {
    expect(isTrapAnswer(card(), 'Envergonhada')).toBe(true)
  })

  it('is false for the correct Spanish answer', () => {
    expect(isTrapAnswer(card(), 'embarazada')).toBe(false)
  })

  it('is false for an unrelated wrong answer', () => {
    expect(isTrapAnswer(card(), 'cansada')).toBe(false)
  })

  it('is false for an empty answer', () => {
    expect(isTrapAnswer(card(), '')).toBe(false)
  })

  it('is false for a card with no interference tag at all', () => {
    expect(isTrapAnswer(card({ interference: undefined }), 'envergonhada')).toBe(false)
  })

  it('is false for a similar-different card — there is no single trap word to compare against', () => {
    expect(isTrapAnswer(card({ interference: { type: 'similar-different' } }), 'envergonhada')).toBe(false)
  })
})

describe('remedialDue', () => {
  it('leaves the scheduled due date alone when there was no trap hit', () => {
    const farOut = NOW + 30 * DAY
    expect(remedialDue(farOut, NOW, false)).toBe(farOut)
  })

  it('pulls a distant due date in to about a day out on a confirmed hit', () => {
    const farOut = NOW + 30 * DAY
    expect(remedialDue(farOut, NOW, true)).toBe(NOW + DAY)
  })

  it('never pushes a due date further out — only ever pulls it closer', () => {
    const soon = NOW + 5 * 60_000 // a ten-minute-step card, already sooner than a day
    expect(remedialDue(soon, NOW, true)).toBe(soon)
  })
})

describe('shouldShowPortuguese', () => {
  const untagged = card({ interference: undefined })
  const falseFriend = card() // has interference: false-friend by default
  const similarDifferent = card({ interference: { type: 'similar-different' } })

  it('is off whenever the setting itself is off, no matter what', () => {
    expect(shouldShowPortuguese(untagged, 1, false, false)).toBe(false)
    expect(shouldShowPortuguese(falseFriend, 1, false, true)).toBe(false)
  })

  it('never fades for a course that has not opted in — English is untouched', () => {
    expect(shouldShowPortuguese(untagged, 4, true, false)).toBe(true)
  })

  it('fades an untagged card once he is past the early levels, for a course that opted in', () => {
    expect(shouldShowPortuguese(untagged, 1, true, true)).toBe(true)
    expect(shouldShowPortuguese(untagged, 2, true, true)).toBe(true)
    expect(shouldShowPortuguese(untagged, 3, true, true)).toBe(false)
    expect(shouldShowPortuguese(untagged, 4, true, true)).toBe(false)
  })

  it('never fades a tagged card — the contrast is the lesson, not a crutch', () => {
    expect(shouldShowPortuguese(falseFriend, 4, true, true)).toBe(true)
    expect(shouldShowPortuguese(similarDifferent, 4, true, true)).toBe(true)
  })
})

describe('buildInterferenceProfile', () => {
  const cards = [card(), card({ id: 'es_ser_estar_0', en: 'soy', interference: { type: 'similar-different' } })]

  it('reports both accuracies as null with no attempts', () => {
    const emptySkills: Skills = {
      vocab: { correct: 0, total: 0 }, listening: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
    }
    const profile = buildInterferenceProfile(cards, emptySkills, { correct: 0, total: 0 }, {})
    expect(profile.taggedAccuracy).toBeNull()
    expect(profile.restAccuracy).toBeNull()
    expect(profile.traps).toEqual([])
  })

  it('splits overall skills into tagged vs the rest', () => {
    const skills: Skills = {
      vocab: { correct: 8, total: 10 }, listening: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
    }
    // 4 of the 10 vocab attempts were on tagged cards, 3 of them right.
    const profile = buildInterferenceProfile(cards, skills, { correct: 3, total: 4 }, {})
    expect(profile.taggedAccuracy).toBe(75)
    // The remaining 6 attempts, 5 right: (8-3)/(10-4).
    expect(profile.restAccuracy).toBe(83)
  })

  it('lists confirmed trap hits worst-first, dropping zero-count entries', () => {
    const profile = buildInterferenceProfile(
      cards,
      { vocab: { correct: 0, total: 0 }, listening: { correct: 0, total: 0 }, grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 } },
      { correct: 0, total: 0 },
      { es_false_0: 3, es_ser_estar_0: 0 },
    )
    expect(profile.traps).toEqual([{ cardId: 'es_false_0', en: 'embarazada', trap: 'envergonhada', hits: 3 }])
  })

  it('skips a trap hit recorded against an id no longer in the corpus', () => {
    const profile = buildInterferenceProfile(
      cards,
      { vocab: { correct: 0, total: 0 }, listening: { correct: 0, total: 0 }, grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 } },
      { correct: 0, total: 0 },
      { gone: 2 },
    )
    expect(profile.traps).toEqual([{ cardId: 'gone', en: 'gone', trap: '', hits: 2 }])
  })
})
