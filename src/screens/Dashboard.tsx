import type { Level, Skill } from '../types'
import { useStore, cardIdsByLevel } from '../store/useStore'
import { totalKnown, totalDue } from '../core/srs'
import { levelProgress, LEVEL_NAMES, LEVEL_EMOJI, LEVEL_TITLES } from '../core/leveling'
import { skillSummary, weakestSkill, levelBreakdown } from '../core/stats'
import { Card, Chip, ScreenHeader } from '../components/ui'

export interface DashboardProps {
  onBack: () => void
}

const SKILL_LABELS: Record<Skill, string> = {
  vocab: 'Vocab', listening: 'Listening', grammar: 'Grammar', speaking: 'Speaking',
}

const SKILL_TONE: Record<Skill, 'brand' | 'good' | 'gold' | 'hard'> = {
  vocab: 'brand', listening: 'good', grammar: 'gold', speaking: 'hard',
}

const TONE_BAR: Record<'brand' | 'good' | 'gold' | 'hard', string> = {
  brand: 'bg-brand', good: 'bg-good', gold: 'bg-gold', hard: 'bg-hard',
}

const LEVELS: Level[] = [1, 2, 3, 4]

/** One skill row. Practised skills show accuracy and a filled bar; an
 * unpractised skill must never read "0%" — that would tell her she is bad
 * at something she was never asked to do (e.g. speaking, with no speech
 * recognition on iOS Safari). */
function SkillRow({ skill, total, accuracy }: {
  skill: Skill; total: number; accuracy: number | null
}) {
  const tone = SKILL_TONE[skill]
  const label = SKILL_LABELS[skill]
  const pct = accuracy === null ? 0 : accuracy

  return (
    <div>
      <p className="mb-1 text-sm text-ink">
        {accuracy === null
          ? <>{label} — <span className="text-muted">not practised yet</span></>
          : <>{label} — <span className="font-bold">{accuracy}% · {total} reviews</span></>}
      </p>
      <div className="h-2 w-full overflow-hidden rounded-full bg-card2">
        <div className={`h-full rounded-full ${TONE_BAR[tone]}`} style={{ width: `${pct}%` }} />
      </div>
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

  const now = Date.now()
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
        <Chip tone="brand" className="self-start text-sm">
          {LEVEL_EMOJI[unlockedLevel]} {LEVEL_NAMES[unlockedLevel]} · {LEVEL_TITLES[unlockedLevel]}
        </Chip>
        {atTopLevel ? (
          <p className="text-sm font-bold text-ink">Top level — keep it sharp 🏔️</p>
        ) : (
          <div>
            {/* No numeric readout here: on a fresh profile this bar sits at
             * 0 progress, and printing "0%" would trip the same rule that
             * protects the skill rows below — a bar with no number is still
             * honest, and the label already says what it's measuring. */}
            <p className="mb-1 text-xs text-muted">
              Progress toward {LEVEL_NAMES[(unlockedLevel + 1) as Level]}
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-card2">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${Math.min(1, Math.max(0, progress)) * 100}%` }}
              />
            </div>
          </div>
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
