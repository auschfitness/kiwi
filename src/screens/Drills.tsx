import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Card, Chip, Meter, ScreenHeader, SpeakerButton } from '../components/ui'
import { useStore } from '../store/useStore'
import { speak } from '../audio/speak'
import { speechSynthesisAvailable } from '../audio/capabilities'
import { ALL_CARDS } from '../content'
import { SESSION_LENGTH, buildDrillSession, checkDrillAnswer } from '../core/drills'
import type { DrillItem, DrillKind, DrillMode } from '../core/drills'

export interface DrillsProps {
  onBack: () => void
}

interface DrillOption {
  mode: DrillMode
  emoji: string
  title: string
  desc: string
}

const OPTIONS: DrillOption[] = [
  { mode: 'number', emoji: '🔢', title: 'Numbers', desc: 'Hear a number, write the digits.' },
  { mode: 'price', emoji: '💵', title: 'Prices', desc: '"Three dollars fifty" — and just "three fifty".' },
  { mode: 'time', emoji: '🕝', title: 'Times', desc: '"Half past two" and "fourteen thirty".' },
  { mode: 'date', emoji: '📅', title: 'Dates', desc: 'Day first here: 5/3 is the 5th of March.' },
  { mode: 'phone', emoji: '📞', title: 'Phone numbers', desc: 'Catch the digits down the phone.' },
  { mode: 'quantity', emoji: '⚖️', title: 'Amounts', desc: 'Grams, a dozen, a fortnight.' },
  { mode: 'spelling', emoji: '🔤', title: 'Spelling', desc: 'Someone spells a name, letter by letter.' },
  { mode: 'mixed', emoji: '🎲', title: 'Mixed', desc: 'A bit of everything, like real life.' },
]

/** She is on a phone: a price drill should open the number pad, not the alphabet. */
const NUMERIC_KINDS: ReadonlySet<DrillKind> = new Set<DrillKind>(['number', 'price', 'time', 'date', 'phone'])

/**
 * Short plain-letter words from the decks, for the spelling drill. Pulled here
 * rather than inside `core/drills.ts` so that module stays free of content
 * imports and stays trivially testable.
 */
const SPELLING_WORDS: string[] = ALL_CARDS
  .map(c => c.en)
  .filter(en => /^[A-Za-z]+$/.test(en) && en.length >= 4 && en.length <= 9)

function answerLabel(item: DrillItem): string {
  return item.kind === 'price' ? `$${item.accept[0]}` : item.accept[0]
}

function warmLine(correct: number, total: number): string {
  const ratio = total === 0 ? 0 : correct / total
  if (ratio >= 0.9) return 'Sweet as — almost nothing got past you. 🥝'
  if (ratio >= 0.6) return 'Good going. A few more rounds and these stop being fast.'
  return 'These go by quickly, eh. This is exactly the practice that pays off at the till.'
}

type Result = 'pending' | 'right' | 'wrong'

interface RunnerProps {
  mode: DrillMode
  title: string
  onQuit: () => void
  onAgain: () => void
}

