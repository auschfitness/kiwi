import { useMemo, useState } from 'react'
import { Card, Button } from '../ui'
import { exampleWords, normalize } from '../../core/text'
import { shuffleWords } from '../../core/options'
import type { ModalityProps } from './types'

type Result = 'pending' | 'right' | 'wrong'

interface Token {
  id: string
  word: string
}

export function Build({ card, onAnswer }: ModalityProps) {
  const [placed, setPlaced] = useState<string[]>([])
  const [result, setResult] = useState<Result>('pending')
  const [answered, setAnswered] = useState(false)

  // Computed once per card so the shuffle doesn't reshuffle mid-interaction.
  const tokens = useMemo<Token[]>(() => {
    const words = exampleWords(card)
    return shuffleWords(words, Math.random).map((word, i) => ({ id: `${card.id}-${i}`, word }))
  }, [card.id])

  const target = useMemo(() => exampleWords(card).join(' '), [card.id])
  const tokensById = useMemo(() => new Map(tokens.map(t => [t.id, t] as const)), [tokens])
  const pool = tokens.filter(t => !placed.includes(t.id))

  function place(id: string) {
    if (result !== 'pending') return
    setPlaced(p => [...p, id])
  }

  function unplace(id: string) {
    if (result !== 'pending') return
    setPlaced(p => p.filter(x => x !== id))
  }

  function check() {
    const answerText = placed.map(id => tokensById.get(id)?.word ?? '').join(' ')
    setResult(normalize(answerText) === normalize(target) ? 'right' : 'wrong')
  }

  function finish(correct: boolean) {
    if (answered) return
    setAnswered(true)
    onAnswer(correct)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-lg font-bold text-ink">{card.examplePt}</p>
        <p className="text-sm text-muted">Put the English words in order.</p>
      </Card>

      <Card className="flex min-h-[64px] flex-wrap items-start gap-2">
        {placed.length === 0 && <p className="text-sm text-muted">Tap words below to build the sentence.</p>}
        {placed.map(id => {
          const token = tokensById.get(id)
          if (!token) return null
          return (
            <button
              key={id}
              type="button"
              onClick={() => unplace(id)}
              disabled={result !== 'pending'}
              className="min-h-[44px] rounded-xl border border-brand bg-card2 px-3 font-bold text-ink transition active:scale-[0.98] disabled:opacity-70"
            >
              {token.word}
            </button>
          )
        })}
      </Card>

      <div className="flex flex-wrap gap-2">
        {pool.map(token => (
          <button
            key={token.id}
            type="button"
            onClick={() => place(token.id)}
            disabled={result !== 'pending'}
            className="min-h-[44px] rounded-xl border border-line bg-card2 px-3 text-ink transition active:scale-[0.98] disabled:opacity-70"
          >
            {token.word}
          </button>
        ))}
      </div>

      {result === 'pending' ? (
        <Button variant="primary" onClick={check} disabled={pool.length > 0}>
          Check
        </Button>
      ) : (
        <>
          <Card className={result === 'right' ? 'text-center text-good font-bold' : 'text-center text-again font-bold'}>
            <p>{result === 'right' ? '✅ Correct!' : 'Not quite. The right order:'}</p>
            <p className="mt-1 font-normal text-ink">{target}</p>
          </Card>
          <Button variant="primary" onClick={() => finish(result === 'right')} disabled={answered}>
            Continue
          </Button>
        </>
      )}
    </div>
  )
}
