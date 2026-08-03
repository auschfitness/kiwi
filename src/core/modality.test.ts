import { describe, it, expect } from 'vitest'
import { supportedModalities, pickModality, skillForModality } from './modality'
import type { Card, CardState, Modality } from '../types'

function card(over: Partial<Card> = {}): Card {
  return {
    id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
    exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
    pos: 'noun', ...over,
  }
}

function state(reps: number): CardState {
  return { due: 0, interval: 1, ease: 2.5, reps, lapses: 0 }
}

describe('supportedModalities', () => {
  it('always supports recognition', () => {
    const long = card({ en: 'a very long phrase indeed', pos: 'phrase', exampleHtml: '<b>x</b>' })
    expect(supportedModalities(long, false)).toEqual(['recognize'])
  })

  it('adds listening and typing for typable cards', () => {
    const c = card({ exampleHtml: '<b>Water</b>.' })
    expect(supportedModalities(c, false)).toEqual(['recognize', 'listen', 'type'])
  })

  it('adds build and dictation for sentence cards', () => {
    const c = card({ en: 'My name is…', pos: 'phrase' })
    expect(supportedModalities(c, false)).toEqual(['recognize', 'build', 'dictate'])
  })

  it('adds speaking only when recognition is available', () => {
    expect(supportedModalities(card(), true)).toContain('speak')
    expect(supportedModalities(card(), false)).not.toContain('speak')
  })

  it('never offers learn as a rotation option', () => {
    expect(supportedModalities(card(), true)).not.toContain('learn')
  })
})

describe('pickModality', () => {
  it('gives new cards the teaching screen', () => {
    expect(pickModality(card(), undefined, true)).toBe('learn')
    expect(pickModality(card(), state(0), true)).toBe('learn')
  })

  it('rotates through every supported modality as reps climb', () => {
    const c = card()
    const supported = supportedModalities(c, true)
    const seen: Modality[] = []
    for (let reps = 1; reps <= supported.length; reps++) {
      seen.push(pickModality(c, state(reps), true))
    }
    expect(new Set(seen).size).toBe(supported.length)
  })

  it('is stable for the same reps count', () => {
    const c = card()
    expect(pickModality(c, state(3), true)).toBe(pickModality(c, state(3), true))
  })

  /**
   * The bias pulls; it does not take over.
   *
   * It used to replace the rotation outright, and that had a consequence
   * nobody wanted: speaking is the hardest skill and therefore usually the
   * weakest, so a learner whose weak skill was speaking got a speaking
   * exercise on *every* review of every card and never saw a writing one
   * again. Reported from real use — "I haven't seen a single writing
   * exercise".
   */
  it('still shows every supported modality while biased', () => {
    const c = card()
    const supported = supportedModalities(c, true)
    const seen = new Set<string>()
    for (let reps = 1; reps <= 40; reps++) seen.add(pickModality(c, state(reps), true, 'speaking'))
    expect(seen).toEqual(new Set(supported))
  })

  // The specific complaint, as a test: a speaking bias must not cost her writing.
  it('still reaches typing when speaking is the weak skill', () => {
    const c = card()
    const picks = Array.from({ length: 40 }, (_, i) => pickModality(c, state(i + 1), true, 'speaking'))
    expect(picks).toContain('type')
  })

  it('favours the weak skill more often than an unbiased rotation would', () => {
    const c = card()
    const count = (bias?: 'listening') =>
      Array.from({ length: 40 }, (_, i) => pickModality(c, state(i + 1), true, bias))
        .filter(m => m === 'listen' || m === 'dictate').length
    expect(count('listening')).toBeGreaterThan(count())
  })

  it('keeps rotating within the biased skill instead of pinning one modality', () => {
    const c = card()
    const picks = Array.from({ length: 40 }, (_, i) => pickModality(c, state(i + 1), true, 'listening'))
    expect(picks).toContain('listen')
    expect(picks).toContain('dictate')
  })

  it('ignores a bias the card cannot serve', () => {
    const c = card({ exampleHtml: '<b>Water</b>.' }) // typable, not a sentence
    expect(pickModality(c, state(1), false, 'grammar')).not.toBe('build')
  })
})

describe('skillForModality', () => {
  it('maps each graded modality to its skill', () => {
    expect(skillForModality('recognize')).toBe('vocab')
    expect(skillForModality('type')).toBe('vocab')
    expect(skillForModality('listen')).toBe('listening')
    expect(skillForModality('dictate')).toBe('listening')
    expect(skillForModality('build')).toBe('grammar')
    expect(skillForModality('speak')).toBe('speaking')
  })

  it('does not grade the teaching screen', () => {
    expect(skillForModality('learn')).toBeNull()
  })
})
