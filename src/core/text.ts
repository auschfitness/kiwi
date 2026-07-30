import type { Card, PartOfSpeech } from '../types'

const TYPABLE_POS: ReadonlySet<PartOfSpeech> = new Set<PartOfSpeech>([
  'word', 'noun', 'verb', 'adj', 'number', 'greeting', 'slang',
])

/** Lowercase, strip punctuation, drop a leading "to ", collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.?!,'‘’]/g, '')
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
