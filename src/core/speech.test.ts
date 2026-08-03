import { describe, it, expect } from 'vitest'
import { speakable, clampRate, slowRateFor } from './speech'

describe('speakable', () => {
  // The complaint that prompted this: "be → was / were" came out as one
  // breathless run. Speech synthesis gives an arrow and a slash no pause at
  // all, so three separate forms arrived as a single phrase.
  it('breaks an irregular verb into its three forms', () => {
    expect(speakable('be → was / were')).toBe('be. was. were')
  })

  it('separates a base form from its past tense', () => {
    expect(speakable('go → went')).toBe('go. went')
  })

  it('separates alternatives joined by a slash', () => {
    expect(speakable('got / gotten')).toBe('got. gotten')
  })

  // The slash must be spaced to count. The drills speak dates and prices as
  // words, so no bare "5/3" reaches synthesis today — but this rule is applied
  // to every utterance in the app, and a rule that splits any slash would be
  // one content change away from reading a date as two numbers.
  it('leaves an unspaced slash alone', () => {
    expect(speakable('5/3')).toBe('5/3')
    expect(speakable('and/or')).toBe('and/or')
  })

  it('leaves ordinary sentences untouched', () => {
    expect(speakable('The bus was late this morning.')).toBe('The bus was late this morning.')
  })

  it('does not double up punctuation that is already there', () => {
    expect(speakable('Ready. → Go')).toBe('Ready. Go')
  })

  it('handles empty and whitespace input without inventing a full stop', () => {
    expect(speakable('')).toBe('')
    expect(speakable('   ')).toBe('')
  })

  it('collapses the extra space a separator leaves behind', () => {
    expect(speakable('a  →  b')).toBe('a. b')
  })
})

describe('clampRate', () => {
  it('keeps a sensible rate as it is', () => {
    expect(clampRate(0.95)).toBe(0.95)
  })

  it('holds the floor and the ceiling', () => {
    expect(clampRate(0.1)).toBe(0.5)
    expect(clampRate(5)).toBe(1.2)
  })

  /**
   * A rate that is not a number at all. `loadProgress` casts network JSON
   * straight to `AppState`, and a snapshot from a build predating `speechRate`
   * merges as `undefined`. `SpeechSynthesisUtterance.rate` is a WebIDL
   * restricted float: assigning NaN throws, out of an onClick with no error
   * boundary above it, and every sound in the app stops.
   */
  it('answers the default for a value that is not a rate', () => {
    for (const bad of [undefined as unknown as number, null as unknown as number, NaN, Infinity]) {
      expect(clampRate(bad)).toBe(0.95)
    }
  })
})

describe('slowRateFor', () => {
  it('is meaningfully slower than her chosen speed', () => {
    expect(slowRateFor(0.95)).toBeLessThan(0.95)
    expect(slowRateFor(1.1)).toBeLessThan(1.1)
  })

  // It has to stay slower than normal at every one of the three speech speeds,
  // which is why the factor is relative rather than a fixed number.
  it('stays below the chosen speed even on the slowest setting', () => {
    expect(slowRateFor(0.75)).toBeLessThan(0.75)
  })

  it('never goes below the floor that keeps it recognisable as speech', () => {
    expect(slowRateFor(0.5)).toBe(0.5)
    expect(slowRateFor(0.1)).toBe(0.5)
  })

  it('answers a usable number for a rate that is not one', () => {
    expect(Number.isFinite(slowRateFor(undefined as unknown as number))).toBe(true)
    expect(Number.isFinite(slowRateFor(NaN))).toBe(true)
  })
})
