import { PLAN } from '../content'
import { DAY } from '../core/time'
import { useStore } from '../store/useStore'
import { ScreenHeader, Chip } from '../components/ui'

export interface PlanProps {
  onBack: () => void
}

/** Which of the eight weeks she's in "now", based on how long ago she
 * started. Clamped to 1..8 so a fresh profile never reads
 * "Week 0" and a learner who has kept going past week 8 stays on the last
 * card rather than pointing at a week that doesn't exist. */
export function currentPlanWeek(now: number, startedAt: number): number {
  const elapsedWeeks = Math.floor((now - startedAt) / (7 * DAY))
  return Math.min(8, Math.max(1, elapsedWeeks + 1))
}

/** The eight-week roadmap — a map, not a study mode. Reading it does
 * nothing to her progress; it just tells her where "now" sits. */
export function Plan({ onBack }: PlanProps) {
  const startedAt = useStore(s => s.startedAt)
  const week = currentPlanWeek(Date.now(), startedAt)

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title="8-week plan" onBack={onBack} />

      <div className="flex flex-col gap-3">
        {PLAN.map((w, i) => {
          const n = i + 1
          const isNow = n === week
          return (
            <div
              key={n}
              className={`rounded-card bg-card p-4 ${isNow ? 'border-2 border-brand' : 'border border-line'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-ink">Week {n} — {w.title}</p>
                {isNow && <Chip tone="brand">• now</Chip>}
              </div>
              <p className="mt-1 text-sm text-muted">{w.detail}</p>
              <p className="mt-2 text-sm text-gold">{w.tip}</p>
            </div>
          )
        })}
      </div>

      <p className="px-1 pb-2 text-center text-sm text-muted">
        Aim for a little every day. Consistency beats long study once a week.
      </p>
    </div>
  )
}
