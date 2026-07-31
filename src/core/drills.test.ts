import { describe, it, expect } from 'vitest'
import {
  GENERATED_KINDS,
  NZ_PLACE_NAMES,
  SESSION_LENGTH,
  answerForms,
  buildDrillSession,
  checkDrillAnswer,
  generateDrill,
  generateSpellingItem,
  numberToWords,
  spellOut,
} from './drills'
import type { DrillItem, DrillMode, GeneratedKind } from './drills'

/** Deterministic pseudo-random in [0,1) — same shape placement.test.ts uses. */
function seeded(seed = 1) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}

/** Many items of one kind, so a test can assert over the whole space of shapes. */
function many(kind: GeneratedKind, n = 200): DrillItem[] {
  const rand = seeded(7)
  return Array.from({ length: n }, () => generateDrill(kind, rand))
}

const WORDS = ['bread', 'milk', 'butter', 'chemist', 'jandals']

describe('numberToWords', () => {
  it('says small numbers plainly', () => {
    expect(numberToWords(0)).toBe('zero')
    expect(numberToWords(7)).toBe('seven')
    expect(numberToWords(19)).toBe('nineteen')
  })

  it('hyphenates the tens', () => {
    expect(numberToWords(21)).toBe('twenty-one')
    expect(numberToWords(90)).toBe('ninety')
  })

  it('keeps the NZ "and" in the hundreds', () => {
    expect(numberToWords(120)).toBe('one hundred and twenty')
    expect(numberToWords(300)).toBe('three hundred')
  })

  it('says thousands naturally, not digit by digit', () => {
    expect(numberToWords(1200)).toBe('one thousand two hundred')
    expect(numberToWords(1005)).toBe('one thousand and five')
    expect(numberToWords(9999)).toBe('nine thousand nine hundred and ninety-nine')
  })

  it('never emits a bare digit', () => {
    for (let n = 0; n <= 9999; n++) expect(numberToWords(n)).not.toMatch(/\d/)
  })
})

describe('generateDrill determinism', () => {
  for (const kind of GENERATED_KINDS) {
    it(`gives the same ${kind} item for the same seed`, () => {
      const a = generateDrill(kind, seeded(42))
      const b = generateDrill(kind, seeded(42))
      expect(a).toEqual(b)
      expect(a.kind).toBe(kind)
    })

    it(`always gives a ${kind} item something to say and something to accept`, () => {
      for (const item of many(kind, 60)) {
        expect(item.spoken.trim().length).toBeGreaterThan(0)
        expect(item.accept.length).toBeGreaterThan(0)
        expect(item.accept.every(a => a.trim().length > 0)).toBe(true)
        // The canonical answer is always one the checker itself would take —
        // otherwise a miss would show her an answer the drill rejects.
        expect(checkDrillAnswer(item.accept[0], item)).toBe(true)
      }
    })
  }

  it('drifts to different items as the sequence runs on', () => {
    const rand = seeded(3)
    const items = Array.from({ length: 20 }, () => generateDrill('number', rand))
    expect(new Set(items.map(i => i.spoken)).size).toBeGreaterThan(1)
  })
})

describe('number drill', () => {
  it('stays inside 0..9999 and accepts the digits', () => {
    for (const item of many('number')) {
      const n = Number(item.accept[0])
      expect(Number.isInteger(n)).toBe(true)
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThanOrEqual(9999)
      expect(item.spoken).toBe(numberToWords(n))
      expect(checkDrillAnswer(String(n), item)).toBe(true)
    }
  })

  it('takes a thousands separator, comma or dot', () => {
    const item: DrillItem = { kind: 'number', spoken: 'one thousand two hundred', accept: ['1200'] }
    expect(checkDrillAnswer('1200', item)).toBe(true)
    expect(checkDrillAnswer('1,200', item)).toBe(true)
    expect(checkDrillAnswer('1.200', item)).toBe(true)
    expect(checkDrillAnswer('1300', item)).toBe(false)
  })
})

