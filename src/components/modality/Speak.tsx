import { useState } from 'react'
import { Card, SpeakerButton, Button } from '../ui'
import { useStore } from '../../store/useStore'
import { recognizeOnce } from '../../audio/listen'
import { judgePronunciation } from '../../core/pronunciation'
import type { ModalityProps } from './types'

type Phase = 'ready' | 'listening' | 'result'

/**
 * A broken or absent microphone must never cost her a card: recognizeOnce
 * never rejects, and an empty transcript always renders the friendly retry
 * copy plus a Skip that grades the attempt as correct rather than wrong.
 */
export function Speak({ card, onAnswer }: ModalityProps) {
  const showPortuguese = useStore(s => s.showPortuguese)
  const accent = useStore(s => s.accent)
  const [phase, setPhase] = useState<Phase>('ready')
  const [heard, setHeard] = useState('')
  const [answered, setAnswered] = useState(false)

  const judgement = phase === 'result' ? judgePronunciation(heard, card.en) : null
  const micFailed = phase === 'result' && heard.trim().length === 0

  async function record() {
    setPhase('listening')
    const transcript = await recognizeOnce(accent)
    setHeard(transcript)
    setPhase('result')
  }

  function finish(correct: boolean) {
    if (answered) return
    setAnswered(true)
    onAnswer(correct)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-extrabold text-ink">{card.en}</h2>
          <SpeakerButton text={card.en} />
        </div>
        {card.phonetic && <p className="text-muted">/{card.phonetic}/</p>}
        {showPortuguese && <p className="text-lg text-muted">{card.pt}</p>}
        <p className="text-sm text-muted">Say it out loud, then tap the mic.</p>
      </Card>

      <button
        type="button"
        aria-label="Record your voice"
        onClick={record}
        disabled={phase === 'listening'}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-line bg-card2 text-lg font-bold text-ink transition active:scale-[0.98] disabled:opacity-70"
      >
        <span aria-hidden="true">🎤</span>
        {phase === 'listening' ? 'Listening…' : 'Record your voice'}
      </button>

      {judgement && (
        <>
          <Card className={micFailed ? 'text-center font-bold text-ink' : judgement.ok ? 'text-center font-bold text-good' : 'text-center font-bold text-again'}>
            <p>{judgement.message}</p>
          </Card>
          {micFailed ? (
            <Button variant="primary" onClick={() => finish(true)} disabled={answered}>
              Skip this one
            </Button>
          ) : (
            <Button variant="primary" onClick={() => finish(judgement.ok)} disabled={answered}>
              Continue
            </Button>
          )}
        </>
      )}
    </div>
  )
}
