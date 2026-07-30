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

  // Built from their codepoints on purpose, never pasted: U+2013/U+2014 and the
  // curly quotes are visually identical to their ASCII cousins in most editors,
  // and it is exactly these characters the shipped corpus contains.
  const EM = String.fromCodePoint(0x2014) // em dash
  const EN = String.fromCodePoint(0x2013) // en dash
  const LDQ = String.fromCodePoint(0x201C) // left curly double quote
  const RDQ = String.fromCodePoint(0x201D) // right curly double quote

  it('strips the em dash the corpus actually contains (U+2014)', () => {
    expect(normalize(`It's cold ${EM} wear a coat.`)).toBe('its cold wear a coat')
    expect(normalize(`Danger ${EM} do not enter.`)).toBe('danger do not enter')
  })

  it('strips the en dash too (U+2013)', () => {
    expect(normalize(`nine ${EN} ten`)).toBe('nine ten')
  })

  it('strips curly double quotes (U+201C/U+201D)', () => {
    expect(normalize(`${LDQ}Thanks!${RDQ} ${EM} ${LDQ}No worries.${RDQ}`)).toBe('thanks no worries')
  })

  it('strips semicolons and colons', () => {
    expect(normalize('He is my brother; she is my sister.')).toBe('he is my brother she is my sister')
    expect(normalize('Past: worked')).toBe('past worked')
  })

  it('treats a slash as a separator, whatever the spacing', () => {
    expect(normalize('He / She')).toBe('he she')
    expect(normalize('he/she')).toBe('he she')
    expect(normalize('CV / résumé')).toBe('cv résumé')
  })

  it('treats a standalone hyphen as the dash a learner types in its place', () => {
    expect(normalize("It's cold - wear a coat.")).toBe('its cold wear a coat')
  })

  it('keeps hyphens inside words', () => {
    expect(normalize('We signed a one-year tenancy.')).toBe('we signed a one-year tenancy')
    expect(normalize('Plurals: add -s')).toBe('plurals add -s')
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

  // The four cases below are the shipped corpus, character for character.
  it('accepts a dictated sentence typed on a plain keyboard', () => {
    const EM = String.fromCodePoint(0x2014)
    const LDQ = String.fromCodePoint(0x201C)
    const RDQ = String.fromCodePoint(0x201D)
    const RSQ = String.fromCodePoint(0x2019)

    // emergency_1
    expect(looseMatch("Call 111 - it's an emergency.", `Call 111 ${EM} it${RSQ}s an emergency.`)).toBe(true)
    expect(looseMatch("Call 111 it's an emergency", `Call 111 ${EM} it${RSQ}s an emergency.`)).toBe(true)
    // smalltalk_6
    expect(looseMatch('"Thanks!" - "No worries."', `${LDQ}Thanks!${RDQ} ${EM} ${LDQ}No worries.${RDQ}`)).toBe(true)
    // kiwi_12
    expect(looseMatch("It's a party - bring a plate.", `It${RSQ}s a party ${EM} bring a plate.`)).toBe(true)
  })

  it('accepts either spelling of a slashed answer', () => {
    // people_14 / work_1
    expect(looseMatch('he/she', 'He / She')).toBe(true)
    expect(looseMatch('he she', 'He / She')).toBe(true)
    expect(looseMatch('He / She', 'He / She')).toBe(true)
    expect(looseMatch('cv/résumé', 'CV / résumé')).toBe(true)
  })

  it('still rejects the wrong words either side of a separator', () => {
    expect(looseMatch('he/it', 'He / She')).toBe(false)
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
