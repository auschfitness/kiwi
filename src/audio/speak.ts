import type { Accent } from '../types'
import { speechSynthesisAvailable } from './capabilities'

const FALLBACKS: Accent[] = ['en-NZ', 'en-AU', 'en-GB', 'en-US']

function byLang(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  return voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
}

/** Exact accent, then NZ → AU → GB → US, then any English voice, then null. */
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

export function speak(text: string, accent: Accent, opts: { rate?: number } = {}): void {
  if (!speechSynthesisAvailable() || !text.trim()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(window.speechSynthesis.getVoices(), accent)
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? accent
  u.rate = opts.rate ?? 0.95
  u.pitch = 1
  window.speechSynthesis.speak(u)
}
