import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SpeakerButton } from './SpeakerButton'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'
import { speak } from '../../audio/speak'

vi.mock('../../audio/speak', async importOriginal => ({
  ...(await importOriginal<typeof import('../../audio/speak')>()),
  speak: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(speak).mockClear()
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, freeAccess: false })
})

/** The rate `speak` was called with on the nth call. */
function rateOf(call: number): number | undefined {
  return vi.mocked(speak).mock.calls[call]?.[2]?.rate
}

describe('SpeakerButton', () => {
  it('offers a normal and a slow control, both labelled', () => {
    render(<SpeakerButton text="be → was / were" />)
    expect(screen.getByRole('button', { name: 'Play audio' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Play audio slowly' })).toBeInTheDocument()
  })

  it('plays at her chosen speed from the speaker', async () => {
    render(<SpeakerButton text="went" />)
    await userEvent.click(screen.getByRole('button', { name: 'Play audio' }))
    expect(speak).toHaveBeenCalledWith('went', 'en-US', { rate: undefined })
  })

  it('plays slower from the turtle', async () => {
    useStore.setState({ speechRate: 0.95 })
    render(<SpeakerButton text="went" />)
    await userEvent.click(screen.getByRole('button', { name: 'Play audio slowly' }))
    expect(rateOf(0)).toBeLessThan(0.95)
  })

  // Role-play already asks for a specific speed for its model lines. The
  // turtle has to slow *that*, not silently replace it with a slowed default.
  it('slows the explicit rate a call site asked for, rather than ignoring it', async () => {
    useStore.setState({ speechRate: 1.1 })
    render(<SpeakerButton text="went" rate={0.8} />)
    await userEvent.click(screen.getByRole('button', { name: 'Play audio slowly' }))
    expect(rateOf(0)).toBeLessThan(0.8)
  })

  it('stays slower than normal on her slowest setting', async () => {
    useStore.setState({ speechRate: 0.75 })
    render(<SpeakerButton text="went" />)
    await userEvent.click(screen.getByRole('button', { name: 'Play audio slowly' }))
    expect(rateOf(0)).toBeLessThan(0.75)
  })

  it('keeps both targets thumb-sized', () => {
    render(<SpeakerButton text="went" />)
    for (const name of ['Play audio', 'Play audio slowly']) {
      expect(screen.getByRole('button', { name })).toHaveClass('h-11', 'w-11')
    }
  })
})
