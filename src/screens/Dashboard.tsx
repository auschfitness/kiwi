import type { Level, Skill } from '../types'
import { useStore, cardIdsByLevel } from '../store/useStore'
import { totalKnown, totalDue } from '../core/srs'
import { levelProgress, LEVEL_NAMES, LEVEL_EMOJI, LEVEL_TITLES } from '../core/leveling'
import { skillSummary, weakestSkill, levelBreakdown } from '../core/stats'
import { studySummary, formatDuration, formatCompact, type StudyDay } from '../core/studyTime'
import { Card, Chip, Meter, ScreenHeader } from '../components/ui'

export interface DashboardProps {
  onBack: () => void
}

const SKILL_LABELS: Record<Skill, string> = {
  vocab: 'Vocab', listening: 'Listening', grammar: 'Grammar', speaking: 'Speaking',
}

const SKILL_TONE: Record<Skill, 'brand' | 'good' | 'gold' | 'hard'> = {
  vocab: 'brand', listening: 'good', grammar: 'gold', speaking: 'hard',
}

const LEVELS: Level[] = [1, 2, 3, 4]

/** One skill row. Practised skills show accuracy and a filled bar; an
 * unpractised skill must never read "0%" — that would tell her she is bad
 * at something she was never asked to do (e.g. speaking, with no speech
 * recognition on iOS Safari). */
