import { describe, it, expect, afterEach } from 'vitest'
import { recognizeOnce } from './listen'

const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }

afterEach(() => {
  delete w.SpeechRecognition
  delete w.webkitSpeechRecognition
})

describe('recognizeOnce', () => {
  it('resolves empty when the API is absent', async () => {
    await expect(recognizeOnce('en-US')).resolves.toBe('')
  })

  it('resolves empty instead of rejecting when construction throws', async () => {
    w.SpeechRecognition = function () { throw new Error('insecure context') }
    await expect(recognizeOnce('en-US')).resolves.toBe('')
  })

  it('resolves empty instead of rejecting when start throws', async () => {
    w.SpeechRecognition = function (this: Record<string, unknown>) {
      this.start = () => { throw new Error('no microphone') }
      this.abort = () => {}
    }
    await expect(recognizeOnce('en-US')).resolves.toBe('')
  })

  it('resolves the transcript when recognition succeeds', async () => {
    w.SpeechRecognition = function (this: Record<string, unknown>) {
      this.abort = () => {}
      this.start = () => {
        const self = this as { onresult?: (e: unknown) => void }
        self.onresult?.({ results: [[{ transcript: 'coffee' }]] })
      }
    }
    await expect(recognizeOnce('en-US')).resolves.toBe('coffee')
  })

  it('runs its cleanup once even when onend follows onresult', async () => {
    let abortCalls = 0
    w.SpeechRecognition = function (this: Record<string, unknown>) {
      this.abort = () => { abortCalls += 1 }
      this.start = () => {
        const self = this as { onresult?: (e: unknown) => void; onend?: () => void }
        self.onresult?.({ results: [[{ transcript: 'hello there' }]] })
        // onend always follows; without the settled guard this would run cleanup twice
        self.onend?.()
      }
    }
    await expect(recognizeOnce('en-US')).resolves.toBe('hello there')
    expect(abortCalls).toBe(1)
  })

  /**
   * The reported bug: Speak/Roleplay/Shadowing never recognise anything she
   * says in Spanish. `es-419` is the Spanish course's default accent — a
   * real BCP-47 tag, but a UN M.49 *region* code ("Latin America"), not a
   * country. It is a legitimate `speechSynthesis` voice tag (and already has
   * a fallback chain for that in `speak.ts`), but speech-recognition engines
   * key off concrete country locales (`es-MX`, `es-AR`, `es-ES`, …) and don't
   * recognise `es-419` as one — so recognition silently hears nothing, every
   * time, for anyone who has never changed the accent away from the default.
   */
  describe('accent -> recognition language', () => {
    function langUsed(accent: Parameters<typeof recognizeOnce>[0]): string | undefined {
      let seen: string | undefined
      w.SpeechRecognition = function (this: Record<string, unknown>) {
        this.abort = () => {}
        this.start = () => { seen = this.lang as string }
      }
      recognizeOnce(accent)
      return seen
    }

    it('requests a real country locale for es-419, not the region code itself', () => {
      expect(langUsed('es-419')).not.toBe('es-419')
    })

    it('leaves an already-concrete accent alone', () => {
      expect(langUsed('es-MX')).toBe('es-MX')
      expect(langUsed('en-US')).toBe('en-US')
      expect(langUsed('pl-PL')).toBe('pl-PL')
    })
  })
})
