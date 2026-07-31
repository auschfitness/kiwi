import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Drills } from './Drills'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'
import { speak } from '../audio/speak'
import { speechSynthesisAvailable } from '../audio/capabilities'

vi.mock('../audio/speak', () => ({
  speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn(), setDefaultRate: vi.fn(),
}))
vi.mock('../audio/capabilities', () => ({
  speechSynthesisAvailable: vi.fn(() => true),
  speechRecognitionAvailable: vi.fn(() => false),
}))

const canSpeak = vi.mocked(speechSynthesisAvailable)

/**
 * Every generator draws from `Math.random`, so pinning it pins the session:
 * with 0 the price drill is $1.00 ("one dollar") ten times over, which is
 * exactly what a runner test wants — a known right answer and a known wrong one.
 */
beforeEach(() => {
  vi.clearAllMocks()
  canSpeak.mockReturnValue(true)
  vi.spyOn(Math, 'random').mockReturnValue(0)
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function startPrices() {
  render(<Drills onBack={vi.fn()} />)
  await userEvent.click(screen.getByTestId('drill-price'))
}

function listening() {
  return useStore.getState().skills.listening
}

describe('Drills menu', () => {
  it('offers the six generated kinds plus spelling and mixed', () => {
    render(<Drills onBack={vi.fn()} />)
    for (const mode of ['number', 'price', 'time', 'date', 'phone', 'quantity', 'spelling', 'mixed']) {
      expect(screen.getByTestId(`drill-${mode}`)).toBeInTheDocument()
    }
  })

  it('goes back to Practice', async () => {
    const onBack = vi.fn()
    render(<Drills onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('Drills without speech synthesis', () => {
  it('says so honestly and offers no drills at all', () => {
    canSpeak.mockReturnValue(false)
    render(<Drills onBack={vi.fn()} />)
    expect(screen.getByText(/this browser can.t speak/i)).toBeInTheDocument()
    expect(screen.queryByTestId('drill-price')).not.toBeInTheDocument()
    expect(screen.queryByTestId('drill-mixed')).not.toBeInTheDocument()
  })
})

describe('Drills runner', () => {
  it('speaks the item on arrival and offers a replay and a slow replay', async () => {
    await startPrices()
    expect(speak).toHaveBeenCalledWith('one dollar', 'en-NZ')
    expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /slow/i }))
    const slow = vi.mocked(speak).mock.calls.at(-1)
    expect(slow?.[2]?.rate).toBeLessThan(useStore.getState().speechRate)
  })

  it('counts a right answer, even typed with a Brazilian comma', async () => {
    await startPrices()
    expect(screen.getByText('Item 1 of 10')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText(/type what you heard/i), '1,00')
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))

    expect(screen.getByText(/ka pai/i)).toBeInTheDocument()
    expect(screen.getByText('1 right')).toBeInTheDocument()
    expect(listening()).toEqual({ correct: 1, total: 1 })
  })

  it('shows the answer on a miss and records the miss', async () => {
    await startPrices()
    await userEvent.type(screen.getByLabelText(/type what you heard/i), '9.99')
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))

    expect(screen.getByText(/not quite/i).textContent).toContain('$1.00')
    expect(listening()).toEqual({ correct: 0, total: 1 })
  })

  it('grades one item once, however many times Check fires', async () => {
    await startPrices()
    await userEvent.type(screen.getByLabelText(/type what you heard/i), '1.00')
    const form = screen.getByLabelText(/type what you heard/i).closest('form')!
    fireEvent.submit(form)
    fireEvent.submit(form)
    fireEvent.submit(form)
    expect(listening()).toEqual({ correct: 1, total: 1 })
  })

  it('plays the next item even when it says the very same thing', async () => {
    await startPrices()
    expect(speak).toHaveBeenCalledTimes(1)

    await userEvent.type(screen.getByLabelText(/type what you heard/i), '1.00')
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText('Item 2 of 10')).toBeInTheDocument()
    expect(speak).toHaveBeenCalledTimes(2)
  })

  it('gives the numeric kinds a number pad and the word kinds a keyboard', async () => {
    await startPrices()
    expect(screen.getByLabelText(/type what you heard/i)).toHaveAttribute('inputmode', 'numeric')

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    await userEvent.click(screen.getByTestId('drill-spelling'))
    expect(screen.getByLabelText(/type what you heard/i)).toHaveAttribute('inputmode', 'text')
  })

  it('spells a word out letter by letter in the spelling drill', async () => {
    render(<Drills onBack={vi.fn()} />)
    await userEvent.click(screen.getByTestId('drill-spelling'))
    const spoken = vi.mocked(speak).mock.calls.at(-1)?.[0] ?? ''
    expect(spoken).toMatch(/^([A-Z]\. )+[A-Z]\.$/)
  })

  it('runs to the end and shows a score with a warm line', async () => {
    await startPrices()
    for (let i = 0; i < 10; i++) {
      await userEvent.type(screen.getByLabelText(/type what you heard/i), '1.00')
      await userEvent.click(screen.getByRole('button', { name: 'Check' }))
      await userEvent.click(screen.getByRole('button', { name: i === 9 ? /see my score/i : /next/i }))
    }

    expect(screen.getByText('You got 10 out of 10')).toBeInTheDocument()
    expect(screen.getByText(/sweet as/i)).toBeInTheDocument()
    expect(listening()).toEqual({ correct: 10, total: 10 })

    // Play again deals a fresh round; back to Drills returns to the menu.
    await userEvent.click(screen.getByRole('button', { name: /play again/i }))
    expect(screen.getByText('Item 1 of 10')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(screen.getByTestId('drill-mixed')).toBeInTheDocument()
  })
})
