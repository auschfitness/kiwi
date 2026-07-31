import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Speak } from './Speak'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'
import type { Card } from '../../types'
import { recognizeOnce } from '../../audio/listen'

vi.mock('../../audio/listen', () => ({ recognizeOnce: vi.fn(async () => '') }))
vi.mock('../../audio/speak', () => ({ speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn() }))

const card: Card = {
  id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
  exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
  pos: 'noun',
}

function rating(name: RegExp) {
  const group = screen.getByRole('group', { name: /how well did you know it/i })
  return within(group).getByRole('button', { name })
}

beforeEach(() => {
  vi.clearAllMocks()
  useStore.setState({ ...createInitialState(0), unlocked: null })
})

describe('Speak', () => {
  it('shows the word and a mic button', () => {
    render(<Speak card={card} onAnswer={vi.fn()} />)
    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /record your voice/i })).toBeInTheDocument()
  })

  it('praises a correct attempt and suggests Good', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('water')
    const onAnswer = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    expect(await screen.findByText(/ka pai/i)).toBeInTheDocument()
    expect(rating(/^Good/)).toHaveAttribute('data-suggested', 'true')
    await userEvent.click(rating(/^Good/))
    // Was `true`; Continue is now the four ratings.
    expect(onAnswer).toHaveBeenCalledWith(2)
  })

  it('lets her overrule the mic and call a scraped-through attempt hard', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('water')
    const onAnswer = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    await userEvent.click(await screen.findByRole('button', { name: /^Hard/ }))
    expect(onAnswer).toHaveBeenCalledWith(1)
  })

  it('grades nothing at all when the microphone catches nothing — it skips instead', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('')
    const onAnswer = vi.fn()
    const onSkip = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} onSkip={onSkip} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    expect(await screen.findByText(/didn't catch that/i)).toBeInTheDocument()
    // Was a check for the absence of "Continue"; the ratings replaced it, so
    // the assertion is now that the whole rating group never renders here.
    expect(screen.queryByRole('group', { name: /how well did you know it/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /skip this one/i }))
    expect(onSkip).toHaveBeenCalledTimes(1)
    // The whole point: a denied or silent mic must not grade her down *or* up.
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it('skips only once when Skip is double-tapped', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('')
    const onSkip = vi.fn()
    render(<Speak card={card} onAnswer={vi.fn()} onSkip={onSkip} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    const skip = await screen.findByRole('button', { name: /skip this one/i })
    await userEvent.click(skip)
    await userEvent.click(skip)
    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('offers no skip button at all when the host gives it no ungraded exit', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('')
    const onAnswer = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    expect(await screen.findByText(/didn't catch that/i)).toBeInTheDocument()
    // Never fall back to grading: no button beats a button that lies.
    expect(screen.queryByRole('button', { name: /skip this one/i })).not.toBeInTheDocument()
    // And no rating either — a dead mic must not be able to reach the store
    // through any of the four new buttons.
    expect(screen.queryByRole('group', { name: /how well did you know it/i })).not.toBeInTheDocument()
    expect(onAnswer).not.toHaveBeenCalled()
  })

  it('grades only once when two ratings are tapped', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('water')
    const onAnswer = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    await userEvent.click(await screen.findByRole('button', { name: /^Easy/ }))
    await userEvent.click(rating(/^Again/))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(3)
  })
})
