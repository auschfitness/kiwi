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
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true, profileName: 'Ana' })
})

describe('Settings with Supabase configured', () => {
  it('shows the sync code field instead of the "not set up" card', () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    expect(screen.queryByText(/cloud sync isn't set up yet/i)).not.toBeInTheDocument()
    expect(screen.getByLabelText(/sync code/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save & sync/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /restore from a code/i })).toBeInTheDocument()
  })

  it('shows a validation error for a bad code instead of submitting', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    await userEvent.type(screen.getByLabelText(/sync code/i), '123456')
    await userEvent.click(screen.getByRole('button', { name: /save & sync/i }))
    expect(await screen.findByText(/letter/i)).toBeInTheDocument()
  })

  it('still exposes every local setting alongside the sync card', () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    expect(screen.getByLabelText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accent/i)).toBeInTheDocument()
  })

  it('submits a valid code to onRestore — the configured flow\'s happy path', async () => {
    const onRestore = vi.fn().mockResolvedValue('pushed')
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={onRestore} />)
    await userEvent.type(screen.getByLabelText(/sync code/i), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save & sync/i }))
    expect(onRestore).toHaveBeenCalledWith('kiwi2026')
  })
})
