import { useEffect, useState } from 'react'
import { Card, SpeakerButton, Button } from '../ui'
import { useStore } from '../../store/useStore'
import { stripTags } from '../../core/text'
import { speak } from '../../audio/speak'
import type { ModalityProps } from './types'

export function Learn({ card, onAnswer }: ModalityProps) {
  const showPortuguese = useStore(s => s.showPortuguese)
  const autoPlayAudio = useStore(s => s.autoPlayAudio)
  const accent = useStore(s => s.accent)
  const [answered, setAnswered] = useState(false)

  useEffect(() => {
    if (!autoPlayAudio) return
    speak(card.en, accent)
  }, [card.en, accent, autoPlayAudio])

  // Teaching, not testing: there is nothing to rate yet, so the single button
  // reports a plain "good" and the four ratings stay off this screen.
  function finish() {
    if (answered) return
    setAnswered(true)
    onAnswer(2)
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
      </Card>

      <Card className="flex flex-col gap-1">
        <p className="text-ink">{stripTags(card.exampleHtml)}</p>
        {showPortuguese && <p className="text-sm text-muted">{card.examplePt}</p>}
      </Card>

      <Button variant="primary" onClick={finish} disabled={answered}>
        Got it 👍
      </Button>
    </div>
  )
}
