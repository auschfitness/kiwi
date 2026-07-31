import { useEffect, useRef, useState } from 'react'
import type { Roleplay as Scenario, RoleplayTurn } from '../content'
import { ROLEPLAYS } from '../content'
import { useStore } from '../store/useStore'
import { speak } from '../audio/speak'
import { recognizeOnce } from '../audio/listen'
import { speechRecognitionAvailable } from '../audio/capabilities'
import { matchesExpected, heardNothing, youTurnCount, MAX_TRIES } from '../core/roleplay'
import { LEVEL_NAMES } from '../core/leveling'
import { ScreenHeader, Card, Button, Chip, SpeakerButton } from '../components/ui'

export interface RoleplayProps {
  onBack: () => void
}

/**
 * Spoken role-play: the app plays the other person, she answers out loud.
 *
 * Two rules run through the whole screen and each of them was a bug once:
 *
 *  - **A microphone that hears nothing never grades her.** `recognizeOnce`
 *    resolves '' on error, silence, timeout or a missing API. That is
 *    "didn't catch that", never "wrong" — so a line where the mic produced no
 *    words at all is skipped past without a failure being recorded.
 *  - **There is never a dead end.** After MAX_TRIES she gets the English, a
 *    chance to hear it, and a way onward. She can always reach the end of the
 *    conversation, which is the only thing that makes it a conversation.
 */
export function Roleplay({ onBack }: RoleplayProps) {
  const [scenario, setScenario] = useState<Scenario | null>(null)
  // Bumped by "Play it again", so the play view remounts with fresh state
  // instead of a reused instance holding a finished conversation.
  const [run, setRun] = useState(0)

  if (!scenario) return <ScenarioList onPick={setScenario} onBack={onBack} />

  return (
    <Play
      key={`${scenario.id}_${run}`}
      scenario={scenario}
      onReplay={() => setRun(r => r + 1)}
      onBack={() => setScenario(null)}
    />
  )
}

/** Pick a scene. Nothing is locked — role-play is practice, not content. */
function ScenarioList({ onPick, onBack }: { onPick: (s: Scenario) => void; onBack: () => void }) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title="Role-play" onBack={onBack} />
      <p className="px-1 text-sm text-muted">
        Pick a scene. I&apos;ll play the other person — you answer out loud.
      </p>

      <div className="flex flex-col gap-3">
        {ROLEPLAYS.map(rp => (
          <button
            key={rp.id}
            type="button"
            data-testid={`roleplay-${rp.id}`}
            onClick={() => onPick(rp)}
            className="flex min-h-[56px] items-center gap-3 rounded-card border border-line bg-card p-4 text-left transition active:scale-[0.98]"
          >
            <span className="text-2xl" aria-hidden="true">{rp.emoji}</span>
            <span className="flex-1">
              <span className="block font-bold text-ink">{rp.title}</span>
              <span className="block text-sm text-muted">{rp.context}</span>
            </span>
            <Chip>{LEVEL_NAMES[rp.level]}</Chip>
          </button>
        ))}
      </div>
    </div>
  )
}

/** One line already said, as it goes in the transcript. */
interface Bubble {
  key: string
  speaker: 'them' | 'you'
  en: string
  pt: string
  /** Her line, but she needed the English shown to get there. */
  helped?: boolean
  /** The last thing the other person said — the only one worth replaying. */
  live?: boolean
}

