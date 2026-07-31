import type { RoleplayTurn } from '../content/authored/roleplays'
import { normalize, normalizeVariants } from './text'
import { similarity } from './pronunciation'

/**
 * How close a heard line has to be to count. Lower than the 0.75 Shadowing
 * grades pronunciation with, on purpose: role-play is a conversation, not a
 * pronunciation test. She is being asked to *produce* a sentence under time
 * pressure, so "a flat white thanks mate" should sail through.
 */
export const MATCH_THRESHOLD = 0.7

/** Tries she gets on one line before the screen shows her the English. */
export const MAX_TRIES = 2

/** Everything that counts as saying this line: the script plus its variants. */
export function candidatesFor(turn: RoleplayTurn): string[] {
  return [turn.en, ...(turn.accept ?? [])]
}

/**
 * Contraction-aware normalised forms, empties dropped.
 *
 * `normalizeVariants` (not `normalize`) is the whole point here: it expands
 * contractions *before* the punctuation strip, so "I'd like a flat white" and
 * "I would like a flat white" both reduce to a shared form. Matching on plain
 * `normalize` alone used to fail her for answers that were exactly right.
 */
function forms(s: string): string[] {
  return normalizeVariants(s).filter(v => v.length > 0)
}

/** The best 0..1 similarity between what she said and any acceptable line. */
export function bestSimilarity(heard: string, turn: RoleplayTurn): number {
  const heardForms = forms(heard)
  if (heardForms.length === 0) return 0
  let best = 0
  for (const candidate of candidatesFor(turn)) {
    for (const c of forms(candidate)) {
      for (const h of heardForms) {
        best = Math.max(best, similarity(h, c))
      }
    }
  }
  return best
}

/**
 * True when `needle` appears inside `haystack` as whole words.
 *
 * Raw substring containment was too generous in one direction that matters:
 * the supermarket scene accepts the single word `no`, and "I know" contains
 * the letters n-o, so a completely different sentence sailed through. Both
 * sides are already normalised to space-separated words, so padding the pair
 * with spaces is all a word boundary needs to be.
 */
function containsPhrase(haystack: string, needle: string): boolean {
  if (needle.length === 0) return false
  return ` ${haystack} `.includes(` ${needle} `)
}

/**
 * True when she said the line. Generous by design — three ways in:
 *
 *  1. an exact match against the script or any `accept` variant,
 *  2. whole-word *containment*, so padding either side ("um, a flat white
 *     please mate") still counts,
 *  3. a fuzzy near-miss at or above MATCH_THRESHOLD, which covers the small
 *     mishearings the browser's recogniser makes on a Brazilian accent.
 *
 * An empty `heard` is never a match: `recognizeOnce` resolves '' for a broken
 * microphone, silence or a timeout, and that means "didn't catch that", never
 * "wrong".
 */
export function matchesExpected(heard: string, turn: RoleplayTurn): boolean {
  const heardForms = forms(heard)
  if (heardForms.length === 0) return false

  for (const candidate of candidatesFor(turn)) {
    for (const c of forms(candidate)) {
      for (const h of heardForms) {
        if (h === c || containsPhrase(h, c)) return true
      }
    }
  }
  return bestSimilarity(heard, turn) >= MATCH_THRESHOLD
}

/** True when `heard` carries no words at all — a silent or missing mic. */
export function heardNothing(heard: string): boolean {
  return normalize(heard).length === 0
}

/**
 * The run of `them` lines starting at `from` — what the screen auto-plays
 * before handing the floor back to her. Empty when `from` is her turn or past
 * the end. Scripts alternate, so this is normally one line, but a scene that
 * lets the other person say two things in a row still works.
 */
export function themRunAt(turns: readonly RoleplayTurn[], from: number): RoleplayTurn[] {
  const run: RoleplayTurn[] = []
  for (let i = Math.max(0, from); i < turns.length; i++) {
    const turn = turns[i]
    if (turn.speaker !== 'them') break
    run.push(turn)
  }
  return run
}

/** Index of the first `you` turn at or after `from`; -1 when there is none. */
export function nextYouIndex(turns: readonly RoleplayTurn[], from: number): number {
  for (let i = Math.max(0, from); i < turns.length; i++) {
    if (turns[i].speaker === 'you') return i
  }
  return -1
}

/** How many lines of the conversation are hers — the denominator of the score. */
export function youTurnCount(turns: readonly RoleplayTurn[]): number {
  return turns.filter(t => t.speaker === 'you').length
}
