import type { Accent } from '../types'
import { speechRecognitionAvailable } from './capabilities'

/**
 * `Accent` includes `es-419` — a real BCP-47 tag, but a UN M.49 *region*
 * code ("Latin America"), not a country. `speechSynthesis` voices are
 * sometimes tagged with it (and `speak.ts` already falls back through a
 * chain of concrete accents when a device has no such voice), but speech
 * *recognition* engines are keyed to concrete country locales — there is no
 * "es-419 recognizer" to fall back from, so a browser asked to recognise
 * `es-419` just hears nothing, silently, every time. `es-419` is also
 * `ES_LATAM.defaultAccent` (`src/courses/index.ts`), so this was not a rare
 * misconfiguration: it was the experience of anyone who never changed the
 * Spanish course's accent away from its default.
 *
 * The fix is narrow on purpose: translate only the one accent that isn't
 * already a real country locale. Every other `Accent` value is a concrete
 * BCP-47 country tag a recognition engine can be asked for directly.
 */
const RECOGNITION_LANG: Partial<Record<Accent, Accent>> = {
  'es-419': 'es-MX',
}

function recognitionLang(accent: Accent): Accent {
  return RECOGNITION_LANG[accent] ?? accent
}

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
      rec.lang = recognitionLang(accent)
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
