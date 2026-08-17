import { describe, it, expect } from 'vitest'
import { accentName, isAmericanVoice } from './accents'

describe('accentName', () => {
  it('names the four accents a voice can plausibly be', () => {
    expect(accentName('en-NZ')).toBe('New Zealand')
    expect(accentName('en-AU')).toBe('Australian')
    expect(accentName('en-GB')).toBe('British')
    expect(accentName('en-US')).toBe('American')
  })

  it('reads a tag whatever case it arrives in', () => {
    expect(accentName('en-nz')).toBe('New Zealand')
    expect(accentName('EN-US')).toBe('American')
  })

  it('says nothing rather than guessing for a tag it has no name for', () => {
    // Ear Training has a third line for exactly this, and it must be reachable.
    expect(accentName('en-IN')).toBeNull()
    expect(accentName('pt-BR')).toBeNull()
    expect(accentName(null)).toBeNull()
    expect(accentName(undefined)).toBeNull()
    expect(accentName('')).toBeNull()
  })
})

describe('isAmericanVoice', () => {
  it('is true only for an actual American voice', () => {
    expect(isAmericanVoice('en-US')).toBe(true)
    expect(isAmericanVoice('en-us')).toBe(true)
  })

  it('treats every other tag, and no tag at all, as not American', () => {
    for (const lang of ['en-AU', 'en-GB', 'en-NZ', 'en-IN', '', null, undefined]) {
      expect(isAmericanVoice(lang)).toBe(false)
    }
  })
})
