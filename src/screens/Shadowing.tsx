import { useEffect, useMemo, useState } from 'react'
import { ScreenHeader, Card, Button } from '../components/ui'
import { useStore } from '../store/useStore'
import { speak } from '../audio/speak'
import { recognizeOnce } from '../audio/listen'
import { speechRecognitionAvailable } from '../audio/capabilities'
import { judgePronunciation, shadowingLines } from '../core/pronunciation'

export interface ShadowingProps {
  /** Scope practice to one dialogue's lines. Omit for a mixed practice set. */
  dialogueId?: string
  onBack: () => void
}

type Phase = 'idle' | 'listening' | 'result'

/**
 * Practice, not review: nothing here is graded or scheduled. A silent or
 * unavailable microphone just repeats the same warm retry copy that a real
 * miss would get — she can always move on with Next line, so the mic can
 * never leave her stuck.
 */
export function Shadowing({ dialogueId, onBack }: ShadowingProps) {
  const accent = useStore(s => s.accent)

  const lines = useMemo(() => {
    const all = shadowingLines()
    if (!dialogueId) return all
    const scoped = all.filter(l => l.id.startsWith(`${dialogueId}_`))
    return scoped.length > 0 ? scoped : all
  }, [dialogueId])

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState<Phase>('idle')
  const [heard, setHeard] = useState('')

  const line = lines[index]

  useEffect(() => {
    setPhase('idle')
    setHeard('')
  }, [index])

  useEffect(() => {
    if (line) speak(line.en, accent)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line?.id, accent])

  async function record() {
    setPhase('listening')
    const transcript = await recognizeOnce(accent)
    setHeard(transcript)
    setPhase('result')
  }

  function next() {
    setIndex(i => Math.min(i + 1, lines.length - 1))
  }

  function prev() {
    setIndex(i => Math.max(i - 1, 0))
  }

  if (!line) {
    return (
      <div>
        <ScreenHeader title="Shadowing" onBack={onBack} />
        <p className="px-1 text-sm text-muted">Nothing to practise yet.</p>
      </div>
    )
  }

  const judgement = phase === 'result' ? judgePronunciation(heard, line.en) : null

  return (
    <div className="flex flex-col gap-4">
      <ScreenHeader title="Shadowing" onBack={onBack} />
      <p className="text-center text-sm text-muted">{`Line ${index + 1} of ${lines.length}`}</p>

      <Card className="flex flex-col items-center gap-2 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">{line.source}</p>
        <p className="text-xl font-extrabold text-ink">{line.en}</p>
        <p className="text-muted">{line.pt}</p>
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => speak(line.en, accent)}
            aria-label="Play audio"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card2 text-lg transition active:scale-[0.98]"
          >
            <span aria-hidden="true">🔊</span>
          </button>
          <button
            type="button"
            onClick={() => speak(line.en, accent, { rate: 0.7 })}
            aria-label="Play slowly"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-line bg-card2 px-4 text-sm font-bold text-ink transition active:scale-[0.98]"
          >
            <span aria-hidden="true">🐢</span> Slow
          </button>
        </div>
      </Card>

      <button
        type="button"
        aria-label="Record your voice"
        onClick={record}
        disabled={phase === 'listening'}
        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border border-line bg-card2 text-lg font-bold text-ink transition active:scale-[0.98] disabled:opacity-70"
      >
        <span aria-hidden="true">🎤</span>
        {phase === 'listening' ? 'Listening…' : 'Record your voice'}
      </button>

      {!speechRecognitionAvailable() && (
        <p className="text-center text-sm text-muted">
          This browser can&apos;t check your pronunciation. Listen, say it out loud, then use Next
          line to carry on — that&apos;s the practice that counts.
        </p>
      )}

      {judgement && (
        <Card className={judgement.ok ? 'text-center font-bold text-good' : 'text-center font-bold text-ink'}>
          <p>{judgement.message}</p>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          variant="ghost"
          size="md"
          onClick={prev}
          disabled={index === 0}
        >
          ← Previous
        </Button>
        <Button
          variant="ghost"
          size="md"
          onClick={next}
          disabled={index === lines.length - 1}
        >
          Next line →
        </Button>
      </div>
    </div>
  )
}
