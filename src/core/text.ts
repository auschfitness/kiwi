import type { Card, PartOfSpeech } from '../types'

/**
 * What a beginner may be asked to type: single words, essentially.
 *
 * `phrase` and `grammar` are out because of what those cards look like in the
 * English course — "go → went" is a card, and asking her to reproduce the
 * arrow would be a test of the notation rather than of the language.
 *
 * A course can widen this. The Spanish course does, because its whole point is
 * production and its phrase cards are short, ordinary things a person says
 * ("sin embargo", "me da igual") rather than notation.
 */
export const DEFAULT_TYPABLE_POS: ReadonlySet<PartOfSpeech> = new Set<PartOfSpeech>([
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

/**
 * How long a target may be and still be worth typing.
 *
 * Sixteen was calibrated for a beginner typing single English words, where a
 * long target is a long *word* and typing it tests patience rather than
 * knowledge. A production course is a different bargain: its targets are
 * ordinary multi-word expressions, and the ones that carry the most
 * naturalness are the longest ("hacer la vista gorda"). Cutting them to fit
 * would be letting the limit edit the language.
 */
export const DEFAULT_TYPABLE_MAX = 16

export function isTypable(
  card: Card,
  typablePos: ReadonlySet<PartOfSpeech> = DEFAULT_TYPABLE_POS,
  maxChars: number = DEFAULT_TYPABLE_MAX,
): boolean {
  return card.en.length <= maxChars && !card.en.includes('…') && typablePos.has(card.pos)
}

export function isSentence(card: Card): boolean {
  const n = exampleWords(card).length
  return n >= 3 && n <= 9
}

/**
 * Apostrophe used in contractions, as it actually appears in the corpus: the
 * straight quote (U+0027) or the curly right single quote (U+2019). Built
 * from codepoints, never pasted — see the note on PUNCTUATION above.
 */
const APOS = '[\'\u2019]'

/**
 * Contractions whose expansion the generic suffix rules below get wrong, so
 * they must be substituted first. `can't` is genuinely two acceptable
 * expansions ("cannot" and "can not"), so it branches instead of resolving.
 */
const IRREGULAR_CONTRACTIONS: ReadonlyArray<[RegExp, string]> = [
  [new RegExp(`\\bwon${APOS}t\\b`, 'gi'), 'will not'],
  [new RegExp(`\\bshan${APOS}t\\b`, 'gi'), 'shall not'],
  [new RegExp(`\\blet${APOS}s\\b`, 'gi'), 'let us'],
  [new RegExp(`\\by${APOS}all\\b`, 'gi'), 'you all'],
]

const CANT_RE = new RegExp(`\\bcan${APOS}t\\b`, 'gi')
const CANT_TEST_RE = new RegExp(`\\bcan${APOS}t\\b`, 'i')

/**
 * Suffix rules applied to the word they attach to, once the irregulars above
 * are out of the way. `'d` (would/had) and `'s` (is/has/possessive) are
 * genuinely ambiguous — left unresolved on purpose, see normalizeVariants.
 */
const SUFFIX_CONTRACTIONS: ReadonlyArray<[RegExp, string]> = [
  [new RegExp(`(\\w+)n${APOS}t\\b`, 'gi'), '$1 not'],
  [new RegExp(`(\\w+)${APOS}re\\b`, 'gi'), '$1 are'],
  [new RegExp(`(\\w+)${APOS}m\\b`, 'gi'), '$1 am'],
  [new RegExp(`(\\w+)${APOS}ve\\b`, 'gi'), '$1 have'],
  [new RegExp(`(\\w+)${APOS}ll\\b`, 'gi'), '$1 will'],
  [new RegExp(`(\\w+)${APOS}d\\b`, 'gi'), '$1 would'],
  [new RegExp(`(\\w+)${APOS}s\\b`, 'gi'), '$1 is'],
]

function applyAll(s: string, rules: ReadonlyArray<[RegExp, string]>): string {
  return rules.reduce((acc, [re, replacement]) => acc.replace(re, replacement), s)
}

/**
 * Every plausible full-word expansion of the contractions in `s`. Usually a
 * single string; two when `can't` is present, since both "cannot" and
 * "can not" are acceptable and the rule can't (sorry) pick one for her.
 */
function expandContractions(s: string): string[] {
  const afterIrregulars = applyAll(s, IRREGULAR_CONTRACTIONS)
  if (!CANT_TEST_RE.test(afterIrregulars)) {
    return [applyAll(afterIrregulars, SUFFIX_CONTRACTIONS)]
  }
  const cannot = afterIrregulars.replace(CANT_RE, 'cannot')
  const canNot = afterIrregulars.replace(CANT_RE, 'can not')
  return [applyAll(cannot, SUFFIX_CONTRACTIONS), applyAll(canNot, SUFFIX_CONTRACTIONS)]
}

/**
 * Every normalized form `s` should be accepted as. Always includes the plain
 * `normalize(s)`, plus one form per plausible contraction expansion, expanded
 * *before* normalize's punctuation strip runs so the apostrophe is gone by
 * the time it would otherwise be silently dropped (turning "it's" into
 * "its" instead of "it is").
 *
 * Deliberately does not resolve `'d`/`'s` ambiguity: both sides of a
 * comparison generate variants, so e.g. "I'd like" vs "I would like" still
 * matches on the shared "would" variant.
 */
export function normalizeVariants(s: string): string[] {
  const variants = new Set<string>([normalize(s)])
  for (const expanded of expandContractions(s)) {
    variants.add(normalize(expanded))
  }
  return Array.from(variants)
}

export function looseMatch(answer: string, target: string): boolean {
  if (normalize(answer).length === 0) return false
  const targetVariants = normalizeVariants(target)
  return normalizeVariants(answer).some(v => targetVariants.includes(v))
}

/** The example sentence with the bolded target replaced by a blank. */
export function clozeExample(card: Card): string {
  if (!/<b>.*?<\/b>/.test(card.exampleHtml)) return stripTags(card.exampleHtml)
  return stripTags(card.exampleHtml.replace(/<b>.*?<\/b>/, '_____'))
}
