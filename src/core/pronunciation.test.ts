import { describe, it, expect } from 'vitest'
import { similarity, judgePronunciation, shadowingLines } from './pronunciation'

describe('similarity', () => {
  it('scores identical strings as 1', () => {
    expect(similarity('water', 'water')).toBe(1)
  })

  it('ignores case and punctuation', () => {
    expect(similarity('Water!', 'water')).toBe(1)
  })

  it('scores a near miss highly', () => {
    expect(similarity('wader', 'water')).toBeGreaterThan(0.7)
  })

  it('scores unrelated words low', () => {
    expect(similarity('elephant', 'water')).toBeLessThan(0.4)
  })

  it('handles an empty string without dividing by zero', () => {
    expect(similarity('', 'water')).toBe(0)
    expect(similarity('', '')).toBe(1)
  })
})

describe('judgePronunciation', () => {
  it('passes an exact match warmly', () => {
    const r = judgePronunciation('water', 'water')
    expect(r.ok).toBe(true)
    expect(r.message).toMatch(/ka pai/i)
  })

  it('passes when the phrase is embedded in a longer transcript', () => {
    expect(judgePronunciation('I said water please', 'water').ok).toBe(true)
  })

  it('passes a close attempt', () => {
    expect(judgePronunciation('wader', 'water').ok).toBe(true)
  })

  it('fails an unrelated word kindly', () => {
    const r = judgePronunciation('elephant', 'water')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/listen once more/i)
  })

  it('blames the microphone, not the learner, when nothing was heard', () => {
    const r = judgePronunciation('', 'water')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/didn't catch that/i)
  })
})

describe('shadowingLines', () => {
  it('draws material from the dialogues', () => {
    const lines = shadowingLines()
    expect(lines.length).toBeGreaterThan(30)
    expect(lines.every(l => l.en.trim().length > 0)).toBe(true)
    expect(lines.every(l => l.source.trim().length > 0)).toBe(true)
  })

  it('gives every line a unique id', () => {
    const ids = shadowingLines().map(l => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
