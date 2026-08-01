import { describe, it, expect } from 'vitest'
import { syncLineState, isLiveStatus, STATUS_LABEL } from './status'

/**
 * How an owed code is represented, tested as the pure rule it is.
 *
 * The point of deriving `'owed'` rather than persisting a flag is that it
 * cannot go stale: signing in makes it false in the same instant, and there is
 * no migration and no second source of truth to disagree with the first.
 */
describe('syncLineState', () => {
  it('says nothing at all when this build has no cloud', () => {
    expect(syncLineState('unconfigured', null)).toBe('hidden')
    // Even a stale code left over from a build that did have one.
    expect(syncLineState('unconfigured', 'kiwi2026')).toBe('hidden')
  })

  it('calls a missing code owed, whatever the connection is doing', () => {
    expect(syncLineState('idle', null)).toBe('owed')
    expect(syncLineState('offline', null)).toBe('owed')
    expect(syncLineState('error', null)).toBe('owed')
    expect(syncLineState('syncing', null)).toBe('owed')
  })

  it('stops being owed the moment a code is set — no flag to clear', () => {
    expect(syncLineState('synced', 'kiwi2026')).toBe('synced')
  })

  it('reads a code-set "idle" as syncing — the launch pull really is in flight', () => {
    expect(syncLineState('idle', 'kiwi2026')).toBe('syncing')
  })

  it('passes the live states straight through', () => {
    expect(syncLineState('offline', 'kiwi2026')).toBe('offline')
    expect(syncLineState('error', 'kiwi2026')).toBe('error')
    expect(syncLineState('syncing', 'kiwi2026')).toBe('syncing')
  })

  it('only ever returns something Home can label', () => {
    for (const code of [null, 'kiwi2026']) {
      for (const status of ['unconfigured', 'offline', 'idle', 'syncing', 'synced', 'error'] as const) {
        const state = syncLineState(status, code)
        if (state === 'hidden' || state === 'owed') continue
        expect(isLiveStatus(state)).toBe(true)
        expect(STATUS_LABEL[state]).toBeTruthy()
      }
    }
  })
})
