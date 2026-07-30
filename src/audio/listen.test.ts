import { describe, it, expect, afterEach } from 'vitest'
import { recognizeOnce } from './listen'

const w = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }

afterEach(() => {
  delete w.SpeechRecognition
  delete w.webkitSpeechRecognition
})

describe('recognizeOnce', () => {
  it('resolves empty when the API is absent', async () => {
    await expect(recognizeOnce('en-NZ')).resolves.toBe('')
  })

  it('resolves empty instead of rejecting when construction throws', async () => {
    w.SpeechRecognition = function () { throw new Error('insecure context') }
    await expect(recognizeOnce('en-NZ')).resolves.toBe('')
  })

  it('resolves empty instead of rejecting when start throws', async () => {
    w.SpeechRecognition = function (this: Record<string, unknown>) {
      this.start = () => { throw new Error('no microphone') }
      this.abort = () => {}
    }
    await expect(recognizeOnce('en-NZ')).resolves.toBe('')
  })

  it('resolves the transcript when recognition succeeds', async () => {
    w.SpeechRecognition = function (this: Record<string, unknown>) {
      this.abort = () => {}
      this.start = () => {
        const self = this as { onresult?: (e: unknown) => void }
        self.onresult?.({ results: [[{ transcript: 'flat white' }]] })
      }
    }
    await expect(recognizeOnce('en-NZ')).resolves.toBe('flat white')
  })

  it('resolves only once even when onend follows onresult', async () => {
    w.SpeechRecognition = function (this: Record<string, unknown>) {
      this.abort = () => {}
      this.start = () => {
        const self = this as { onresult?: (e: unknown) => void; onend?: () => void }
        self.onresult?.({ results: [[{ transcript: 'kia ora' }]] })
        self.onend?.()
      }
    }
    await expect(recognizeOnce('en-NZ')).resolves.toBe('kia ora')
  })
})
