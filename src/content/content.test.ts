import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import {
  DECKS, ALL_CARDS, CARD_INDEX, DIALOGUES, PLAN, PHOTOS, PHOTO_CREDITS,
  decksForLevel, levelOfCard,
} from './index'
import { PHOTOS_ES } from './authored/photosEs'

describe('generated content', () => {
  it('has the full v1 corpus', () => {
    expect(DECKS.length).toBeGreaterThanOrEqual(25)
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(425)
    expect(DIALOGUES).toHaveLength(7)
    expect(PLAN).toHaveLength(8)
  })

  it('gives every card a unique id', () => {
    const ids = ALL_CARDS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(CARD_INDEX)).toHaveLength(ids.length)
  })

  it('never leaves a card field empty', () => {
    for (const c of ALL_CARDS) {
      expect(c.en, c.id).toBeTruthy()
      expect(c.pt, c.id).toBeTruthy()
      expect(c.exampleHtml, c.id).toBeTruthy()
      expect(c.examplePt, c.id).toBeTruthy()
      expect(c.pos, c.id).toBeTruthy()
      expect(c.deckId, c.id).toBeTruthy()
    }
  })

  it('assigns every deck a level in 1..4', () => {
    for (const d of DECKS) expect([1, 2, 3, 4]).toContain(d.level)
  })

  it('puts emergency vocabulary at A1', () => {
    expect(DECKS.find(d => d.id === 'emergency')?.level).toBe(1)
  })

  it('filters decks by unlocked level', () => {
    expect(decksForLevel(1).every(d => d.level === 1)).toBe(true)
    expect(decksForLevel(4)).toHaveLength(DECKS.length)
  })

  it('resolves a card back to its deck level', () => {
    expect(levelOfCard('survival_0')).toBe(1)
    expect(levelOfCard('nope_99')).toBeUndefined()
  })

  it('gives every dialogue line a speaker and both languages', () => {
    for (const d of DIALOGUES) {
      expect(d.lines.length).toBeGreaterThan(0)
      for (const l of d.lines) {
        expect(l.who).toBeTruthy()
        expect(l.en).toBeTruthy()
        expect(l.pt).toBeTruthy()
      }
    }
  })
})

describe('card photographs', () => {
  it('merges the photo onto the card, like the phonetic', () => {
    // food_0 is "Water" — as concrete as the corpus gets.
    expect(CARD_INDEX.food_0?.photo).toBe('/photos/food_0.webp')
  })

  it('leaves the abstract cards alone', () => {
    // A photograph of "however" would be a lie, so there is none, and the
    // card has to keep working without one.
    expect(CARD_INDEX.connectors_0?.photo).toBeUndefined()
    expect(CARD_INDEX.grammar_0?.photo).toBeUndefined()
  })

  it('only points at cards that exist', () => {
    // A typo'd id in PHOTOS fails silently in the app — the photo simply
    // never appears — so it has to fail here instead.
    for (const id of Object.keys(PHOTOS)) expect(CARD_INDEX[id], id).toBeDefined()
  })

  it('ships the file behind every photo path', () => {
    // An entry with no file on disk is a broken image on her screen; a file
    // with no entry is dead weight in the deploy. Both are caught here.
    //
    // public/photos/ is shared with the Spanish course (see
    // content/es/es.test.ts), so the orphan check below is against the union
    // of both tables rather than PHOTOS alone.
    const onDisk = new Set(readdirSync(join(process.cwd(), 'public', 'photos')))
    for (const [id, src] of Object.entries(PHOTOS)) {
      expect(src, id).toBe(`/photos/${id}.webp`)
      expect(onDisk.has(`${id}.webp`), id).toBe(true)
    }
    const known = new Set([...Object.keys(PHOTOS), ...Object.keys(PHOTOS_ES)].map(id => `${id}.webp`))
    expect(onDisk.size).toBe(known.size)
  })

  it('credits the photographer of every photo', () => {
    // Pexels does not require attribution but asks for it.
    expect(Object.keys(PHOTO_CREDITS).sort()).toEqual(Object.keys(PHOTOS).sort())
    for (const [id, c] of Object.entries(PHOTO_CREDITS)) {
      expect(c.photographer, id).toBeTruthy()
      expect(c.url, id).toMatch(/^https:\/\/www\.pexels\.com\//)
    }
  })
})
