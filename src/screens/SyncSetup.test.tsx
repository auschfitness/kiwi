import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SyncSetup } from './SyncSetup'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, profileName: 'Ana' })
})

describe('SyncSetup', () => {
  it('explains what the code is for before asking for one', () => {
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={vi.fn()} />)
    // Not "enter a sync code" — the reason, in the order it occurs to her.
    expect(screen.getByText(/how your progress gets saved/i)).toBeInTheDocument()
    expect(screen.getByText(/comes with you if you ever change phone/i)).toBeInTheDocument()
    expect(screen.getByText(/write it down/i)).toBeInTheDocument()
    expect(screen.getByText(/anyone who types this same code sees this same progress/i))
      .toBeInTheDocument()
  })

  it('suggests the shape of a code in the placeholder, the way Settings does', () => {
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={vi.fn()} />)
    const input = screen.getByLabelText('Sync code')
    expect(input).toHaveAttribute('placeholder', 'a word plus some numbers, e.g. kiwi2026')
    expect(input).toHaveAttribute('autoCapitalize', 'none')
    expect(input).toHaveAttribute('autoCorrect', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
  })

  it('makes the cost of skipping plain, right next to the skip', () => {
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={vi.fn()} />)
    expect(screen.getByText(/stays on this device only/i)).toBeInTheDocument()
    expect(screen.getByText(/you can add a code any time in settings/i)).toBeInTheDocument()
  })

  it('sends a valid code through the restore-and-push path', async () => {
    const onRestore = vi.fn().mockResolvedValue('pushed')
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={onRestore} />)
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))
    expect(onRestore).toHaveBeenCalledWith('kiwi2026')
  })

  it('trims the code before sending it', async () => {
    const onRestore = vi.fn().mockResolvedValue('pushed')
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={onRestore} />)
    await userEvent.type(screen.getByLabelText('Sync code'), '  kiwi2026  ')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))
    expect(onRestore).toHaveBeenCalledWith('kiwi2026')
  })

  it('says a fresh code was saved right now, not after her first card', async () => {
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={vi.fn().mockResolvedValue('pushed')} />)
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))
    expect(await screen.findByText(/in the cloud from right now/i)).toBeInTheDocument()
  })

  it('says her existing progress was found and joined up — the recovery case', async () => {
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={vi.fn().mockResolvedValue('merged')} />)
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))
    expect(await screen.findByText(/found progress already saved under that code/i))
      .toBeInTheDocument()
  })

  it('swaps the primary button for the way forward once it is saved', async () => {
    const onDone = vi.fn()
    render(<SyncSetup onDone={onDone} onSkip={vi.fn()} onRestore={vi.fn().mockResolvedValue('pushed')} />)
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))

    const go = await screen.findByRole('button', { name: /let's go/i })
    // Nothing left to skip past — the escape hatch retires with the question.
    expect(screen.queryByRole('button', { name: /not now/i })).not.toBeInTheDocument()
    await userEvent.click(go)
    expect(onDone).toHaveBeenCalled()
  })

  it('shows the validation error inline and never touches the network', async () => {
    const onRestore = vi.fn()
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={onRestore} />)
    await userEvent.type(screen.getByLabelText('Sync code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))

    expect(await screen.findByText(/include at least one letter/i)).toBeInTheDocument()
    expect(onRestore).not.toHaveBeenCalled()
    // Still here, still able to fix it.
    expect(screen.getByRole('button', { name: /save my progress/i })).toBeInTheDocument()
  })

  it('rejects a too-short code and a letters-only code the same way', async () => {
    const onRestore = vi.fn()
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={onRestore} />)
    const input = screen.getByLabelText('Sync code')

    await userEvent.type(input, 'ana1')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))
    expect(await screen.findByText(/use at least 6 characters/i)).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, 'anabanana')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))
    // Scoped to the whole sentence: the explanation above the field mentions
    // "numbers" too, and a bare /number/ would match both.
    expect(await screen.findByText(/include at least one number/i)).toBeInTheDocument()

    expect(onRestore).not.toHaveBeenCalled()
  })

  it('lets her out with "Not now", setting no code at all', async () => {
    const onSkip = vi.fn()
    const onRestore = vi.fn()
    render(<SyncSetup onDone={vi.fn()} onSkip={onSkip} onRestore={onRestore} />)
    await userEvent.click(screen.getByRole('button', { name: /not now/i }))
    expect(onSkip).toHaveBeenCalled()
    expect(onRestore).not.toHaveBeenCalled()
    expect(useStore.getState().syncCode).toBeNull()
  })

  it('does not trap her when the network fails — the error is honest and the door is open', async () => {
    const onSkip = vi.fn()
    // useSync.restore resolves 'error' rather than rejecting, so a dead
    // network is a message on the screen, never an unhandled rejection and
    // never a permanent spinner.
    render(<SyncSetup onDone={vi.fn()} onSkip={onSkip} onRestore={vi.fn().mockResolvedValue('error')} />)
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /save my progress/i }))

    expect(await screen.findByText(/couldn't reach the cloud just now/i)).toBeInTheDocument()
    // Both ways on are still there: try again, or carry on without one.
    expect(screen.getByRole('button', { name: /save my progress/i })).toBeEnabled()
    await userEvent.click(screen.getByRole('button', { name: /not now/i }))
    expect(onSkip).toHaveBeenCalled()
  })

  it('prefills the code she already has, for the trip back from Home', () => {
    useStore.setState({ syncCode: 'kiwi2026' })
    render(<SyncSetup onDone={vi.fn()} onSkip={vi.fn()} onRestore={vi.fn()} />)
    expect(screen.getByLabelText('Sync code')).toHaveValue('kiwi2026')
  })
})
