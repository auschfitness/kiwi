import type { ReactNode } from 'react'

type Tone = 'brand' | 'good' | 'gold' | 'hard'

// Tinted text + matching border on a neutral card background, so a chip never
// depends on a hardcoded contrast colour to stay readable.
const TONES: Record<Tone, string> = {
  brand: 'text-brand border-brand',
  good: 'text-good border-good',
  gold: 'text-gold border-gold',
  hard: 'text-hard border-hard',
}

const NEUTRAL = 'text-muted border-line'

export function Chip({
  children, tone, className = '',
}: { children: ReactNode; tone?: Tone; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border bg-card2 px-3 py-1 text-xs font-bold ${tone ? TONES[tone] : NEUTRAL} ${className}`}
    >
      {children}
    </span>
  )
}