function SkillRow({ skill, total, accuracy }: {
  skill: Skill; total: number; accuracy: number | null
}) {
  return (
    <Meter
      label={SKILL_LABELS[skill]}
      tone={SKILL_TONE[skill]}
      value={accuracy === null ? 0 : accuracy / 100}
      // "reps", not "reviews": drills and role-play feed these same counters
      // and neither of them is a card review.
      valueText={accuracy === null ? 'not practised yet' : `${accuracy}% · ${total} reps`}
    />
  )
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** `2026-8-4` → `Tue`. The key format is `dayKey`'s, and it is local already. */
function weekdayOf(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return WEEKDAY[new Date(y, m - 1, d).getDay()] ?? ''
}

/**
 * Seven days of practice, tallest bar first among equals.
 *
 * Heights are relative to her own best day in the window, not to some target:
 * a week of twenty-minute evenings should look like a solid week, not like a
 * failure to do an hour. A day with no study is a visible empty column rather
 * than a gap, because seeing the gap is the point.
 */
function WeekStrip({ week }: { week: StudyDay[] }) {
  const peak = week.reduce((max, d) => Math.max(max, d.ms), 0)

  return (
    <div className="flex items-end justify-between gap-1" data-testid="week-strip">
      {week.map((day, i) => {
        const height = peak === 0 ? 0 : Math.round((day.ms / peak) * 100)
        const label = `${weekdayOf(day.key)}: ${formatDuration(day.ms)}`
        return (
          <div key={day.key} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-16 w-full items-end rounded bg-card2" title={label} aria-label={label}>
              {day.ms > 0 && (
                <div
                  className="w-full rounded bg-brand"
                  // Floor at 8% so a short but real day is still a mark on the
                  // page — a one-pixel bar reads as "nothing", which is a lie.
                  style={{ height: `${Math.max(8, height)}%` }}
                />
              )}
            </div>
            <span className={`text-[10px] ${i === week.length - 1 ? 'font-bold text-ink' : 'text-muted'}`}>
              {weekdayOf(day.key).slice(0, 1)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Progress and skills, told kindly — encouraging, not a data dump. */
export function Dashboard({ onBack }: DashboardProps) {
  const cards = useStore(s => s.cards)
  const skills = useStore(s => s.skills)
  const unlockedLevel = useStore(s => s.unlockedLevel)
  const streak = useStore(s => s.streak)
  const bestDay = useStore(s => s.bestDay)
  const studyLog = useStore(s => s.studyLog)

  const now = Date.now()
  const time = studySummary(studyLog, now)
  const known = totalKnown(cards)
  const due = totalDue(cards, now)
  const rows = skillSummary(skills)
  const weakest = weakestSkill(skills)
  const breakdown = levelBreakdown(cards, cardIdsByLevel)
  const atTopLevel = unlockedLevel >= 4
  const progress = levelProgress(cardIdsByLevel[unlockedLevel], cards)

  return (
    <div className="flex flex-col gap-5 pt-2">
      <ScreenHeader title="Progress" onBack={onBack} />

      <Card className="flex flex-col gap-3">
        {/* The badge stands alone now. It used to share this row with a
          * "Retake test" button; nothing here can change her level any more,
          * because only working through the level does that. */}
        <Chip tone="brand" className="self-start text-sm">
          {LEVEL_EMOJI[unlockedLevel]} {LEVEL_NAMES[unlockedLevel]} · {LEVEL_TITLES[unlockedLevel]}
        </Chip>
        {atTopLevel ? (
          <p className="text-sm font-bold text-ink">Top level — keep it sharp 🏔️</p>
        ) : (
          // valueText={null}: on a fresh profile this bar sits at 0 progress,
          // and printing "0%" would trip the same rule that protects the
          // skill rows below — a bar with no number is still honest, and the
          // label already says what it's measuring.
          <Meter
            label={`Progress toward ${LEVEL_NAMES[(unlockedLevel + 1) as Level]}`}
            value={progress}
            valueText={null}
          />
        )}
      </Card>

      {weakest && (
        <Card className="bg-card2">
          <p className="text-sm text-ink">
            {SKILL_LABELS[weakest]} could use some love — your next session will focus there.
          </p>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <p className="font-bold text-ink">Time studied</p>
          <span className="text-sm text-muted">
            {time.todayMs > 0 ? `${formatDuration(time.todayMs)} today` : 'nothing yet today'}
          </span>
        </div>

        <WeekStrip week={time.week} />

        {time.daysStudied === 0 ? (
          // Day one, and after the update that added the clock. Saying "0 h"
          // three times over would read as a scolding for something she has
          // not had the chance to do yet.
          <p className="text-sm text-muted">
            The clock starts the moment you open a session — come back after one and this
            fills in.
          </p>
        ) : (
          <div className="flex justify-between gap-2 text-center">
            <div className="flex-1">
              <p className="text-base font-extrabold text-ink">{formatCompact(time.weekMs)}</p>
              <p className="text-xs text-muted">this week</p>
            </div>
            <div className="flex-1">
              <p className="text-base font-extrabold text-ink">{formatCompact(time.averageMs)}</p>
              <p className="text-xs text-muted">per study day</p>
            </div>
            <div className="flex-1">
              <p className="text-base font-extrabold text-ink">{formatCompact(time.totalMs)}</p>
              <p className="text-xs text-muted">
                all time · {time.daysStudied} {time.daysStudied === 1 ? 'day' : 'days'}
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <p className="font-bold text-ink">Skills</p>
        {rows.map(row => (
          <SkillRow key={row.skill} skill={row.skill} total={row.total} accuracy={row.accuracy} />
        ))}
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="font-bold text-ink">Words learned</p>
          <span className="text-lg font-extrabold text-ink">{known}</span>
        </div>
        <div className="flex flex-col gap-2">
          {LEVELS.map(level => {
            const stats = breakdown[level]
            // Level 4 has no B2 content yet (Task 22) — an empty level has
            // nothing to break down, and "0/0" or "NaN%" would just confuse
            // her, so this row is skipped until there is something to show,
            // the same convention Home.tsx already uses for empty levels.
            if (stats.total === 0) return null
            // Titles rather than CEFR codes here: the badge above already
            // owns the "A2"-style code for her current level, and repeating
            // it in this list is confusing to read as a screen and, for a
            // level that matches her current one, makes an element's text
            // ambiguous with the badge above.
            return (
              <div key={level} data-testid={`level-breakdown-${level}`} className="flex items-center justify-between text-sm">
                <span className="text-muted">{LEVEL_EMOJI[level]} {LEVEL_TITLES[level]}</span>
                <span className="text-ink">{stats.known}/{stats.total}</span>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="flex flex-col items-center gap-1 py-3 text-center">
          <span className="text-2xl">🔥</span>
          <span className="text-lg font-extrabold text-ink">{streak}</span>
          <span className="text-xs text-muted">day streak</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 py-3 text-center">
          <span className="text-2xl">⏰</span>
          <span className="text-lg font-extrabold text-ink">{due}</span>
          <span className="text-xs text-muted">due today</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 py-3 text-center">
          <span className="text-2xl">🏆</span>
          <span className="text-lg font-extrabold text-ink">{bestDay}</span>
          <span className="text-xs text-muted">best day</span>
        </Card>
      </div>
    </div>
  )
}
