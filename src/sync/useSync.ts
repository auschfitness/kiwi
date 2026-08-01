import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { mergeSnapshots } from '../core/merge'
import {
  isSyncConfigured, loadProgress, saveProgress,
  type CreateOutcome, type SignInOutcome, type SyncStatus,
} from './client'
import type { AppState } from '../types'

const DEBOUNCE_MS = 4000

function snapshot(): AppState {
  const { unlocked: _unlocked, ...rest } = useStore.getState()
  return rest as AppState
}

export interface SyncApi {
  status: SyncStatus
  /** Claim a code nobody is using yet. Refuses rather than overwrite. */
  createAccount: (code: string) => Promise<CreateOutcome>
  /** Reach an account that already exists, from a second device. */
  signIn: (code: string) => Promise<SignInOutcome>
}

export function useSync(): SyncApi {
  const [status, setStatusState] = useState<SyncStatus>(isSyncConfigured() ? 'idle' : 'unconfigured')
  // A mirror of `status` that the callbacks below can read *now* rather than
  // through the render they closed over. Both refused answers — 'taken' and
  // 'unknown' — write nothing at all, so the badge has to go back to whatever
  // it said before the attempt rather than getting stuck on '⟳ syncing'.
  const statusRef = useRef<SyncStatus>(status)
  const setStatus = useCallback((next: SyncStatus) => {
    statusRef.current = next
    setStatusState(next)
  }, [])

  const syncCode = useStore(s => s.syncCode)
  const updatedAt = useStore(s => s.updatedAt)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const push = useCallback(async () => {
    if (!isSyncConfigured() || !syncCode) return
    if (!navigator.onLine) { setStatus('offline'); return }
    setStatus('syncing')
    try { await saveProgress(syncCode, snapshot()); setStatus('synced') }
    catch { setStatus('error') }
  }, [syncCode, setStatus])

  // Pull on launch.
  useEffect(() => {
    if (!isSyncConfigured() || !syncCode) return
    let cancelled = false
    void (async () => {
      try {
        const remote = await loadProgress(syncCode)
        if (cancelled || !remote) return
        if (remote.updatedAt > useStore.getState().updatedAt) {
          useStore.getState().replaceState(mergeSnapshots(snapshot(), remote))
        }
        setStatus('synced')
      } catch { setStatus('error') }
    })()
    return () => { cancelled = true }
  }, [syncCode, setStatus])

  // Debounced push on change.
  useEffect(() => {
    if (!isSyncConfigured() || !syncCode) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { void push() }, DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [updatedAt, syncCode, push])

  // Save when the tab goes away.
  useEffect(() => {
    const flush = () => { void push() }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [push])

  /**
   * Claim `code` as a brand-new account.
   *
   * The existence check is `load_progress` itself: non-null means somebody
   * already owns that code, null means it is free. No new table and no new RPC
   * — the owner's Supabase project is not reachable from here, so anything
   * needing fresh SQL would sit undeployed and the feature simply would not
   * work. The two security-definer functions that are already live are enough.
   *
   * On 'taken' nothing whatsoever is written: no `setSyncCode`, no push. That
   * is the requirement stated as code — her snapshot can never land on top of
   * another account's progress, because we ask before we write.
   *
   * The claim *is* the push, so it happens immediately rather than four
   * seconds later on the debounce. A real user lost a day of work to a code
   * that was set but never pushed; from the moment this resolves 'created'
   * there is a snapshot in the cloud.
   *
   * There is a race here and it is accepted rather than solved: two people
   * claiming the same free code in the same instant both read null and the
   * second push wins. Closing it needs a conditional insert — new SQL — and
   * this is a two-person app. See the report.
   */
  const createAccount = useCallback(async (code: string): Promise<CreateOutcome> => {
    if (!isSyncConfigured()) return 'unreachable'
    const before = statusRef.current
    setStatus('syncing')

    let remote: AppState | null
    try { remote = await loadProgress(code) }
    catch { setStatus('error'); return 'unreachable' }

    if (remote) { setStatus(before); return 'taken' }

    // Free, and now hers. `setSyncCode` before the push so the snapshot that
    // goes up already carries the code, and so the debounced push and the
    // pagehide flush keep retrying the claim if this one does not land.
    useStore.getState().setSyncCode(code)
    try { await saveProgress(code, snapshot()); setStatus('synced'); return 'created' }
    catch { setStatus('error'); return 'unreachable' }
  }, [setStatus])

  /**
   * Reach an account that already exists — the same person on a second device.
   *
   * The mirror image of `createAccount`: here a null answer is the failure.
   * Nothing is adopted and nothing is written on 'unknown', so a typo can
   * never quietly create a second, empty account under a misspelt code.
   *
   * A push that fails after a successful pull still resolves 'merged', and
   * deliberately: her progress genuinely did arrive and is on the device. The
   * status badge carries the push failure, and the debounced push and the
   * pagehide flush go on retrying it — `setSyncCode` bumped `updatedAt`, which
   * is exactly what arms that timer.
   */
  const signIn = useCallback(async (code: string): Promise<SignInOutcome> => {
    if (!isSyncConfigured()) return 'unreachable'
    const before = statusRef.current
    setStatus('syncing')

    let remote: AppState | null
    try { remote = await loadProgress(code) }
    catch { setStatus('error'); return 'unreachable' }

    if (!remote) { setStatus(before); return 'unknown' }

    useStore.getState().replaceState(mergeSnapshots(snapshot(), remote))
    useStore.getState().setSyncCode(code)
    try { await saveProgress(code, snapshot()); setStatus('synced') }
    catch { setStatus('error') }
    return 'merged'
  }, [setStatus])

  return { status, createAccount, signIn }
}
