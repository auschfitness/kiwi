import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useStore } from './store/useStore'
import { createInitialState } from './store/defaults'
import { DIALOGUES } from './content'

vi.mock('./audio/speak', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  warmUp: vi.fn(),
  pickVoice: vi.fn(),
}))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('App', () => {
  it('sends a brand-new profile to the Name screen', () => {
    useStore.setState({ profileName: '' })
    render(<App />)
    expect(screen.getByText(/what should i call you\?/i)).toBeInTheDocument()
  })

  it('sends a named but unplaced profile to the Placement screen', () => {
    useStore.setState({ profileName: 'Ana', placed: false })
    render(<App />)
    // buildPlacementTest's question count depends on how much content exists
    // per band (see Placement.test.tsx) — assert the counter shows up at all,
    // not a hardcoded question count.
    expect(screen.getByText(/question 1 of \d+/i)).toBeInTheDocument()
  })

  it('sends a named and placed profile to Home', () => {
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })

  it('shows the unlock toast and dismisses it on its timer', () => {
    // Toast (src/components/ui/Toast.tsx) has no clickable dismiss control —
    // it only calls onDismiss from a 4s setTimeout (see its own test in
    // src/components/ui/ui.test.tsx). We drive that same timer to exercise
    // App's unlocked !== null gate and its wiring to clearUnlockToast.
    vi.useFakeTimers()
    useStore.setState({
      profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 2, unlocked: 2,
    })
    render(<App />)
    expect(screen.getByText(/new level unlocked: a2/i)).toBeInTheDocument()

    vi.advanceTimersByTime(4000)

    expect(useStore.getState().unlocked).toBeNull()
  })

  it('walks from Home through a session to Done and back to Home', async () => {
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByTestId('study-now'))
    // "End session" is the aria-label on Session's Finish button — a reliable
    // marker that a session is on screen, regardless of which card/modality
    // happens to be first in the queue.
    expect(screen.getByRole('button', { name: /end session/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(screen.getByRole('button', { name: /back home/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /back home/i }))
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })

  it('scopes Shadowing to one dialogue when reached via "Shadow this", and back returns to Dialogues', async () => {
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /dialogues/i }))
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    await userEvent.click(screen.getByRole('button', { name: /shadow this/i }))

    // The strongest available signal that Shadowing is actually scoped to
    // this one dialogue (rather than the full mixed practice set — every
    // dialogue line plus every long card example) is that its line count
    // matches this dialogue's own line count, not the much larger unscoped
    // total.
    const firstDialogueLineCount = DIALOGUES[0].lines.length
    expect(
      screen.getByText(`Line 1 of ${firstDialogueLineCount}`),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))

    // Back from a dialogue-scoped Shadowing session must return to the
    // dialogue list it came from, not all the way home.
    expect(screen.getByRole('heading', { name: 'Dialogues' })).toBeInTheDocument()
    expect(screen.getAllByTestId('dialogue-card').length).toBeGreaterThan(0)
  })
})
