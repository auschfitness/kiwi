import { useStore } from '../../store/useStore'
import { speak } from '../../audio/speak'

export function SpeakerButton({
  text, rate, className = '',
}: { text: string; rate?: number; className?: string }) {
  const accent = useStore(s => s.accent)

  return (
    <button
      type="button"
      onClick={() => speak(text, accent, { rate })}
      aria-label="Play audio"
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-card2 text-lg transition active:scale-[0.98] ${className}`}
    >
      <span aria-hidden="true">🔊</span>
    </button>
  )
}