describe('price drill', () => {
  it('says a price either in full or clipped, and never mixes them up', () => {
    const items = many('price')
    const full = items.filter(i => i.spoken.includes('dollars'))
    const clipped = items.filter(i => !i.spoken.includes('dollars'))
    expect(full.length).toBeGreaterThan(0)
    expect(clipped.length).toBeGreaterThan(0)
    for (const item of items) {
      expect(item.display).toBe('$____')
      expect(item.accept[0]).toMatch(/^\d{1,2}\.\d{2}$/)
      expect(item.spoken).not.toMatch(/\d/)
    }
  })

  it('accepts every way she might type $3.50', () => {
    const item: DrillItem = { kind: 'price', spoken: 'three fifty', display: '$____', accept: ['3.50', '350'] }
    for (const typed of ['3.50', '$3.50', '350', '3,50', ' $3.50 ', 'NZD 3.50']) {
      expect(checkDrillAnswer(typed, item)).toBe(true)
    }
  })

  it('still says no to the wrong price', () => {
    const item: DrillItem = { kind: 'price', spoken: 'three fifty', display: '$____', accept: ['3.50', '350'] }
    for (const typed of ['4.50', '3.05', '35', '', '   ']) {
      expect(checkDrillAnswer(typed, item)).toBe(false)
    }
  })
})

