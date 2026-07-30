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

  it('brings a missed card back before the session ends', async () => {
    // Card: survival_0 ("Hello", pos "greeting").
    //   isTypable: "Hello".length (5) <= 16, no "…", pos "greeting" is in
    //     TYPABLE_POS -> true, so 'listen' and 'type' are supported.
    //   isSentence: stripTags("<b>Hello</b>, how are you?") -> "Hello, how are
    //     you?" -> 4 words, 3 <= 4 <= 9 -> true, so 'build' and 'dictate' are
    //     supported too. canSpeak is forced false in Session, so 'speak' is not.
    //   supported = ORDER.filter(...) = ['recognize','listen','type','build','dictate']
    //     (length 5).
    //   pickModality returns supported[reps % supported.length]. reps must be
    //   > 0 for the card to count as studied (isNew is reps === 0), so the
    //   smallest reps that lands on index 0 ('recognize') is reps = 5
    //   (5 % 5 === 0).
    useStore.setState({
      ...createInitialState(Date.now()),
      unlocked: null, placed: true, cefrLevel: 1, unlockedLevel: 1,
      newPerSession: 0, autoPlayAudio: false,
      cards: { survival_0: { due: Date.now() - 1000, interval: 1, ease: 2.5, reps: 5, lapses: 0 } },
    })
    const onDone = vi.fn()
    render(<Session deckId="survival" onDone={onDone} />)

    // The one due card, in its recognize form.
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(screen.getByRole('button', { name: /didn't/i }))

    // It was requeued, so the session is not over and the card is shown again.
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /show meaning/i })).toBeInTheDocument()
    expect(useStore.getState().cards.survival_0.lapses).toBe(1)
  })
})
