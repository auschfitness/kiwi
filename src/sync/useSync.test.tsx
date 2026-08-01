import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, cleanup } from '@testing-library/react'
import { useSync } from './useSync'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'
import type { AppState } from '../types'

const loadProgress = vi.fn<(code: string) => Promise<AppState | null>>()
const saveProgress = vi.fn<(code: string, data: AppState) => Promise<void>>()

// A configured project, with the two RPC wrappers swapped for spies. The
// unconfigured path is covered for real (against the genuinely absent .env) in
// client.test.ts — mocking it here would prove nothing.
vi.mock('./client', async importOriginal => ({
  ...(await importOriginal<typeof import('./client')>()),
  isSyncConfigured: () => true,
  loadProgress: (code: string) => loadProgress(code),
  saveProgress: (code: string, data: AppState) => saveProgress(code, data),
}))

/** A snapshot as it would come back off the network, newer than the local one. */
function remoteSnapshot(now: number): AppState {
  return {
    ...createInitialState(now),
    profileName: 'Ana',
    syncCode: 'kiwi2026',
    unlockedLevel: 2,
    cards: { survival_0: { due: now, interval: 5, ease: 2.5, reps: 3, lapses: 0 } },
    streak: 7,
    bestDay: 30,
    updatedAt: now + 60_000,
  }
}

beforeEach(() => {
  loadProgress.mockReset()
  saveProgress.mockReset().mockResolvedValue(undefined)
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, profileName: 'Ana' })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('useSync().createAccount', () => {
  it('claims a free code and pushes immediately — no waiting for the debounce', async () => {
    loadProgress.mockResolvedValue(null)
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.createAccount('kiwi2026') })

    expect(outcome).toBe('created')
    expect(loadProgress).toHaveBeenCalledWith('kiwi2026')
    expect(saveProgress).toHaveBeenCalledWith('kiwi2026', expect.objectContaining({ syncCode: 'kiwi2026' }))
    expect(useStore.getState().syncCode).toBe('kiwi2026')
  })

  it('asks whether the code is free before it writes anything', async () => {
    loadProgress.mockResolvedValue(null)
    const { result } = renderHook(() => useSync())
    await act(async () => { await result.current.createAccount('kiwi2026') })

    expect(loadProgress.mock.invocationCallOrder[0])
      .toBeLessThan(saveProgress.mock.invocationCallOrder[0])
  })

  /**
   * Requirement 2, as code. `load_progress` returning a blob is the existence
   * check — no new table and no new RPC — and a blob means somebody already
   * owns that code.
   */
  it('refuses a code that already exists and writes absolutely nothing', async () => {
    const now = Date.now()
    loadProgress.mockResolvedValue(remoteSnapshot(now))
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.createAccount('kiwi2026') })

    expect(outcome).toBe('taken')
    // The other account's progress is untouched, and this device did not adopt
    // the code or pull the stranger's cards in.
    expect(saveProgress).not.toHaveBeenCalled()
    expect(useStore.getState().syncCode).toBeNull()
    expect(useStore.getState().cards.survival_0).toBeUndefined()
    expect(useStore.getState().unlockedLevel).toBe(1)
  })

  it('leaves the badge where it was after a refusal, not stuck on "syncing"', async () => {
    loadProgress.mockResolvedValue(remoteSnapshot(Date.now()))
    const { result } = renderHook(() => useSync())
    await act(async () => { await result.current.createAccount('kiwi2026') })
    expect(result.current.status).toBe('idle')
  })

  it('claims nothing when the existence check itself fails', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.createAccount('kiwi2026') })

    // We do not know whether the code is free, so we must not write to it.
    expect(outcome).toBe('unreachable')
    expect(saveProgress).not.toHaveBeenCalled()
    expect(useStore.getState().syncCode).toBeNull()
    expect(result.current.status).toBe('error')
  })

  it('keeps the code when only the claiming push fails, so retries can land it', async () => {
    loadProgress.mockResolvedValue(null)
    saveProgress.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.createAccount('kiwi2026') })

    // She is told the truth — the claim did not land — but the code is on the
    // device and setSyncCode bumped updatedAt, which arms the debounced push.
    expect(outcome).toBe('unreachable')
    expect(useStore.getState().syncCode).toBe('kiwi2026')
    expect(result.current.status).toBe('error')
  })

  it('resolves rather than rejects on failure, so no caller can be left hanging', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSync())
    await expect(act(async () => { await result.current.createAccount('kiwi2026') }))
      .resolves.not.toThrow()
  })
})

describe('useSync().signIn', () => {
  it('merges progress that already exists under that code — the second device', async () => {
    const now = Date.now()
    loadProgress.mockResolvedValue(remoteSnapshot(now))
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.signIn('kiwi2026') })

    expect(outcome).toBe('merged')
    const s = useStore.getState()
    expect(s.cards.survival_0).toBeDefined()
    expect(s.unlockedLevel).toBe(2)
    expect(s.streak).toBe(7)
    expect(s.syncCode).toBe('kiwi2026')
  })

  it('pushes the merged result too — the branch that used to wait four seconds', async () => {
    // This is the exact gap that lost a real user her progress: a code that
    // was set, a merge that landed locally, and nothing in the cloud until a
    // debounced timer got round to it.
    const now = Date.now()
    loadProgress.mockResolvedValue(remoteSnapshot(now))
    const { result } = renderHook(() => useSync())
    await act(async () => { await result.current.signIn('kiwi2026') })

    expect(saveProgress).toHaveBeenCalledTimes(1)
    const [code, pushed] = saveProgress.mock.calls[0]
    expect(code).toBe('kiwi2026')
    // What went up is the merged state, not the empty local one it started as.
    expect(pushed.cards.survival_0).toBeDefined()
    expect(pushed.syncCode).toBe('kiwi2026')
  })

  /** A typo must never quietly create a second, empty account. */
  it('adopts nothing when no account uses that code', async () => {
    loadProgress.mockResolvedValue(null)
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.signIn('kiwi2026') })

    expect(outcome).toBe('unknown')
    expect(saveProgress).not.toHaveBeenCalled()
    expect(useStore.getState().syncCode).toBeNull()
    expect(result.current.status).toBe('idle')
  })

  it('adopts no code when the pull fails, rather than risking an overwrite', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.signIn('kiwi2026') })

    expect(outcome).toBe('unreachable')
    expect(saveProgress).not.toHaveBeenCalled()
    expect(useStore.getState().syncCode).toBeNull()
    expect(result.current.status).toBe('error')
  })

  it('resolves rather than rejects on failure, so no caller can be left hanging', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSync())
    await expect(act(async () => { await result.current.signIn('kiwi2026') })).resolves.not.toThrow()
  })

  it('keeps the code when only the push fails — the merge landed and retries can carry it', async () => {
    const now = Date.now()
    loadProgress.mockResolvedValue(remoteSnapshot(now))
    saveProgress.mockRejectedValue(new Error('offline'))
    const { result } = renderHook(() => useSync())

    let outcome: string | undefined
    await act(async () => { outcome = await result.current.signIn('kiwi2026') })

    // Her progress genuinely did arrive, so the sign-in succeeded; the
    // debounced push and the pagehide flush carry the retry. The status is
    // deliberately not asserted here: adopting the code re-runs the launch
    // pull, which succeeds and legitimately reports 'synced' a tick later.
    expect(outcome).toBe('merged')
    expect(useStore.getState().syncCode).toBe('kiwi2026')
    expect(useStore.getState().cards.survival_0).toBeDefined()
  })
})
