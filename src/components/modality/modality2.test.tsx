import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Listen } from './Listen'
import { Dictate } from './Dictate'
import { Build } from './Build'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'
import type { Card } from '../../types'

vi.mock('../../audio/speak', () => ({
  speak: vi.fn(),
  cancelSpeech: vi.fn(),
  warmUp: vi.fn(),
  pickVoice: vi.fn(),
}))

import { speak } from '../../audio/speak'

const card: Card = {
  id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
  exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
  pos: 'noun',
}

/**
 * Scoped to the rating group on purpose: Listen's multiple-choice options are
 * drawn from real content, so a distractor could easily read "Good morning"
 * and collide with a bare /good/ query.
 */
function rating(name: RegExp) {
  const group = screen.getByRole('group', { name: /how well did you know it/i })
  return within(group).getByRole('button', { name })
}

beforeEach(() => {
  vi.clearAllMocks()
  useStore.setState({ ...createInitialState(0), unlocked: null })
})

describe('Listen', () => {
  it('offers four options and never shows the word as text before answering', () => {
    render(<Listen card={card} onAnswer={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: /^(?!Play|Replay).+/ }).length).toBeGreaterThanOrEqual(4)
  })

  it('suggests Good after a correct pick and reports the rating she taps', async () => {
    const onAnswer = vi.fn()
    render(<Listen card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'water' }))
    expect(rating(/^Good/)).toHaveAttribute('data-suggested', 'true')
    await userEvent.click(rating(/^Good/))
    // Was `true`; Continue is now the four ratings.
    expect(onAnswer).toHaveBeenCalledWith(2)
  })

  it('lets her say it was easy even though the app only knows it was right', async () => {
    const onAnswer = vi.fn()
    render(<Listen card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'water' }))
    await userEvent.click(rating(/^Easy/))
    expect(onAnswer).toHaveBeenCalledWith(3)
  })

  it('grades only once when two ratings are tapped', async () => {
    const onAnswer = vi.fn()
    render(<Listen card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'water' }))
    await userEvent.click(rating(/^Again/))
    await userEvent.click(rating(/^Easy/))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(0)
  })
})

describe('Dictate', () => {
  it('accepts the sentence with loose punctuation', async () => {
    const onAnswer = vi.fn()
    render(<Dictate card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'i want water please')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(rating(/^Good/)).toHaveAttribute('data-suggested', 'true')
    await userEvent.click(rating(/^Good/))
    expect(onAnswer).toHaveBeenCalledWith(2)
  })

  it('reveals the sentence after a miss and suggests Again', async () => {
    render(<Dictate card={card} onAnswer={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(screen.getByText(/I want water, please\./)).toBeInTheDocument()
    expect(rating(/^Again/)).toHaveAttribute('data-suggested', 'true')
  })

  it('grades only once when two ratings are tapped', async () => {
    const onAnswer = vi.fn()
    render(<Dictate card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'i want water please')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(rating(/^Hard/))
    await userEvent.click(rating(/^Easy/))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(1)
  })

  it('plays the sentence even when auto-play audio is off', () => {
    useStore.setState({ autoPlayAudio: false })
    render(<Dictate card={card} onAnswer={vi.fn()} />)
    expect(speak).toHaveBeenCalled()
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
    expect(rating(/^Good/)).toHaveAttribute('data-suggested', 'true')
    await userEvent.click(rating(/^Good/))
    expect(onAnswer).toHaveBeenCalledWith(2)
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

  it('grades only once when two ratings are tapped', async () => {
    const onAnswer = vi.fn()
    render(<Build card={card} onAnswer={onAnswer} />)
    for (const word of ['I', 'want', 'water,', 'please.']) {
      await userEvent.click(screen.getByRole('button', { name: word }))
    }
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(rating(/^Again/))
    await userEvent.click(rating(/^Good/))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(0)
  })
})
