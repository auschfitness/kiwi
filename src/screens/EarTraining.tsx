import { useEffect, useMemo, useRef, useState } from 'react'
import type { Accent } from '../types'
import { Button, Card, Chip, Meter, ScreenHeader, SpeakerButton } from '../components/ui'
import { useStore } from '../store/useStore'
import { pickVoice, speak } from '../audio/speak'
import { accentName, isKiwiVoice } from '../audio/accents'
import { speechSynthesisAvailable } from '../audio/capabilities'
import { MINIMAL_PAIRS, PAIR_GROUPS } from '../content'
import type { MinimalPair } from '../content'
import {
  EAR_SESSION_LENGTH,
  buildEarSession,
  isEarAnswerCorrect,
  quizzablePairs,
  spokenWord,
  wordOf,
} from '../core/minimalPairs'
import type { EarQuestion, Side } from '../core/minimalPairs'

export interface EarTrainingProps {
  onBack: () => void
}

const QUIZZABLE = quizzablePairs(MINIMAL_PAIRS)

/* ---------------------------------------------------------------------------
 * Being honest about the voice
 *
 * The whole point of half this table is "a Kiwi says these almost the same" —
 * and the browser reads them with whatever voice the phone happens to own.
 * `pickVoice` falls back NZ → AU → GB → US, so on plenty of devices she is
 * hearing an American read a New Zealand lesson, and the two words will sound
 * further apart than they ever will at the supermarket.
 *
 * Rather than pretend, the screen looks up the voice it is actually about to
 * use and says so in one line. Three things follow from that line: the pairs
 * that are genuinely merged here are never graded (see `quizzablePairs`), the
 * quiz is honestly described as "which word did this voice say" rather than
 * "which word would a Kiwi have said", and the teaching that matters lives in
 * the note, which is text and sounds the same on every device.
 * ------------------------------------------------------------------------- */

/** The language tag of the voice `speak()` will pick, once the list has loaded. */
function useVoiceLang(accent: Accent): string | null {
  const [lang, setLang] = useState<string | null>(null)

  useEffect(() => {
    if (!speechSynthesisAvailable()) return
    const synth = window.speechSynthesis
    // jsdom and older Safari give a partial object; never assume the methods.
    if (!synth || typeof synth.getVoices !== 'function') return

    const read = () => setLang(pickVoice(synth.getVoices() ?? [], accent)?.lang ?? null)
    read()
    // Chrome populates the voice list asynchronously — the first read is
    // usually empty and this is the event that fills it in.
    synth.addEventListener?.('voiceschanged', read)
    return () => synth.removeEventListener?.('voiceschanged', read)
  }, [accent])

  return lang
}

function VoiceNote({ accent }: { accent: Accent }) {
  const lang = useVoiceLang(accent)
  const kiwi = isKiwiVoice(lang)
  const name = accentName(lang)

  let line: string
  if (kiwi) {
    line = 'Your phone has a New Zealand voice, so these should sound close to the real thing. Real people still go faster.'
  } else if (name) {
    line = `Your phone is reading these in ${name === 'American' ? 'an' : 'a'} ${name} voice, not a Kiwi one. So the two words may sound further apart here than they will at the shop — learn the pair, then listen to real people.`
  } else {
    line = 'Your phone may not have a New Zealand voice. If the two words sound very different here, they will still be much closer in real life — the note under each pair is the part that always holds.'
  }

  return (
    <Card className="flex flex-col gap-1">
      <p className="text-sm font-bold text-ink">
        <span aria-hidden="true">🎧</span> About the voice
      </p>
      <p className="text-sm text-muted">{line}</p>
    </Card>
  )
}

/* ------------------------------------------------------------------------ */

function PairButton({ word, onPlay }: { word: string; onPlay: () => void }) {
  return (
    <button
      type="button"
      onClick={onPlay}
      aria-label={`Play ${word}`}
      className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-card2 px-3 text-base font-bold text-ink transition active:scale-[0.98]"
    >
      <span aria-hidden="true">🔊</span> {word}
    </button>
  )
}

/**
 * Compare: ungraded on purpose. Tap one word, tap the other, read the line
 * underneath. Nothing is recorded here — this is where the distinction gets
 * built, and being scored while you are still building it just makes you tense.
 */
