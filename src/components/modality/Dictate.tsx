import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Card, Button, SpeakerButton } from '../ui'
import { useStore } from '../../store/useStore'
import { stripTags, looseMatch } from '../../core/text'
import { speak } from '../../audio/speak'
import type { ModalityProps } from './types'

type Result = 'pending' | 'right' | 'wrong'

export function Dictate({ card, onAnswer }: ModalityProps) {
  const accent = useStore(s => s.accent)
  const speechRate = useStore(s => s.speechRate)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<Result>('pending')
  const [answered, setAnswered] = useState(false)

  const plain = useMemo(() => stripTags(card.exampleHtml), [card.exampleHtml])

  useEffect(() => {
    speak(plain, accent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id])

  function check() {
    setResult(looseMatch(value, plain) ? 'right' : 'wrong')
  }

  function finish(correct: boolean) {
    if (answered) return
    setAnswered(true)
    onAnswer(correct)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    check()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-3">
          <SpeakerButton text={plain} />
          <button
            type="button"
            onClick={() => speak(plain, accent, { rate: Math.max(0.5, speechRate * 0.75) })}
            aria-label="Play slowly"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-card2 px-4 text-sm font-bold text-ink transition active:scale-[0.98]"
          >
            <span aria-hidden="true">🐢</span> Slow
          </button>
        </div>
        <p className="text-sm text-muted">Listen, then type the sentence you hear.</p>
      </Card>

      {result === 'pending' ? (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type the sentence you hear"
            className="min-h-[44px] w-full rounded-2xl border border-line bg-card2 px-4 text-ink"
          />
          <Button type="submit" variant="primary">
            Check
          </Button>
        </form>
      ) : (
        <>
          <Card className={result === 'right' ? 'text-center text-good font-bold' : 'text-center text-again font-bold'}>
            <p>{result === 'right' ? '✅ Correct!' : 'Not quite.'}</p>
            <p className="mt-1 font-normal text-ink">{plain}</p>
          </Card>
          <Button variant="primary" onClick={() => finish(result === 'right')} disabled={answered}>
            Continue
          </Button>
        </>
      )}
    </div>
  )
}
