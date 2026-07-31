import { describe, it, expect } from 'vitest'
import {
  matchesExpected, bestSimilarity, candidatesFor, heardNothing,
  themRunAt, nextYouIndex, youTurnCount, MATCH_THRESHOLD,
} from './roleplay'
import type { RoleplayTurn } from '../content/authored/roleplays'
import { ROLEPLAYS } from '../content'

const coffee: RoleplayTurn = {
  speaker: 'you',
  en: 'Can I have a flat white, please?',
  pt: 'Peça um flat white.',
  accept: ['a flat white please', "I'd like a flat white", 'flat white thanks'],
}

describe('matchesExpected', () => {
  it('accepts the scripted line exactly', () => {
    expect(matchesExpected('Can I have a flat white, please?', coffee)).toBe(true)
  })

  it('ignores case and punctuation', () => {
    expect(matchesExpected('can i have a flat white please', coffee)).toBe(true)
  })

  it('accepts an accept variant', () => {
    expect(matchesExpected('flat white thanks', coffee)).toBe(true)
  })

  it('accepts a near-miss the recogniser garbled slightly', () => {
    // One dropped word off an accept variant: well inside the threshold, and
    // exactly what a Brazilian accent gets back from the browser.
    expect(matchesExpected('a flat white pleas', coffee)).toBe(true)
    expect(bestSimilarity('a flat white pleas', coffee)).toBeGreaterThanOrEqual(MATCH_THRESHOLD)
  })

  it('accepts the expanded form of a contracted variant, and the reverse', () => {
    // The bug this guards: she says the full form, the script has the
    // contraction, and she gets marked wrong for a correct answer.
    expect(matchesExpected('I would like a flat white', coffee)).toBe(true)
    expect(matchesExpected("I'd like a flat white", coffee)).toBe(true)

    const contracted: RoleplayTurn = {
      speaker: 'you', en: "No, I don't.", pt: 'Diga que não tem.', accept: ['no', 'not yet'],
    }
    expect(matchesExpected('no I do not', contracted)).toBe(true)
  })

  it('accepts extra words either side of the line', () => {
    expect(matchesExpected('um yeah a flat white please mate', coffee)).toBe(true)
  })

  it('rejects something clearly wrong', () => {
    expect(matchesExpected('where is the train station', coffee)).toBe(false)
  })

  it('rejects an empty transcript — a silent mic is not a wrong answer', () => {
    expect(matchesExpected('', coffee)).toBe(false)
    expect(matchesExpected('   ', coffee)).toBe(false)
    expect(heardNothing('')).toBe(true)
    expect(heardNothing('no')).toBe(false)
  })

  it('works on a turn with no accept list at all', () => {
    const bare: RoleplayTurn = { speaker: 'you', en: 'Card, please.', pt: 'Cartão.' }
    expect(candidatesFor(bare)).toEqual(['Card, please.'])
    expect(matchesExpected('card please', bare)).toBe(true)
    expect(matchesExpected('cash', bare)).toBe(false)
  })
})

describe('walking the script', () => {
  const turns: RoleplayTurn[] = [
    { speaker: 'them', en: 'Kia ora!', pt: 'Olá!' },
    { speaker: 'them', en: 'What can I get you?', pt: 'O que você quer?' },
    { speaker: 'you', en: 'A flat white, please.', pt: 'Peça um café.' },
    { speaker: 'them', en: 'Sweet as.', pt: 'Beleza.' },
    { speaker: 'you', en: 'Thanks!', pt: 'Agradeça.' },
  ]

  it('collects the run of them lines to auto-play', () => {
    expect(themRunAt(turns, 0).map(t => t.en)).toEqual(['Kia ora!', 'What can I get you?'])
    expect(themRunAt(turns, 3).map(t => t.en)).toEqual(['Sweet as.'])
  })

  it('returns no run when it is her turn, or past the end', () => {
    expect(themRunAt(turns, 2)).toEqual([])
    expect(themRunAt(turns, 99)).toEqual([])
  })

  it('finds the next you turn to await', () => {
    expect(nextYouIndex(turns, 0)).toBe(2)
    expect(nextYouIndex(turns, 2)).toBe(2)
    expect(nextYouIndex(turns, 3)).toBe(4)
    expect(nextYouIndex(turns, 5)).toBe(-1)
  })

  it('counts her lines for the score', () => {
    expect(youTurnCount(turns)).toBe(2)
  })
})

describe('the authored scenarios', () => {
  it('every you line matches its own script and every accept variant', () => {
    for (const rp of ROLEPLAYS) {
      for (const turn of rp.turns) {
        if (turn.speaker !== 'you') continue
        for (const candidate of candidatesFor(turn)) {
          expect(matchesExpected(candidate, turn), `${rp.id}: ${candidate}`).toBe(true)
        }
      }
    }
  })
})
