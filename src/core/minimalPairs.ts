/**
 * Minimal-pair ear training — the quiz engine.
 *
 * A new file rather than another mode inside `drills.ts`: a drill there is a
 * generated utterance you type digits back at (`DrillItem.accept`), and this
 * is an authored two-way discrimination you tap. Nothing but the injected-rand
 * habit is shared, and `drills.ts` is long enough already.
 *
 * Pure like the rest of `core/`: the pair table lives in
 * `src/content/authored/minimalPairs.ts` and the screen hands it in, so this
 * module never imports content, and randomness always arrives as a parameter
 * (the rule every core/ module keeps) so a seeded test gets the same round every time.
 */

/**
 * The part of a pair the engine needs. The authored table adds the teaching
 * metadata on top of this — see `MinimalPair` in the content folder.
 */
export interface EarPair {
  /** First word of the pair, e.g. "pen". */
  a: string
  /** Second word, e.g. "pin". */
  b: string
  /** One line of teaching, shown in Compare and after every quiz answer. */
  note: string
  /**
   * True when the two words genuinely are one sound in the accent this table
   * teaches (e.g. the American flap-t merges: latter/ladder). Those pairs are
   * teaching material and never quiz material: there is no right answer to
   * grade, and asking her to hear a difference that does not exist would only
   * teach her to distrust her own ear.
   */
  merged?: boolean
}

/** Which word of a pair is meant: the first or the second. */
export type Side = 'a' | 'b'

export interface EarQuestion<T extends EarPair = EarPair> {
  pair: T
  /** The side actually played. She has to pick this one back. */
  side: Side
}

export const EAR_SESSION_LENGTH = 10

export function wordOf(pair: EarPair, side: Side): string {
  return side === 'a' ? pair.a : pair.b
}

/** The word the app speaks for a question. */
export function spokenWord<T extends EarPair>(q: EarQuestion<T>): string {
  return wordOf(q.pair, q.side)
}

/** Every pair a quiz is allowed to grade: everything not genuinely merged. */
export function quizzablePairs<T extends EarPair>(pairs: readonly T[]): T[] {
  return pairs.filter(p => p.merged !== true)
}

function shuffle<T>(items: readonly T[], rand: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/** One question drawn straight from the pool — used on its own by tests. */
export function pickEarQuestion<T extends EarPair>(
  pairs: readonly T[],
  rand: () => number,
): EarQuestion<T> | null {
  const pool = quizzablePairs(pairs)
  if (pool.length === 0) return null
  const pair = pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))]
  return { pair, side: rand() < 0.5 ? 'a' : 'b' }
}

/**
 * A whole round. Deals from a shuffled bag instead of picking each item
 * independently, so ten questions are ten different pairs rather than the same
 * one three times. If the pool is smaller than the round, the bag is reshuffled
 * and dealt again.
 */
export function buildEarSession<T extends EarPair>(
  pairs: readonly T[],
  rand: () => number,
  count: number = EAR_SESSION_LENGTH,
): EarQuestion<T>[] {
  const pool = quizzablePairs(pairs)
  if (pool.length === 0 || count <= 0) return []

  const out: EarQuestion<T>[] = []
  let bag: T[] = []
  while (out.length < count) {
    if (bag.length === 0) bag = shuffle(pool, rand)
    const pair = bag.pop() as T
    out.push({ pair, side: rand() < 0.5 ? 'a' : 'b' })
  }
  return out
}

/** True when she tapped the word that was actually said. */
export function isEarAnswerCorrect<T extends EarPair>(q: EarQuestion<T>, chosen: Side): boolean {
  return chosen === q.side
}
