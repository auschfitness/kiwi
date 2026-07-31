import { describe, it, expect } from 'vitest'
import { DAY, HOUR, MIN } from './time'
import {
  newCardState, schedule, isDue, isNew, deckProgress, totalKnown, totalDue,
  previewIntervals, formatDelta,
} from './srs'
import type { CardState, Deck } from '../types'

const NOW = 1_700_000_000_000

describe('newCardState', () => {
  it('starts due immediately with default ease', () => {
    expect(newCardState(NOW)).toEqual({ due: NOW, interval: 0, ease: 2.5, reps: 0, lapses: 0 })
  })
})

describe('schedule', () => {
  it('seeds a brand new card to one day on the first correct answer', () => {
    const s = schedule(undefined, 2, NOW)
    expect(s.reps).toBe(1)
    expect(s.interval).toBe(1)
    expect(s.ease).toBe(2.5)
    expect(s.due).toBe(NOW + DAY)
  })

  it('moves the second correct answer to three days', () => {
    const first = schedule(undefined, 2, NOW)
    const second = schedule(first, 2, NOW)
    expect(second.reps).toBe(2)
    expect(second.interval).toBe(3)
    expect(second.due).toBe(NOW + 3 * DAY)
  })

  it('multiplies by ease from the third correct answer on', () => {
    let s = schedule(undefined, 2, NOW)
    s = schedule(s, 2, NOW)
    s = schedule(s, 2, NOW)
    expect(s.reps).toBe(3)
    expect(s.interval).toBe(Math.round(3 * 2.5))
    expect(s.due).toBe(NOW + s.interval * DAY)
  })

  it('sends a wrong answer to ten minutes and drops ease', () => {
    const known = schedule(schedule(undefined, 2, NOW), 2, NOW)
    const lapsed = schedule(known, 0, NOW)
    expect(lapsed.interval).toBe(0)
    expect(lapsed.lapses).toBe(1)
    expect(lapsed.ease).toBeCloseTo(2.3, 5)
    expect(lapsed.due).toBe(NOW + 10 * MIN)
  })

  it('never lets ease fall below 1.3', () => {
    let s: CardState | undefined = undefined
    for (let i = 0; i < 20; i++) s = schedule(s, 0, NOW)
    expect(s!.ease).toBe(1.3)
  })

  it('keeps at least one rep after a lapse so the card is not treated as new', () => {
    const s = schedule(undefined, 0, NOW)
    expect(s.reps).toBeGreaterThanOrEqual(1)
    expect(isNew(s)).toBe(false)
  })

  it('gives an easy answer a bigger interval and more ease', () => {
    const good = schedule(schedule(schedule(undefined, 2, NOW), 2, NOW), 2, NOW)
    const easy = schedule(schedule(schedule(undefined, 2, NOW), 2, NOW), 3, NOW)
    expect(easy.ease).toBeGreaterThan(good.ease)
    expect(easy.interval).toBeGreaterThan(good.interval)
  })

  it('does not mutate the state it is given', () => {
    const before = newCardState(NOW)
    const snapshot = { ...before }
    schedule(before, 2, NOW)
    expect(before).toEqual(snapshot)
  })
})

describe('previewIntervals', () => {
  it('labels all four buttons for a card she has never seen', () => {
    expect(previewIntervals(undefined, NOW)).toEqual({ 0: '10m', 1: '10m', 2: '1d', 3: '4d' })
  })

  it('grows the labels as the card matures', () => {
    const once = schedule(undefined, 2, NOW)
    expect(previewIntervals(once, NOW)).toEqual({ 0: '10m', 1: '1d', 2: '3d', 3: '6d' })

    const twice = schedule(once, 2, NOW)
    const mature = previewIntervals(twice, NOW)
    // Third rep multiplies by ease (2.5) rather than using the fixed steps, so
    // the labels have to have moved on from the 1d / 3d / 6d row above.
    expect(mature[2]).toBe('8d')
    expect(mature[3]).toBe('10d')
    expect(mature[1]).toBe('4d')
    // Again always drops her back to the same ten-minute step, however mature.
    expect(mature[0]).toBe('10m')
  })

  it('reads its numbers off schedule() rather than restating the arithmetic', () => {
    const state = { due: NOW, interval: 40, ease: 2.7, reps: 9, lapses: 1 }
    const labels = previewIntervals(state, NOW)
    for (const rating of [0, 1, 2, 3] as const) {
      const days = (schedule(state, rating, NOW).due - NOW) / DAY
      const expected = days < 1 / 24
        ? `${Math.round(days * 24 * 60)}m`
        : days < 1 ? `${Math.round(days * 24)}h` : `${Math.round(days)}d`
      expect(labels[rating]).toBe(expected)
    }
  })

})

describe('formatDelta', () => {
  it('says minutes under an hour, hours under a day, days above that', () => {
    expect(formatDelta(10 * MIN)).toBe('10m')
    expect(formatDelta(59 * MIN)).toBe('59m')
    expect(formatDelta(HOUR)).toBe('1h')
    expect(formatDelta(8 * HOUR)).toBe('8h')
    expect(formatDelta(DAY)).toBe('1d')
    expect(formatDelta(3 * DAY)).toBe('3d')
  })

  it('never shows a bare zero for a gap that is real but tiny', () => {
    expect(formatDelta(1)).toBe('1m')
    expect(formatDelta(0)).toBe('1m')
  })
})

describe('isDue / isNew', () => {
  it('treats an absent state as new and not due', () => {
    expect(isNew(undefined)).toBe(true)
    expect(isDue(undefined, NOW)).toBe(false)
  })

  it('is due exactly at the due timestamp', () => {
    const s = schedule(undefined, 2, NOW)
    expect(isDue(s, NOW + DAY - 1)).toBe(false)
    expect(isDue(s, NOW + DAY)).toBe(true)
  })
})

describe('aggregates', () => {
  const deck: Deck = {
    id: 'd', name: 'D', emoji: '🥝', desc: '', level: 1,
    cards: [
      { id: 'd_0', deckId: 'd', en: 'a', pt: 'a', exampleHtml: 'a', examplePt: 'a', pos: 'word' },
      { id: 'd_1', deckId: 'd', en: 'b', pt: 'b', exampleHtml: 'b', examplePt: 'b', pos: 'word' },
      { id: 'd_2', deckId: 'd', en: 'c', pt: 'c', exampleHtml: 'c', examplePt: 'c', pos: 'word' },
    ],
  }

  it('counts learned, due and total for a deck', () => {
    const cards = {
      d_0: schedule(undefined, 2, NOW),               // learned, due in 1 day
      d_1: { due: NOW - 1, interval: 1, ease: 2.5, reps: 4, lapses: 0 }, // learned and due
    }
    expect(deckProgress(deck, cards, NOW)).toEqual({ learned: 2, due: 1, total: 3 })
  })

  it('counts known and due across the whole collection', () => {
    const cards = {
      a: { due: NOW - 1, interval: 1, ease: 2.5, reps: 2, lapses: 0 },
      b: { due: NOW + DAY, interval: 1, ease: 2.5, reps: 1, lapses: 0 },
      c: { due: NOW, interval: 0, ease: 2.5, reps: 0, lapses: 0 },
    }
    expect(totalKnown(cards)).toBe(2)
    expect(totalDue(cards, NOW)).toBe(2)
  })
})
