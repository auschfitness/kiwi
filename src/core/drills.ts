import { normalize } from './text'

/**
 * The things that actually trip a newcomer at a counter: a price said fast, a
 * time said on the phone, a date, a street name spelled out. Everything here
 * is pure — randomness is injected rather than reached for, so a
 * test can pin a seed and get the same drill every time.
 */

export type DrillKind =
  | 'number' | 'price' | 'time' | 'date' | 'phone' | 'quantity' | 'spelling'

/**
 * The kinds `generateDrill` can make out of thin air. Spelling is the odd one
 * out — it needs a word list, so it has its own generator and is excluded here
 * by the type rather than by a runtime throw.
 */
export const GENERATED_KINDS = ['number', 'price', 'time', 'date', 'phone', 'quantity'] as const
export type GeneratedKind = (typeof GENERATED_KINDS)[number]

export interface DrillItem {
  kind: DrillKind
  /** What TTS says. */
  spoken: string
  /** Optional on-screen prompt, e.g. "$____" — a shape, never the answer. */
  display?: string
  /** Acceptable typed answers. `accept[0]` is the canonical one we show on a miss. */
  accept: string[]
}

/** A whole session: one of the generated kinds, spelling, or a mix of the lot. */
export type DrillMode = GeneratedKind | 'spelling' | 'mixed'

// ---------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------

const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
  'seventeen', 'eighteen', 'nineteen',
]

const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

/**
 * 0–9999 said the way a person says it, not digit by digit. Keeps the "and":
 * "one hundred and twenty", "one thousand and five" — Americans say it too in
 * speech, and that little word is half of why a spoken number goes past her
 * too fast.
 */
export function numberToWords(n: number): string {
  if (n < 20) return ONES[n]
  if (n < 100) {
    const tens = TENS[Math.floor(n / 10)]
    const ones = n % 10
    return ones === 0 ? tens : `${tens}-${ONES[ones]}`
  }
  if (n < 1000) {
    const rest = n % 100
    const head = `${ONES[Math.floor(n / 100)]} hundred`
    return rest === 0 ? head : `${head} and ${numberToWords(rest)}`
  }
  const rest = n % 1000
  const head = `${numberToWords(Math.floor(n / 1000))} thousand`
  if (rest === 0) return head
  return rest < 100 ? `${head} and ${numberToWords(rest)}` : `${head} ${numberToWords(rest)}`
}

const ORDINALS = [
  '', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth',
  'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth',
  'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth', 'twentieth',
  'twenty-first', 'twenty-second', 'twenty-third', 'twenty-fourth', 'twenty-fifth',
  'twenty-sixth', 'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth',
  'thirty-first',
]

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** Non-leap lengths: a generated date is never the 31st of February. */
const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

// ---------------------------------------------------------------------------
// Answer tolerance
// ---------------------------------------------------------------------------

/** Currency marks she may or may not type. The amount is the answer, not the sign. */
const CURRENCY = /[$£€¥]|\busd\b/gi

/** 1,200 / 1.200 — a group of exactly three digits after the mark is a thousands separator. */
const THOUSANDS_COMMA = /^\d{1,3}(,\d{3})+$/
const THOUSANDS_DOT = /^\d{1,3}(\.\d{3})+$/

/** Leading zeros on a token: "05 03" is the same date as "5 3". */
const LEADING_ZEROS = /\b0+(\d)/g

function stripThousands(s: string): string {
  if (THOUSANDS_COMMA.test(s)) return s.replace(/,/g, '')
  if (THOUSANDS_DOT.test(s)) return s.replace(/\./g, '')
  return s
}

/**
 * A comma between digits is a decimal point to her — she is Brazilian and
 * "3,50" will come out of her fingers before she can stop it. Rejecting that
 * teaches nothing about English, so it is a spelling of the right answer.
 */
function commaDecimal(s: string): string {
  return s.replace(/(\d),(\d)/g, '$1.$2')
}

/**
 * Every shape one answer can legitimately take. Kept here rather than in
 * ever-longer `accept` arrays: two answers match when any shape of one equals
 * any shape of the other.
 *
 * `normalize` already lowercases and drops the punctuation that separates
 * digits (`.` `:` `,`) and turns `/` into a space, so "3.50", "3,50" and "350"
 * converge on their own; the bare form additionally throws away spaces and
 * dashes so "021 555 1234" and "021-555-1234" meet.
 */
