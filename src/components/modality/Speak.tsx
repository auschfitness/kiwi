import { useState } from 'react'
import { Card, SpeakerButton, Button } from '../ui'
import { ACTIVE_COURSE } from '../../courses'
import { useStore } from '../../store/useStore'
import { recognizeOnce } from '../../audio/listen'
import { judgePronunciation } from '../../core/pronunciation'
import { RatingButtons } from './RatingButtons'
import type { Rating } from '../../types'
import type { ModalityProps } from './types'

type Phase = 'ready' | 'listening' | 'result'

/**
 * A broken or absent microphone must never cost her a card — and must never
 * win her one either. recognizeOnce never rejects, and an empty transcript
 * renders the friendly retry copy plus a Skip that leaves the card ungraded
 * (onSkip), so a denied mic can neither mark her wrong nor quietly schedule
 * a review she never did. Without onSkip there is no skip button at all: she
 * can record again, but she cannot buy progress with a broken microphone.
 */
export function Speak({ card, onAnswer, onSkip }: ModalityProps) {
  const showPortuguese = useStore(s => s.showPortuguese)
  const produce = ACTIVE_COURSE.speakDirection === 'produce'
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

  function finish(rating: Rating) {
    if (answered) return
    setAnswered(true)
    onAnswer(rating)
  }

  // Same one-shot guard as finish(), so a double-tap can't advance two items.
  function skip() {
    if (answered || !onSkip) return
    setAnswered(true)
    onSkip()
  }

  return (
    <div className="flex flex-col gap-4">
      {/*
        * Two exercises wearing one screen, because the two learners need
        * opposite things from speaking.
        *
        * `repeat` shows the word and asks her to say it — she is practising
        * the sounds of something she has just met, and hiding it would make
        * this a memory test instead of a pronunciation one.
        *
        * `produce` shows only the Portuguese. He can already read Spanish
        * aloud; what he cannot do is retrieve the word unprompted, so putting
        * it on screen would remove the entire difficulty. The Spanish appears
        * afterwards, with the recording, as the answer.
        */}
      <Card className="flex flex-col items-center gap-3 text-center">
        {produce ? (
          <>
            <h2 className="text-3xl font-extrabold text-ink">{card.pt}</h2>
            <p className="text-sm text-muted">Diga em voz alta, depois toque no microfone.</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <h2 className="text-3xl font-extrabold text-ink">{card.en}</h2>
              <SpeakerButton text={card.en} />
            </div>
            {card.phonetic && <p className="text-muted">/{card.phonetic}/</p>}
            {showPortuguese && <p className="text-lg text-muted">{card.pt}</p>}
            <p className="text-sm text-muted">Say it out loud, then tap the mic.</p>
          </>
        )}
      </Card>

      <button
        type="button"
        onClick={record}
        disabled={phase === 'listening'}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-line bg-card2 text-lg font-bold text-ink transition active:scale-[0.98] disabled:opacity-70"
      >
        <span aria-hidden="true">🎤</span>
        {phase === 'listening' ? 'Listening…' : 'Record your voice'}
      </button>

      {judgement && (
        <>
          {/* In produce mode the target was never on screen, so this is the
            * first sight of the answer — and the whole lesson. Without it he
            * would be told he got it wrong and never shown what right was. */}
          {produce && (
            <Card className="flex flex-col items-center gap-2 text-center">
              <div className="flex items-center gap-3">
                <p className="text-2xl font-extrabold text-ink">{card.en}</p>
                <SpeakerButton text={card.en} />
              </div>
            </Card>
          )}
          <Card className={micFailed ? 'text-center font-bold text-ink' : judgement.ok ? 'text-center font-bold text-good' : 'text-center font-bold text-again'}>
            <p>{judgement.message}</p>
          </Card>
          {micFailed ? (
            onSkip && (
              <Button variant="primary" onClick={skip} disabled={answered}>
                Skip this one
              </Button>
            )
          ) : (
            // Only reachable when the mic actually heard something: the
            // micFailed branch above never renders a rating at all, so a dead
            // microphone still cannot reach the store.
            <RatingButtons
              cardId={card.id}
              onRate={finish}
              disabled={answered}
              suggested={judgement.ok ? 2 : 0}
            />
          )}
        </>
      )}
    </div>
  )
}
