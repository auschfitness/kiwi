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

export type Screen =
  | 'home' | 'name' | 'placement' | 'session' | 'dashboard'
  | 'plan' | 'dialogues' | 'shadowing' | 'settings' | 'done'

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
      case 'plan':
        return <ComingSoon title="8-week plan" onBack={goHome} />
      case 'dialogues':
        return <ComingSoon title="Dialogues" onBack={goHome} />
      case 'shadowing':
        return <ComingSoon title="Shadowing" onBack={goHome} />
      case 'settings':
        return <ComingSoon title="Settings" onBack={goHome} />
      default:
        return <Home onNavigate={setScreen} onStudy={handleStudy} />
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
