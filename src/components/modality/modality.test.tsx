import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Learn } from './Learn'
import { Recognize } from './Recognize'
import { Type } from './Type'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'
import type { Card } from '../../types'

const card: Card = {
  id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
  exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
  pos: 'noun', phonetic: 'ˈwɔːtə',
}

beforeEach(() => {
  useStore.setState({ ...createInitialState(0), unlocked: null, autoPlayAudio: false })
})

describe('Learn', () => {
  it('teaches the word and reports a correct exposure', async () => {
    const onAnswer = vi.fn()
    render(<Learn card={card} onAnswer={onAnswer} />)
    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByText('água')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('hides Portuguese when the setting is off', () => {
    useStore.setState({ showPortuguese: false })
    render(<Learn card={card} onAnswer={vi.fn()} />)
    expect(screen.queryByText('água')).not.toBeInTheDocument()
  })

  it('reports the exposure only once when tapped twice', async () => {
    const onAnswer = vi.fn()
    render(<Learn card={card} onAnswer={onAnswer} />)
    const btn = screen.getByRole('button', { name: /got it/i })
    await userEvent.click(btn)
    await userEvent.click(btn)
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})

describe('Recognize', () => {
  it('hides the meaning until asked, then self-marks', async () => {
    const onAnswer = vi.fn()
    render(<Recognize card={card} onAnswer={onAnswer} />)
    expect(screen.queryByText('água')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    expect(screen.getByText('água')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /knew it/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('reports a miss', async () => {
    const onAnswer = vi.fn()
    render(<Recognize card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(screen.getByRole('button', { name: /didn't/i }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })

  it('does not record a second, contradictory grade', async () => {
    const onAnswer = vi.fn()
    render(<Recognize card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(screen.getByRole('button', { name: /knew it/i }))
    await userEvent.click(screen.getByRole('button', { name: /didn't/i }))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
})

describe('Type', () => {
  it('accepts a leniently matching answer', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'Water!')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('shows the answer after a miss and reports it', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'fire')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(screen.getByText(/water/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })

  it('blanks the target in the example sentence', () => {
    render(<Type card={card} onAnswer={vi.fn()} />)
    expect(screen.getByText(/I want _____, please\./)).toBeInTheDocument()
  })

  it('does not accept an empty answer as correct', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })

  it('grades only once when Continue is double-tapped', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'water')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    const cont = screen.getByRole('button', { name: /continue/i })
    await userEvent.click(cont)
    await userEvent.click(cont)
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})
