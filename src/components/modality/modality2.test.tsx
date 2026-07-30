import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Listen } from './Listen'
import { Dictate } from './Dictate'
import { Build } from './Build'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'
import type { Card } from '../../types'

const card: Card = {
  id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
  exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
  pos: 'noun',
}

beforeEach(() => {
  useStore.setState({ ...createInitialState(0), unlocked: null })
})

describe('Listen', () => {
  it('offers four options and never shows the word as text before answering', () => {
    render(<Listen card={card} onAnswer={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: /^(?!Play|Replay).+/ }).length).toBeGreaterThanOrEqual(4)
  })

  it('reports a correct pick', async () => {
    const onAnswer = vi.fn()
    render(<Listen card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'water' }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('grades only once when Continue is double-tapped', async () => {
    const onAnswer = vi.fn()
    render(<Listen card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'water' }))
    const cont = screen.getByRole('button', { name: /continue/i })
    await userEvent.click(cont)
    await userEvent.click(cont)
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})

describe('Dictate', () => {
  it('accepts the sentence with loose punctuation', async () => {
    const onAnswer = vi.fn()
    render(<Dictate card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'i want water please')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('reveals the sentence after a miss', async () => {
    render(<Dictate card={card} onAnswer={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(screen.getByText(/I want water, please\./)).toBeInTheDocument()
  })

  it('grades only once when Continue is double-tapped', async () => {
    const onAnswer = vi.fn()
    render(<Dictate card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'i want water please')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    const cont = screen.getByRole('button', { name: /continue/i })
    await userEvent.click(cont)
    await userEvent.click(cont)
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})

describe('Build', () => {
  it('accepts the words tapped in the right order', async () => {
    const onAnswer = vi.fn()
    render(<Build card={card} onAnswer={onAnswer} />)
    for (const word of ['I', 'want', 'water,', 'please.']) {
      await userEvent.click(screen.getByRole('button', { name: word }))
    }
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('returns a placed token to the pool when tapped again', async () => {
    render(<Build card={card} onAnswer={vi.fn()} />)
    const first = screen.getByRole('button', { name: 'I' })
    await userEvent.click(first)
    await userEvent.click(screen.getByRole('button', { name: 'I' }))
    expect(screen.getByRole('button', { name: /check/i })).toBeDisabled()
  })

  it('shows the Portuguese sentence as the prompt', () => {
    render(<Build card={card} onAnswer={vi.fn()} />)
    expect(screen.getByText('Eu quero água, por favor.')).toBeInTheDocument()
  })

  it('grades only once when Continue is double-tapped', async () => {
    const onAnswer = vi.fn()
    render(<Build card={card} onAnswer={onAnswer} />)
    for (const word of ['I', 'want', 'water,', 'please.']) {
      await userEvent.click(screen.getByRole('button', { name: word }))
    }
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    const cont = screen.getByRole('button', { name: /continue/i })
    await userEvent.click(cont)
    await userEvent.click(cont)
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})