function DrillRunner({ mode, title, onQuit, onAgain }: RunnerProps) {
  const accent = useStore(s => s.accent)
  const recordListeningPractice = useStore(s => s.recordListeningPractice)

  // Built once per mounted runner. "Play again" remounts this component with a
  // fresh key, which is what gives her a genuinely new set of items.
  const items = useMemo(() => buildDrillSession(mode, SPELLING_WORDS, Math.random), [mode])

  const [index, setIndex] = useState(0)
  const [value, setValue] = useState('')
  const [result, setResult] = useState<Result>('pending')
  const [answered, setAnswered] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  // A ref, not just the state flag: two taps landing in the same tick would
  // both read `answered` as false and grade the item twice.
  const answeredRef = useRef(false)

  const item = items[index]

  // Keyed on the index, not on the text: two items in a row can legitimately
  // say the same thing (there are only so many ways to say "a fortnight"), and
  // arriving at the second one must still play it.
  useEffect(() => {
    if (item && !finished) speak(item.spoken, accent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, accent, finished])

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  function check(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // One item, one grade: a double tap on Check must never score twice, the
    // same guard every modality component uses.
    if (answeredRef.current || !item) return
    answeredRef.current = true
    const ok = checkDrillAnswer(value, item)
    setAnswered(true)
    setResult(ok ? 'right' : 'wrong')
    if (ok) setCorrect(c => c + 1)
    recordListeningPractice(ok)
  }

  function next() {
    if (index + 1 >= items.length) {
      setFinished(true)
      return
    }
    setIndex(i => i + 1)
    setValue('')
    setAnswered(false)
    answeredRef.current = false
    setResult('pending')
  }

  if (finished || !item) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title={title} onBack={onQuit} />
        <Card className="flex flex-col items-center gap-3 text-center">
          <p className="text-3xl" aria-hidden="true">🥝</p>
          <p className="text-xl font-extrabold text-ink">
            {`You got ${correct} out of ${items.length}`}
          </p>
          <Meter
            className="w-full"
            value={items.length === 0 ? 0 : correct / items.length}
            label="This round"
            tone={correct >= items.length * 0.6 ? 'good' : 'brand'}
            valueText={`${correct}/${items.length}`}
          />
          <p className="text-sm text-muted">{warmLine(correct, items.length)}</p>
        </Card>
        <Button variant="primary" onClick={onAgain}>Play again</Button>
        <Button variant="ghost" onClick={onQuit}>Back to Drills</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={title} onBack={onQuit} />

      <div className="flex items-center justify-between">
        <Chip>{`Item ${index + 1} of ${items.length}`}</Chip>
        <Chip tone="good">{`${correct} right`}</Chip>
      </div>

      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted">Listen, then write what you heard.</p>
        {item.display && (
          <p className="text-2xl font-extrabold tracking-wide text-ink">{item.display}</p>
        )}
        {/* The slow replay used to be a bespoke button here — this screen had
          * it first. It is part of SpeakerButton now, so every card in the app
          * gets it and there is one definition of "slower" rather than two. */}
        <div className="flex items-center gap-3 pt-1">
          <SpeakerButton text={item.spoken} />
        </div>
      </Card>

      <form onSubmit={check} className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="text"
          inputMode={NUMERIC_KINDS.has(item.kind) ? 'numeric' : 'text'}
          value={value}
          onChange={e => setValue(e.target.value)}
          disabled={answered}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Type what you heard"
          className="min-h-[44px] w-full rounded-2xl border border-line bg-card2 px-4 text-ink disabled:opacity-70"
        />
        {!answered && <Button type="submit" variant="primary">Check</Button>}
      </form>

      {answered && (
        <>
          <Card className={result === 'right' ? 'text-center font-bold text-good' : 'text-center font-bold text-ink'}>
            {result === 'right' ? (
              <p>✅ Ka pai!</p>
            ) : (
              <p>
                Not quite. It was <span className="text-brand">{answerLabel(item)}</span>
              </p>
            )}
          </Card>
          <Button variant="primary" onClick={next}>
            {index + 1 >= items.length ? 'See my score' : 'Next'}
          </Button>
        </>
      )}
    </div>
  )
}

/**
 * Practical listening: the price at the counter, the time on the phone, a
 * street name spelled out. Everything is generated fresh, so she can never
 * memorise the answers instead of the listening.
 */
export function Drills({ onBack }: DrillsProps) {
  const [mode, setMode] = useState<DrillMode | null>(null)
  const [round, setRound] = useState(0)

  // No voice, no drill. Offering a menu that plays silence would waste her
  // time — the same honesty Shadowing shows about a missing microphone.
  if (!speechSynthesisAvailable()) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title="Drills" onBack={onBack} />
        <Card className="flex flex-col gap-2">
          <p className="font-bold text-ink">This browser can&apos;t speak 🔇</p>
          <p className="text-sm text-muted">
            Every drill here is something you listen to, so there is nothing to practise without
            a voice. Open the app in Chrome or Safari on your phone and they will all work.
          </p>
        </Card>
        <Button variant="ghost" onClick={onBack}>Back to Practice</Button>
      </div>
    )
  }

  if (mode) {
    const title = OPTIONS.find(o => o.mode === mode)?.title ?? 'Drills'
    return (
      <DrillRunner
        key={`${mode}-${round}`}
        mode={mode}
        title={title}
        onQuit={() => setMode(null)}
        onAgain={() => setRound(r => r + 1)}
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Drills" onBack={onBack} />
      <p className="px-1 text-sm text-muted">
        {`Short listening reps — ${SESSION_LENGTH} at a time. Pick what you want to catch better.`}
      </p>

      <div className="flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.mode}
            type="button"
            data-testid={`drill-${opt.mode}`}
            onClick={() => setMode(opt.mode)}
            className="flex min-h-[56px] items-center gap-3 rounded-card border border-line bg-card p-4 text-left transition active:scale-[0.98]"
          >
            <span className="text-2xl" aria-hidden="true">{opt.emoji}</span>
            <span className="flex-1">
              <span className="block font-bold text-ink">{opt.title}</span>
              <span className="block text-sm text-muted">{opt.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
