import { useEffect, useState } from 'react'
import { setDefaultRate, warmUp } from './audio/speak'
import { useStore } from './store/useStore'
import { useSync } from './sync/useSync'
import { LEVEL_NAMES } from './core/leveling'
import { Button, Toast } from './components/ui'
import { Name } from './screens/Name'
import { Placement } from './screens/Placement'
import { Home } from './screens/Home'
import { Session } from './screens/Session'
import { Dashboard } from './screens/Dashboard'
import { ConjugationTable } from './screens/ConjugationTable'
import { Practice } from './screens/Practice'
import { Shadowing } from './screens/Shadowing'
import { Roleplay } from './screens/Roleplay'
import { Drills } from './screens/Drills'
import { EarTraining } from './screens/EarTraining'
import { Plan } from './screens/Plan'
import { Dialogues } from './screens/Dialogues'
import { Settings } from './screens/Settings'

export type Screen =
  | 'home' | 'name' | 'placement' | 'session' | 'dashboard'
  | 'plan' | 'practice' | 'dialogues' | 'shadowing' | 'roleplay' | 'drills' | 'earTraining'
  | 'settings' | 'done' | 'conjugation'

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
  // "Shadow this" button). Any other way of reaching Shadowing — Practice's
  // hub included — clears it, so that entry point keeps its mixed practice
  // set rather than accidentally reusing a stale scope.
  const [shadowDialogueId, setShadowDialogueId] = useState<string | undefined>(undefined)

  const profileName = useStore(s => s.profileName)
  const placed = useStore(s => s.placed)
  const unlocked = useStore(s => s.unlocked)
  const clearUnlockToast = useStore(s => s.clearUnlockToast)
  const retakePlacement = useStore(s => s.retakePlacement)
  const speechRate = useStore(s => s.speechRate)

  // Mounted once, for the whole session, regardless of which screen is
  // showing — this is what keeps progress pushed to the cloud in the
  // background. With no Supabase env vars it's a no-op: isSyncConfigured()
  // is false, so every effect inside short-circuits before touching a client.
  // Settings is a presentational consumer of this single instance (status +
  // restore passed down as props) rather than mounting its own — one set of
  // debounced push timers and visibility listeners per session, not one per
  // screen that happens to render Settings.
  const { status: syncStatus, restore: onRestore } = useSync()

  useEffect(() => {
    const unlock = () => { warmUp(); document.removeEventListener('pointerdown', unlock) }
    document.addEventListener('pointerdown', unlock)
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  // Keeps the audio layer's module-level default rate in sync with her
  // preference — on mount and every time she changes it in Settings.
  useEffect(() => {
    setDefaultRate(speechRate)
  }, [speechRate])

  function goHome() {
    setScreen('home')
  }

  // Dialogues, Role-play and Drills are all reached only through the
  // Practice hub now (Home's row no longer links to them directly), so back
  // from any of them returns to Practice, not Home. Shadowing is the one
  // exception — see handleShadowingBack below.
  function backToPractice() {
    setScreen('practice')
  }

  function handleStudy(deckId?: string) {
    setStudyDeckId(deckId)
    setScreen('session')
  }

  // Home's nav row (Progress/Plan/Practice/Settings) and Practice's own menu
  // (Dialogues/Shadowing/Role-play/Drills) are both plain "go to this
  // screen" jumps — neither ever carries a dialogue scope.
  function handleNavigate(next: Screen) {
    setShadowDialogueId(undefined)
    setScreen(next)
  }

  function handleShadowFromDialogue(dialogueId: string) {
    setShadowDialogueId(dialogueId)
    setScreen('shadowing')
  }

  // placed=false makes renderScreen() show Placement regardless of `screen`
  // (see below) — resetting to 'home' just keeps state tidy for when she
  // finishes it and lands back on Home rather than on Settings.
  function handleRetakePlacement() {
    retakePlacement()
    setScreen('home')
  }

  // She got to Shadowing either from Practice's hub (no dialogue scope —
  // back should return there) or from one specific dialogue's "Shadow this"
  // button (back should return to the dialogue list, not all the way to
  // Practice, since that's the resource she was just reading and may want
  // more of).
  function handleShadowingBack() {
    const backToDialogues = shadowDialogueId !== undefined
    setShadowDialogueId(undefined)
    setScreen(backToDialogues ? 'dialogues' : 'practice')
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
        return <Dashboard onBack={goHome} onRetakePlacement={handleRetakePlacement} />
      case 'conjugation':
        return <ConjugationTable onBack={goHome} />
      case 'plan':
        return <Plan onBack={goHome} />
      case 'practice':
        return <Practice onBack={goHome} onNavigate={handleNavigate} />
      case 'dialogues':
        return <Dialogues onBack={backToPractice} onShadow={handleShadowFromDialogue} />
      case 'shadowing':
        return <Shadowing dialogueId={shadowDialogueId} onBack={handleShadowingBack} />
      case 'roleplay':
        return <Roleplay onBack={backToPractice} />
      case 'drills':
        return <Drills onBack={backToPractice} />
      case 'earTraining':
        return <EarTraining onBack={backToPractice} />
      case 'settings':
        return (
          <Settings
            onBack={goHome}
            onRetakePlacement={handleRetakePlacement}
            syncStatus={syncStatus}
            onRestore={onRestore}
          />
        )
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
