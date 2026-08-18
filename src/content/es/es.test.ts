import { describe, it, expect } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ES_DECKS } from './index'
import { ES_ROLEPLAYS } from './roleplays'
import { ES_DIALOGUES } from './dialogues'
import { isTypable, isSentence, DEFAULT_TYPABLE_POS } from '../../core/text'
import { supportedModalities } from '../../core/modality'
import { PHOTOS_ES } from '../authored/photosEs'
import { PHOTO_CREDITS_ES } from '../authored/photoCreditsEs'
import type { PartOfSpeech } from '../../types'

const ES_CARDS = ES_DECKS.flatMap(d => d.cards)

const ES_RULES = {
  modalities: ['type', 'build', 'dictate', 'speak'] as const,
  typablePos: new Set<PartOfSpeech>([...DEFAULT_TYPABLE_POS, 'phrase']),
  typableMaxChars: 24,
}

describe('Spanish corpus', () => {
  it('ships a course worth studying', () => {
    expect(ES_CARDS.length).toBeGreaterThanOrEqual(150)
  })

  it('gives every card the fields a session needs', () => {
    for (const c of ES_CARDS) {
      expect(c.id, c.id).toBeTruthy()
      expect(c.en.trim(), c.id).not.toBe('')
      expect(c.pt.trim(), c.id).not.toBe('')
      expect(c.examplePt.trim(), c.id).not.toBe('')
      expect(c.exampleHtml, c.id).toContain('<b>')
    }
  })

  it('keeps every card inside the deck that owns it', () => {
    for (const deck of ES_DECKS) {
      for (const c of deck.cards) expect(c.deckId, c.id).toBe(deck.id)
    }
  })

  /**
   * The whole point of the course. A card that cannot be typed cannot exercise
   * production, which is the one thing he is missing — so this is the test that
   * says the corpus is fit for its purpose rather than merely well-formed.
   */
  it('makes every card typable under the Spanish rules', () => {
    const untypable = ES_CARDS.filter(c => !isTypable(c, ES_RULES.typablePos, ES_RULES.typableMaxChars))
    expect(untypable.map(c => `${c.id}: ${c.en}`)).toEqual([])
  })

  // Sentence building and dictation both need an example of three to nine
  // words. Most cards should reach them; a handful falling outside is fine.
  it('gives most cards a sentence to build and dictate', () => {
    const withSentence = ES_CARDS.filter(isSentence).length
    expect(withSentence / ES_CARDS.length).toBeGreaterThan(0.8)
  })

  it('leaves no card without an exercise', () => {
    for (const c of ES_CARDS) {
      expect(supportedModalities(c, false, ES_RULES).length, c.id).toBeGreaterThan(0)
    }
  })

  // Latin American Spanish: `ustedes`, never the peninsular `vosotros`.
  it('uses no peninsular conjugation', () => {
    const peninsular = ES_CARDS.filter(c =>
      /\bvosotros\b|\bvuestro/i.test(`${c.en} ${c.exampleHtml}`),
    )
    expect(peninsular.map(c => c.id)).toEqual([])
  })
})

