import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true, cefrLevel: 2, unlockedLevel: 2 })
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
    expect(screen.getByText(/82% · 50 reviews/)).toBeInTheDocument()
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

  it('breaks words learned down by level', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByTestId('level-breakdown-1')).toBeInTheDocument()
  })
})