function Play({
  scenario, onReplay, onBack,
}: { scenario: Scenario; onReplay: () => void; onBack: () => void }) {
  const accent = useStore(s => s.accent)
  const speechRate = useStore(s => s.speechRate)
  const showPortuguese = useStore(s => s.showPortuguese)
  const recordSpeakingPractice = useStore(s => s.recordSpeakingPractice)

  const turns = scenario.turns
  const canListen = speechRecognitionAvailable()

  // `cursor` is the only source of truth for progress: everything before it is
  // transcript, everything from it on is still to come. The transcript is
  // derived from it rather than accumulated in an effect, so a double-invoked
  // effect (React.StrictMode in dev) can never append the same line twice.
  const [cursor, setCursor] = useState(0)
  const [said, setSaid] = useState<Record<number, string>>({})
  const [helped, setHelped] = useState<Record<number, true>>({})
  const [nailed, setNailed] = useState(0)

  const [misses, setMisses] = useState(0)
  const [listening, setListening] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  // Refs, not state: these guards have to hold within a single tick, before
  // React has re-rendered. A double-tap on 🎤 or on Next is a real thing on a
  // phone, and either one could otherwise record a turn twice or skip a line.
  const busyRef = useRef(false)
  const advancedRef = useRef(-1)
  const recordedRef = useRef<Set<number>>(new Set())
  // Whether the microphone produced *any* words on this line, across tries.
  const heardWordsRef = useRef(false)

  const turn: RoleplayTurn | undefined = turns[cursor]
  const done = cursor >= turns.length
  const total = youTurnCount(turns)

  // The other person's lines play themselves and then hand the floor back.
  // The functional guard keeps a double-invoked effect from advancing twice.
  useEffect(() => {
    const current = turns[cursor]
    if (!current || current.speaker !== 'them') return
    speak(current.en, accent)
    setCursor(c => (c === cursor ? c + 1 : c))
  }, [cursor, turns, accent])

  // Fresh slate for each of her lines.
  useEffect(() => {
    setMisses(0)
    setRevealed(false)
    setFeedback(null)
    heardWordsRef.current = false
  }, [cursor])

  function recordOnce(index: number, correct: boolean) {
    if (recordedRef.current.has(index)) return
    recordedRef.current.add(index)
    recordSpeakingPractice(correct)
  }

  function advance(index: number, spoken: string, wasHelped: boolean) {
    if (advancedRef.current === index) return
    advancedRef.current = index
    setSaid(s => ({ ...s, [index]: spoken }))
    if (wasHelped) setHelped(h => ({ ...h, [index]: true }))
    setCursor(index + 1)
  }

  async function sayIt() {
    if (busyRef.current || !turn || turn.speaker !== 'you') return
    const index = cursor
    busyRef.current = true
    setListening(true)
    setFeedback(null)

    const heard = await recognizeOnce(accent)

    setListening(false)
    busyRef.current = false
    if (!heardNothing(heard)) heardWordsRef.current = true

    if (matchesExpected(heard, turn)) {
      recordOnce(index, true)
      setNailed(n => n + 1)
      advance(index, heard.trim(), false)
      return
    }

    const tries = misses + 1
    setMisses(tries)

    if (tries < MAX_TRIES) {
      setFeedback(
        heardNothing(heard)
          ? "Didn't catch that — have another go 🎤"
          : `I heard "${heard.trim()}". Close — one more go.`,
      )
      return
    }

    // Out of tries. Show her the line, offer to say it for her, and let her
    // carry on. Only grade her if the microphone actually heard words: a mic
    // that returned silence every time tested nothing, and a false 0% on the
    // Speaking meter would tell her she is bad at something her browser
    // cannot even check.
    setRevealed(true)
    if (heardWordsRef.current) recordOnce(index, false)
    setFeedback('No worries — here it is. Have a listen, then say it with me.')
  }

  // Everything said so far, derived straight from the cursor. Her bubbles
  // carry what the recogniser actually heard, so she sees her own words —
  // falling back to the script for a line she was helped through.
  const spokenSoFar = turns.slice(0, cursor)
  const lastThem = spokenSoFar.map(t => t.speaker).lastIndexOf('them')
  const bubbles: Bubble[] = spokenSoFar.map((t, i) => ({
    key: `${scenario.id}_${i}`,
    speaker: t.speaker,
    en: t.speaker === 'them' ? t.en : (said[i] ?? t.en),
    pt: t.pt,
    helped: helped[i],
    // Only the newest line of theirs is worth a replay — it is the one she
    // is answering. Buttons on every past bubble would just be clutter.
    live: i === lastThem,
  }))

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title={scenario.title} onBack={onBack} />

      <Card className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden="true">{scenario.emoji}</span>
        <p className="flex-1 text-sm text-ink">{scenario.context}</p>
      </Card>

      <div className="flex flex-col gap-3">
        {bubbles.map(b => (
          <BubbleRow key={b.key} bubble={b} showPortuguese={showPortuguese} speechRate={speechRate} />
        ))}
      </div>

      {!done && turn && turn.speaker === 'you' && (
        canListen ? (
          // Keyed by the turn it belongs to. Without it React reuses one
          // instance across every line she says, and its internal "Show
          // English" state arrives at the next line already revealed.
          <YourTurn
            key={`you_${cursor}`}
            turn={turn}
            listening={listening}
            revealed={revealed}
            feedback={feedback}
            outOfTries={misses >= MAX_TRIES}
            speechRate={speechRate}
            onSayIt={sayIt}
            onCarryOn={() => advance(cursor, turn.en, true)}
          />
        ) : (
          <ReadItOut
            key={`read_${cursor}`}
            turn={turn}
            speechRate={speechRate}
            onNext={() => advance(cursor, turn.en, false)}
          />
        )
      )}

      {done && (
        <EndCard
          nailed={nailed}
          total={total}
          graded={canListen}
          onReplay={onReplay}
          onBack={onBack}
        />
      )}
    </div>
  )
}

/** One line of the conversation. Same look as the dialogue reader, laid out
 * left for them and right for her so it reads as a chat. */
