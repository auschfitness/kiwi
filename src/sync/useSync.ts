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

  const restore = useCallback(async (code: string) => {
    if (!isSyncConfigured()) return 'error' as const
    setStatus('syncing')
    try {
      const remote = await loadProgress(code)
      if (remote) {
        useStore.getState().replaceState(mergeSnapshots(snapshot(), remote))
        useStore.getState().setSyncCode(code)
        setStatus('synced')
        return 'merged' as const
      }
      useStore.getState().setSyncCode(code)
      await saveProgress(code, snapshot())
      setStatus('synced')
      return 'pushed' as const
    } catch { setStatus('error'); return 'error' as const }
  }, [])

  return { status, restore }
}
