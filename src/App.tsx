import { useEffect, useState } from 'react'
import { warmUp } from './audio/speak'
import { useStore } from './store/useStore'
import { LEVEL_NAMES } from './core/leveling'
import { Button, ScreenHeader, Toast } from './components/ui'
import { Name } from './screens/Name'
import { Placement } from './screens/Placement'
import { Home } from './screens/Home'
import { Session } from './screens/Session'
import { Dashboard } from './screens/Dashboard'
import { ConjugationTable } from './screens/ConjugationTable'
import { Shadowing } from './screens/Shadowing'
import { Plan } from './screens/Plan'
import { Dialogues } from './screens/Dialogues'

export type Screen =
  | 'home' | 'name' | 'placement' | 'session' | 'dashboard'
  | 'plan' | 'dialogues' | 'shadowing' | 'settings' | 'done' | 'conjugation'

/** A screen that has not landed yet (Tasks 20-25) — an honest placeholder, not a dead button. */
function ComingSoon({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div>
      <ScreenHeader title={title} onBack={onBack} />
      <p className="px-1 text-sm text-muted">Coming soon 🥝</p>
    </div>
  )
}

function Done({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 pt-16 text-center">
      <p className="text-3xl">🥝</p>
      <p className="text-lg font-bold text-ink">Nice work — see you next time!</p>
      <Button variant="primary" onClick={onBack}>Back home</Button>
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')
  const [studyDeckId, setStudyDeckId] = useState<string | undefined>(undefined)
  // Set only when Shadowing was opened from one specific dialogue (via its
  // "Shadow this" button). Any other way of reaching Shadowing — Home's
  // Explore row included — clears it, so that entry point keeps its mixed
  // practice set rather than accidentally reusing a stale scope.
  const [shadowDialogueId, setShadowDialogueId] = useState<string | undefined>(undefined)

  const profileName = useStore(s => s.profileName)
  const placed = useStore(s => s.placed)
  const unlocked = useStore(s => s.unlocked)
  const clearUnlockToast = useStore(s => s.clearUnlockToast)

  useEffect(() => {
    const unlock = () => { warmUp(); document.removeEventListener('pointerdown', unlock) }
    document.addEventListener('pointerdown', unlock)
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  function goHome() {
    setScreen('home')
  }

  function handleStudy(deckId?: string) {
    setStudyDeckId(deckId)
    setScreen('session')
  }

  // Home's nav row (Progress/Plan/Dialogues/Shadowing/Settings) is a plain
  // "go to this screen" jump — it never carries a dialogue scope.
  function handleNavigate(next: Screen) {
    setShadowDialogueId(undefined)
    setScreen(next)
  }

  function handleShadowFromDialogue(dialogueId: string) {
    setShadowDialogueId(dialogueId)
    setScreen('shadowing')
  }

  // She got to Shadowing either from Home's Explore row (no dialogue scope —
  // back should return there) or from one specific dialogue's "Shadow this"
  // button (back should return to the dialogue list, not all the way home,
  // since that's the resource she was just reading and may want more of).
  function handleShadowingBack() {
    const backToDialogues = shadowDialogueId !== undefined
    setShadowDialogueId(undefined)
    setScreen(backToDialogues ? 'dialogues' : 'home')
  }

  function renderScreen() {
    if (!profileName) return <Name onNext={goHome} />
    if (!placed) return <Placement onDone={goHome} />

    switch (screen) {
      case 'session':
        return <Session deckId={studyDeckId} onDone={() => setScreen('done')} />
      case 'done':
        return <Done onBack={goHome} />
      case 'dashboard':
        return <Dashboard onBack={goHome} />
      case 'conjugation':
        return <ConjugationTable onBack={goHome} />
      case 'plan':
        return <Plan onBack={goHome} />
      case 'dialogues':
        return <Dialogues onBack={goHome} onShadow={handleShadowFromDialogue} />
      case 'shadowing':
        return <Shadowing dialogueId={shadowDialogueId} onBack={handleShadowingBack} />
      case 'settings':
        return <ComingSoon title="Settings" onBack={goHome} />
      default:
        return <Home onNavigate={handleNavigate} onStudy={handleStudy} />
    }
  }

  return (
    <div className="min-h-full bg-bg text-ink safe-top safe-bottom">
      <main className="mx-auto w-full max-w-md px-4 pb-8">
        {renderScreen()}
      </main>
      {unlocked !== null && (
        <Toast
          message={`🎉 New level unlocked: ${LEVEL_NAMES[unlocked]}`}
          onDismiss={clearUnlockToast}
        />
      )}
    </div>
  )
}
