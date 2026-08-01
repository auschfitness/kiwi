import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import type { CreateOutcome, SignInOutcome, SyncOutcome } from '../sync/client'
import { Button, Card } from '../components/ui'
import { SyncCodeForm } from './SyncCodeForm'

export interface SyncSetupProps {
  /**
   * True when this is the gate: she has no code, the build has a cloud, and
   * there is no way past except setting one up — or the cloud being down.
   */
  mandatory: boolean
  /** She is set up and ready to go on — App sends her to Home. */
  onDone: () => void
  /**
   * Only ever offered when the cloud could not be reached. App remembers the
   * code is still owed and puts the gate back the moment she is online again.
   */
  onDefer?: () => void
  /** Present only when the code is not owed: her way back to Home unchanged. */
  onCancel?: () => void
  // The create/sign-in pair from App's single instance of useSync, passed down
  // the same way Settings receives them. This screen never mounts its own copy
  // of that hook: one set of debounced push timers and visibility listeners
  // per session, not one per screen that happens to render.
  onCreate: (code: string) => Promise<CreateOutcome>
  onSignIn: (code: string) => Promise<SignInOutcome>
}

/**
 * Why there is no "Not now" any more, said once and without menace.
 *
 * The owner made the code mandatory, and the reason is the one thing she cares
 * about: a device-only profile is one cleared browser away from nothing. So
 * the note explains the requirement rather than announcing it.
 */
const REQUIRED_NOTE =
  "Your code is the one thing that keeps your work safe, so it's the one thing we ask for before you start. It only takes a moment."

/**
 * The single honest exception, and the reason it exists.
 *
 * She is moving countries. An aeroplane, a new SIM, a dead café wifi — locking
 * her out of studying because Supabase timed out would be indefensible. So
 * when the cloud genuinely cannot be reached the door opens, and the app says
 * plainly that the question is only postponed, not dropped.
 */
const OFFLINE_NOTE =
  "No internet just now? That's alright — carry on studying, and we'll ask for your code as soon as you're back online. Nothing you do in the meantime gets lost."

/** True unless the browser positively says otherwise. */
function browserOnline(): boolean {
  return typeof navigator === 'undefined' || navigator.onLine !== false
}

/**
 * The second question of first run: her sync code. Now a real account key —
 * one code, one account, nobody else can hold it.
 *
 * App only renders this when `isSyncConfigured()` is true. With an empty .env
 * there is no cloud to save to, no way to check whether a code is free, and
 * nothing a code could do — so first run stays one question long rather than
 * gating her behind a field that can never answer.
 *
 * Nothing here can trap her, even though it is mandatory. A code that will not
 * validate keeps her on the screen with the reason under the field; a code
 * that cannot be checked because the cloud is unreachable opens the door, with
 * the promise that the question comes back. What she cannot do is walk past a
 * cloud that is perfectly reachable.
 */
export function SyncSetup({
  mandatory, onDone, onDefer, onCancel, onCreate, onSignIn,
}: SyncSetupProps) {
  // Prefilled when she already has a code and came here from Home's status
  // line to check or change it. Empty on first run.
  const syncCode = useStore(s => s.syncCode)

  const [done, setDone] = useState(false)
  const [unreachable, setUnreachable] = useState(false)
  const [online, setOnline] = useState(browserOnline)

  // A browser that already knows it is offline should not make her type a code
  // and press a button to find that out. Either signal — the browser's, or a
  // request that actually failed — opens the door.
  useEffect(() => {
    const up = () => { setOnline(true); setUnreachable(false) }
    const down = () => setOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  function handleOutcome(outcome: SyncOutcome) {
    if (outcome === 'created' || outcome === 'merged') { setDone(true); return }
    if (outcome === 'unreachable') setUnreachable(true)
  }

  const canDefer = mandatory && onDefer !== undefined && (unreachable || !online)

  return (
    <div className="flex flex-col gap-5 pt-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-3xl">☁️</p>
        <h1 className="text-2xl font-extrabold text-ink">Keep your progress safe</h1>
      </div>

      <Card>
        <SyncCodeForm
          initialMode={syncCode ? 'signin' : 'create'}
          initialValue={syncCode ?? ''}
          onCreate={onCreate}
          onSignIn={onSignIn}
          onOutcome={handleOutcome}
        />
      </Card>

      {/* Once it is saved, the only thing left to do is start — so the screen
        * stops asking and becomes the way forward. */}
      {done && (
        <Button variant="primary" onClick={onDone}>
          Let's go
        </Button>
      )}

      {!done && mandatory && !canDefer && (
        <p className="px-2 text-center text-xs text-muted">{REQUIRED_NOTE}</p>
      )}

      {/* Deliberately not a primary Button: this is the exception, not the
        * road. Still a full 44px target — quiet is not the same as fiddly. */}
      {!done && canDefer && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onDefer}
            className="min-h-[44px] px-4 text-sm font-bold text-muted underline underline-offset-4 transition active:scale-[0.98]"
          >
            Carry on for now
          </button>
          <p className="px-2 text-center text-xs text-muted">{OFFLINE_NOTE}</p>
        </div>
      )}

      {!done && !mandatory && onCancel && (
        <Button variant="ghost" size="md" onClick={onCancel}>
          Back home
        </Button>
      )}
    </div>
  )
}
