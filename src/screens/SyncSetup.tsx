import { useState } from 'react'
import { useStore } from '../store/useStore'
import { validateSyncCode } from '../sync/client'
import { Button, Card } from '../components/ui'

export type SyncOutcome = 'merged' | 'pushed' | 'error'

export interface SyncSetupProps {
  /** She is set up and ready to go on — App sends her to Home. */
  onDone: () => void
  /** "Not now". Also Home, with no code set and nothing saved. */
  onSkip: () => void
  // The restore/merge/push path from App's single instance of useSync, passed
  // down the same way Settings receives it. This screen never mounts its own
  // copy of that hook: one set of debounced push timers and visibility
  // listeners per session, not one per screen that happens to render.
  onRestore: (code: string) => Promise<SyncOutcome>
}

/**
 * Why she is being asked this at all, in the order the questions actually
 * occur to her: what is it, what does it do for me, what do I do with it.
 *
 * Not "enter a sync code" — that names the field, not the reason, and a person
 * who does not know the reason skips the step. The reason is the whole point:
 * a real user studied for a day, opened the app the next morning from a
 * different place (Home Screen icon versus Safari tab, which on iOS can be two
 * separate stores) and found nothing there, because sync was opt-in and buried
 * in Settings and she had never been told it existed.
 *
 * "Write it down" is the one instruction, because a code she cannot remember
 * is a code that cannot bring her progress back.
 */
const WHY =
  "Pick a sync code — a word with a few numbers, like kiwi2026. It's how your progress gets saved, and how it comes with you if you ever change phone or use a computer. Write it down somewhere you'll find it again."

/**
 * Said plainly, once. This is not a password and the app must never let her
 * think it is one — there is no account and no recovery, so the honest framing
 * is "same code, same progress", which is also exactly how she gets her own
 * work back on a new device.
 */
const WHO =
  'Anyone who types this same code sees this same progress, so keep it to yourself.'

/**
 * The cost of "Not now", on the screen rather than buried.
 *
 * She is allowed to skip — a hard wall on first open is hostile, and Settings
 * can do this any day. What she is not allowed to do is skip it without
 * knowing what she gave up. The last sentence is the way back in, so the
 * paragraph ends on a door rather than a warning.
 */
const SKIP_NOTE =
  "Without a code, your progress stays on this device only. If the app gets cleared, or you open it somewhere else, it starts from zero. You can add a code any time in Settings."

/**
 * What actually happened, in her words.
 *
 * 'merged' is the recovery case — a lost phone, a fresh install, the Safari
 * tab that could not see the Home Screen app's storage — and it is the one
 * that has to read like relief. 'pushed' is the first-run case and its promise
 * is deliberately about *now*: the snapshot exists already, not after her
 * first card.
 */
const OUTCOME_MESSAGE: Record<SyncOutcome, string> = {
  merged: "✓ Found progress already saved under that code — it's all here, joined up with this device.",
  pushed: '✓ Saved. Your progress is in the cloud from right now.',
  error:
    "⚠︎ Couldn't reach the cloud just now. Check your internet and have another go — or carry on, and set this up later in Settings.",
}

/**
 * The second question of first run: her sync code.
 *
 * App only renders this when `isSyncConfigured()` is true. With an empty .env
 * there is no cloud to save to, so first run stays one question long rather
 * than showing her a field that can never do anything.
 *
 * Nothing here can trap her. A code that will not validate keeps her on the
 * screen with the reason in front of her; a code that validates but cannot
 * reach the network shows what went wrong and leaves both the retry and the
 * way out ("Not now") on screen. She reaches Home either way.
 */
export function SyncSetup({ onDone, onSkip, onRestore }: SyncSetupProps) {
  // Prefilled when she already has a code and came here from Home's status
  // line to check or change it. Empty on first run.
  const syncCode = useStore(s => s.syncCode)

  const [value, setValue] = useState(syncCode ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [outcome, setOutcome] = useState<SyncOutcome | null>(null)

  const saved = outcome === 'merged' || outcome === 'pushed'

  async function handleSave() {
    if (saving) return
    const trimmed = value.trim()
    const invalid = validateSyncCode(trimmed)
    setError(invalid)
    // An invalid code never reaches the network: no pull, no push, no code
    // adopted. She stays here with the reason under the field.
    if (invalid) return

    setSaving(true)
    setOutcome(null)
    // onRestore never rejects — it resolves 'error' instead (see useSync) — so
    // there is no failure mode in which she is left staring at a spinner.
    const result = await onRestore(trimmed)
    setOutcome(result)
    setSaving(false)
  }

  return (
    <div className="flex flex-col gap-5 pt-12">
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-3xl">☁️</p>
        <h1 className="text-2xl font-extrabold text-ink">Keep your progress safe</h1>
      </div>

      <Card className="flex flex-col gap-3">
        <p className="text-sm text-ink">{WHY}</p>
        <p className="text-sm text-muted">{WHO}</p>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink">Sync code</span>
          <input
            type="text"
            value={value}
            onChange={e => { setValue(e.target.value); setError(null); setOutcome(null) }}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            aria-label="Sync code"
            placeholder="a word plus some numbers, e.g. kiwi2026"
            className="min-h-[44px] w-full rounded-2xl border border-line bg-card2 px-4 text-ink"
          />
        </label>

        {error && <p className="text-sm text-again">{error}</p>}

        {outcome && (
          <p role="status" className="text-sm text-ink">
            {OUTCOME_MESSAGE[outcome]}
          </p>
        )}
      </Card>

      {/* Once it is saved, the only thing left to do is start — so the primary
        * button stops offering to save again and becomes the way forward. */}
      {saved ? (
        <Button variant="primary" onClick={onDone}>
          Let's go
        </Button>
      ) : (
        <Button variant="primary" disabled={saving} onClick={handleSave}>
          {saving ? 'Saving…' : 'Save my progress'}
        </Button>
      )}

      {/* Deliberately not a Button: skipping is a real option and it is right
        * there, but it must not compete with the thing that keeps her work.
        * Still a full 44px target — quiet is not the same as fiddly. */}
      {!saved && (
        <div className="flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] px-4 text-sm font-bold text-muted underline underline-offset-4 transition active:scale-[0.98]"
          >
            Not now
          </button>
          <p className="px-2 text-center text-xs text-muted">{SKIP_NOTE}</p>
        </div>
      )}
    </div>
  )
}
