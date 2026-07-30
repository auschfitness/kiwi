import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home } from './Home'
import { useStore, cardIdsByLevel } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({
    ...createInitialState(Date.now()),
    unlocked: null, placed: true, profileName: 'Ana', cefrLevel: 1, unlockedLevel: 1,
  })
})

describe('Home', () => {
  it('greets her by name', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
  })

  it('offers exactly one study action and no mode buttons', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^typing$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^listening$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^quiz$/i })).not.toBeInTheDocument()
  })

  it('starts an unscoped session from the primary button', async () => {
    const onStudy = vi.fn()
    render(<Home onNavigate={vi.fn()} onStudy={onStudy} />)
    await userEvent.click(screen.getByTestId('study-now'))
    expect(onStudy).toHaveBeenCalledWith(undefined)
  })

  it('locks levels above the unlocked one', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    expect(screen.getAllByText(/finish a1 to unlock/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('deck-money')).toBeDisabled()
  })

  it('lets her study an unlocked deck directly', async () => {
    const onStudy = vi.fn()
    render(<Home onNavigate={vi.fn()} onStudy={onStudy} />)
    await userEvent.click(screen.getByTestId('deck-survival'))
    expect(onStudy).toHaveBeenCalledWith('survival')
  })

  it('opens the dashboard from the skills strip', async () => {
    const onNavigate = vi.fn()
    render(<Home onNavigate={onNavigate} onStudy={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /progress/i }))
    expect(onNavigate).toHaveBeenCalledWith('dashboard')
  })

  it('never scores an unpractised skill at 0% on the strip', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    // Scoped to the strip: the level rows elsewhere on Home legitimately show
    // "0%" progress for a fresh profile. A skill she was never asked to
    // practise is a different claim — iOS Safari never runs the speaking
    // modality, and "0% speaking" would score her on it anyway.
    const strip = within(screen.getByRole('button', { name: /skills overview/i }))
    expect(strip.queryByText(/0%/)).not.toBeInTheDocument()
    expect(strip.getAllByText(/not practised yet/i).length).toBe(4)
  })

  it('shows real accuracy on the strip once a skill has been practised', () => {
    useStore.setState({ skills: { ...useStore.getState().skills, listening: { correct: 41, total: 50 } } })
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    const strip = within(screen.getByRole('button', { name: /skills overview/i }))
    expect(strip.getByText('82%')).toBeInTheDocument()
    expect(strip.getAllByText(/not practised yet/i).length).toBe(3)
  })

  it('does not offer new words that are still locked', () => {
    // Every A1 card already reviewed, so nothing is due and nothing at A1 is new.
    // Only locked levels still hold new cards — the button must not offer them.
    const a1 = cardIdsByLevel[1]
    const seen = Object.fromEntries(
      a1.map(id => [id, { due: Date.now() + 86_400_000, interval: 5, ease: 2.5, reps: 3, lapses: 0 }]),
    )
    useStore.setState({ cards: seen, unlockedLevel: 1, cefrLevel: 1 })
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    const study = screen.getByTestId('study-now')
    expect(study).toHaveTextContent(/all done for now/i)
    expect(study).toBeDisabled()
  })
})
