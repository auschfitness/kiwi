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
  setDefaultRate: vi.fn(),
}))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
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
    // "Finish session" is the aria-label on Session's Finish button — a reliable
    // marker that a session is on screen, regardless of which card/modality
    // happens to be first in the queue.
    expect(screen.getByRole('button', { name: /finish session/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /finish session/i }))
    expect(screen.getByRole('button', { name: /back home/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /back home/i }))
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })

  it('shows the placement result screen — with the real router above it — before Home appears, then Continue reaches Home', async () => {
    // Regression test for the bug where App.tsx (which routes on the store's
    // `placed` flag) rendered Home the instant the last placement answer
    // flipped `placed`, before Placement's own result screen ever committed.
    // Placement.test.tsx renders <Placement /> standalone, with no router
    // above it to steal the screen — it could never have caught this. This
    // test renders the real <App />, so it would have failed against the old
    // "finishPlacement then show result" ordering.
    //
    // Same deterministic-shuffle trick as Placement.test.tsx: buildPlacementTest
    // shuffles with Fisher-Yates (j = floor(rand() * (i + 1))); rand() just
    // under 1 makes j === i every time, so the correct answer always lands at
    // options[0] and clicking the last option is always a distractor.
    vi.spyOn(Math, 'random').mockReturnValue(0.999999)
    useStore.setState({ profileName: 'Ana', placed: false })
    render(<App />)

    for (let i = 0; i < 20; i++) {
      const options = screen.queryAllByTestId('placement-option')
      if (options.length > 0) {
        await userEvent.click(options[options.length - 1])
        continue
      }
      const input = screen.queryByRole('textbox')
      if (input) {
        await userEvent.type(input, 'zzzz')
        await userEvent.click(screen.getByRole('button', { name: /next|finish/i }))
        continue
      }
      break
    }

    // The result screen must be visible now — and Home must NOT be — before
    // she has tapped anything past the last question.
    expect(screen.getByText(/you're at a1/i)).toBeInTheDocument()
    expect(screen.queryByTestId('study-now')).not.toBeInTheDocument()
    expect(useStore.getState().placed).toBe(false)

    await userEvent.click(screen.getByRole('button', { name: /continue|start/i }))

    expect(useStore.getState().placed).toBe(true)
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })

  it('reaches Dialogues through the Practice hub, and back returns to Practice', async () => {
    // Home no longer links to Dialogues directly (A1: both Dialogues and
    // Shadowing moved behind a single Practice button) — this is now a
    // two-hop trip: Home -> Practice -> Dialogues.
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('practice-dialogues'))
    expect(screen.getByRole('heading', { name: 'Dialogues' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))

    // Back from Dialogues must return to Practice, not all the way home.
    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
  })

  it('scopes Shadowing to one dialogue when reached via "Shadow this", and back returns to Dialogues', async () => {
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    await userEvent.click(screen.getByTestId('practice-dialogues'))
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
    // dialogue list it came from, not all the way to Practice.
    expect(screen.getByRole('heading', { name: 'Dialogues' })).toBeInTheDocument()
    expect(screen.getAllByTestId('dialogue-card').length).toBeGreaterThan(0)
  })

  it('reaches unscoped Shadowing through Practice, and back returns to Practice (not Home)', async () => {
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    await userEvent.click(screen.getByTestId('practice-shadowing'))
    expect(screen.getByRole('heading', { name: 'Shadowing' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))

    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
  })

  it('shows an honest "coming soon" placeholder for Role-play, returning to Practice', async () => {
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    await userEvent.click(screen.getByTestId('practice-roleplay'))
    expect(screen.getByRole('heading', { name: 'Role-play' })).toBeInTheDocument()
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
  })

  it('reaches Drills through Practice, and back returns to Practice', async () => {
    useStore.setState({ profileName: 'Ana', placed: true, cefrLevel: 1, unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    await userEvent.click(screen.getByTestId('practice-drills'))
    expect(screen.getByRole('heading', { name: 'Drills' })).toBeInTheDocument()
    // jsdom has no speechSynthesis, so Drills takes its honest no-voice branch
    // rather than offering listening exercises that would play silence.
    expect(screen.getByText(/this browser can.t speak/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
  })
})