function Compare({ accent }: { accent: Accent }) {
  return (
    <div className="flex flex-col gap-5">
      <p className="px-1 text-sm text-muted">
        Tap one word, then the other. Nothing is scored here — just listen and read.
      </p>

      {PAIR_GROUPS.map(group => {
        const pairs = MINIMAL_PAIRS.filter(p => p.group === group.id)
        if (pairs.length === 0) return null
        return (
          <section key={group.id} className="flex flex-col gap-3">
            <div className="px-1">
              <h2 className="font-extrabold text-ink">{group.title}</h2>
              <p className="text-sm text-muted">{group.blurb}</p>
            </div>
            {pairs.map(pair => (
              <Card key={`${pair.a}-${pair.b}`} className="flex flex-col gap-2">
                <div className="flex items-stretch gap-2">
                  <PairButton word={pair.a} onPlay={() => speak(pair.a, accent)} />
                  <PairButton word={pair.b} onPlay={() => speak(pair.b, accent)} />
                </div>
                {pair.merged && <Chip tone="gold">Kiwis say these the same</Chip>}
                <p className="text-sm text-muted">{pair.note}</p>
              </Card>
            ))}
          </section>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------------ */

function warmLine(correct: number, total: number): string {
  const ratio = total === 0 ? 0 : correct / total
  if (ratio >= 0.9) return 'Sweet as — that ear is coming along nicely. 🥝'
  if (ratio >= 0.6) return 'Good going. These two sounds are starting to separate for you.'
  return 'These are hard, and nobody hears them on day one. Go back to Compare for a bit — that is the part that builds it.'
}

type Result = 'pending' | 'right' | 'wrong'

function Quiz({ accent, onQuit, onAgain }: { accent: Accent; onQuit: () => void; onAgain: () => void }) {
  const recordListeningPractice = useStore(s => s.recordListeningPractice)

  // Built once per mounted quiz. "Play again" remounts with a fresh key, which
  // is what deals her a genuinely new round.
  const questions = useMemo<EarQuestion<MinimalPair>[]>(
    () => buildEarSession(QUIZZABLE, Math.random),
    [],
  )

  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<Side | null>(null)
  const [result, setResult] = useState<Result>('pending')
  const [correct, setCorrect] = useState(0)
  const [finished, setFinished] = useState(false)
  // A ref, not just the state: two taps landing in the same tick would both
  // read `chosen` as null and grade the question twice.
  const answeredRef = useRef(false)

  const q = questions[index]
  const answered = chosen !== null

  useEffect(() => {
    if (q && !finished) speak(spokenWord(q), accent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, accent, finished])

  function answer(side: Side) {
    if (answeredRef.current || !q) return
    answeredRef.current = true
    const ok = isEarAnswerCorrect(q, side)
    setChosen(side)
    setResult(ok ? 'right' : 'wrong')
    if (ok) setCorrect(c => c + 1)
    recordListeningPractice(ok)
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setIndex(i => i + 1)
    setChosen(null)
    answeredRef.current = false
    setResult('pending')
  }

  if (finished || !q) {
    return (
      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="text-3xl" aria-hidden="true">🥝</p>
        <p className="text-xl font-extrabold text-ink">
          {`You got ${correct} out of ${questions.length}`}
        </p>
        <Meter
          className="w-full"
          value={questions.length === 0 ? 0 : correct / questions.length}
          label="This round"
          tone={correct >= questions.length * 0.6 ? 'good' : 'brand'}
          valueText={`${correct}/${questions.length}`}
        />
        <p className="text-sm text-muted">{warmLine(correct, questions.length)}</p>
        <div className="flex w-full flex-col gap-2 pt-1">
          <Button variant="primary" onClick={onAgain}>Play again</Button>
          <Button variant="ghost" onClick={onQuit}>Back to Ear training</Button>
        </div>
      </Card>
    )
  }

  const said = wordOf(q.pair, q.side)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Chip>{`Item ${index + 1} of ${questions.length}`}</Chip>
        <Chip tone="good">{`${correct} right`}</Chip>
      </div>

      <Card className="flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-muted">Which word did you hear?</p>
        <SpeakerButton text={spokenWord(q)} />
      </Card>

      <div className="flex flex-col gap-3">
        {(['a', 'b'] as const).map(side => {
          const word = wordOf(q.pair, side)
          const isRight = side === q.side
          const tone = !answered
            ? 'border-line bg-card text-ink'
            : isRight
              ? 'border-good bg-card text-good'
              : chosen === side
                ? 'border-again bg-card text-again'
                : 'border-line bg-card text-muted'
          return (
            <button
              key={side}
              type="button"
              data-testid={`ear-choice-${side}`}
              disabled={answered}
              onClick={() => answer(side)}
              className={`min-h-[56px] rounded-card border text-lg font-extrabold transition active:scale-[0.98] disabled:opacity-100 ${tone}`}
            >
              {word}
            </button>
          )
        })}
      </div>

      {answered && (
        <>
          <Card className="flex flex-col gap-2 text-center">
            <p className={result === 'right' ? 'font-bold text-good' : 'font-bold text-ink'}>
              {result === 'right' ? '✅ Ka pai!' : <>Not quite — it was <span className="text-brand">{said}</span></>}
            </p>
            {/* Shown right or wrong: the moment she just missed one is exactly
                when the line about the Kiwi mouth actually lands. */}
            <p data-testid="ear-note" className="text-sm text-muted">{q.pair.note}</p>
          </Card>
          <Button variant="primary" onClick={next}>
            {index + 1 >= questions.length ? 'See my score' : 'Next'}
          </Button>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------------ */

type Mode = 'menu' | 'compare' | 'quiz'

const TITLES: Record<Mode, string> = {
  menu: 'Ear training',
  compare: 'Compare',
  quiz: 'Which one?',
}

/**
 * The New Zealand short front vowel shift, one pair at a time. Compare builds
 * the distinction; the quiz checks it. Everything Kiwis genuinely merge is
 * Compare-only, so nothing here grades her on a difference that is not there.
 */
export function EarTraining({ onBack }: EarTrainingProps) {
  const accent = useStore(s => s.accent)
  const [mode, setMode] = useState<Mode>('menu')
  const [round, setRound] = useState(0)

  // No voice, no ear training. Same honesty Drills shows.
  if (!speechSynthesisAvailable()) {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title="Ear training" onBack={onBack} />
        <Card className="flex flex-col gap-2">
          <p className="font-bold text-ink">This browser can&apos;t speak 🔇</p>
          <p className="text-sm text-muted">
            Every pair here is something you listen to, so there is nothing to practise without
            a voice. Open the app in Chrome or Safari on your phone and it will all work.
          </p>
        </Card>
        <Button variant="ghost" onClick={onBack}>Back to Practice</Button>
      </div>
    )
  }

  if (mode === 'compare') {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title={TITLES.compare} onBack={() => setMode('menu')} />
        <VoiceNote accent={accent} />
        <Compare accent={accent} />
      </div>
    )
  }

  if (mode === 'quiz') {
    return (
      <div className="flex flex-col gap-4">
        <ScreenHeader title={TITLES.quiz} onBack={() => setMode('menu')} />
        <Quiz
          key={round}
          accent={accent}
          onQuit={() => setMode('menu')}
          onAgain={() => setRound(r => r + 1)}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title={TITLES.menu} onBack={onBack} />
      <p className="px-1 text-sm text-muted">
        Kiwis move their short vowels: <span className="font-bold text-ink">pen</span> sounds like
        your <span className="font-bold text-ink">pin</span>, and{' '}
        <span className="font-bold text-ink">bad</span> sounds like your{' '}
        <span className="font-bold text-ink">bed</span>. Here are{' '}
        {MINIMAL_PAIRS.length} pairs to train your ear on.
      </p>

      <VoiceNote accent={accent} />

      <div className="flex flex-col gap-3">
        <button
          type="button"
          data-testid="ear-compare"
          onClick={() => setMode('compare')}
          className="flex min-h-[56px] items-center gap-3 rounded-card border border-line bg-card p-4 text-left transition active:scale-[0.98]"
        >
          <span className="text-2xl" aria-hidden="true">👂</span>
          <span className="flex-1">
            <span className="block font-bold text-ink">Compare</span>
            <span className="block text-sm text-muted">
              Hear both words side by side and read what changes. Nothing is scored.
            </span>
          </span>
        </button>

        <button
          type="button"
          data-testid="ear-quiz"
          onClick={() => setMode('quiz')}
          className="flex min-h-[56px] items-center gap-3 rounded-card border border-line bg-card p-4 text-left transition active:scale-[0.98]"
        >
          <span className="text-2xl" aria-hidden="true">🎯</span>
          <span className="flex-1">
            <span className="block font-bold text-ink">Which one?</span>
            <span className="block text-sm text-muted">
              {`${EAR_SESSION_LENGTH} words, one at a time. Pick the one you heard.`}
            </span>
          </span>
        </button>
      </div>

      <p className="px-1 text-xs text-muted">
        {`The quiz uses ${QUIZZABLE.length} of the pairs. The other ${MINIMAL_PAIRS.length - QUIZZABLE.length} really are the same sound in New Zealand, so there is nothing to score — you will find them in Compare.`}
      </p>
    </div>
  )
}
