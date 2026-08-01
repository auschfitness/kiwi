import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { mergeSnapshots } from '../core/merge'
import { isSyncConfigured, loadProgress, saveProgress, type SyncStatus } from './client'
import type { AppState } from '../types'

const DEBOUNCE_MS = 4000

function snapshot(): AppState {
  const { unlocked: _unlocked, ...rest } = useStore.getState()
  return rest as AppState
}

export function useSync(): { status: SyncStatus; restore: (code: string) => Promise<'merged' | 'pushed' | 'error'> } {
  const [status, setStatus] = useState<SyncStatus>(isSyncConfigured() ? 'idle' : 'unconfigured')
  const syncCode = useStore(s => s.syncCode)
  const updatedAt = useStore(s => s.updatedAt)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const push = useCallback(async () => {
    if (!isSyncConfigured() || !syncCode) return
    if (!navigator.onLine) { setStatus('offline'); return }
    setStatus('syncing')
    try { await saveProgress(syncCode, snapshot()); setStatus('synced') }
    catch { setStatus('error') }
  }, [syncCode])

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
  }, [syncCode])

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
   * Adopt `code` on this device: pull whatever is already saved under it,
   * merge it in, and push the result back — in that order, right now.
   *
   * The immediate push is the whole point, not a nicety. It used to happen
   * only on the "nothing there yet" branch; a merge left the debounced timer
   * above to do it four seconds later, which is four seconds in which she can
   * close the tab, lose signal, or never come back. A real user lost a day of
   * work to a code that was set but never pushed, so from the moment this
   * resolves there is a snapshot in the cloud, whichever branch it took.
   *
   * Note where `setSyncCode` sits: after the pull, before the push. If the
   * *pull* throws, the code is never adopted — we do not know whether it
   * already holds her progress, and arming the background push against it
   * could overwrite a good remote snapshot with an empty local one. If only
   * the *push* throws, the code is hers and the merge already landed locally,
   * so the debounced push and the pagehide flush go on retrying it.
   */
  const restore = useCallback(async (code: string) => {
    if (!isSyncConfigured()) return 'error' as const
    setStatus('syncing')
    try {
      const remote = await loadProgress(code)
      if (remote) useStore.getState().replaceState(mergeSnapshots(snapshot(), remote))
      useStore.getState().setSyncCode(code)
      await saveProgress(code, snapshot())
      setStatus('synced')
      return remote ? ('merged' as const) : ('pushed' as const)
    } catch { setStatus('error'); return 'error' as const }
  }, [])

  return { status, restore }
}
