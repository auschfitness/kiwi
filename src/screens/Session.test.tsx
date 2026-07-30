import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Session } from './Session'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({
    ...createInitialState(Date.now()),
    unlocked: null, placed: true, cefrLevel: 1, unlockedLevel: 1,
    newPerSession: 3, autoPlayAudio: false,
  })
})

describe('Session', () => {
  it('teaches new cards first time through', () => {
    render(<Session onDone={vi.fn()} />)
    expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
  })

  it('advances through the queue and finishes', async () => {
    const onDone = vi.fn()
    render(<Session onDone={onDone} />)
    for (let i = 0; i < 3; i++) {
      const btn = screen.queryByRole('button', { name: /got it/i })
      if (!btn) break
      await userEvent.click(btn)
    }
    expect(onDone).toHaveBeenCalled()
  })

  it('records progress in the store as she answers', async () => {
    render(<Session onDone={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(useStore.getState().doneToday).toBe(1)
    expect(Object.keys(useStore.getState().cards).length).toBeGreaterThan(0)
  })

  it('scopes the session to one deck when asked', () => {
    render(<Session deckId="numbers" onDone={vi.fn()} />)
    const ids = Object.keys(useStore.getState().cards)
    expect(ids.every(id => id.startsWith('numbers_') || ids.length === 0)).toBe(true)
  })

  it('shows a friendly empty state when nothing is due', () => {
    useStore.setState({ newPerSession: 0 })
    render(<Session deckId="numbers" onDone={vi.fn()} />)
    expect(screen.getByText(/all done for now/i)).toBeInTheDocument()
  })

  it('lets her leave early', async () => {
    const onDone = vi.fn()
    render(<Session onDone={onDone} />)
    await userEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(onDone).toHaveBeenCalled()
  })
})
