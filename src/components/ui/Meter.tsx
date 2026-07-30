type Tone = 'brand' | 'good' | 'gold' | 'hard'

const TONES: Record<Tone, string> = {
  brand: 'bg-brand',
  good: 'bg-good',
  gold: 'bg-gold',
  hard: 'bg-hard',
}

/** Clamp to 0..1, and fall back to 0 for NaN/Infinity so a bad input never crashes the bar. */
function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export function Meter({
  value, label, tone = 'brand', className = '',
}: { value: number; label: string; tone?: Tone; className?: string }) {
  const pct = clamp01(value) * 100

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-card2">
        <div className={`h-full rounded-full ${TONES[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
