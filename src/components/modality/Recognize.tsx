import { useState } from 'react'
import { Card, SpeakerButton, Button } from '../ui'
import { useStore } from '../../store/useStore'
import { stripTags } from '../../core/text'
import type { ModalityProps } from './types'

export function Recognize({ card, onAnswer }: ModalityProps) {
  const showPortuguese = useStore(s => s.showPortuguese)
  const [revealed, setRevealed] = useState(false)
  const [answered, setAnswered] = useState(false)

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
        <div className="flex gap-3">
          <Button variant="again" onClick={() => finish(false)} disabled={answered}>
            ❌ Didn't
          </Button>
          <Button variant="good" onClick={() => finish(true)} disabled={answered}>
            ✅ Knew it
          </Button>
        </div>
      )}
    </div>
  )
}