export function answerForms(raw: string): string[] {
  const cleaned = commaDecimal(stripThousands(raw.replace(CURRENCY, '').trim()))
  const text = normalize(cleaned)
  const bare = text.replace(/[^0-9a-z]/g, '')
  const shapes = [text, text.replace(LEADING_ZEROS, '$1'), bare, bare.replace(LEADING_ZEROS, '$1')]
  return Array.from(new Set(shapes.filter(s => s.length > 0)))
}

/** True when what she typed is one of the answers this item will take. */
export function checkDrillAnswer(typed: string, item: DrillItem): boolean {
  if (!typed.trim()) return false
  const got = new Set(answerForms(typed))
  if (got.size === 0) return false
  return item.accept.some(a => answerForms(a).some(form => got.has(form)))
}

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

function pick<T>(items: readonly T[], rand: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(rand() * items.length))]
}

function intBetween(min: number, max: number, rand: () => number): number {
  return min + Math.min(max - min, Math.floor(rand() * (max - min + 1)))
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

function numberDrill(rand: () => number): DrillItem {
  const n = intBetween(0, 9999, rand)
  return { kind: 'number', spoken: numberToWords(n), accept: [String(n)] }
}

/** Cents people actually say at a till — all ≥ 10, so "three dollars fifty" stays natural. */
const CENTS = [0, 10, 20, 25, 50, 75, 80, 90, 95, 99]

function priceDrill(rand: () => number): DrillItem {
  const dollars = intBetween(1, 99, rand)
  const cents = pick(CENTS, rand)
  const clipped = rand() < 0.5
  const unit = dollars === 1 ? 'dollar' : 'dollars'

  let spoken: string
  if (cents === 0) {
    spoken = `${numberToWords(dollars)} ${unit}`
  } else if (clipped) {
    // The form she will actually meet at a counter: "three fifty", no "dollars"
    // anywhere in it. Under ten cents it becomes "three oh five".
    spoken = cents < 10
      ? `${numberToWords(dollars)} oh ${numberToWords(cents)}`
      : `${numberToWords(dollars)} ${numberToWords(cents)}`
  } else {
    spoken = `${numberToWords(dollars)} ${unit} ${numberToWords(cents)}`
  }

  const canonical = `${dollars}.${pad2(cents)}`
  return {
    kind: 'price',
    spoken,
    display: '$____',
    // The cents-only spelling ("350") is a different answer, not a different
    // punctuation of the same one, so it lives here rather than in the checker.
    accept: [canonical, `${dollars}${pad2(cents)}`, ...(cents === 0 ? [String(dollars)] : [])],
  }
}

const MINUTES_ANALOGUE = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
/** The 24-hour style needs a minute to say: "fourteen hundred" is army, not everyday. */
const MINUTES_24 = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]

function analogueTime(hour12: number, minute: number): string {
  const next = hour12 === 12 ? 1 : hour12 + 1
  if (minute === 0) return `${numberToWords(hour12)} o'clock`
  if (minute === 15) return `quarter past ${numberToWords(hour12)}`
  if (minute === 30) return `half past ${numberToWords(hour12)}`
  if (minute === 45) return `quarter to ${numberToWords(next)}`
  if (minute < 30) return `${numberToWords(minute)} past ${numberToWords(hour12)}`
  return `${numberToWords(60 - minute)} to ${numberToWords(next)}`
}

function timeDrill(rand: () => number): DrillItem {
  const hour12 = intBetween(1, 12, rand)
  const pm = rand() < 0.5
  const twentyFour = rand() < 0.5
  const minute = pick(twentyFour ? MINUTES_24 : MINUTES_ANALOGUE, rand)
  const hour24 = pm ? (hour12 % 12) + 12 : hour12 % 12

  // Midnight is said "twelve oh five", never "zero oh five" — nobody says that,
  // and hearing it would teach her a sentence no American will ever say to her.
  // Both readings are accepted below, so 12:05 and 00:05 are still both right.
  const spokenHour = hour24 === 0 ? 12 : hour24
  const spoken = twentyFour
    ? `${numberToWords(spokenHour)} ${minute < 10 ? `oh ${numberToWords(minute)}` : numberToWords(minute)}`
    : analogueTime(hour12, minute)

  // Both readings are accepted whichever way it was said: "half past two" never
  // told her whether it was the afternoon, so 2:30 and 14:30 are both right.
  return {
    kind: 'time',
    spoken,
    display: '__:__',
    accept: [`${hour12}:${pad2(minute)}`, `${pad2(hour24)}:${pad2(minute)}`],
  }
}

