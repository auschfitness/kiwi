import { describe, it, expect } from 'vitest'
import { pickVoice } from './speak'

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
