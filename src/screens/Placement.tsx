import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Card as CardModel, CardState, Level } from '../types'
import { buildPlacementTest, scorePlacement, seedKnownCards } from '../core/placement'
import type { PlacementQuestion } from '../core/placement'
import { looseMatch } from '../core/text'
import { DECKS } from '../content'
import { useStore } from '../store/useStore'
import { Button, Card, Meter } from '../components/ui'

export interface PlacementProps {
  onDone: () => void
}

const LEVEL_NAMES: Record<Level, string> = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' }

/** Group every deck's cards by CEFR band, the shape buildPlacementTest wants. */
function groupCardsByLevel(): Record<Level, CardModel[]> {
  const out: Record<Level, CardModel[]> = { 1: [], 2: [], 3: [], 4: [] }
  for (const deck of DECKS) out[deck.level].push(...deck.cards)
  return out
}

/**
 * One-time CEFR placement test, taken right after she gives her name. No
 * feedback per question — this decides her starting level, it isn't practice.
 *
 * The question count is whatever buildPlacementTest actually produced (today
 * 15, since level-4 content doesn't exist until Task 22 and an empty band
 * contributes zero questions) — never a hardcoded number.
 */
export function Placement({ onDone }: PlacementProps) {
  const finishPlacement = useStore(s => s.finishPlacement)

  const [questions] = useState<PlacementQuestion[]>(() =>
    buildPlacementTest(groupCardsByLevel(), Math.random),
  )
  const answersRef = useRef<Record<string, boolean>>({})
  const [index, setIndex] = useState(0)
  const [typedValue, setTypedValue] = useState('')
  const [answered, setAnswered] = useState(false)
  // Held locally until Continue is tapped: computing this does NOT write to
  // the store. If it did, App.tsx (which routes on the store's `placed`
  // flag) would stop rendering Placement the instant this state updates,
  // before this component ever got to show its own result screen.
  const [result, setResult] = useState<{
    startLevel: Level
    seeded: Record<string, CardState>
    now: number
  } | null>(null)
  // Guards the Continue button the same way `answered` guards each question:
  // a second tap (e.g. a double-click landing before the store update
  // unmounts this screen) must not call finishPlacement twice.
  const submittedRef = useRef(false)

  const question = questions[index]

  function finish(correct: boolean) {
    if (answered || !question) return
    setAnswered(true)
    answersRef.current[question.id] = correct

    if (index + 1 < questions.length) {
      setIndex(i => i + 1)
      setTypedValue('')
      setAnswered(false)
      return
    }

    const now = Date.now()
    const { startLevel: placedLevel } = scorePlacement(questions, answersRef.current)
    // Only decks strictly below the placed level get seeded — cards at
    // startLevel itself stay brand new so she learns them properly.
    const belowIds = DECKS
      .filter(d => d.level < placedLevel)
      .flatMap(d => d.cards.map(c => c.id))
    const seeded = seedKnownCards(belowIds, now, Math.random)
    setResult({ startLevel: placedLevel, seeded, now })
  }

  function handleTypedSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!question) return
    finish(looseMatch(typedValue, question.answer))
  }

  // The store write and the App-level navigation it causes (App routes on
  // `placed`) now happen together, on Continue — so nothing can render
  // between them and steal this screen before she sees her result.
  function handleContinue() {
    if (submittedRef.current || !result) return
    submittedRef.current = true
    finishPlacement(result.startLevel, result.seeded, result.now)
    onDone()
  }

  if (result !== null) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16 text-center">
        <p className="text-2xl">🥝</p>
        <p className="text-xl font-extrabold text-ink">
          You're at {LEVEL_NAMES[result.startLevel]} — let's build from here 🥝
        </p>
        <Button variant="primary" onClick={handleContinue}>
          Continue
        </Button>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="flex flex-col gap-4 pt-4">
      <Meter
        value={index / questions.length}
        label={`Question ${index + 1} of ${questions.length}`}
      />

      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-2xl font-extrabold text-ink">{question.prompt}</p>
      </Card>

      {question.kind === 'choice' ? (
        <div className="flex flex-col gap-3">
          {question.options?.map(option => (
            <Button
              key={option}
              variant="ghost"
              data-testid="placement-option"
              onClick={() => finish(option === question.answer)}
              disabled={answered}
            >
              {option}
            </Button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleTypedSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            value={typedValue}
            onChange={e => setTypedValue(e.target.value)}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Type the English word"
            disabled={answered}
            className="min-h-[44px] w-full rounded-2xl border border-line bg-card2 px-4 text-ink"
          />
          <Button type="submit" variant="primary" disabled={answered}>
            {index + 1 < questions.length ? 'Next' : 'Finish'}
          </Button>
        </form>
      )}
    </div>
  )
}
