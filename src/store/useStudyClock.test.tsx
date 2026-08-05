import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { useStudyClock } from './useStudyClock'
import { useStore } from './useStore'
import { createInitialState } from './defaults'
import { STUDY_TICK_MS } from '../core/studyTime'
import { dayKey } from '../core/time'

const NOW = new Date(2026, 7, 4, 20, 0, 0).getTime()

function Clock({ active }: { active: boolean }) {
  useStudyClock(active)
  return null
}

/** Advance the fake clock by whole ticks, flushing React between each. */
async function tick(times: number) {
  for (let i = 0; i < times; i++) {
    await act(async () => {
      vi.advanceTimersByTime(STUDY_TICK_MS)
    })
  }
}

const today = () => useStore.getState().studyLog[dayKey(NOW)] ?? 0

describe('useStudyClock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    useStore.setState(createInitialState(NOW))
    useStore.setState({ sessionMs: 0 })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('adds one tick of study time for every tick she stays on the screen', async () => {
    render(<Clock active />)
    await tick(4)

    expect(today()).toBe(4 * STUDY_TICK_MS)
    expect(useStore.getState().sessionMs).toBe(4 * STUDY_TICK_MS)
  })

  it('does not credit the tick she has only just started', async () => {
    // Arriving is not studying. The first tick lands one interval later, so
    // the clock under-reports by less than a tick rather than over-reporting.
    render(<Clock active />)
    expect(today()).toBe(0)
  })

  it('counts nothing at all while she is not on a study screen', async () => {
    render(<Clock active={false} />)
    await tick(10)
    expect(today()).toBe(0)
  })

  it('stops when she leaves the screen and does not resume by itself', async () => {
    const { rerender } = render(<Clock active />)
    await tick(2)
    rerender(<Clock active={false} />)
    await tick(10)

    expect(today()).toBe(2 * STUDY_TICK_MS)
  })

  it('records nothing while the app is in the background', async () => {
    // A session left open on a locked phone is not four hours of study, and a
    // tracker that says it is, is a tracker she learns to ignore.
    render(<Clock active />)
    await tick(2)

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await tick(20)
    expect(today()).toBe(2 * STUDY_TICK_MS)

    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    await tick(1)
    expect(today()).toBe(3 * STUDY_TICK_MS)
  })

  it('starts a fresh sitting each time, without touching the day total', async () => {
    const { rerender } = render(<Clock active />)
    await tick(3)
    rerender(<Clock active={false} />)

    // The finished sitting is still readable — that is what the "well done"
    // screen reports.
    expect(useStore.getState().sessionMs).toBe(3 * STUDY_TICK_MS)

    rerender(<Clock active />)
    expect(useStore.getState().sessionMs).toBe(0)
    await tick(1)

    expect(useStore.getState().sessionMs).toBe(STUDY_TICK_MS)
    expect(today()).toBe(4 * STUDY_TICK_MS)
  })

  it('keeps the sitting out of what gets saved and synced', async () => {
    render(<Clock active />)
    await tick(1)

    const saved = JSON.parse(localStorage.getItem('english-nz') ?? '{}')
    expect(saved.state?.studyLog?.[dayKey(NOW)]).toBe(STUDY_TICK_MS)
    expect('sessionMs' in (saved.state ?? {})).toBe(false)
  })
})
