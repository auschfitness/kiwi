import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'
import { dayKey, DAY, MIN, HOUR } from '../core/time'

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, unlockedLevel: 2 })
})

describe('Dashboard', () => {
  it('shows the CEFR badge', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByText(/A2/)).toBeInTheDocument()
  })

  it('says "not practised yet" instead of zero percent', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getAllByText(/not practised yet/i).length).toBe(4)
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument()
  })

  it('reports accuracy for a practised skill', () => {
    useStore.setState({ skills: { ...useStore.getState().skills, listening: { correct: 41, total: 50 } } })
    render(<Dashboard onBack={vi.fn()} />)
    // "reps", not "reviews" — drills and role-play feed these counters too.
    expect(screen.getByText(/82% · 50 reps/)).toBeInTheDocument()
    expect(screen.queryByText(/reviews/)).not.toBeInTheDocument()
  })

  it('nudges the weakest practised skill only', () => {
    useStore.setState({
      skills: {
        vocab: { correct: 9, total: 10 }, listening: { correct: 5, total: 10 },
        grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
      },
    })
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByText(/listening could use some love/i)).toBeInTheDocument()
  })

  it('shows no nudge before anything is practised', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.queryByText(/could use some love/i)).not.toBeInTheDocument()
  })

  it('offers no way to skip ahead — the level badge is a readout, not a control', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /retake/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /test/i })).not.toBeInTheDocument()
  })

  it('breaks words learned down by level', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByTestId('level-breakdown-1')).toBeInTheDocument()
  })
})

describe('Dashboard — time studied', () => {
  const NOW = new Date(2026, 7, 4, 20, 0, 0).getTime()
  const day = (back: number) => dayKey(NOW - back * DAY)

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    useStore.setState({ ...createInitialState(NOW), unlocked: null, unlockedLevel: 2 })
  })

  afterEach(() => vi.useRealTimers())

  it('invites her in rather than reporting three zeros on day one', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByText('Time studied')).toBeInTheDocument()
    expect(screen.getByText(/nothing yet today/i)).toBeInTheDocument()
    expect(screen.getByText(/the clock starts the moment/i)).toBeInTheDocument()
  })

  it('reports today, the week, the average and the whole history', () => {
    useStore.setState({
      studyLog: {
        [day(0)]: 25 * MIN,
        [day(2)]: 35 * MIN,
        [day(40)]: HOUR, // outside the week, inside all-time
      },
    })
    render(<Dashboard onBack={vi.fn()} />)

    expect(screen.getByText('25 min today')).toBeInTheDocument()
    expect(screen.getByText('1h')).toBeInTheDocument() // 25 + 35 this week
    expect(screen.getByText('40m')).toBeInTheDocument() // average over 3 days
    expect(screen.getByText('2h')).toBeInTheDocument() // all time
    expect(screen.getByText(/3 days/)).toBeInTheDocument()
  })

  it('draws seven days, and marks the ones she missed', () => {
    useStore.setState({ studyLog: { [day(0)]: 30 * MIN, [day(3)]: 10 * MIN } })
    render(<Dashboard onBack={vi.fn()} />)

    expect(screen.getByTestId('week-strip').children).toHaveLength(7)
    // The empty days are labelled too, so the gap is legible rather than blank.
    expect(screen.getByLabelText(new RegExp(`${WEEKDAY_OF(day(1))}: 0 min`))).toBeInTheDocument()
    expect(screen.getByLabelText(new RegExp(`${WEEKDAY_OF(day(0))}: 30 min`))).toBeInTheDocument()
  })
})

/** Same mapping the strip uses, so the test names the day it means. */
function WEEKDAY_OF(key: string): string {
  const [y, m, d] = key.split('-').map(Number)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(y, m - 1, d).getDay()]
}
