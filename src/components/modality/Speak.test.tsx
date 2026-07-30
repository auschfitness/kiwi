import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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

  it('praises a correct attempt and grades it correct', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('water')
    const onAnswer = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    expect(await screen.findByText(/ka pai/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('never grades her down when the microphone catches nothing — it offers a skip instead', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('')
    const onAnswer = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    expect(await screen.findByText(/didn't catch that/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^continue$/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /skip this one/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('grades only once when Continue is double-tapped', async () => {
    vi.mocked(recognizeOnce).mockResolvedValueOnce('water')
    const onAnswer = vi.fn()
    render(<Speak card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    const cont = await screen.findByRole('button', { name: /continue/i })
    await userEvent.click(cont)
    await userEvent.click(cont)
    expect(onAnswer).toHaveBeenCalledTimes(1)
  })
})