function BubbleRow({
  bubble, showPortuguese, speechRate,
}: { bubble: Bubble; showPortuguese: boolean; speechRate: number }) {
  const accent = useStore(s => s.accent)
  const mine = bubble.speaker === 'you'
  return (
    <div className={`flex items-start gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
      <div
        className={`max-w-[85%] rounded-card border border-line p-3 ${mine ? 'bg-brand text-onBrand' : 'bg-card'}`}
      >
        <p className={`text-xs font-bold uppercase tracking-wide ${mine ? 'text-onBrand opacity-80' : 'text-muted'}`}>
          {mine ? 'You' : 'Them'}
        </p>
        <p className={mine ? 'text-onBrand' : 'text-ink'}>{bubble.en}</p>
        {!mine && showPortuguese && (
          <p data-testid="roleplay-bubble-pt" className="text-sm text-muted">{bubble.pt}</p>
        )}
        {bubble.helped && (
          <p className="text-xs text-onBrand opacity-80">with a little help 👀</p>
        )}
      </div>
      {!mine && bubble.live && (
        <div className="flex shrink-0 flex-col gap-2">
          <SpeakerButton text={bubble.en} />
          <button
            type="button"
            onClick={() => speak(bubble.en, accent, { rate: Math.max(0.5, speechRate * 0.75) })}
            aria-label="Play slowly"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card2 text-lg transition active:scale-[0.98]"
          >
            <span aria-hidden="true">🐢</span>
          </button>
        </div>
      )}
    </div>
  )
}

/** Her turn, with a working microphone. */
function YourTurn({
  turn, listening, revealed, feedback, outOfTries, speechRate, onSayIt, onCarryOn,
}: {
  turn: RoleplayTurn
  listening: boolean
  revealed: boolean
  feedback: string | null
  outOfTries: boolean
  speechRate: number
  onSayIt: () => void
  onCarryOn: () => void
}) {
  const accent = useStore(s => s.accent)
  const [peeked, setPeeked] = useState(false)
  const showEnglish = peeked || revealed

  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Your turn</p>
      <p className="text-ink">{turn.pt}</p>

      {showEnglish ? (
        <p data-testid="roleplay-target" className="text-lg font-extrabold text-ink">{turn.en}</p>
      ) : (
        <button
          type="button"
          data-testid="roleplay-peek"
          onClick={() => setPeeked(true)}
          className="min-h-[44px] self-start rounded-2xl border border-line bg-card2 px-4 text-sm font-bold text-ink transition active:scale-[0.98]"
        >
          Show English
        </button>
      )}

      {feedback && <p className="text-sm text-muted">{feedback}</p>}

      {!outOfTries && (
        <button
          type="button"
          data-testid="roleplay-say"
          onClick={onSayIt}
          disabled={listening}
          className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-brand text-lg font-extrabold text-onBrand transition active:scale-[0.98] disabled:opacity-70"
        >
          <span aria-hidden="true">🎤</span>
          {listening ? 'Listening…' : 'Say it'}
        </button>
      )}

      {outOfTries && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            data-testid="roleplay-hear-it"
            onClick={() => speak(turn.en, accent, { rate: Math.max(0.5, speechRate * 0.85) })}
            className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-line bg-card2 text-base font-bold text-ink transition active:scale-[0.98]"
          >
            <span aria-hidden="true">🔊</span> Hear it &amp; repeat
          </button>
          <Button variant="primary" size="md" onClick={onCarryOn}>
            Carry on →
          </Button>
        </div>
      )}
    </Card>
  )
}

/**
 * Her turn on a browser with no speech recognition — every iPhone, which is
 * to say most of the time. She reads the line out loud and taps Next. Nothing
 * is recorded here: the practice is real, but nothing was measured, and a 0%
 * on the Speaking meter would be a lie about her, not about the browser.
 */
function ReadItOut({
  turn, speechRate, onNext,
}: { turn: RoleplayTurn; speechRate: number; onNext: () => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">Your turn</p>
      <p className="text-ink">{turn.pt}</p>
      <div className="flex items-center gap-3">
        <p data-testid="roleplay-target" className="flex-1 text-lg font-extrabold text-ink">{turn.en}</p>
        <SpeakerButton text={turn.en} rate={Math.max(0.5, speechRate * 0.85)} />
      </div>
      <p className="text-sm text-muted">
        This browser can&apos;t hear you. Say it out loud, then tap Next — that&apos;s the practice
        that counts.
      </p>
      <Button variant="primary" size="md" onClick={onNext}>
        Next →
      </Button>
    </Card>
  )
}

function EndCard({
  nailed, total, graded, onReplay, onBack,
}: { nailed: number; total: number; graded: boolean; onReplay: () => void; onBack: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 text-center">
      <p className="text-3xl" aria-hidden="true">🥝</p>
      <p className="text-lg font-extrabold text-ink">Ka pai! You held a whole conversation 🥝</p>
      {graded ? (
        <p data-testid="roleplay-score" className="text-ink">
          {`You nailed ${nailed} of ${total} lines.`}
        </p>
      ) : (
        <p data-testid="roleplay-score" className="text-ink">
          {`You said all ${total} of your lines out loud.`}
        </p>
      )}
      <div className="flex w-full flex-col gap-2 pt-1">
        <Button variant="primary" size="md" onClick={onReplay}>Play it again</Button>
        <Button variant="ghost" size="md" onClick={onBack}>Back to the scenes</Button>
      </div>
    </Card>
  )
}
