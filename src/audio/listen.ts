import type { Accent } from '../types'
import { speechRecognitionAvailable } from './capabilities'

type RecognitionCtor = new () => {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function ctor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Resolves with the transcript, or '' on error, silence or timeout.
 * It never rejects — a broken microphone must not break a study session.
 */
export function recognizeOnce(accent: Accent, timeoutMs = 6000): Promise<string> {
  if (!speechRecognitionAvailable()) return Promise.resolve('')
  const Ctor = ctor()
  if (!Ctor) return Promise.resolve('')

  return new Promise<string>(resolve => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let rec: InstanceType<RecognitionCtor> | undefined

    const finish = (value: string) => {
      if (settled) return
      settled = true
      if (timer !== undefined) clearTimeout(timer)
      try { rec?.abort() } catch { /* already stopped */ }
      resolve(value)
    }

    try {
      rec = new Ctor()
      rec.lang = accent
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.continuous = false
      rec.onresult = e => finish(e.results?.[0]?.[0]?.transcript ?? '')
      rec.onerror = () => finish('')
      rec.onend = () => finish('')
      timer = setTimeout(() => finish(''), timeoutMs)
      rec.start()
    } catch {
      finish('')
    }
  })
}
