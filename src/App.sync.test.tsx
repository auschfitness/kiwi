import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
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

beforeEach(() => {
  loadProgress.mockReset().mockResolvedValue(null)
  saveProgress.mockReset().mockResolvedValue(undefined)
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

/** Answer the name question and land on whatever comes next. */
async function answerTheNameQuestion() {
  await userEvent.type(screen.getByRole('textbox'), 'Ana')
  await userEvent.click(screen.getByRole('button', { name: /continue/i }))
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

  it('saves a fresh code and shows her it happened, then lets her through to Home', async () => {
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))

    // A snapshot exists in the cloud before she has answered a single card —
    // this is the exact gap that lost a real user her day of work.
    expect(await screen.findByText(/in the cloud from right now/i)).toBeInTheDocument()
    expect(saveProgress).toHaveBeenCalledWith('kiwi2026', expect.objectContaining({ syncCode: 'kiwi2026' }))

    await userEvent.click(screen.getByRole('button', { name: /let's go/i }))
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(useStore.getState().syncCode).toBe('kiwi2026')
  })

  it('brings her progress back when the code already exists — the lost-device route', async () => {
    const now = Date.now()
    loadProgress.mockResolvedValue({
      ...createInitialState(now),
      profileName: 'Ana', syncCode: 'kiwi2026', unlockedLevel: 2,
      cards: { survival_0: { due: now, interval: 5, ease: 2.5, reps: 3, lapses: 0 } },
      streak: 7, updatedAt: now + 60_000,
    })
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))

    expect(await screen.findByText(/found progress already saved under that code/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /let's go/i }))

    const s = useStore.getState()
    expect(s.cards.survival_0).toBeDefined()
    expect(s.unlockedLevel).toBe(2)
    expect(s.streak).toBe(7)
  })

  it('lets her say "Not now" and reach Home with no code set', async () => {
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.click(screen.getByRole('button', { name: /not now/i }))

    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
    expect(useStore.getState().syncCode).toBeNull()
    expect(saveProgress).not.toHaveBeenCalled()
  })

  it('does not trap her on the step when the network is down', async () => {
    loadProgress.mockRejectedValue(new Error('offline'))
    useStore.setState({ profileName: '' })
    render(<App />)
    await answerTheNameQuestion()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))

    expect(await screen.findByText(/couldn't reach the cloud just now/i)).toBeInTheDocument()

    // The door is still open, and it leads to a working app.
    await userEvent.click(screen.getByRole('button', { name: /not now/i }))
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })

  it('shows the skipped user a prompt on Home, and takes her back to the same step', async () => {
    // This is the route in for someone already using the app, who has no code
    // because there was never a screen that asked her for one.
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1, syncCode: null })
    render(<App />)

    const line = screen.getByTestId('sync-line')
    expect(line).toHaveTextContent(/set up a sync code/i)

    await userEvent.click(line)
    expect(screen.getByRole('heading', { name: /keep your progress safe/i })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))
    expect(await screen.findByText(/in the cloud from right now/i)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /let's go/i }))
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/synced/i)
  })

  it('does not re-ask a returning profile — the step belongs to first run', () => {
    useStore.setState({ profileName: 'Ana', unlockedLevel: 1 })
    render(<App />)
    expect(screen.queryByRole('heading', { name: /keep your progress safe/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
  })
})
