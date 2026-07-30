import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { Meter } from './Meter'
import { Toast } from './Toast'

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