describe('time drill', () => {
  it('offers both the analogue and the 24-hour way of saying it', () => {
    const spokens = many('time').map(i => i.spoken)
    expect(spokens.some(s => /half past|quarter to|quarter past|o'clock/.test(s))).toBe(true)
    expect(spokens.some(s => /^(thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)/.test(s))).toBe(true)
  })

  it('accepts the 12-hour, 24-hour and bare-digit spellings', () => {
    const item: DrillItem = { kind: 'time', spoken: 'half past two', display: '__:__', accept: ['2:30', '14:30'] }
    for (const typed of ['2:30', '14:30', '230', '1430', '02:30', '2.30']) {
      expect(checkDrillAnswer(typed, item)).toBe(true)
    }
    expect(checkDrillAnswer('2:15', item)).toBe(false)
    expect(checkDrillAnswer('3:30', item)).toBe(false)
  })

  it('gives every item a 12-hour and a 24-hour answer', () => {
    for (const item of many('time')) {
      expect(item.accept).toHaveLength(2)
      expect(item.accept[0]).toMatch(/^\d{1,2}:\d{2}$/)
      expect(item.accept[1]).toMatch(/^\d{2}:\d{2}$/)
      expect(item.display).toBe('__:__')
    }
  })
})

describe('date drill', () => {
  it('says the day as an ordinal, month by name', () => {
    for (const item of many('date')) {
      expect(item.spoken).toMatch(/^the [a-z-]+ of [A-Z][a-z]+$/)
      expect(item.accept[0]).toMatch(/^\d{1,2}\/\d{1,2}$/)
      expect(item.display).toBe('__/__')
    }
  })

  it('reads day-first, the way NZ writes it', () => {
    const item: DrillItem = { kind: 'date', spoken: 'the fifth of March', display: '__/__', accept: ['5/3', '5 March'] }
    for (const typed of ['5/3', '05/03', '5 march', '5 March', '05/3']) {
      expect(checkDrillAnswer(typed, item)).toBe(true)
    }
    // The American reading of the same slashes is a different day — refuse it.
    expect(checkDrillAnswer('3/5', item)).toBe(false)
    expect(checkDrillAnswer('5 May', item)).toBe(false)
  })

  it('never generates a day the month does not have', () => {
    for (const item of many('date')) {
      const [day, month] = item.accept[0].split('/').map(Number)
      const lengths = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
      expect(day).toBeGreaterThanOrEqual(1)
      expect(day).toBeLessThanOrEqual(lengths[month - 1])
    }
  })
})

describe('phone drill', () => {
  it('says NZ-grouped digits with "oh" for zero', () => {
    const items = many('phone')
    for (const item of items) {
      expect(item.spoken).not.toMatch(/\d/)
      expect(item.spoken.split('. ').length).toBe(3)
      expect(item.accept[0]).toMatch(/^\d{2,3} \d{3} \d{4}$/)
    }
    expect(items.some(i => i.spoken.startsWith('oh two'))).toBe(true)
  })

  it('accepts the number with spaces, dashes or neither', () => {
    const item: DrillItem = { kind: 'phone', spoken: 'oh two one. five five five. one two three four.', accept: ['021 555 1234'] }
    for (const typed of ['021 555 1234', '0215551234', '021-555-1234', '021 5551234']) {
      expect(checkDrillAnswer(typed, item)).toBe(true)
    }
    expect(checkDrillAnswer('021 555 1235', item)).toBe(false)
  })
})

describe('quantity drill', () => {
  it('says an amount in words and takes the number or the keyword', () => {
    for (const item of many('quantity')) {
      expect(item.spoken).not.toMatch(/\d/)
      expect(checkDrillAnswer(item.accept[0], item)).toBe(true)
    }
  })

  it('teaches fortnight, dozen and grams', () => {
    const spokens = new Set(many('quantity').map(i => i.spoken))
    expect(spokens.has('a fortnight')).toBe(true)
    expect(spokens.has('a dozen eggs')).toBe(true)
    expect(spokens.has('two hundred grams')).toBe(true)
  })

  it('takes either the number or the word for a fortnight', () => {
    const item: DrillItem = { kind: 'quantity', spoken: 'a fortnight', accept: ['14', 'fortnight', 'two weeks', '14 days'] }
    for (const typed of ['14', 'fortnight', 'Fortnight', 'two weeks', '14 days']) {
      expect(checkDrillAnswer(typed, item)).toBe(true)
    }
    expect(checkDrillAnswer('7', item)).toBe(false)
    expect(checkDrillAnswer('a week', item)).toBe(false)
  })
})

describe('spellOut', () => {
  it('puts a full stop after every letter so TTS pauses', () => {
    expect(spellOut('Auckland')).toBe('A. U. C. K. L. A. N. D.')
  })

  it('closes up a two-word place name', () => {
    expect(spellOut('Grey Lynn')).toBe('G. R. E. Y. L. Y. N. N.')
  })
})

describe('generateSpellingItem', () => {
  it('is deterministic for a seed', () => {
    expect(generateSpellingItem(WORDS, seeded(9))).toEqual(generateSpellingItem(WORDS, seeded(9)))
  })

  it('spells the word out with spaced letters and accepts the word itself', () => {
    const rand = seeded(5)
    for (let i = 0; i < 50; i++) {
      const item = generateSpellingItem(WORDS, rand)
      expect(item.kind).toBe('spelling')
      expect(item.spoken).toMatch(/^([A-Z]\. )*[A-Z]\.$/)
      const word = item.accept[0]
      expect(item.spoken).toBe(spellOut(word))
      expect(item.display).toBe(`${word.replace(/\s+/g, '').length} letters`)
      expect(checkDrillAnswer(word, item)).toBe(true)
      expect(checkDrillAnswer(word.toUpperCase(), item)).toBe(true)
      expect(checkDrillAnswer('definitelynotit', item)).toBe(false)
    }
  })

  it('draws on both the caller words and the NZ place names', () => {
    const rand = seeded(11)
    const picked = new Set(Array.from({ length: 300 }, () => generateSpellingItem(WORDS, rand).accept[0]))
    expect([...picked].some(w => WORDS.includes(w))).toBe(true)
    expect([...picked].some(w => NZ_PLACE_NAMES.includes(w))).toBe(true)
  })

  it('falls back to a place name when the caller has nothing usable', () => {
    const item = generateSpellingItem([], seeded(1))
    expect(NZ_PLACE_NAMES).toContain(item.accept[0])
  })

  it('skips words that are not plain short letters', () => {
    const rand = seeded(2)
    const picked = new Set(Array.from({ length: 300 }, () => generateSpellingItem(['a', "isn't", 'antidisestablishmentarianism', 'x y'], rand).accept[0]))
    expect(picked.has('a')).toBe(false)
    expect(picked.has("isn't")).toBe(false)
    expect(picked.has('antidisestablishmentarianism')).toBe(false)
  })
})

describe('buildDrillSession', () => {
  it('builds ten items of one kind', () => {
    const items = buildDrillSession('price', WORDS, seeded(4))
    expect(items).toHaveLength(SESSION_LENGTH)
    expect(items.every(i => i.kind === 'price')).toBe(true)
  })

  it('mixes kinds when asked to', () => {
    const items = buildDrillSession('mixed', WORDS, seeded(4), 60)
    expect(new Set(items.map(i => i.kind)).size).toBeGreaterThan(2)
  })

  it('is deterministic for every mode', () => {
    const modes: DrillMode[] = [...GENERATED_KINDS, 'spelling', 'mixed']
    for (const mode of modes) {
      expect(buildDrillSession(mode, WORDS, seeded(8))).toEqual(buildDrillSession(mode, WORDS, seeded(8)))
    }
  })
})

describe('answerForms', () => {
  it('drops currency marks and leading zeros', () => {
    expect(answerForms('$3.50')).toContain('350')
    expect(answerForms('05/03')).toContain('5 3')
  })

  it('gives an empty answer no shapes at all', () => {
    expect(answerForms('  ')).toEqual([])
  })
})
