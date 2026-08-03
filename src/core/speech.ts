/**
 * Turning written card text into text a synthesiser reads the way she reads it.
 *
 * Cards are written for the eye: "be → was / were" is three forms to a reader,
 * because the arrow and the slash are visual separators. Speech synthesis gives
 * neither of them any pause at all, so it arrives as one breathless run and the
 * three forms blur into each other — exactly the complaint that produced this
 * file.
 *
 * A full stop is what buys the pause. `src/core/drills.ts` already leans on the
 * same trick for spelled-out words ("A. U. C. K. L. A. N. D."), for the same
 * reason and with the same fix.
 */

export const MIN_RATE = 0.5
export const MAX_RATE = 1.2
/** Today's speed, and the answer whenever the rate on hand is not a number. */
export const DEFAULT_RATE = 0.95

/**
 * A usable rate, whatever arrives.
 *
 * The type says `number`, and at every call site it is one — but the value
 * behind it has travelled through localStorage and through a JSON snapshot
 * written by an older build that had no `speechRate` at all. `undefined` there
 * makes `Math.max` return NaN, and `SpeechSynthesisUtterance.rate` is a WebIDL
 * *restricted* float: assigning NaN throws a TypeError. That throw would come
 * out of an effect and an onClick with no error boundary above either, and
 * every sound in the app would stop.
 */
export function clampRate(rate: number): number {
  if (!Number.isFinite(rate)) return DEFAULT_RATE
  return Math.min(MAX_RATE, Math.max(MIN_RATE, rate))
}

/**
 * How much slower the turtle button is than whatever speed she has chosen.
 *
 * Relative rather than a fixed number, so it stays *slower than her normal*
 * whichever of the three speech speeds she is on. The Drills screen had this
 * first, with these exact two numbers written locally; it is here now so there
 * is one definition of "slower" in the app.
 */
const SLOW_FACTOR = 0.6

/** The deliberate-listening speed: her chosen rate, meaningfully slowed. */
export function slowRateFor(rate: number): number {
  return clampRate(clampRate(rate) * SLOW_FACTOR)
}

/** Separators that are punctuation to the eye and silence to a synthesiser. */
const SEPARATORS = /\s*→\s*|\s+\/\s+/g

/**
 * The spoken form of written card text.
 *
 * Note the slash rule requires surrounding whitespace. "was / were" is two
 * alternatives; "5/3" is one date and "and/or" is one word, and splitting
 * either would read out something she never wrote.
 */
export function speakable(text: string): string {
  const withPauses = text.replace(SEPARATORS, '. ')
  return withPauses
    // A separator following existing punctuation would otherwise leave ".. ".
    .replace(/([.!?])\s*\.\s+/g, '$1 ')
    .replace(/\s+/g, ' ')
    .trim()
}
