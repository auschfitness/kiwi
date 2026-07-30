import type { ReactNode } from 'react'

/** Clamp to 0..1, and fall back to 0 for NaN/Infinity so a bad input never crashes the ring. */
function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export function Ring({
  value, size = 64, children,
}: { value: number; size?: number; children?: ReactNode }) {
  const safeSize = Number.isFinite(size) && size > 0 ? size : 64
  const stroke = Math.max(4, safeSize * 0.1)
  const radius = Math.max(0, (safeSize - stroke) / 2)
  const circumference = 2 * Math.PI * radius
  const pct = clamp01(value)
  const dashOffset = circumference * (1 - pct)

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: safeSize, height: safeSize }}>
      <svg width={safeSize} height={safeSize} viewBox={`0 0 ${safeSize} ${safeSize}`} className="-rotate-90">
        <circle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-card2"
        />
        <circle
          cx={safeSize / 2}
          cy={safeSize / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="stroke-brand"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
