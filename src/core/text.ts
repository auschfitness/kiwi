import type { Card, PartOfSpeech } from '../types'

const TYPABLE_POS: ReadonlySet<PartOfSpeech> = new Set<PartOfSpeech>([
  'word', 'noun', 'verb', 'adj', 'number', 'greeting', 'slang',
])

/**
 * Separators that stand between alternatives or clauses. Each becomes a space
 * so the surrounding whitespace collapse makes spacing irrelevant: "He / She",
 * "he/she" and "he she" all normalise to "he she".
 *
 * Written as \u escapes on purpose — U+2013 and U+2014 are visually
 * indistinguishable from an ASCII hyphen in most editors, and the corpus really
 * does contain U+2014 (14 cards) but never U+2013.
 */
const SEPARATORS = /[/\u2013\u2014]/g

/**
 * A hyphen standing alone between words: what a learner types when she hears
 * the pause an em dash marks. Intra-word hyphens ("one-year", "add -s") are
 * left alone — the lookahead requires whitespace or end-of-string after the run.
 */
const LONE_HYPHEN = /(^|\s)-+(?=\s|$)/g

/**
 * Punctuation the learner should never have to reproduce. Straight and curly
 * quotes/apostrophes (U+2018/U+2019/U+201C/U+201D), sentence enders, and the
 * `;` / `:` the grammar and people decks use.
 */
const PUNCTUATION = /[.?!,;:'"\u2018\u2019\u201C\u201D]/g

/**
 * Lowercase, neutralise separators, strip punctuation, drop a leading "to ",
 * collapse whitespace.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(SEPARATORS, ' ')
    .replace(LONE_HYPHEN, ' ')
    .replace(PUNCTUATION, '')
    .trim()
    .replace(/^to\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function exampleWords(card: Card): string[] {
  return stripTags(card.exampleHtml).trim().split(/\s+/).filter(Boolean)
}

export function isTypable(card: Card): boolean {
  return card.en.length <= 16 && !card.en.includes('…') && TYPABLE_POS.has(card.pos)
}

export function isSentence(card: Card): boolean {
  const n = exampleWords(card).length
  return n >= 3 && n <= 9
}

export function looseMatch(answer: string, target: string): boolean {
  const a = normalize(answer)
  return a.length > 0 && a === normalize(target)
}

/** The example sentence with the bolded target replaced by a blank. */
export function clozeExample(card: Card): string {
  if (!/<b>.*?<\/b>/.test(card.exampleHtml)) return stripTags(card.exampleHtml)
  return stripTags(card.exampleHtml.replace(/<b>.*?<\/b>/, '_____'))
}
