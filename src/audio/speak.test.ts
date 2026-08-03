import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { pickVoice, speak, setDefaultRate } from './speak'

function voice(lang: string, name = lang): SpeechSynthesisVoice {
  return { lang, name, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice
}

describe('pickVoice', () => {
  it('prefers an exact accent match', () => {
    const voices = [voice('en-US'), voice('en-NZ'), voice('en-GB')]
    expect(pickVoice(voices, 'en-NZ')?.lang).toBe('en-NZ')
  })

  it('matches case-insensitively', () => {
    expect(pickVoice([voice('en-nz')], 'en-NZ')?.lang).toBe('en-nz')
  })

  it('falls back to Australian when New Zealand is missing', () => {
    const voices = [voice('en-US'), voice('en-AU'), voice('en-GB')]
    expect(pickVoice(voices, 'en-NZ')?.lang).toBe('en-AU')
  })

  it('falls back to British before American', () => {
    expect(pickVoice([voice('en-US'), voice('en-GB')], 'en-NZ')?.lang).toBe('en-GB')
  })

  it('accepts any English voice as a last resort', () => {
    expect(pickVoice([voice('en-IN')], 'en-NZ')?.lang).toBe('en-IN')
  })

  it('returns null when there is no English voice at all', () => {
    expect(pickVoice([voice('pt-BR')], 'en-NZ')).toBeNull()
  })

  it('returns null for an empty voice list', () => {
    expect(pickVoice([], 'en-NZ')).toBeNull()
  })

  it('honours a non-default accent choice', () => {
    const voices = [voice('en-NZ'), voice('en-GB')]
    expect(pickVoice(voices, 'en-GB')?.lang).toBe('en-GB')
  })
})

// jsdom has no speechSynthesis / SpeechSynthesisUtterance, so we stub the
// minimum surface `speak()` touches and capture the utterance it builds.
describe('speak rate', () => {
  let utterances: { rate: number }[]

  beforeEach(() => {
    utterances = []
    class FakeUtterance {
      rate = 1
      pitch = 1
      lang = ''
      voice: SpeechSynthesisVoice | null = null
      constructor(_text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [],
      speak: (u: { rate: number }) => { utterances.push(u) },
      cancel: vi.fn(),
    })
    // Reset the module-level default so earlier tests in this file can't leak into later ones.
    setDefaultRate(0.95)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the module default rate when no explicit rate is given', () => {
    speak('hello', 'en-NZ')
    expect(utterances[0].rate).toBe(0.95)
  })

  it('respects a rate set via setDefaultRate', () => {
    setDefaultRate(0.75)
    speak('hello', 'en-NZ')
    expect(utterances[0].rate).toBe(0.75)
  })

  it('lets an explicit opts.rate override the default', () => {
    setDefaultRate(0.75)
    speak('hello', 'en-NZ', { rate: 1.1 })
    expect(utterances[0].rate).toBe(1.1)
  })

  it('clamps a too-low default rate to 0.5', () => {
    setDefaultRate(0.1)
    speak('hello', 'en-NZ')
    expect(utterances[0].rate).toBe(0.5)
  })

  it('clamps a too-high default rate to 1.2', () => {
    setDefaultRate(5)
    speak('hello', 'en-NZ')
    expect(utterances[0].rate).toBe(1.2)
  })

  it('clamps an explicit opts.rate too, so a bad caller cannot break speech', () => {
    speak('hello', 'en-NZ', { rate: 10 })
    expect(utterances[0].rate).toBe(1.2)
  })

  /**
   * A rate that is not a number at all.
   *
   * `loadProgress` casts network JSON straight to `AppState`; a snapshot from
   * a build that predates `speechRate` merges as `undefined`, and App.tsx
   * hands that to `setDefaultRate`. `Math.max(0.5, undefined)` is NaN, and
   * `SpeechSynthesisUtterance.rate` is a WebIDL *restricted* float — assigning
   * NaN throws a TypeError out of an effect and an onClick with no error
   * boundary above them, and every sound in the app stops.
   */
  const NOT_A_RATE: number[] = [
    undefined as unknown as number,
    null as unknown as number,
    NaN,
    Infinity,
    -Infinity,
    'fast' as unknown as number,
  ]

  for (const bad of NOT_A_RATE) {
    it(`falls back to 0.95 rather than NaN for a default rate of ${String(bad)}`, () => {
      setDefaultRate(bad)
      expect(() => speak('hello', 'en-NZ')).not.toThrow()
      expect(utterances[0].rate).toBe(0.95)
      expect(Number.isFinite(utterances[0].rate)).toBe(true)
    })

    it(`falls back to 0.95 for an explicit rate of ${String(bad)}`, () => {
      expect(() => speak('hello', 'en-NZ', { rate: bad })).not.toThrow()
      expect(utterances[0].rate).toBe(0.95)
    })
  }
})

describe('speak text', () => {
  let spoken: string[]

  beforeEach(() => {
    spoken = []
    class FakeUtterance {
      rate = 1
      pitch = 1
      lang = ''
      voice: SpeechSynthesisVoice | null = null
      constructor(public text: string) {}
    }
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [],
      speak: (u: { text: string }) => { spoken.push(u.text) },
      cancel: vi.fn(),
    })
  })

  afterEach(() => vi.unstubAllGlobals())

  // The reported bug: the three forms ran together into one phrase.
  it('gives an irregular verb card its pauses', () => {
    speak('be → was / were', 'en-NZ')
    expect(spoken[0]).toBe('be. was. were')
  })

  it('leaves an ordinary sentence exactly as written', () => {
    speak('The bus was late this morning.', 'en-NZ')
    expect(spoken[0]).toBe('The bus was late this morning.')
  })

  // The blank-text guard runs on the original, so a string that is only a
  // separator still reaches synthesis as nothing rather than as a lone stop.
  it('says nothing for whitespace', () => {
    speak('   ', 'en-NZ')
    expect(spoken).toHaveLength(0)
  })
})
