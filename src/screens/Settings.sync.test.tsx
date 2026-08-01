import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from './Settings'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

// Separate file (rather than mutating one shared mock mid-suite) so the
// "configured" case gets its own clean, static mock — no risk of one test's
// mock state leaking into another's.
vi.mock('../sync/client', async importOriginal => ({
  ...(await importOriginal<typeof import('../sync/client')>()),
  isSyncConfigured: () => true,
}))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, profileName: 'Ana' })
})

describe('Settings with Supabase configured', () => {
  it('shows the sync code field instead of the "not set up" card', () => {
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.queryByText(/cloud sync isn't set up yet/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Sync code')).toBeInTheDocument()
  })

  /**
   * The model changed here, so the old single "Save & sync this device" button
   * had to go: it blindly pushed whatever code she typed, which is exactly the
   * overwrite the uniqueness rule exists to prevent. Settings now asks the
   * same question first run does — a new code, or one you already have.
   */
  it('asks the same create-or-sign-in question as first run', () => {
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /i'm new here/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /i already have a code/i })).toBeInTheDocument()
    // The blind-overwrite button is gone, and so is the "nothing is lost
    // either way" promise it used to make — a taken code is now refused.
    expect(screen.queryByRole('button', { name: /save & sync this device/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/nothing is lost either way/i)).not.toBeInTheDocument()
  })

  it('defaults to signing in when she already has a code, and prefills it', () => {
    useStore.setState({ syncCode: 'kiwi2026' })
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByRole('radio', { name: /i already have a code/i }))
      .toHaveAttribute('aria-checked', 'true')
    expect(screen.getByLabelText('Sync code')).toHaveValue('kiwi2026')
  })

  it('routes a changed code through sign-in, not a blind overwrite', async () => {
    const onSignIn = vi.fn().mockResolvedValue('merged')
    const onCreate = vi.fn()
    useStore.setState({ syncCode: 'kiwi2026' })
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={onCreate} onSignIn={onSignIn} />)

    const input = screen.getByLabelText('Sync code')
    await userEvent.clear(input)
    await userEvent.type(input, 'tui2027')
    await userEvent.click(screen.getByRole('button', { name: /sign in with this code/i }))

    expect(onSignIn).toHaveBeenCalledWith('tui2027')
    expect(onCreate).not.toHaveBeenCalled()
    expect(await screen.findByText(/found progress already saved under that code/i)).toBeInTheDocument()
  })

  /** The uniqueness rule has to hold here too, or it holds nowhere. */
  it('refuses a code that belongs to someone else, and writes nothing', async () => {
    const onCreate = vi.fn().mockResolvedValue('taken')
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={onCreate} onSignIn={vi.fn()} />)

    await userEvent.click(screen.getByRole('radio', { name: /i'm new here/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    expect(await screen.findByText(/that code is already taken/i)).toBeInTheDocument()
    expect(useStore.getState().syncCode).toBeNull()
  })

  it('says so plainly when the cloud cannot be reached', async () => {
    const onSignIn = vi.fn().mockResolvedValue('unreachable')
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={vi.fn()} onSignIn={onSignIn} />)
    await userEvent.click(screen.getByRole('radio', { name: /i already have a code/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /sign in with this code/i }))
    expect(await screen.findByText(/couldn't reach the cloud just now/i)).toBeInTheDocument()
  })

  it('shows a validation error for a bad code instead of submitting', async () => {
    const onCreate = vi.fn()
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={onCreate} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByRole('radio', { name: /i'm new here/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    expect(await screen.findByText(/include at least one letter/i)).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('still says phone reminders are unset — cloud sync alone is not push', () => {
    // Both halves are needed (a Supabase project *and* a VAPID public key),
    // and this is the exact half-configured state the owner passes through.
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByText(/aren't set up yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/your phone can buzz/i)).not.toBeInTheDocument()
  })

  it('still exposes every local setting alongside the sync card', () => {
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByLabelText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accent/i)).toBeInTheDocument()
  })

  it("claims a free code from here — the configured flow's happy path", async () => {
    const onCreate = vi.fn().mockResolvedValue('created')
    render(<Settings onBack={vi.fn()} syncStatus="idle" onCreate={onCreate} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByRole('radio', { name: /i'm new here/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    expect(onCreate).toHaveBeenCalledWith('kiwi2026')
    expect(await screen.findByText(/that code is yours now/i)).toBeInTheDocument()
  })
})
