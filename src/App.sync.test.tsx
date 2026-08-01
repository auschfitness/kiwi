import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useStore } from './store/useStore'
import { createInitialState } from './store/defaults'
import type { AppState } from './types'

vi.mock('./audio/speak', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  warmUp: vi.fn(),
  pickVoice: vi.fn(),
  setDefaultRate: vi.fn(),
}))

const loadProgress = vi.fn<(code: string) => Promise<AppState | null>>()
const saveProgress = vi.fn<(code: string, data: AppState) => Promise<void>>()

// Its own file rather than a mock mutated mid-suite, the same way
// Settings.sync.test.tsx is split from Settings.test.tsx: the "configured"
// branch gets one clean, static mock and cannot leak into the unconfigured
// assertions in App.test.tsx.
vi.mock('./sync/client', async importOriginal => ({
  ...(await importOriginal<typeof import('./sync/client')>()),
  isSyncConfigured: () => true,
  loadProgress: (code: string) => loadProgress(code),
  saveProgress: (code: string, data: AppState) => saveProgress(code, data),
}))

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

beforeEach(() => {
  loadProgress.mockReset().mockResolvedValue(null)
  saveProgress.mockReset().mockResolvedValue(undefined)
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
  setOnLine(true)
})

afterEach(() => {
  cleanup()
  setOnLine(true)
  vi.useRealTimers()
})

/** Answer the name question and land on whatever comes next. */
async function answerTheNameQuestion() {
  await userEvent.type(screen.getByRole('textbox'), 'Ana')
  await userEvent.click(screen.getByRole('button', { name: /continue/i }))
}

/** A snapshot as another device would have left it under a code. */
function existingAccount(now: number): AppState {
  return {
    ...createInitialState(now),
    profileName: 'Ana', syncCode: 'kiwi2026', unlockedLevel: 2,
    cards: { survival_0: { due: now, interval: 5, ease: 2.5, reps: 3, lapses: 0 } },
    streak: 7, updatedAt: now + 60_000,
  }
}

