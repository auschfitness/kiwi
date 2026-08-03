import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home } from './Home'
import { useStore, cardIdsByLevel } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({
    ...createInitialState(Date.now()),
    unlocked: null, profileName: 'Ana', unlockedLevel: 1, freeAccess: false,
  })
})

// Every test in this block passes syncStatus="unconfigured" — the state this
// repo's test environment genuinely has (no .env, see src/sync/client.test.ts)
// and the one in which Home's cloud-sync line renders nothing at all. It keeps
// these assertions about what they were always about, and it keeps the sync
// line's own wording (which contains words like "device") out of the way of
// selectors here. The line itself is covered in its own block below.
describe('Home', () => {
  it('greets her by name', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
  })

  it('offers exactly one study action and no mode buttons', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^typing$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^listening$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^quiz$/i })).not.toBeInTheDocument()
  })

  it('starts an unscoped session from the primary button', async () => {
    const onStudy = vi.fn()
    render(<Home onNavigate={vi.fn()} onStudy={onStudy} syncStatus="unconfigured" />)
    await userEvent.click(screen.getByTestId('study-now'))
    expect(onStudy).toHaveBeenCalledWith(undefined)
  })

  it('locks levels above the unlocked one', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    expect(screen.getAllByText(/finish a1 to unlock/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('deck-money')).toBeDisabled()
  })

  /**
   * With free access on, the gate is lifted but nothing is awarded: the badge
   * still says A1. These four assertions are the whole visible feature.
   */
  describe('with free access on', () => {
    beforeEach(() => useStore.setState({ freeAccess: true, unlockedLevel: 1 }))

    it('unlocks every deck', () => {
      render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
      expect(screen.getByTestId('deck-money')).toBeEnabled()
    })

    it('drops the padlock copy', () => {
      render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
      expect(screen.queryByText(/to unlock/i)).not.toBeInTheDocument()
    })

    it('lets her open a deck that was locked a moment ago', async () => {
      const onStudy = vi.fn()
      render(<Home onNavigate={vi.fn()} onStudy={onStudy} syncStatus="unconfigured" />)
      await userEvent.click(screen.getByTestId('deck-money'))
      expect(onStudy).toHaveBeenCalledWith('money')
    })

    // The mirror of "does not offer new words that are still locked": with
    // every A1 card reviewed the button used to go dead, because the new words
    // left were all out of reach. Now they are in reach, so it must offer them.
    it('offers new words from levels above the earned one', () => {
      const a1 = cardIdsByLevel[1]
      const seen = Object.fromEntries(
        a1.map(id => [id, { due: Date.now() + 86_400_000, interval: 5, ease: 2.5, reps: 3, lapses: 0 }]),
      )
      useStore.setState({ cards: seen })
      render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
      expect(screen.getByTestId('study-now')).toBeEnabled()
    })
  })

  it('lets her study an unlocked deck directly', async () => {
    const onStudy = vi.fn()
    render(<Home onNavigate={vi.fn()} onStudy={onStudy} syncStatus="unconfigured" />)
    await userEvent.click(screen.getByTestId('deck-survival'))
    expect(onStudy).toHaveBeenCalledWith('survival')
  })

  it('opens the dashboard from the skills strip', async () => {
    const onNavigate = vi.fn()
    render(<Home onNavigate={onNavigate} onStudy={vi.fn()} syncStatus="unconfigured" />)
    await userEvent.click(screen.getByRole('button', { name: /progress/i }))
    expect(onNavigate).toHaveBeenCalledWith('dashboard')
  })

  it('offers a single Practice button, and no direct Dialogues/Shadowing buttons', async () => {
    // Both features moved behind the Practice hub (A1) — Home's row now has
    // Progress, 8-week plan and Practice only, so it stays tidy as more
    // practice features arrive.
    const onNavigate = vi.fn()
    render(<Home onNavigate={onNavigate} onStudy={vi.fn()} syncStatus="unconfigured" />)
    expect(screen.queryByRole('button', { name: /^🗣️ dialogues$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^🐢 shadowing$/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /practice/i }))
    expect(onNavigate).toHaveBeenCalledWith('practice')
  })

  it('never scores an unpractised skill at 0% on the strip', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
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
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
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
    useStore.setState({ cards: seen, unlockedLevel: 1 })
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    const study = screen.getByTestId('study-now')
    expect(study).toHaveTextContent(/all done for now/i)
    expect(study).toBeDisabled()
  })
})

