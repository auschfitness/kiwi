import { useState } from 'react'
import type { FormEvent } from 'react'
import { Card, Button } from '../ui'
import { clozeExample, looseMatch } from '../../core/text'
import type { ModalityProps } from './types'

type Result = 'pending' | 'right' | 'wrong'

export function Type({ card, onAnswer }: ModalityProps) {
  const [value, setValue] = useState('')
  const [result, setResult] = useState<Result>('pending')
  const [answered, setAnswered] = useState(false)

  const check = () => {
    setResult(looseMatch(value, card.en) ? 'right' : 'wrong')
  }

  function finish(correct: boolean) {
    if (answered) return
    setAnswered(true)
    onAnswer(correct)
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    check()
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-2xl font-extrabold text-ink">{card.pt}</p>
        <p className="text-muted">{clozeExample(card)}</p>
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
            aria-label="Type the English word"
            className="min-h-[44px] w-full rounded-2xl border border-line bg-card2 px-4 text-ink"
          />
          <Button type="submit" variant="primary">
            Check
          </Button>
        </form>
      ) : (
        <>
          <Card className={result === 'right' ? 'text-center text-good font-bold' : 'text-center text-again font-bold'}>
            {result === 'right' ? (
              <p>✅ Correct!</p>
            ) : (
              <p>
                Not quite. The answer is <span className="text-ink">{card.en}</span>
              </p>
            )}
          </Card>
          <Button variant="primary" onClick={() => finish(result === 'right')} disabled={answered}>
            Continue
          </Button>
        </>
      )}
    </div>
  )
}
