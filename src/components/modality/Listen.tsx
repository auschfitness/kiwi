import { useEffect, useMemo, useState } from 'react'
import { Card, SpeakerButton, Button } from '../ui'
import { useStore } from '../../store/useStore'
import { buildChoices } from '../../core/options'
import { ALL_CARDS } from '../../content'
import { speak } from '../../audio/speak'
import { RatingButtons } from './RatingButtons'
import type { Rating } from '../../types'
import type { ModalityProps } from './types'

export function Listen({ card, onAnswer }: ModalityProps) {
  const showPortuguese = useStore(s => s.showPortuguese)
  const accent = useStore(s => s.accent)
  const [picked, setPicked] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)

  // Hearing the word is the exercise, so it always plays on mount — never gated
  // on the autoPlayAudio preference.
  useEffect(() => {
    speak(card.en, accent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  // Computed once per card so the options don't reshuffle mid-interaction.
  const options = useMemo(
    () => buildChoices(card.en, ALL_CARDS.map(c => c.en), Math.random),
    [card.id],
  )

  function choose(option: string) {
    if (picked) return
    setPicked(option)
  }

  function finish(rating: Rating) {
    if (answered) return
    setAnswered(true)
    onAnswer(rating)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 text-center">
        <SpeakerButton text={card.en} />
        <p className="text-sm text-muted">Listen, then choose the word you hear.</p>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {options.map(option => {
          const isAnswer = option === card.en
          const showState = picked !== null && (isAnswer || option === picked)
          return (
            <Button
              key={option}
              variant={showState ? (isAnswer ? 'good' : 'again') : 'ghost'}
              onClick={() => choose(option)}
              disabled={picked !== null}
            >
              {/* Correct/incorrect must never be colour-only: the tick/cross
                  is visible to everyone (including colour-blind readers),
                  and the sr-only text carries the same distinction to a
                  screen reader, whose users get no benefit from the variant
                  colour at all. */}
              {showState && (
                <span aria-hidden="true">{isAnswer ? '✅ ' : '❌ '}</span>
              )}
              {option}
              {showState && (
                <span className="sr-only">
                  {isAnswer ? ' — correct answer' : ' — your answer, incorrect'}
                </span>
              )}
            </Button>
          )
        })}
      </div>

      {picked && (
        <>
          <Card className="flex flex-col items-center gap-1 text-center">
            <p className="text-xl font-extrabold text-ink">{card.en}</p>
            {showPortuguese && <p className="text-muted">{card.pt}</p>}
          </Card>
          <RatingButtons
            cardId={card.id}
            onRate={finish}
            disabled={answered}
            suggested={picked === card.en ? 2 : 0}
          />
        </>
      )}
    </div>
  )
}