/**
 * Home is the screen she opens every day, so it is the only place a "is my
 * work actually backed up?" answer reliably reaches her. Settings is a place
 * she may never visit — that is precisely how a day of progress got lost.
 *
 * Home takes the status as a prop (from App's single useSync), so these cases
 * are driven directly rather than by mocking the Supabase client.
 */
describe("Home's cloud-sync line", () => {
  it('says nothing at all when the build has no cloud to sync to', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    expect(screen.queryByTestId('sync-line')).not.toBeInTheDocument()
  })

  it('says nothing even when a stale code is somehow set but sync is unconfigured', () => {
    // Nagging about a feature this build cannot perform is worse than silence.
    useStore.setState({ syncCode: 'kiwi2026' })
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    expect(screen.queryByTestId('sync-line')).not.toBeInTheDocument()
  })

  /**
   * The owed state. Since the code became mandatory there is only one way to
   * be sitting on Home without one — the cloud was unreachable when she was
   * asked — so this line is the standing reminder that the question is still
   * open, not a soft "you could if you liked".
   */
  it('says the progress is not in the cloud yet when she owes a code', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="idle" />)
    const line = screen.getByTestId('sync-line')
    expect(line).toHaveTextContent(/your progress isn't in the cloud yet/i)
    expect(line).toHaveTextContent(/set up a sync code/i)
  })

  it('keeps saying it is owed whatever the connection is doing', () => {
    const { rerender } = render(
      <Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="offline" />,
    )
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/set up a sync code/i)

    // Never a bare "✓ synced" while there is no code to sync to.
    rerender(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="synced" />)
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/set up a sync code/i)
    expect(screen.getByTestId('sync-line')).not.toHaveTextContent(/✓ synced/)
  })

  it('taps through from that prompt straight to the sync setup screen', async () => {
    const onNavigate = vi.fn()
    render(<Home onNavigate={onNavigate} onStudy={vi.fn()} syncStatus="idle" />)
    await userEvent.click(screen.getByTestId('sync-line'))
    expect(onNavigate).toHaveBeenCalledWith('sync')
  })

  it('stops nagging the instant a code is set', () => {
    const { rerender } = render(
      <Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="syncing" />,
    )
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/set up a sync code/i)

    useStore.setState({ syncCode: 'kiwi2026' })
    rerender(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="syncing" />)
    expect(screen.getByTestId('sync-line')).not.toHaveTextContent(/set up a sync code/i)
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/syncing/i)
  })

  it('shows the live status once a code is set, so "it works" is visible not assumed', () => {
    useStore.setState({ syncCode: 'kiwi2026' })
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="synced" />)
    const line = screen.getByTestId('sync-line')
    expect(line).toHaveTextContent(/✓ synced/)
    expect(line).not.toHaveTextContent(/set up a sync code/i)
    // The accessible name carries every word she can see.
    expect(screen.getByRole('button', { name: 'Cloud sync, ✓ synced' })).toBe(line)
  })

  it('is honest about offline and about a failed sync', () => {
    useStore.setState({ syncCode: 'kiwi2026' })
    const { rerender } = render(
      <Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="offline" />,
    )
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/offline/i)

    rerender(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="error" />)
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/error/i)
  })

  it('reads a code-set "idle" as syncing — the launch pull really is in flight', () => {
    useStore.setState({ syncCode: 'kiwi2026' })
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="idle" />)
    expect(screen.getByTestId('sync-line')).toHaveTextContent(/syncing/i)
  })
})