describe('Spanish card photographs', () => {
  const ES_CARD_INDEX = Object.fromEntries(ES_CARDS.map(c => [c.id, c] as const))

  it('merges the photo onto the card, like PHOTOS does for English', () => {
    // es_false_0 is "embarazada" — the false friend a photo helps most.
    expect(ES_CARD_INDEX.es_false_0?.photo).toBe('/photos/es_false_0.webp')
  })

  it('leaves the phrase, verb and grammar cards alone', () => {
    // A photograph of "por otro lado" or "tengo" would be a lie, so there is
    // none, and the card has to keep working without one.
    expect(ES_CARD_INDEX.es_connect_0?.photo).toBeUndefined()
    expect(ES_CARD_INDEX.es_core_verbs_0?.photo).toBeUndefined()
  })

  it('only points at cards that exist', () => {
    for (const id of Object.keys(PHOTOS_ES)) expect(ES_CARD_INDEX[id], id).toBeDefined()
  })

  it('ships the file behind every photo path', () => {
    const onDisk = new Set(readdirSync(join(process.cwd(), 'public', 'photos')))
    for (const [id, src] of Object.entries(PHOTOS_ES)) {
      expect(src, id).toBe(`/photos/${id}.webp`)
      expect(onDisk.has(`${id}.webp`), id).toBe(true)
    }
  })

  it('credits the photographer of every photo', () => {
    expect(Object.keys(PHOTO_CREDITS_ES).sort()).toEqual(Object.keys(PHOTOS_ES).sort())
    for (const [id, c] of Object.entries(PHOTO_CREDITS_ES)) {
      expect(c.photographer, id).toBeTruthy()
      expect(c.url, id).toMatch(/^https:\/\/www\.pexels\.com\//)
    }
  })
})

describe('Portuguese-interference tags', () => {
  it('names the trap on every false-friend card', () => {
    for (const c of ES_CARDS) {
      if (c.interference?.type !== 'false-friend') continue
      expect(c.interference.trap?.trim(), c.id).toBeTruthy()
    }
  })

  it('leaves similar-different cards to their own pt field, with no trap', () => {
    for (const c of ES_CARDS) {
      if (c.interference?.type !== 'similar-different') continue
      expect(c.interference.trap, c.id).toBeUndefined()
    }
  })

  it('tags a meaningful chunk of the false-friends deck, not all of it', () => {
    // The deck also carries the "safe" companion word for each trap
    // (ancho next to largo, jugar next to brincar) — those should stay
    // untagged. Both bounds catch the deck drifting either way.
    const falseFriendsDeck = ES_CARDS.filter(c => c.deckId === 'es_false')
    const tagged = falseFriendsDeck.filter(c => c.interference?.type === 'false-friend')
    expect(tagged.length).toBeGreaterThan(10)
    expect(tagged.length).toBeLessThan(falseFriendsDeck.length)
  })

  it('tags every card in the four contrast-grammar decks as similar-different', () => {
    for (const deckId of ['es_ser_estar', 'es_por_para', 'es_subj', 'es_past']) {
      const cards = ES_CARDS.filter(c => c.deckId === deckId)
      expect(cards.length, deckId).toBeGreaterThan(0)
      for (const c of cards) expect(c.interference?.type, c.id).toBe('similar-different')
    }
  })

  it('leaves most of the corpus untagged — the flag means something because it is rare', () => {
    const taggedRatio = ES_CARDS.filter(c => c.interference).length / ES_CARDS.length
    expect(taggedRatio).toBeLessThan(0.3)
  })
})

describe('Spanish practice material', () => {
  it('ships scenes and conversations', () => {
    expect(ES_ROLEPLAYS.length).toBeGreaterThanOrEqual(6)
    expect(ES_DIALOGUES.length).toBeGreaterThanOrEqual(6)
  })

  /**
   * Every `you` line has to be sayable in one breath. A long expected answer
   * fails him constantly and teaches nothing — the same rule the English table
   * learned the hard way.
   */
  it('keeps his lines short enough to say on a first try', () => {
    for (const play of ES_ROLEPLAYS) {
      for (const turn of play.turns) {
        if (turn.speaker !== 'you') continue
        const words = turn.en.trim().split(/\s+/).length
        expect(words, `${play.id}: ${turn.en}`).toBeLessThanOrEqual(6)
      }
    }
  })

  // `matchesExpected` allows contractions, containment and a fuzzy near-miss,
  // so these only need to cover genuinely different phrasings — but a line
  // with none at all accepts exactly one wording and will feel broken.
  it('gives every line of his some other way to be right', () => {
    for (const play of ES_ROLEPLAYS) {
      for (const turn of play.turns) {
        if (turn.speaker !== 'you') continue
        expect(turn.accept?.length ?? 0, `${play.id}: ${turn.en}`).toBeGreaterThan(0)
      }
    }
  })

  it('opens and closes every scene with the other person speaking first', () => {
    for (const play of ES_ROLEPLAYS) {
      expect(play.turns[0].speaker, play.id).toBe('them')
      expect(play.turns.length, play.id).toBeGreaterThanOrEqual(8)
    }
  })

  it('translates every dialogue line', () => {
    for (const d of ES_DIALOGUES) {
      expect(d.lines.length, d.id).toBeGreaterThanOrEqual(6)
      for (const line of d.lines) {
        expect(line.en.trim(), d.id).not.toBe('')
        expect(line.pt.trim(), d.id).not.toBe('')
        expect(line.who.trim(), d.id).not.toBe('')
      }
    }
  })

  it('uses no peninsular conjugation in the practice material either', () => {
    const all = [
      ...ES_ROLEPLAYS.flatMap(p => p.turns.map(t => t.en)),
      ...ES_DIALOGUES.flatMap(d => d.lines.map(l => l.en)),
    ]
    expect(all.filter(line => /\bvosotros\b|\bvuestro/i.test(line))).toEqual([])
  })
})
