import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ALL_COURSES, courseById, ACTIVE_COURSE, ACTIVE_RULES } from './index'
import { readActiveCourseId, writeActiveCourseId, ACTIVE_COURSE_KEY, DEFAULT_COURSE } from './active'
import { supportedModalities, pickModality } from '../core/modality'
import type { Card, CardState } from '../types'

function card(over: Partial<Card> = {}): Card {
  return {
    id: 'x_0', deckId: 'x', en: 'sin embargo', pt: 'no entanto',
    exampleHtml: 'Es caro; <b>sin embargo</b>, funciona.', examplePt: 'É caro; no entanto, funciona.',
    pos: 'phrase', ...over,
  }
}

const state = (reps: number): CardState => ({ due: 0, interval: 1, ease: 2.5, reps, lapses: 0 })

describe('active course', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('opens the English course when nothing was ever chosen', () => {
    expect(readActiveCourseId()).toBe(DEFAULT_COURSE)
    expect(DEFAULT_COURSE).toBe('en-nz')
  })

  it('remembers a choice', () => {
    writeActiveCourseId('es-latam')
    expect(readActiveCourseId()).toBe('es-latam')
  })

  // A hand-edited or half-written value must not leave the app with no corpus.
  it('falls back to the default for a value that is not a course', () => {
    localStorage.setItem(ACTIVE_COURSE_KEY, 'portuguese')
    expect(readActiveCourseId()).toBe(DEFAULT_COURSE)
  })

  it('opens the default rather than throwing when storage is unreadable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied')
    })
    expect(readActiveCourseId()).toBe(DEFAULT_COURSE)
  })

  // The caller reloads the page on a true. Reporting success on a failed write
  // would reload straight back into the old course and look like a dead button.
  it('reports a refused write instead of claiming success', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota')
    })
    expect(writeActiveCourseId('es-latam')).toBe(false)
  })
})

describe('course registry', () => {
  it('offers exactly the two courses', () => {
    expect(ALL_COURSES.map(c => c.id)).toEqual(['en-nz', 'es-latam'])
  })

  /**
   * The one field that must never change. Every profile that exists is saved
   * under `english-nz`; renaming it would look to her like the app had
   * forgotten her streak and her whole deck.
   */
  it('keeps the English course on its original storage key', () => {
    expect(courseById('en-nz').storageKey).toBe('english-nz')
  })

  it('gives each course a storage key of its own', () => {
    const keys = ALL_COURSES.map(c => c.storageKey)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('ships content in both courses', () => {
    for (const course of ALL_COURSES) {
      expect(course.decks.length).toBeGreaterThan(0)
      expect(course.decks.flatMap(d => d.cards).length).toBeGreaterThan(0)
    }
  })

  it('gives every card a unique id within its course', () => {
    for (const course of ALL_COURSES) {
      const ids = course.decks.flatMap(d => d.cards.map(c => c.id))
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('starts each course in a voice of its own language', () => {
    expect(courseById('en-nz').defaultAccent.startsWith('en')).toBe(true)
    expect(courseById('es-latam').defaultAccent.startsWith('es')).toBe(true)
  })

  /** He understands Spanish already; being shown a word to pick its meaning
   * would be time spent proving that. */
  it('drops recognition from the Spanish course only', () => {
    expect(courseById('es-latam').modalities).not.toContain('recognize')
    expect(courseById('en-nz').modalities).toContain('recognize')
  })

  it('gates English and leaves Spanish open', () => {
    expect(courseById('en-nz').gated).toBe(true)
    expect(courseById('es-latam').gated).toBe(false)
  })

  // Every Practice screen is built on New Zealand material.
  it('offers Practice only where there is material for it', () => {
    expect(courseById('en-nz').hasPractice).toBe(true)
    expect(courseById('es-latam').hasPractice).toBe(false)
  })

  it('loads the English course by default in tests', () => {
    expect(ACTIVE_COURSE.id).toBe('en-nz')
  })
})

describe('course rules', () => {
  const ES_RULES = {
    modalities: courseById('es-latam').modalities,
    typablePos: new Set(['word', 'noun', 'verb', 'adj', 'number', 'greeting', 'slang', 'phrase'] as const),
  }

  /**
   * Half the Spanish corpus is `phrase` — "sin embargo", "me da igual" — and
   * the default rules keep `phrase` untypable, because in the English course a
   * phrase card is arrow notation. Widening it is what makes the Spanish
   * course's central exercise reachable at all.
   */
  it('lets Spanish phrase cards be typed', () => {
    expect(supportedModalities(card(), false, ES_RULES)).toContain('type')
  })

  it('leaves English phrase cards untypable', () => {
    expect(supportedModalities(card(), false, ACTIVE_RULES)).not.toContain('type')
  })

  it('never offers a Spanish learner a recognition exercise', () => {
    const picks = Array.from({ length: 30 }, (_, i) => pickModality(card(), state(i + 1), true, undefined, ES_RULES))
    expect(picks).not.toContain('recognize')
  })

  /**
   * A course that drops `recognize` would otherwise leave nothing at all for a
   * card that supports only `recognize` — and an empty modality list means an
   * undefined exercise, which is a blank screen mid-session.
   */
  it('falls back rather than returning nothing for a card the course cannot serve', () => {
    const unreachable = card({ en: 'una frase larguísima de verdad', pos: 'grammar', exampleHtml: '<b>x</b>' })
    const got = supportedModalities(unreachable, false, ES_RULES)
    expect(got.length).toBeGreaterThan(0)
    expect(got).toEqual(['recognize'])
  })
})
