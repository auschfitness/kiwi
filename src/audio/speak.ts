import type { Accent } from '../types'
import { speechSynthesisAvailable } from './capabilities'
import { speakable, clampRate, DEFAULT_RATE } from '../core/speech'

const FALLBACKS: Accent[] = ['en-US', 'en-NZ', 'en-AU', 'en-GB']

// Module-level default so this file never has to import the Zustand store
// (the store imports content and core; importing it back from here would be
// a cycle). App.tsx keeps this in sync with her `speechRate` preference via
// an effect. Clamped so a corrupt persisted value can never make speech too
// fast to follow or too slow to be speech at all.
let defaultRate = DEFAULT_RATE

/** Sets the rate every future `speak()` call uses when it isn't given one explicitly. */
export function setDefaultRate(rate: number): void {
  defaultRate = clampRate(rate)
}

function byLang(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  return voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
}

/** Exact accent, then US → NZ → AU → GB, then any English voice, then null. */
export function pickVoice(voices: SpeechSynthesisVoice[], accent: Accent): SpeechSynthesisVoice | null {
  const exact = byLang(voices, accent)
  if (exact) return exact
  for (const lang of FALLBACKS) {
    const hit = byLang(voices, lang)
    if (hit) return hit
  }
  return voices.find(v => v.lang.toLowerCase().startsWith('en')) ?? null
}

let warmed = false

/** iOS refuses to speak unless synthesis was first triggered inside a user gesture. */
export function warmUp(): void {
  if (warmed || !speechSynthesisAvailable()) return
  warmed = true
  const u = new SpeechSynthesisUtterance('')
  u.volume = 0
  window.speechSynthesis.speak(u)
}

export function cancelSpeech(): void {
  if (speechSynthesisAvailable()) window.speechSynthesis.cancel()
}

/**
 * `onEnd` fires when this utterance stops — finished, errored, or cancelled by
 * the next `speak()`. Callers that chain lines need the real signal: estimating
 * how long a line takes and moving on by timer means every underestimate cuts
 * the line off mid-word, because the next `speak()` cancels it. Dialogues did
 * exactly that and it was audible.
 *
 * Cancellation counts as an end on purpose — a caller waiting on this must not
 * hang when its audio is stopped. Chaining callers guard with their own token.
 */
export function speak(
  text: string,
  accent: Accent,
  opts: { rate?: number; onEnd?: () => void } = {},
): void {
  // A caller that cannot be spoken for still has to be told, or a chain that
  // waits on `onEnd` stalls on the one line synthesis refused.
  if (!speechSynthesisAvailable() || !text.trim()) {
    opts.onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  // Written for the eye, spoken for the ear: arrows and spaced slashes become
  // the pause they look like. See src/core/speech.ts.
  const u = new SpeechSynthesisUtterance(speakable(text))
  const voice = pickVoice(window.speechSynthesis.getVoices(), accent)
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? accent
  u.rate = clampRate(opts.rate ?? defaultRate)
  u.pitch = 1
  if (opts.onEnd) {
    let done = false
    // onerror as well as onend: a voice that fails to load fires only the
    // former, and a chain waiting on the latter alone would stop dead there.
    const finish = () => {
      if (done) return
      done = true
      opts.onEnd!()
    }
    u.onend = finish
    u.onerror = finish
  }
  window.speechSynthesis.speak(u)
}
