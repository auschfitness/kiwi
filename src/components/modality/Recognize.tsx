import { useState } from 'react'
import { Card, SpeakerButton, Button } from '../ui'
import { useStore } from '../../store/useStore'
import { stripTags } from '../../core/text'
import { RatingButtons } from './RatingButtons'
import type { Rating } from '../../types'
import type { ModalityProps } from './types'

export function Recognize({ card, onAnswer }: ModalityProps) {
  const showPortuguese = useStore(s => s.showPortuguese)
  const [revealed, setRevealed] = useState(false)
  const [answered, setAnswered] = useState(false)

  function finish(rating: Rating) {
    if (answered) return
    setAnswered(true)
    onAnswer(rating)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <h2 className="text-3xl font-extrabold text-ink">{card.en}</h2>
          <SpeakerButton text={card.en} />
        </div>
      </Card>

      {revealed && (
        <Card className="flex flex-col gap-1">
          {showPortuguese && <p className="text-lg text-ink">{card.pt}</p>}
          <p className="text-ink">{stripTags(card.exampleHtml)}</p>
          {showPortuguese && <p className="text-sm text-muted">{card.examplePt}</p>}
        </Card>
      )}

      {!revealed ? (
        <Button variant="ghost" onClick={() => setRevealed(true)}>
          Show meaning
        </Button>
      ) : (
        // Nothing was checked here, so nothing is suggested: on this screen the
        // four ratings *are* the answer.
        <RatingButtons cardId={card.id} onRate={finish} disabled={answered} />
      )}
    </div>
  )
}
