import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Meter } from './Meter'
import { Toast } from './Toast'
import { InterferenceNote } from './InterferenceNote'
import type { Card } from '../../types'

const BASE_CARD: Card = {
  id: 'x', deckId: 'x', en: 'x', pt: 'x', exampleHtml: 'x', examplePt: 'x', pos: 'noun',
}

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

describe('Meter', () => {
  it('renders its label text', () => {
    render(<Meter value={0.5} label="Today" />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('clamps an out-of-range value without throwing', () => {
    expect(() => render(<Meter value={5} label="Over" />)).not.toThrow()
    expect(() => render(<Meter value={-3} label="Under" />)).not.toThrow()
    expect(() => render(<Meter value={NaN} label="Not a number" />)).not.toThrow()
    expect(() => render(<Meter value={Infinity} label="Infinite" />)).not.toThrow()
  })
})

describe('InterferenceNote', () => {
  it('renders nothing for a card with no interference tag', () => {
    const { container } = render(<InterferenceNote card={BASE_CARD} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('names the trap for a false-friend card', () => {
    render(<InterferenceNote card={{ ...BASE_CARD, interference: { type: 'false-friend', trap: 'envergonhada' } }} />)
    expect(screen.getByText(/envergonhada/)).toBeInTheDocument()
  })

  it('falls back to a plain warning when a false-friend card has no trap text', () => {
    render(<InterferenceNote card={{ ...BASE_CARD, interference: { type: 'false-friend' } }} />)
    expect(screen.getByText(/falso amigo/i)).toBeInTheDocument()
  })

  it('labels a similar-different card without repeating any trap text', () => {
    render(<InterferenceNote card={{ ...BASE_CARD, interference: { type: 'similar-different' } }} />)
    expect(screen.getByText(/diferente do português/i)).toBeInTheDocument()
  })
})

describe('Toast', () => {
  it('calls onDismiss after its timer elapses', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Toast message="Saved" onDismiss={onDismiss} />)

    vi.advanceTimersByTime(4000)

    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not call onDismiss after unmount', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const { unmount } = render(<Toast message="Saved" onDismiss={onDismiss} />)

    unmount()
    vi.advanceTimersByTime(4000)

    expect(onDismiss).not.toHaveBeenCalled()
  })
})
