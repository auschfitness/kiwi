import { useEffect, useState } from 'react'
import { setDefaultRate, warmUp } from './audio/speak'
import { useStore } from './store/useStore'
import { useStudyClock } from './store/useStudyClock'
import { formatDuration } from './core/studyTime'
import { useSync } from './sync/useSync'
import { isSyncConfigured } from './sync/client'
import { LEVEL_NAMES } from './core/leveling'
import { shouldNudge } from './core/reminder'
import { useReminders } from './notify/delivery'
import { dayKey } from './core/time'
import { Button, Toast } from './components/ui'
import { Name } from './screens/Name'
import { SyncSetup } from './screens/SyncSetup'
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

/** Warm, short, and gone in four seconds. It nudges; it never blocks. */
const NUDGE_MESSAGE = 'Time for a little English 🥝 — keep your 🔥 streak alive'

export type Screen =
  | 'home' | 'name' | 'sync' | 'session' | 'dashboard'
  | 'plan' | 'practice' | 'dialogues' | 'shadowing' | 'roleplay' | 'drills' | 'earTraining'
  | 'settings' | 'done' | 'conjugation'

/**
 * The screens whose time counts as study — the ones where she is working at
 * the language rather than reading about her progress. Home, Progress, Plan,
 * Settings and the sync screens are deliberately not here: time spent
 * admiring the streak is not time spent earning it.
 *
 * `practice` is the hub, not a practice: it is a list of buttons, so it counts
 * for nothing until she picks one.
 */
const STUDY_SCREENS: ReadonlySet<Screen> = new Set<Screen>([
  'session', 'dialogues', 'shadowing', 'roleplay', 'drills', 'earTraining',
])

