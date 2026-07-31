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
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    expect(screen.queryByText(/cloud sync isn't set up yet/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/sync code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save & sync this device/i })).toBeInTheDocument()
  })

  it('offers one sync button, not two synonyms — and never promises a restore', () => {
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    // Both old buttons called the same merge, and "Restore from a code" named
    // a replace this app does not do.
    expect(screen.queryByRole('button', { name: /restore/i })).not.toBeInTheDocument()
    expect(screen.getByText(/nothing is lost either way/i)).toBeInTheDocument()
  })

  it('says which thing happened after a sync', async () => {
    const onRestore = vi.fn().mockResolvedValue('merged')
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={onRestore} />)
    await userEvent.type(screen.getByLabelText(/sync code/i), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save & sync this device/i }))
    expect(await screen.findByText(/joined up with the progress/i)).toBeInTheDocument()
  })

  it('says so plainly when the sync fails', async () => {
    const onRestore = vi.fn().mockResolvedValue('error')
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={onRestore} />)
    await userEvent.type(screen.getByLabelText(/sync code/i), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save & sync this device/i }))
    expect(await screen.findByText(/didn't work just now/i)).toBeInTheDocument()
  })

  it('shows a validation error for a bad code instead of submitting', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/sync code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /save & sync this device/i }))
    expect(await screen.findByText(/letter/i)).toBeInTheDocument()
  })

  it('still says phone reminders are unset — cloud sync alone is not push', () => {
    // Both halves are needed (a Supabase project *and* a VAPID public key),
    // and this is the exact half-configured state the owner passes through.
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    expect(screen.getByText(/aren't set up yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/your phone can buzz/i)).not.toBeInTheDocument()
  })

  it('still exposes every local setting alongside the sync card', () => {
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    expect(screen.getByLabelText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accent/i)).toBeInTheDocument()
  })

  it('submits a valid code to onRestore — the configured flow\'s happy path', async () => {
    const onRestore = vi.fn().mockResolvedValue('pushed')
    render(<Settings onBack={vi.fn()} syncStatus="idle" onRestore={onRestore} />)
    await userEvent.type(screen.getByLabelText(/sync code/i), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save & sync this device/i }))
    expect(onRestore).toHaveBeenCalledWith('kiwi2026')
  })
})