describe('first run with a Supabase project in the build', () => {
  it('asks for a sync code after her name, before Home', async () => {
    useStore.setState({ profileName: '' })
    render(<App />)

    await answerTheNameQuestion()

    expect(screen.getByRole('heading', { name: /keep your progress safe/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Sync code')).toBeInTheDocument()
    // Not Home yet — this is a step, not a toast on top of Home.
    expect(screen.queryByTestId('study-now')).not.toBeInTheDocument()
  })

  it('claims a free code and shows her it happened, then lets her through to Home', async () => {
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    // A snapshot exists in the cloud before she has answered a single card —
    // this is the exact gap that lost a real user her day of work.
    expect(await screen.findByText(/that code is yours now/i)).toBeInTheDocument()
    expect(saveProgress).toHaveBeenCalledWith('kiwi2026', expect.objectContaining({ syncCode: 'kiwi2026' }))

    await userEvent.click(screen.getByRole('button', { name: /let's go/i }))
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(useStore.getState().syncCode).toBe('kiwi2026')
  })

  /**
   * Requirement 2, end to end. The other account's progress must survive, and
   * she must not be quietly signed in to a stranger's cards either.
   */
  it('refuses a code that is already taken, and overwrites nothing', async () => {
    const now = Date.now()
    loadProgress.mockResolvedValue(existingAccount(now))
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    expect(await screen.findByText(/that code is already taken/i)).toBeInTheDocument()
    expect(saveProgress).not.toHaveBeenCalled()
    expect(useStore.getState().syncCode).toBeNull()
    expect(useStore.getState().cards.survival_0).toBeUndefined()
    // Still on the step: a refused code is not a way through.
    expect(screen.queryByTestId('study-now')).not.toBeInTheDocument()
  })

  it('brings her progress back when she signs in — the second-device route', async () => {
    const now = Date.now()
    loadProgress.mockResolvedValue(existingAccount(now))
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.click(screen.getByRole('radio', { name: /i already have a code/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /sign in with this code/i }))

    expect(await screen.findByText(/found progress already saved under that code/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /let's go/i }))

    const s = useStore.getState()
    expect(s.cards.survival_0).toBeDefined()
    expect(s.unlockedLevel).toBe(2)
    expect(s.streak).toBe(7)
  })

  it('offers to create a code nobody is using, rather than signing her into nothing', async () => {
    loadProgress.mockResolvedValue(null)
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.click(screen.getByRole('radio', { name: /i already have a code/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /sign in with this code/i }))

    expect(await screen.findByText(/no account is using that code yet/i)).toBeInTheDocument()
    expect(useStore.getState().syncCode).toBeNull()

    await userEvent.click(screen.getByRole('button', { name: /create this code instead/i }))
    expect(await screen.findByText(/that code is yours now/i)).toBeInTheDocument()
    expect(useStore.getState().syncCode).toBe('kiwi2026')
  })

  /** Requirement 3: mandatory means mandatory when the cloud is reachable. */
  it('has no way past the step while the cloud answers', async () => {
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    expect(screen.queryByRole('button', { name: /not now/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /carry on for now/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('study-now')).not.toBeInTheDocument()

    // A code that is taken does not become a way through either.
    loadProgress.mockResolvedValue(existingAccount(Date.now()))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    await screen.findByText(/that code is already taken/i)
    expect(screen.queryByTestId('study-now')).not.toBeInTheDocument()
  })

  /**
   * The second honest exception. She is moving countries: an aeroplane, a new
   * SIM, a dead café wifi. Locking her out of studying because Supabase timed
   * out would be indefensible.
   */
  it('lets her through when the cloud is unreachable, and leaves the code owed', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    expect(await screen.findByText(/couldn't reach the cloud just now/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /carry on for now/i }))

    // A working app, and no code claimed.
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
    expect(useStore.getState().syncCode).toBeNull()
    expect(saveProgress).not.toHaveBeenCalled()
    // Not silently dropped: Home carries the standing reminder.
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/your progress isn't in the cloud yet/i)
  })

  it('puts the question straight back the moment she is online again', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    await screen.findByText(/couldn't reach the cloud just now/i)
    await userEvent.click(screen.getByRole('button', { name: /carry on for now/i }))
    expect(screen.getByTestId('study-now')).toBeInTheDocument()

    loadProgress.mockResolvedValue(null)
    act(() => { window.dispatchEvent(new Event('online')) })

    // Back on the step, without her having to remember anything.
    expect(screen.getByRole('heading', { name: /keep your progress safe/i })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    expect(await screen.findByText(/that code is yours now/i)).toBeInTheDocument()
  })

  it('waits until she is out of a session before re-asking', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    await screen.findByText(/couldn't reach the cloud just now/i)
    await userEvent.click(screen.getByRole('button', { name: /carry on for now/i }))

    await userEvent.click(screen.getByTestId('study-now'))
    expect(screen.getByRole('button', { name: /finish session/i })).toBeInTheDocument()

    act(() => { window.dispatchEvent(new Event('online')) })

    // Still on her card: the gate must never yank her off one mid-answer.
    expect(screen.getByRole('button', { name: /finish session/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /keep your progress safe/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /finish session/i }))
    await userEvent.click(screen.getByRole('button', { name: /back home/i }))
    // And it is waiting for her when she gets back.
    expect(screen.getByRole('heading', { name: /keep your progress safe/i })).toBeInTheDocument()
  })

  /**
   * Migration care for anyone who was already using the app before the code
   * became mandatory: they are asked too, and nothing they have is lost —
   * whichever branch they take pushes their local progress up.
   */
  it('asks a returning profile that never set a code, and keeps her work', async () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 2, syncCode: null, streak: 4 })
    render(<App />)

    expect(screen.getByRole('heading', { name: /keep your progress safe/i })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    await screen.findByText(/that code is yours now/i)

    expect(saveProgress).toHaveBeenCalledWith(
      'kiwi2026',
      expect.objectContaining({ unlockedLevel: 2, streak: 4 }),
    )
    await userEvent.click(screen.getByRole('button', { name: /let's go/i }))
    expect(useStore.getState().unlockedLevel).toBe(2)
    expect(useStore.getState().streak).toBe(4)
  })

  it('does not re-ask a profile that already has a code', () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1, syncCode: 'kiwi2026' })
    render(<App />)
    expect(screen.queryByRole('heading', { name: /keep your progress safe/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })

  it('still lets her open the step from Home to check the code she has', async () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1, syncCode: 'kiwi2026' })
    render(<App />)

    await userEvent.click(screen.getByTestId('sync-line'))
    expect(screen.getByRole('heading', { name: /keep your progress safe/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Sync code')).toHaveValue('kiwi2026')

    // Not the gate this time: there is a way back with nothing changed.
    await userEvent.click(screen.getByRole('button', { name: /back home/i }))
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })
})
