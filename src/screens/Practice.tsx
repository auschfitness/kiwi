import type { Screen } from '../App'
import { ACTIVE_COURSE } from '../courses'
import type { PracticeFeature } from '../courses/types'
import { ScreenHeader } from '../components/ui'

export interface PracticeProps {
  onBack: () => void
  /** Every card here is a plain "go to this screen" jump — same rule as
   * Home's own nav row: it never carries a dialogue scope. */
  onNavigate: (screen: Screen) => void
}

interface PracticeOption {
  screen: Screen
  emoji: string
  title: string
  desc: string
}

const OPTIONS: PracticeOption[] = [
  { screen: 'dialogues', emoji: '🗣️', title: 'Dialogues', desc: 'Listen to real conversations and read along.' },
  { screen: 'shadowing', emoji: '🐢', title: 'Shadowing', desc: 'Repeat after a speaker and check how you sound.' },
  { screen: 'roleplay', emoji: '🎭', title: 'Role-play', desc: 'Act out everyday scenes, like ordering coffee.' },
  { screen: 'drills', emoji: '🔢', title: 'Drills', desc: 'Quick reps for numbers, prices, times and dates.' },
  { screen: 'earTraining', emoji: '👂', title: 'Ear training', desc: "Is that latter or ladder, sheep or ship?" },
]

/** One hub for every speaking and listening exercise, so Home stays tidy —
 * a simple menu, not a study mode of its own. */
export function Practice({ onBack, onNavigate }: PracticeProps) {
  // Only what this course has material for. A course showing a screen it
  // cannot fill would be worse than a shorter list.
  const options = OPTIONS.filter(o => ACTIVE_COURSE.practice.includes(o.screen as PracticeFeature))

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title="Practice" onBack={onBack} />

      <div className="flex flex-col gap-3">
        {options.map(opt => (
          <button
            key={opt.screen}
            type="button"
            data-testid={`practice-${opt.screen}`}
            onClick={() => onNavigate(opt.screen)}
            className="flex min-h-[56px] items-center gap-3 rounded-card border border-line bg-card p-4 text-left transition active:scale-[0.98]"
          >
            <span className="text-2xl" aria-hidden="true">{opt.emoji}</span>
            <span className="flex-1">
              <span className="block font-bold text-ink">{opt.title}</span>
              <span className="block text-sm text-muted">{opt.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
