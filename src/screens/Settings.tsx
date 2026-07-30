import { useState } from 'react'
import type { Accent } from '../types'
import { useStore } from '../store/useStore'
import { isSyncConfigured, validateSyncCode, type SyncStatus } from '../sync/client'
import { Button, Card, Chip, ScreenHeader } from '../components/ui'

export interface SettingsProps {
  onBack: () => void
  onRetakePlacement: () => void
  // Sync status + restore action live in App's single instance of the sync
  // hook — Settings is a presentational consumer of them, not a second
  // mount of that hook (which would double the debounced push timers, the
  // visibilitychange/pagehide listeners, and the launch pull).
  syncStatus: SyncStatus
  onRestore: (code: string) => Promise<'merged' | 'pushed' | 'error'>
}

const ACCENTS: { value: Accent; label: string }[] = [
  { value: 'en-NZ', label: '🇳🇿 NZ' },
  { value: 'en-AU', label: '🇦🇺 AU' },
  { value: 'en-GB', label: '🇬🇧 UK' },
  { value: 'en-US', label: '🇺🇸 US' },
]

type LiveStatus = 'syncing' | 'synced' | 'offline' | 'error'

const STATUS_LABEL: Record<LiveStatus, string> = {
  syncing: '⟳ syncing',
  synced: '✓ synced',
  offline: '⚠︎ offline',
  error: '⚠︎ error',
}

const STATUS_TONE: Record<LiveStatus, 'brand' | 'good' | 'hard'> = {
  syncing: 'brand',
  synced: 'good',
  offline: 'hard',
  error: 'hard',
}

function isLiveStatus(s: string): s is LiveStatus {
  return s === 'syncing' || s === 'synced' || s === 'offline' || s === 'error'
}

/**
 * A +/- control with a label naming what it changes — never bare symbols.
 *
 * `announceAs` lets the +/- buttons describe the change in different words
 * than the group's own visible/labelled name. That's not decoration: the
 * group already exposes an accessible name equal to `label` (so a screen
 * reader announces it once on entry), and a query like
 * `getByLabelText(/daily goal/i)` must resolve to exactly that one element.
 * If the buttons repeated the same phrase verbatim, every accessible-name
 * lookup for "daily goal" would return three elements instead of one.
 */
