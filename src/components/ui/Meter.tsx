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

/**
 * `valueText` lets a caller override or suppress the trailing readout:
 * - omitted (`undefined`): falls back to the default `{Math.round(pct)}%` — every
 *   existing caller keeps rendering exactly as before.
 * - a string: printed verbatim (e.g. "82% · 50 reviews", or "not practised yet"
 *   so an unpractised skill never reads "0%").
 * - `null`: no value text at all — just the label, e.g. a level-progress bar
 *   that shouldn't print a bare percentage.
 */
export function Meter({
  value, label, tone = 'brand', className = '', valueText,
}: {
  value: number
  label: string
  tone?: Tone
  className?: string
  valueText?: string | null
}) {
  const pct = clamp01(value) * 100
  const text = valueText === undefined ? `${Math.round(pct)}%` : valueText

  return (
    <div className={className}>
      <div className="mb-1 flex items-center justify-between text-xs text-muted">
        <span>{label}</span>
        {text !== null && <span>{text}</span>}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-card2">
        <div className={`h-full rounded-full ${TONES[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
