import { useStore } from '../../store/useStore'
import { speak } from '../../audio/speak'
// From core, not from audio: this is arithmetic, not a browser API. Keeping it
// here also means the nine test files that mock the whole audio/speak module
// do not each have to know about it.
import { slowRateFor } from '../../core/speech'

const SHAPE = 'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card2 text-lg transition active:scale-[0.98]'

/**
 * Play, and play slowly.
 *
 * The turtle is a second button rather than a speed setting because the two
 * are different questions. The setting in Settings is "how fast should this
 * app talk to me"; the turtle is "say that one again, slower" — asked about a
 * particular word, in the moment, without leaving the card and without
 * changing anything for the next one.
 *
 * It is relative to her chosen speed (see `slowRateFor`), so it is still the
 * slow one whichever speed she is on.
 */
export function SpeakerButton({
  text, rate, className = '',
}: { text: string; rate?: number; className?: string }) {
  const accent = useStore(s => s.accent)
  const speechRate = useStore(s => s.speechRate)

  // An explicit `rate` is a call site asking for a specific speed (Role-play
  // slows its model lines); the turtle slows whatever that speed turned out
  // to be rather than ignoring it.
  const normal = rate ?? speechRate

  return (
    <div className={`flex shrink-0 items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => speak(text, accent, { rate })}
        aria-label="Play audio"
        className={SHAPE}
      >
        <span aria-hidden="true">🔊</span>
      </button>
      <button
        type="button"
        onClick={() => speak(text, accent, { rate: slowRateFor(normal) })}
        aria-label="Play audio slowly"
        className={SHAPE}
      >
        <span aria-hidden="true">🐢</span>
      </button>
    </div>
  )
}
