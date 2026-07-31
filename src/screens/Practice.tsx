import type { Screen } from '../App'
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
  { screen: 'earTraining', emoji: '👂', title: 'Ear training', desc: 'Kiwi vowels: is that pen or pin, bad or bed?' },
]

/** One hub for every speaking and listening exercise, so Home stays tidy —
 * a simple menu, not a study mode of its own. */
export function Practice({ onBack, onNavigate }: PracticeProps) {
  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title="Practice" onBack={onBack} />

      <div className="flex flex-col gap-3">
        {OPTIONS.map(opt => (
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
