import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { FREE_ACCESS_KEY, readFreeAccess, writeFreeAccess } from './freeAccess'

describe('free access storage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('is off when nothing was ever stored', () => {
    expect(readFreeAccess()).toBe(false)
  })

  it('survives a round trip', () => {
    writeFreeAccess(true)
    expect(readFreeAccess()).toBe(true)
    writeFreeAccess(false)
    expect(readFreeAccess()).toBe(false)
  })

  // Anything that is not the exact stored token reads as off. A half-written
  // or hand-edited value must not be interpreted generously: the safe answer
  // is the gated one she already has.
  it('reads a corrupt value as off', () => {
    localStorage.setItem(FREE_ACCESS_KEY, 'yes please')
    expect(readFreeAccess()).toBe(false)
  })

  // Safari in private mode throws on both of these. The switch is a
  // convenience; it may not be the thing that takes her app down.
  it('answers off rather than throwing when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied')
    })
    expect(readFreeAccess()).toBe(false)
  })

  it('swallows a failed write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota')
    })
    expect(() => writeFreeAccess(true)).not.toThrow()
  })

  it('keeps its own key, separate from the profile', () => {
    expect(FREE_ACCESS_KEY).not.toBe('english-nz')
    writeFreeAccess(true)
    expect(localStorage.getItem('english-nz')).toBeNull()
  })
})
