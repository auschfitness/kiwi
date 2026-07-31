import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
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

  it('sends a named profile straight to Home', () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
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
      profileName: 'Ana', unlockedLevel: 2, unlocked: 2,
    })
    render(<App />)
    expect(screen.getByText(/new level unlocked: a2/i)).toBeInTheDocument()

    vi.advanceTimersByTime(4000)

    expect(useStore.getState().unlocked).toBeNull()
  })

  it('nudges her on open when the reminder is due and she has not studied today', () => {
    useStore.setState({
      profileName: 'Ana', unlockedLevel: 1,
      reminderEnabled: true, reminderTime: '00:00', doneToday: 0, doneDate: null,
    })
    render(<App />)
    // "00:00" is at-or-past whatever time this suite happens to run at.
    expect(screen.getByText(/time for a little english/i)).toBeInTheDocument()
    // And it blocks nothing — Home is right there behind it.
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })

  it('stays quiet on open when the reminder is switched off', () => {
    useStore.setState({
      profileName: 'Ana', unlockedLevel: 1,
      reminderEnabled: false, reminderTime: '00:00',
    })
    render(<App />)
    expect(screen.queryByText(/time for a little english/i)).not.toBeInTheDocument()
  })

  it('stays quiet on open when the reminder time has not arrived yet', () => {
    useStore.setState({
      profileName: 'Ana', unlockedLevel: 1,
      reminderEnabled: true, reminderTime: '23:59', doneToday: 0, doneDate: null,
    })
    render(<App />)
    // Unless the suite is run in the last minute of the day, this is "not yet".
    const lastMinuteOfTheDay = new Date().getHours() === 23 && new Date().getMinutes() === 59
    if (!lastMinuteOfTheDay) {
      expect(screen.queryByText(/time for a little english/i)).not.toBeInTheDocument()
    }
  })

  it('drops the nudge the moment she starts studying, and does not raise it again', async () => {
    useStore.setState({
      profileName: 'Ana', unlockedLevel: 1,
      reminderEnabled: true, reminderTime: '00:00', doneToday: 0, doneDate: null,
    })
    render(<App />)
    expect(screen.getByText(/time for a little english/i)).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('study-now'))
    act(() => { useStore.getState().gradeItem('survival_0', 'recognize', 2, Date.now()) })

    expect(screen.queryByText(/time for a little english/i)).not.toBeInTheDocument()

    // Back to Home: the question was answered once, when the app opened —
    // re-rendering the same visit must not re-ask it.
    await userEvent.click(screen.getByRole('button', { name: /finish session/i }))
    await userEvent.click(screen.getByRole('button', { name: /back home/i }))
    expect(screen.queryByText(/time for a little english/i)).not.toBeInTheDocument()
  })

  it('gives the toast slot to an earned unlock rather than stacking a nudge on top of it', () => {
    useStore.setState({
      profileName: 'Ana', unlockedLevel: 2, unlocked: 2,
      reminderEnabled: true, reminderTime: '00:00', doneToday: 0, doneDate: null,
    })
    render(<App />)
    expect(screen.getByText(/new level unlocked: a2/i)).toBeInTheDocument()
    expect(screen.queryByText(/time for a little english/i)).not.toBeInTheDocument()
  })

  it('walks from Home through a session to Done and back to Home', async () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
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

  /**
   * First run is now two screens long: her name, then Home. There used to be
   * a fifteen-question placement test in between, and a whole class of bugs
   * about which screen won the moment it finished. Nothing to sit, nothing to
   * skip: she starts at A1 like everyone else.
   */
  it('takes a brand-new profile from the name question straight to Home, at A1 with nothing known', async () => {
    useStore.setState({ profileName: '' })
    render(<App />)

    await userEvent.type(screen.getByRole('textbox'), 'Ana')
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))

    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()

    const s = useStore.getState()
    expect(s.unlockedLevel).toBe(1)
    expect(s.cards).toEqual({})
  })

  it('offers no route past the levels — nothing on Settings or Progress can skip content', async () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /settings/i }))
    expect(screen.queryByRole('button', { name: /placement|retake/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    await userEvent.click(screen.getByRole('button', { name: /progress/i }))
    expect(screen.queryByRole('button', { name: /placement|retake/i })).not.toBeInTheDocument()
  })

  it('reaches Dialogues through the Practice hub, and back returns to Practice', async () => {
    // Home no longer links to Dialogues directly (A1: both Dialogues and
    // Shadowing moved behind a single Practice button) — this is now a
    // two-hop trip: Home -> Practice -> Dialogues.
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
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
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
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
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    await userEvent.click(screen.getByTestId('practice-shadowing'))
    expect(screen.getByRole('heading', { name: 'Shadowing' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))

    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
  })

  it('reaches Role-play through Practice, and back returns to Practice', async () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
    render(<App />)

    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    await userEvent.click(screen.getByTestId('practice-roleplay'))
    expect(screen.getByRole('heading', { name: 'Role-play' })).toBeInTheDocument()
    // Role-play locks nothing: an A1 profile still sees the B1 scenes.
    expect(screen.getByTestId('roleplay-cafe')).toBeEnabled()
    expect(screen.getByTestId('roleplay-phone')).toBeEnabled()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(screen.getByRole('heading', { name: 'Practice' })).toBeInTheDocument()
  })

  it('reaches Drills through Practice, and back returns to Practice', async () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
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
