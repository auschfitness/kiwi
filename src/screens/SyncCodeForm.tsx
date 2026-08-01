import { useState } from 'react'
import {
  validateSyncCode,
  type CreateOutcome, type SignInOutcome, type SyncMode, type SyncOutcome,
} from '../sync/client'
import { Button } from '../components/ui'

/**
 * Why she is being asked this at all, in the order the questions actually
 * occur to her: what is it, what does it do for me, what do I do with it.
 *
 * Not "enter a sync code" — that names the field, not the reason. The reason
 * is the whole point: a real user studied for a day, opened the app the next
 * morning from a different place (Home Screen icon versus Safari tab, which on
 * iOS can be two separate stores) and found nothing there.
 *
 * "Write it down" is the one instruction, because a code she cannot remember
 * is a code that cannot bring her progress back.
 */
const CREATE_WHY =
  "Pick a sync code — a word with a few numbers, like kiwi2026. It's how your progress gets saved, and how it comes with you if you ever change phone or use a computer. Write it down somewhere you'll find it again."

/**
 * Said plainly, once. The model changed: a code is now an account key that
 * nobody else can hold, so the old "anyone who types this same code" framing
 * would be wrong as well as alarming. What stays true — and matters more — is
 * that the code is the key to her progress and should stay hers.
 */
const CREATE_WHO =
  'One code, one account: once it is yours, nobody else can pick it. Anyone who types it sees your progress, so keep it to yourself.'

/** The second-device case, named as the ordinary thing it is. */
const SIGNIN_WHY =
  "Type the code you already use. We'll bring that progress over and join it up with anything you've done on this device. Same code, same account — this is how your phone and your computer stay in step."

/**
 * What actually happened, in her words.
 *
 * `taken` is the sentence this whole change exists for, and it must not read
 * as an accusation. She has not done anything wrong: a code is one-of-a-kind,
 * hers simply is not free, and there are two ways forward — a different code,
 * or signing in if the code is in fact her own. Both are on the screen.
 *
 * `unknown` is its mirror. A code that reaches nothing is nearly always a
 * typo, so the spelling comes first — and if it was not a typo, the way on is
 * to make the code hers, one tap away.
 */
const OUTCOME_MESSAGE: Record<SyncOutcome, string> = {
  created: '✓ That code is yours now. Your progress is in the cloud from right now.',
  merged: "✓ Found progress already saved under that code — it's all here, joined up with this device.",
  taken:
    'That code is already taken. Codes have to be one of a kind, so pick another one — adding a few numbers usually does it, like kiwi2026. If the code is your own, sign in with it instead.',
  unknown:
    "No account is using that code yet. Have a look at the spelling — or make the code yours now.",
  unreachable:
    "⚠︎ Couldn't reach the cloud just now. Check your internet and have another go.",
}

const MODES: { value: SyncMode; label: string }[] = [
  { value: 'create', label: "I'm new here" },
  { value: 'signin', label: 'I already have a code' },
]

export interface SyncCodeFormProps {
  /** 'signin' when she already has a code and came here to check or change it. */
  initialMode: SyncMode
  initialValue?: string
  onCreate: (code: string) => Promise<CreateOutcome>
  onSignIn: (code: string) => Promise<SignInOutcome>
  /**
   * Told about every settled attempt. The mandatory gate uses it twice: to
   * learn it may let her on ('created'/'merged'), and to learn the cloud is
   * unreachable, which is the one honest reason to offer a way past.
   */
  onOutcome?: (outcome: SyncOutcome) => void
}

/**
 * The one implementation of "create an account, or sign in to one".
 *
 * Shared by the onboarding gate and Settings on purpose: changing a code in
 * Settings has to go through the same taken/free question as first run, or the
 * uniqueness rule would hold in one place and not the other.
 */
export function SyncCodeForm({
  initialMode, initialValue = '', onCreate, onSignIn, onOutcome,
}: SyncCodeFormProps) {
  const [mode, setMode] = useState<SyncMode>(initialMode)
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [outcome, setOutcome] = useState<SyncOutcome | null>(null)

  const settled = outcome === 'created' || outcome === 'merged'

  async function attempt(as: SyncMode) {
    if (busy) return
    const trimmed = value.trim()
    const invalid = validateSyncCode(trimmed)
    setError(invalid)
    // An invalid code never reaches the network: no pull, no push, no code
    // claimed. She stays here with the reason under the field.
    if (invalid) return

    setBusy(true)
    setOutcome(null)
    const result = as === 'create' ? await onCreate(trimmed) : await onSignIn(trimmed)
    setOutcome(result)
    setBusy(false)
    onOutcome?.(result)
  }

  /** The one-tap way out of a refusal: same code, the other question. */
  async function crossOver(to: SyncMode) {
    setMode(to)
    await attempt(to)
  }

  function chooseMode(next: SyncMode) {
    setMode(next)
    setError(null)
    setOutcome(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {!settled && (
        <>
          <div role="radiogroup" aria-label="New code or existing code" className="grid grid-cols-2 gap-2">
            {MODES.map(m => (
              <button
                key={m.value}
                type="button"
                role="radio"
                aria-checked={mode === m.value}
                onClick={() => chooseMode(m.value)}
                className={`min-h-[44px] rounded-2xl border px-2 text-sm font-bold transition active:scale-[0.98] ${
                  mode === m.value ? 'border-brand bg-card2 text-brand' : 'border-line bg-card text-ink'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <p className="text-sm text-ink">{mode === 'create' ? CREATE_WHY : SIGNIN_WHY}</p>
          {mode === 'create' && <p className="text-sm text-muted">{CREATE_WHO}</p>}
        </>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-ink">Sync code</span>
        <input
          type="text"
          value={value}
          disabled={settled}
          onChange={e => { setValue(e.target.value); setError(null); setOutcome(null) }}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-label="Sync code"
          placeholder="a word plus some numbers, e.g. kiwi2026"
          className="min-h-[44px] w-full rounded-2xl border border-line bg-card2 px-4 text-ink disabled:opacity-70"
        />
      </label>

      {error && <p className="text-sm text-again">{error}</p>}

      {outcome && (
        <p role="status" className="text-sm text-ink">
          {OUTCOME_MESSAGE[outcome]}
        </p>
      )}

      {!settled && (
        <Button variant="primary" size="md" disabled={busy} onClick={() => void attempt(mode)}>
          {busy
            ? 'Checking…'
            : mode === 'create' ? 'Make this code mine' : 'Sign in with this code'}
        </Button>
      )}

      {/* The refusals, each with the other question one tap away. */}
      {outcome === 'taken' && (
        <Button variant="ghost" size="md" onClick={() => void crossOver('signin')}>
          Sign in with this code instead
        </Button>
      )}
      {outcome === 'unknown' && (
        <Button variant="ghost" size="md" onClick={() => void crossOver('create')}>
          Create this code instead
        </Button>
      )}

      {settled && (
        <button
          type="button"
          onClick={() => { setOutcome(null); setError(null) }}
          className="min-h-[44px] px-4 text-sm font-bold text-muted underline underline-offset-4 transition active:scale-[0.98]"
        >
          Use a different code
        </button>
      )}
    </div>
  )
}
