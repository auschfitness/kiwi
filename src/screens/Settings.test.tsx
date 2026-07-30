import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from './Settings'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

vi.mock('../sync/client', async importOriginal => ({
  ...(await importOriginal<typeof import('../sync/client')>()),
  isSyncConfigured: () => false,
}))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true, profileName: 'Ana' })
})

describe('Settings without Supabase configured', () => {
  it('explains that sync is not set up instead of showing a broken field', () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    expect(screen.getByText(/cloud sync isn't set up yet/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/sync code/i)).not.toBeInTheDocument()
  })

  it('still exposes every local setting', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    expect(screen.getByLabelText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/show portuguese/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accent/i)).toBeInTheDocument()
  })

  it('changes a preference in the store', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    await userEvent.click(screen.getByLabelText(/show portuguese/i))
    expect(useStore.getState().showPortuguese).toBe(false)
  })

  it('requires a second confirmation before wiping progress', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    expect(screen.getByRole('button', { name: /yes, erase everything/i })).toBeInTheDocument()
    expect(useStore.getState().placed).toBe(true)
  })
})

describe('Settings — additional behaviour (still unconfigured)', () => {
  it('back button calls onBack', async () => {
    const onBack = vi.fn()
    render(<Settings onBack={onBack} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('calls onRetakePlacement when that button is pressed', async () => {
    const onRetake = vi.fn()
    render(<Settings onBack={vi.fn()} onRetakePlacement={onRetake} syncStatus="unconfigured" onRestore={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /retake placement test/i }))
    expect(onRetake).toHaveBeenCalledTimes(1)
  })

  it('only wipes progress on the second tap, and clears it on that tap', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    await userEvent.click(screen.getByRole('button', { name: /yes, erase everything/i }))
    expect(useStore.getState().placed).toBe(false)
    expect(useStore.getState().cards).toEqual({})
  })

  it('cancel on the reset confirm leaves progress untouched', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('button', { name: /yes, erase everything/i })).not.toBeInTheDocument()
    expect(useStore.getState().placed).toBe(true)
  })

  it('daily goal stepper disables decrease at the floor and steps by 5 off it', async () => {
    useStore.setState({ dailyGoal: 5 })
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    expect(screen.getByRole('button', { name: /decrease how many cards a day/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /increase how many cards a day/i }))
    expect(useStore.getState().dailyGoal).toBe(10)
  })

  it('daily goal stepper disables increase at the 100 ceiling', () => {
    useStore.setState({ dailyGoal: 100 })
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    expect(screen.getByRole('button', { name: /increase how many cards a day/i })).toBeDisabled()
  })

  it('new-cards stepper disables decrease at 1 and increase at 20', () => {
    useStore.setState({ newPerSession: 1 })
    const { unmount } = render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    expect(screen.getByRole('button', { name: /decrease new cards per session/i })).toBeDisabled()
    unmount()

    useStore.setState({ newPerSession: 20 })
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    expect(screen.getByRole('button', { name: /increase new cards per session/i })).toBeDisabled()
  })

  it('accent selector marks the active accent and switches on click', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    const nz = screen.getByRole('radio', { name: /nz/i })
    expect(nz).toHaveAttribute('aria-checked', 'true')

    const au = screen.getByRole('radio', { name: /au/i })
    await userEvent.click(au)
    expect(useStore.getState().accent).toBe('en-AU')
  })

  it('commits an edited name on blur, ignoring an attempt to clear it', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="unconfigured" onRestore={vi.fn()} />)
    const input = screen.getByDisplayValue('Ana')
    await userEvent.clear(input)
    await userEvent.tab()
    expect(useStore.getState().profileName).toBe('Ana')

    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, 'Beatriz')
    await userEvent.tab()
    expect(useStore.getState().profileName).toBe('Beatriz')
  })
})