function Stepper({
  label, value, min, max, step, onChange, unit, announceAs,
}: {
  label: string; value: number; min: number; max: number; step: number
  onChange: (next: number) => void; unit?: string; announceAs?: string
}) {
  const change = announceAs ?? label
  return (
    <div
      role="group"
      aria-label={label}
      className="flex items-center justify-between gap-3 rounded-card border border-line bg-card p-4"
    >
      <div>
        <p className="font-bold text-ink">{label}</p>
        <p className="text-sm text-muted">{value}{unit ? ` ${unit}` : ''}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Decrease ${change}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card2 text-lg font-bold text-ink transition active:scale-[0.98] disabled:opacity-40"
        >
          −
        </button>
        <button
          type="button"
          aria-label={`Increase ${change}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + step))}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-card2 text-lg font-bold text-ink transition active:scale-[0.98] disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  )
}

function Toggle({
  label, checked, onChange,
}: { label: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <label className="flex min-h-[44px] items-center justify-between gap-3">
      <span className="font-bold text-ink">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="h-6 w-6 accent-brand"
      />
    </label>
  )
}

/**
 * Settings — one screen for everything she can tweak: her name, cloud sync,
 * study preferences, and the two escape hatches (retake placement, wipe
 * progress). With no Supabase env vars, the sync section degrades to a
 * plain explanatory card instead of a field that can never work.
 */
export function Settings({ onBack, onRetakePlacement, syncStatus, onRestore }: SettingsProps) {
  const profileName = useStore(s => s.profileName)
  const syncCode = useStore(s => s.syncCode)
  const dailyGoal = useStore(s => s.dailyGoal)
  const newPerSession = useStore(s => s.newPerSession)
  const accent = useStore(s => s.accent)
  const autoPlayAudio = useStore(s => s.autoPlayAudio)
  const showPortuguese = useStore(s => s.showPortuguese)
  const setPref = useStore(s => s.setPref)
  const resetProgress = useStore(s => s.resetProgress)

  const configured = isSyncConfigured()

  const [name, setName] = useState(profileName)
  const [codeInput, setCodeInput] = useState(syncCode ?? '')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [confirmingReset, setConfirmingReset] = useState(false)

  function commitName() {
    const trimmed = name.trim()
    // An empty name would flip the app back to the "what's your name?"
    // screen the moment she blurs the field — never let that happen from here.
    if (trimmed.length === 0) { setName(profileName); return }
    if (trimmed !== profileName) setPref('profileName', trimmed)
  }

  async function handleSyncSubmit() {
    const trimmed = codeInput.trim()
    const err = validateSyncCode(trimmed)
    setCodeError(err)
    if (err) return
    setRestoring(true)
    await onRestore(trimmed)
    setRestoring(false)
  }

  function handleResetClick() {
    if (!confirmingReset) { setConfirmingReset(true); return }
    resetProgress(Date.now())
  }

  const liveStatus = isLiveStatus(syncStatus) ? syncStatus : null

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title="Settings" onBack={onBack} />

      <Card>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-ink">Your name</span>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={commitName}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-[44px] rounded-2xl border border-line bg-card2 px-4 text-ink"
          />
        </label>
      </Card>

      {!configured && (
        <Card className="text-sm text-muted">
          Cloud sync isn't set up yet. Your progress is saved on this device.
        </Card>
      )}

      {configured && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-ink">Cloud sync</p>
            {liveStatus && <Chip tone={STATUS_TONE[liveStatus]}>{STATUS_LABEL[liveStatus]}</Chip>}
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-muted">Sync code</span>
            <input
              type="text"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value); setCodeError(null) }}
              placeholder="a word plus some numbers, e.g. kiwi2026"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              className="min-h-[44px] rounded-2xl border border-line bg-card2 px-4 text-ink"
            />
          </label>
          {codeError && <p className="text-sm text-again">{codeError}</p>}
          <p className="text-xs text-muted">
            Use the same code on another device to bring your progress there, or to send
            this device's progress to the cloud for the first time.
          </p>
          <Button variant="primary" size="md" disabled={restoring} onClick={handleSyncSubmit}>
            Save &amp; sync
          </Button>
          <Button variant="ghost" size="md" disabled={restoring} onClick={handleSyncSubmit}>
            Restore from a code
          </Button>
        </Card>
      )}

      <Stepper
        label="Daily goal"
        announceAs="how many cards a day"
        value={dailyGoal}
        min={5}
        max={100}
        step={5}
        unit="cards/day"
        onChange={next => setPref('dailyGoal', next)}
      />

      <Stepper
        label="New cards per session"
        value={newPerSession}
        min={1}
        max={20}
        step={1}
        unit="new cards"
        onChange={next => setPref('newPerSession', next)}
      />

      <div
        role="radiogroup"
        aria-label="Accent"
        className="flex flex-col gap-2 rounded-card border border-line bg-card p-4"
      >
        <p className="font-bold text-ink">Accent</p>
        <div className="grid grid-cols-4 gap-2">
          {ACCENTS.map(a => (
            <button
              key={a.value}
              type="button"
              role="radio"
              aria-checked={accent === a.value}
              onClick={() => setPref('accent', a.value)}
              className={`min-h-[44px] rounded-2xl border px-1 text-sm font-bold transition active:scale-[0.98] ${
                accent === a.value ? 'border-brand bg-card2 text-brand' : 'border-line bg-card text-ink'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="flex flex-col gap-3">
        <Toggle label="Auto-play audio" checked={autoPlayAudio} onChange={v => setPref('autoPlayAudio', v)} />
        <Toggle label="Show Portuguese" checked={showPortuguese} onChange={v => setPref('showPortuguese', v)} />
      </Card>

      <Button variant="ghost" onClick={onRetakePlacement}>
        Retake placement test
      </Button>

      {!confirmingReset && (
        <Button variant="again" onClick={handleResetClick}>
          Reset progress
        </Button>
      )}

      {confirmingReset && (
        <Card className="flex flex-col gap-3 border-again">
          <p className="text-sm text-ink">
            This erases every card, streak and setting on this device. There's no undo.
          </p>
          <Button variant="again" onClick={handleResetClick}>
            Yes, erase everything
          </Button>
          <Button variant="ghost" size="md" onClick={() => setConfirmingReset(false)}>
            Cancel
          </Button>
        </Card>
      )}
    </div>
  )
}