function Done({ onBack }: { onBack: () => void }) {
  // The sitting she has just finished. The clock stopped when she left the
  // session; it is not reset until the next one starts, which is what lets
  // this screen still report it.
  const sessionMs = useStore(s => s.sessionMs)
  const todayMs = useStore(s => s.studyLog?.[dayKey(Date.now())] ?? 0)

  return (
    <div className="flex flex-col items-center gap-6 pt-16 text-center">
      <p className="text-3xl">🥝</p>
      <p className="text-lg font-bold text-ink">Nice work — see you next time!</p>
      {sessionMs > 0 && (
        <p className="text-sm text-muted" data-testid="session-time">
          <span className="font-bold text-ink">{formatDuration(sessionMs)}</span> this session
          {todayMs > sessionMs && <> · {formatDuration(todayMs)} today</>}
        </p>
      )}
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
  /**
   * How an owed code is represented: a session-only "we already asked, the
   * cloud was down, let her study" flag — and nothing else.
   *
   * There is deliberately no persisted `syncCodeOwed` field. Since the code
   * became mandatory, "configured, and no code set" *is* the owed state; a
   * second stored flag could only ever disagree with the first. Not persisting
   * this one is the point: a reload, a new day, or the browser firing `online`
   * all put the question straight back in front of her, which is exactly what
   * "do not silently drop it" means.
   */
  const [codeDeferred, setCodeDeferred] = useState(false)

  /**
   * Whether the sync-code step is on screen right now.
   *
   * Latched rather than derived straight from "no code set", and that is not
   * an accident: the instant she claims a code the owed condition goes false,
   * so a purely derived gate would unmount itself mid-success and she would
   * never see "that code is yours now". She leaves this step when she says so
   * — "Let's go", or the offline "Carry on for now" — and not a moment before.
   *
   * Seeded at mount so first run goes name -> code with no flash of Home in
   * between; the effect below is what re-raises it later.
   */
  const [askingForCode, setAskingForCode] = useState(
    () => isSyncConfigured() && useStore.getState().syncCode === null,
  )

  // One clock for the whole app, driven by which screen is up. Putting it here
  // rather than inside each study screen means there is a single list of what
  // counts (STUDY_SCREENS) instead of six screens each remembering to start it.
  useStudyClock(STUDY_SCREENS.has(screen))

  const profileName = useStore(s => s.profileName)
  const syncCode = useStore(s => s.syncCode)
  const unlocked = useStore(s => s.unlocked)
  const clearUnlockToast = useStore(s => s.clearUnlockToast)
  const speechRate = useStore(s => s.speechRate)
  const doneToday = useStore(s => s.doneToday)
  const doneDate = useStore(s => s.doneDate)

  // Layer 1 of the daily reminder: the in-app nudge. Decided once, when the
  // app opens — an empty dep array, and `getState()` rather than a
  // subscription, so no re-render can re-ask the question and no store change
  // can re-raise a toast she has already seen this visit.
  const [nudging, setNudging] = useState(false)
  useEffect(() => {
    if (shouldNudge(useStore.getState(), Date.now())) setNudging(true)
  }, [])

  // Mounted once, for the whole session, regardless of which screen is
  // showing — this is what keeps progress pushed to the cloud in the
  // background. With no Supabase env vars it's a no-op: isSyncConfigured()
  // is false, so every effect inside short-circuits before touching a client.
  // Settings is a presentational consumer of this single instance (status +
  // restore passed down as props) rather than mounting its own — one set of
  // debounced push timers and visibility listeners per session, not one per
  // screen that happens to render Settings.
  const { status: syncStatus, createAccount, signIn } = useSync()

  /**
   * The code is owed until she sets one. Derived, never stored — see
   * `codeDeferred` above and `syncLineState` in src/sync/status.ts.
   */
  const codeOwed = isSyncConfigured() && !syncCode

  // Re-raise the step whenever a code is owed and there is no live excuse.
  // Two things reach it: the deferral expiring (below), and "Reset progress"
  // in Settings clearing the code she had. It cannot fire on success — a
  // claimed code makes `codeOwed` false in the same commit.
  useEffect(() => {
    if (codeOwed && !codeDeferred) setAskingForCode(true)
  }, [codeOwed, codeDeferred])

  // "Prompt for it from Home as soon as she is online." The browser telling us
  // the connection is back is the moment the excuse expires.
  useEffect(() => {
    const askAgain = () => setCodeDeferred(false)
    window.addEventListener('online', askAgain)
    return () => window.removeEventListener('online', askAgain)
  }, [])

  // Layers 2 and 3 of the daily reminder: a Web Push subscription if the
  // backend exists, otherwise a locally scheduled notification where the
  // browser can do it, otherwise nothing at all and Layer 1 above carries the
  // feature alone. Same deal as useSync: with an empty .env every path inside
  // short-circuits before touching a client, a service worker or a permission
  // — see src/notify/delivery.ts for the ordering rule.
  useReminders()

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

  // First run is two questions long: her name, then her sync code, then Home.
  // There is no test to sit and nothing to skip on the way up — everyone
  // starts at A1 and unlocks A2 by actually working through A1 (see
  // src/core/leveling.ts). The sync question is the one thing standing between
  // her and a device-only profile that a cleared browser can erase, so it is
  // now required rather than offered — and it disappears entirely when the
  // build has no cloud to save to.
  //
  // The gate is scoped to Home on purpose. It catches first run, because
  // `screen` starts as 'home'; it catches a returning profile that still has
  // no code; and when the browser comes back online mid-session it waits until
  // she is out of the session rather than yanking her off a card she is
  // halfway through answering.
  function renderScreen() {
    if (!profileName) return <Name onNext={goHome} />

    if (askingForCode && screen === 'home') {
      return (
        <SyncSetup
          mandatory
          onDone={() => { setAskingForCode(false); goHome() }}
          onDefer={() => { setCodeDeferred(true); setAskingForCode(false) }}
          onCreate={createAccount}
          onSignIn={signIn}
        />
      )
    }

    switch (screen) {
      case 'sync':
        // The same screen, reached later from Home's status line — her way to
        // check the code she has, or to move this device to another account.
        return (
          <SyncSetup
            mandatory={false}
            onDone={goHome}
            onCancel={goHome}
            onCreate={createAccount}
            onSignIn={signIn}
          />
        )

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
            syncStatus={syncStatus}
            onCreate={createAccount}
            onSignIn={signIn}
          />
        )
      default:
        return <Home onNavigate={handleNavigate} onStudy={handleStudy} syncStatus={syncStatus} />
    }
  }

  // The moment she answers her first card the nudge has done its job, so it
  // gets out of the way mid-visit too — derived, not a second piece of state
  // to keep in step.
  const showNudge = nudging && !(doneDate === dayKey(Date.now()) && doneToday > 0)

  return (
    <div className="min-h-full bg-bg text-ink safe-top safe-bottom">
      <main className="mx-auto w-full max-w-md px-4 pb-8">
        {renderScreen()}
      </main>
      {/* One toast slot: both of these are pinned to the same corner, so an
        * unlock — which she earned — takes it, and the nudge waits for her
        * next visit rather than stacking on top of the celebration. */}
      {unlocked !== null ? (
        <Toast
          message={`🎉 New level unlocked: ${LEVEL_NAMES[unlocked]}`}
          onDismiss={clearUnlockToast}
        />
      ) : (
        showNudge && <Toast message={NUDGE_MESSAGE} onDismiss={() => setNudging(false)} />
      )}
    </div>
  )
}