function dateDrill(rand: () => number): DrillItem {
  const month = intBetween(1, 12, rand)
  const day = intBetween(1, MONTH_DAYS[month - 1], rand)
  const name = MONTHS[month - 1]
  return {
    kind: 'date',
    spoken: `the ${ORDINALS[day]} of ${name}`,
    display: '__/__',
    // American writes the month first, so 3/5 is the fifth of March. The
    // day-first reading (5/3) is deliberately not accepted — getting that
    // wrong is how you turn up to an appointment two months early.
    accept: [`${month}/${day}`, `${day} ${name}`],
  }
}

/** Real US area codes (NYC, Chicago, SF, Miami, Las Vegas) — recognisable, and none starts with 0 or 1, which the NANP forbids. */
const AREA_CODES = ['212', '312', '415', '305', '702']

const DIGIT_WORDS = ['oh', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']

function sayDigits(group: string): string {
  return group.split('').map(d => DIGIT_WORDS[Number(d)]).join(' ')
}

function randomDigits(n: number, rand: () => number): string {
  let out = ''
  for (let i = 0; i < n; i++) out += String(intBetween(0, 9, rand))
  return out
}

function phoneDrill(rand: () => number): DrillItem {
  const areaCode = pick(AREA_CODES, rand)
  // US phone numbers all group the same way: area code, exchange, line —
  // "212 555 1234".
  const groups = [areaCode, randomDigits(3, rand), randomDigits(4, rand)]

  // The full stops are load-bearing: without them TTS reads the whole thing as
  // one long number and she has no chance of catching the groups.
  const spoken = `${groups.map(sayDigits).join('. ')}.`
  return {
    kind: 'phone',
    spoken,
    display: '___ ___ ____',
    accept: [groups.join(' ')],
  }
}

/**
 * Amounts said as words. She grew up metric, and American groceries are
 * quoted in pounds, ounces and gallons instead — a real gap, not a voice
 * quirk, since a Brazilian ear has no built-in sense of what an ounce is.
 */
const QUANTITIES: ReadonlyArray<{ spoken: string; accept: string[] }> = [
  { spoken: 'half a pound', accept: ['8', '8 oz', 'half a pound'] },
  { spoken: 'a pound', accept: ['16', '16 oz', 'a pound', 'pound'] },
  { spoken: 'a quarter pound', accept: ['4', '4 oz', 'a quarter pound', 'quarter pound'] },
  { spoken: 'a dozen eggs', accept: ['12', 'dozen', 'a dozen'] },
  { spoken: 'half a dozen', accept: ['6', 'half a dozen'] },
  { spoken: 'two weeks', accept: ['14', 'two weeks', '14 days'] },
  { spoken: 'a couple of days', accept: ['2', 'couple'] },
  { spoken: 'a gallon of milk', accept: ['1', '1 gallon', 'a gallon'] },
  { spoken: 'a quart of milk', accept: ['1', '1 quart', 'a quart'] },
  { spoken: 'three quarters of an hour', accept: ['45', '45 minutes'] },
  { spoken: 'a six-pack', accept: ['6', 'six-pack', 'a six-pack'] },
]

function quantityDrill(rand: () => number): DrillItem {
  const q = pick(QUANTITIES, rand)
  // Unlike every other kind, an amount has no obvious written shape — there is
  // no "$____" or "__:__" to look at — so say what is being asked for. Without
  // it the screen's "write what you heard" is the only instruction she has,
  // and it is the wrong one.
  return { kind: 'quantity', spoken: q.spoken, display: 'how many?', accept: [...q.accept] }
}

/**
 * Writing down exactly what she heard is never wrong.
 *
 * Every generator here converts speech into some other written shape — words
 * to digits, "half past two" to 2:30 — and each of them used to reject its own
 * spoken text. The screen says "Listen, then write what you heard", so a
 * learner who hears "a fortnight" and types "a fortnight" heard it perfectly
 * and was told `Not quite`, with a listening failure recorded against her.
 * That is a mark for guessing the format, not for listening.
 *
 * Applied centrally rather than in each generator so a kind added later cannot
 * quietly reopen the hole. It only ever widens what is accepted, and only for
 * the one string the item itself just said out loud; `checkDrillAnswer` is the
 * dedupe, so items that already took their spoken form are left untouched.
 */
function acceptItsOwnWords(item: DrillItem): DrillItem {
  const spoken = item.spoken.trim()
  if (!spoken || checkDrillAnswer(spoken, item)) return item
  return { ...item, accept: [...item.accept, spoken] }
}

const GENERATORS: Record<GeneratedKind, (rand: () => number) => DrillItem> = {
  number: numberDrill,
  price: priceDrill,
  time: timeDrill,
  date: dateDrill,
  phone: phoneDrill,
  quantity: quantityDrill,
}

export function generateDrill(kind: GeneratedKind, rand: () => number): DrillItem {
  return acceptItsOwnWords(GENERATORS[kind](rand))
}

// ---------------------------------------------------------------------------
// Spelling by ear
// ---------------------------------------------------------------------------

/**
 * Places she will have to spell down a phone in her first week — major
 * cities, plus a few neighborhoods she's likely to hear by name.
 */
export const US_PLACE_NAMES: readonly string[] = [
  'Chicago', 'Seattle', 'Boston', 'Austin', 'Denver', 'Portland',
  'Nashville', 'Phoenix', 'Orlando', 'Memphis',
  'Brooklyn', 'Manhattan', 'Hollywood', 'Sacramento', 'Baltimore', 'Pittsburgh',
]

const MIN_SPELLING_LETTERS = 3
const MAX_SPELLING_LETTERS = 12

/** Plain letters only, and short enough to hold in your head while you type. */
function spellable(word: string): boolean {
  const letters = word.replace(/\s+/g, '')
  return /^[A-Za-z]+$/.test(letters)
    && letters.length >= MIN_SPELLING_LETTERS
    && letters.length <= MAX_SPELLING_LETTERS
}

/**
 * The trailing full stop on every letter is what makes this work: without them
 * TTS runs "AUCKLAND" together and the drill teaches nothing.
 */
export function spellOut(word: string): string {
  return word
    .replace(/\s+/g, '')
    .toUpperCase()
    .split('')
    .map(letter => `${letter}.`)
    .join(' ')
}

/**
 * `words` comes from the caller (the screen passes card `en` values) so this
 * module never imports content — the same arrangement every core/ module keeps.
 */
export function generateSpellingItem(words: string[], rand: () => number): DrillItem {
  const seen = new Set<string>()
  const pool: string[] = []
  for (const word of [...words, ...US_PLACE_NAMES]) {
    const trimmed = word.trim()
    const key = trimmed.toLowerCase()
    if (!spellable(trimmed) || seen.has(key)) continue
    seen.add(key)
    pool.push(trimmed)
  }
  const word = pool.length > 0 ? pick(pool, rand) : 'Chicago'
  const letters = word.replace(/\s+/g, '')
  return acceptItsOwnWords({
    kind: 'spelling',
    spoken: spellOut(word),
    display: `${letters.length} letters`,
    accept: [word],
  })
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export const SESSION_LENGTH = 10

const MIXED_MODES: ReadonlyArray<GeneratedKind | 'spelling'> = [...GENERATED_KINDS, 'spelling']

/** One item of whichever mode was asked for; `mixed` rolls a mode per item. */
export function generateForMode(mode: DrillMode, words: string[], rand: () => number): DrillItem {
  const chosen = mode === 'mixed' ? pick(MIXED_MODES, rand) : mode
  return chosen === 'spelling' ? generateSpellingItem(words, rand) : generateDrill(chosen, rand)
}

export function buildDrillSession(
  mode: DrillMode,
  words: string[],
  rand: () => number,
  count: number = SESSION_LENGTH,
): DrillItem[] {
  return Array.from({ length: count }, () => generateForMode(mode, words, rand))
}
