import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialogues } from './Dialogues'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'
import { speak, cancelSpeech } from '../audio/speak'

vi.mock('../audio/speak', () => ({ speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn() }))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

describe('Dialogues', () => {
  it('lists all seven dialogues', () => {
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    expect(screen.getAllByTestId('dialogue-card')).toHaveLength(7)
  })

  it('expands to show the lines', async () => {
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument()
  })

  it('starts shadowing for that dialogue', async () => {
    const onShadow = vi.fn()
    render(<Dialogues onBack={vi.fn()} onShadow={onShadow} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    await userEvent.click(screen.getByRole('button', { name: /shadow this/i }))
    expect(onShadow).toHaveBeenCalledWith('dlg_0')
  })

  it('hides Portuguese when the setting is off', async () => {
    useStore.setState({ showPortuguese: false })
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    expect(screen.queryByTestId('dialogue-line-pt')).not.toBeInTheDocument()
  })
})

// Play-all's pacing runs on a setTimeout chain guarded by a monotonic token
// (see Dialogues.tsx). Fake timers are scoped to just this describe block —
// the tests above don't need them, and mixing real userEvent timing with
// fake timers file-wide would make those flaky.
describe('Dialogues play-all concurrency', () => {
  beforeEach(() => {
    // shouldAdvanceTime keeps the fake clock ticking with real elapsed time
    // so userEvent's internal act()/scheduler flushing (which relies on a
    // setTimeout fallback in jsdom) doesn't deadlock waiting on a timer we
    // never manually advance.
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(speak).mockClear()
    vi.mocked(cancelSpeech).mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('speaks the first line when Play all is clicked', async () => {
    const user = userEvent.setup({ delay: null })
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await user.click(screen.getAllByTestId('dialogue-card')[0])
    await user.click(screen.getByRole('button', { name: /play all/i }))

    expect(speak).toHaveBeenCalledTimes(1)
  })

  it('a second tap stops playback instead of starting a parallel reading', async () => {
    const user = userEvent.setup({ delay: null })
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await user.click(screen.getAllByTestId('dialogue-card')[0])

    // Keep the same button handle across both taps — its accessible name
    // flips from "Play all" to "Stop" once playback starts, so re-querying
    // by name would be brittle here.
    const playAllButton = screen.getByRole('button', { name: /play all/i })
    await user.click(playAllButton)
    expect(speak).toHaveBeenCalledTimes(1)

    await user.click(playAllButton)
    // If the token/stop guard regressed and the second tap instead started a
    // fresh run in parallel, this would already be 2 — synchronously, before
    // any timer even advances.
    expect(cancelSpeech).toHaveBeenCalled()
    expect(speak).toHaveBeenCalledTimes(1)

    // Advance well past every remaining line's delay. A regressed token
    // check (or a stop that forgot to clear the pending timer) would let the
    // original chain's setTimeout still fire and speak further lines.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(speak).toHaveBeenCalledTimes(1)
  })

  it('unmounting mid-playback stops the chain from speaking further lines', async () => {
    const user = userEvent.setup({ delay: null })
    const { unmount } = render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await user.click(screen.getAllByTestId('dialogue-card')[0])
    await user.click(screen.getByRole('button', { name: /play all/i }))
    expect(speak).toHaveBeenCalledTimes(1)

    unmount()

    // If the unmount cleanup effect regressed (stopped calling stopPlayback),
    // the outstanding setTimeout would still fire and speak the next line.
    await vi.advanceTimersByTimeAsync(60_000)
    expect(speak).toHaveBeenCalledTimes(1)
  })
})
