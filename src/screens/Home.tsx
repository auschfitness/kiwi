import { useMemo } from 'react'
import type { Screen } from '../App'
import type { Level } from '../types'
import { useStore, cardIdsByLevel } from '../store/useStore'
import { DECKS, decksForLevel } from '../content'
import { totalKnown, totalDue, deckProgress, isNew } from '../core/srs'
import { levelProgress, LEVEL_NAMES, LEVEL_EMOJI, LEVEL_TITLES } from '../core/leveling'
import { skillSummary } from '../core/stats'
import { greeting, studyButtonLabel } from '../core/home'
import { Button, Card, Ring, Meter, Chip } from '../components/ui'

export interface HomeProps {
  onNavigate: (screen: Screen) => void
  onStudy: (deckId?: string) => void
}

const LEVELS: Level[] = [1, 2, 3, 4]

const SKILL_LABELS: Record<string, string> = {
  vocab: 'Vocab', listening: 'Listening', grammar: 'Grammar', speaking: 'Speaking',
}

/** Home is her daily front door — one study action, no mode buttons. */
export function Home({ onNavigate, onStudy }: HomeProps) {
  const profileName = useStore(s => s.profileName)
  const streak = useStore(s => s.streak)
  const cards = useStore(s => s.cards)
  const dailyGoal = useStore(s => s.dailyGoal)
  const doneToday = useStore(s => s.doneToday)
  const skills = useStore(s => s.skills)
  const unlockedLevel = useStore(s => s.unlockedLevel)

  const now = Date.now()
  const known = totalKnown(cards)
  const due = totalDue(cards, now)

  // newAvailable is scoped to unlocked decks only — offering "Learn new
  // words" for content she can't reach yet would be a lie.
  const newAvailable = useMemo(
    () => decksForLevel(unlockedLevel).flatMap(d => d.cards).filter(c => isNew(cards[c.id])).length,
    [unlockedLevel, cards],
  )

  const label = studyButtonLabel(due, newAvailable)
  const studyDisabled = due === 0 && newAvailable === 0

  const decksByLevel = useMemo(() => {
    const out: Record<Level, typeof DECKS> = { 1: [], 2: [], 3: [], 4: [] }
    for (const deck of DECKS) out[deck.level].push(deck)
    return out
  }, [])

  const skillRows = skillSummary(skills)

  return (
    <div className="flex flex-col gap-5 pt-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-ink">Kia ora, {profileName} 👋</h1>
          <p className="text-sm text-muted">{greeting(now)}</p>
        </div>
        <button
          type="button"
          aria-label="Settings"
          onClick={() => onNavigate('settings')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card2 text-lg text-ink transition active:scale-[0.98]"
        >
          ⚙️
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <div data-testid="stat-streak">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-2xl">🔥</span>
            <span className="text-lg font-extrabold text-ink">{streak}</span>
            <span className="text-xs text-muted">day streak</span>
          </Card>
        </div>
        <div data-testid="stat-known">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-2xl">📚</span>
            <span className="text-lg font-extrabold text-ink">{known}</span>
            <span className="text-xs text-muted">words learned</span>
          </Card>
        </div>
        <div data-testid="stat-due">
          <Card className="flex flex-col items-center gap-1 py-3 text-center">
            <span className="text-2xl">⏰</span>
            <span className="text-lg font-extrabold text-ink">{due}</span>
            <span className="text-xs text-muted">to review</span>
          </Card>
        </div>
      </div>

      <Card className="flex items-center gap-4">
        <Ring value={dailyGoal > 0 ? doneToday / dailyGoal : 0} size={64}>
          <span className="text-sm font-extrabold text-ink">{doneToday}/{dailyGoal}</span>
        </Ring>
        <div>
          <p className="font-bold text-ink">Today's goal</p>
          <p className="text-sm text-muted">{doneToday} of {dailyGoal} cards done</p>
        </div>
      </Card>

      <Button
        variant="primary"
        data-testid="study-now"
        disabled={studyDisabled}
        onClick={() => onStudy(undefined)}
      >
        {label}
      </Button>

      <button
        type="button"
        aria-label="Skills overview"
        onClick={() => onNavigate('dashboard')}
        className="rounded-card border border-line bg-card p-4 text-left transition active:scale-[0.98]"
      >
        <div className="grid grid-cols-2 gap-3">
          {skillRows.map(row => (
            <Meter
              key={row.skill}
              label={SKILL_LABELS[row.skill] ?? row.skill}
              value={(row.accuracy ?? 0) / 100}
            />
          ))}
        </div>
      </button>

      <div className="flex gap-3">
        <div className="flex-1">
          <Button variant="ghost" size="md" onClick={() => onNavigate('dashboard')}>
            📊 Progress
          </Button>
        </div>
        <div className="flex-1">
          <Button variant="ghost" size="md" onClick={() => onNavigate('plan')}>
            🗺️ 8-week plan
          </Button>
        </div>
        <div className="flex-1">
          <Button variant="ghost" size="md" onClick={() => onNavigate('dialogues')}>
            🗣️ Dialogues
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {LEVELS.map(level => {
          const decks = decksByLevel[level]
          // Level 4's B2 content arrives in Task 22. An empty level has
          // nothing to show and levelProgress would be a meaningless 0%, so
          // skip the whole group rather than render a bare, empty header.
          if (decks.length === 0) return null

          const locked = level > unlockedLevel
          const progress = levelProgress(cardIdsByLevel[level], cards)

          return (
            <div key={level} className={locked ? 'opacity-50' : undefined}>
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-ink">
                  {LEVEL_EMOJI[level]} {LEVEL_NAMES[level]} — {LEVEL_TITLES[level]}
                </h2>
                <span className="text-xs text-muted">{Math.round(progress * 100)}%</span>
              </div>
              {locked && (
                <p className="px-1 text-xs text-muted">
                  🔒 Finish {LEVEL_NAMES[unlockedLevel]} to unlock
                </p>
              )}
              <div className="flex flex-col gap-2 pt-2">
                {decks.map(deck => {
                  const stats = deckProgress(deck, cards, now)
                  return (
                    <div key={deck.id} className="flex items-stretch gap-2">
                      <button
                        type="button"
                        data-testid={`deck-${deck.id}`}
                        disabled={locked}
                        onClick={() => onStudy(deck.id)}
                        className="flex min-h-[56px] flex-1 items-center gap-3 rounded-card border border-line bg-card p-3 text-left transition active:scale-[0.98] disabled:opacity-50"
                      >
                        <span className="text-2xl">{deck.emoji}</span>
                        <span className="flex-1">
                          <span className="block text-sm font-bold text-ink">{deck.name}</span>
                          <span className="block text-xs text-muted">
                            {stats.learned}/{stats.total} learned
                          </span>
                        </span>
                        {!locked && stats.due > 0 && <Chip tone="brand">{stats.due} due</Chip>}
                      </button>
                      {/* Reference table, not a study action — kept as a
                       * separate sibling button rather than nested inside
                       * the deck row so it stays reachable even when the
                       * deck is locked. */}
                      {deck.id === 'irregular' && (
                        <button
                          type="button"
                          aria-label="Conjugation table"
                          onClick={() => onNavigate('conjugation')}
                          className={`flex min-h-[56px] w-16 shrink-0 flex-col items-center justify-center gap-0.5 rounded-card border border-line bg-card2 text-ink transition active:scale-[0.98]${locked ? ' opacity-50' : ''}`}
                        >
                          <span className="text-base" aria-hidden="true">📋</span>
                          <span className="text-[10px] font-bold">Table</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
