import { describe, it, expect } from 'vitest'
import { normalize, stripTags, exampleWords, isTypable, isSentence, looseMatch, clozeExample } from './text'
import type { Card, PartOfSpeech } from '../types'

function card(over: Partial<Card> = {}): Card {
  return {
    id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
    exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
    pos: 'noun', ...over,
  }
}

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('  Hello  ')).toBe('hello')
  })

  it('strips terminal and internal punctuation', () => {
    expect(normalize('Hello, world!')).toBe('hello world')
    expect(normalize('Really?')).toBe('really')
  })

  it('strips both straight and curly apostrophes', () => {
    expect(normalize("I don't know")).toBe('i dont know')
    expect(normalize("I don’t know")).toBe('i dont know')
  })

  it('drops a leading "to " so infinitives match bare verbs', () => {
    expect(normalize('to go')).toBe('go')
    expect(normalize('To Go')).toBe('go')
  })

  it('does not strip "to" mid-string', () => {
    expect(normalize('I go to work')).toBe('i go to work')
  })

  it('collapses runs of whitespace', () => {
    expect(normalize('a   b\n c')).toBe('a b c')
  })
})

describe('stripTags', () => {
  it('removes markup and keeps the words', () => {
    expect(stripTags('I want <b>water</b>, please.')).toBe('I want water, please.')
  })
})

describe('exampleWords', () => {
  it('returns plain words with punctuation removed', () => {
    expect(exampleWords(card())).toEqual(['I', 'want', 'water,', 'please.'])
  })
})

describe('isTypable', () => {
  it('accepts short single words', () => {
    expect(isTypable(card({ en: 'water', pos: 'noun' }))).toBe(true)
  })

  it('rejects long targets', () => {
    expect(isTypable(card({ en: 'a very long phrase indeed', pos: 'noun' }))).toBe(false)
  })

  it('rejects ellipsis placeholders', () => {
    expect(isTypable(card({ en: 'My name is…', pos: 'phrase' }))).toBe(false)
  })

  it('rejects phrase and grammar parts of speech', () => {
    for (const pos of ['phrase', 'grammar'] as PartOfSpeech[]) {
      expect(isTypable(card({ en: 'short', pos }))).toBe(false)
    }
  })

  it('accepts every typable part of speech', () => {
    for (const pos of ['word', 'noun', 'verb', 'adj', 'number', 'greeting', 'slang'] as PartOfSpeech[]) {
      expect(isTypable(card({ en: 'short', pos }))).toBe(true)
    }
  })
})

describe('isSentence', () => {
  it('accepts examples of three to nine words', () => {
    expect(isSentence(card({ exampleHtml: 'I want <b>water</b>, please.' }))).toBe(true)
  })

  it('rejects examples shorter than three words', () => {
    expect(isSentence(card({ exampleHtml: '<b>Ten</b> minutes.' }))).toBe(false)
  })

  it('rejects examples longer than nine words', () => {
    expect(isSentence(card({ exampleHtml: 'one two three four five six seven eight nine <b>ten</b>' }))).toBe(false)
  })
})

describe('looseMatch', () => {
  it('accepts an answer that differs only in case and punctuation', () => {
    expect(looseMatch('Water!', 'water')).toBe(true)
  })

  it('accepts a bare verb for an infinitive target', () => {
    expect(looseMatch('go', 'to go')).toBe(true)
  })

  it('rejects a different word', () => {
    expect(looseMatch('fire', 'water')).toBe(false)
  })

  it('rejects an empty answer', () => {
    expect(looseMatch('   ', 'water')).toBe(false)
  })
})

describe('clozeExample', () => {
  it('blanks the bolded target', () => {
    expect(clozeExample(card())).toBe('I want _____, please.')
  })

  it('falls back to the plain example when nothing is bolded', () => {
    expect(clozeExample(card({ exampleHtml: 'No bold here.' }))).toBe('No bold here.')
  })
})
