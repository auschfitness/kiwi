import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Roleplay } from './Roleplay'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'
import { recognizeOnce } from '../audio/listen'
import { speak } from '../audio/speak'
import { speechRecognitionAvailable } from '../audio/capabilities'
import { ROLEPLAYS } from '../content'
import { youTurnCount } from '../core/roleplay'

vi.mock('../audio/listen', () => ({ recognizeOnce: vi.fn(async () => '') }))
vi.mock('../audio/speak', () => ({
  speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn(), setDefaultRate: vi.fn(),
}))
vi.mock('../audio/capabilities', () => ({
  speechSynthesisAvailable: vi.fn(() => true),
  speechRecognitionAvailable: vi.fn(() => true),
}))

const listen = vi.mocked(recognizeOnce)
const spoke = vi.mocked(speak)
const canListen = vi.mocked(speechRecognitionAvailable)

const CAFE = ROLEPLAYS.find(r => r.id === 'cafe')!

beforeEach(() => {
  vi.clearAllMocks()
  canListen.mockReturnValue(true)
  listen.mockResolvedValue('')
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function speaking() {
  return useStore.getState().skills.speaking
}

/** Answer every `you` line of the café script with its own scripted text. */
function answerPerfectly() {
  const lines = CAFE.turns.filter(t => t.speaker === 'you').map(t => t.en)
  let i = 0
  listen.mockImplementation(async () => lines[Math.min(i++, lines.length - 1)])
}

async function openCafe() {
  render(<Roleplay onBack={vi.fn()} />)
  await userEvent.click(screen.getByTestId('roleplay-cafe'))
}

describe('Role-play list', () => {
  it('offers all six scenes with their level, and locks nothing', () => {
    render(<Roleplay onBack={vi.fn()} />)
    for (const rp of ROLEPLAYS) {
      const card = screen.getByTestId(`roleplay-${rp.id}`)
      expect(card).toBeEnabled()
      expect(card).toHaveTextContent(rp.title)
    }
    expect(screen.getAllByText(/^(A1|A2|B1|B2)$/).length).toBe(ROLEPLAYS.length)
  })

  it('goes back to Practice from the list', async () => {
    const onBack = vi.fn()
    render(<Roleplay onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('Role-play, one scene through to the end', () => {
  it('plays the first line, waits for her, and advances when she says it', async () => {
    answerPerfectly()
    await openCafe()

    // The other person opens, out loud.
    expect(spoke).toHaveBeenCalledWith(CAFE.turns[0].en, 'en-US')
    expect(screen.getByText(CAFE.turns[0].en)).toBeInTheDocument()

    // Her line is hidden — the hint is Portuguese until she asks for it.
    expect(screen.queryByTestId('roleplay-target')).not.toBeInTheDocument()
    expect(screen.getByText(CAFE.turns[1].pt)).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('roleplay-say'))

    // What she said is in the chat, and the next line has played.
    await waitFor(() => expect(screen.getByText(CAFE.turns[2].en)).toBeInTheDocument())
    expect(spoke).toHaveBeenCalledWith(CAFE.turns[2].en, 'en-US')
  })

  it('reveals the English only when she asks for it', async () => {
    answerPerfectly()
    await openCafe()
    await userEvent.click(screen.getByTestId('roleplay-peek'))
    expect(screen.getByTestId('roleplay-target')).toHaveTextContent(CAFE.turns[1].en)
  })

  it('runs the whole conversation and records one speaking rep per line of hers', async () => {
    answerPerfectly()
    await openCafe()

    const mine = youTurnCount(CAFE.turns)
    for (let i = 0; i < mine; i++) {
      await userEvent.click(await screen.findByTestId('roleplay-say'))
    }

    expect(await screen.findByTestId('roleplay-score')).toHaveTextContent(`You nailed ${mine} of ${mine} lines`)
    expect(screen.getByText(/nice one/i)).toBeInTheDocument()
    expect(speaking()).toEqual({ correct: mine, total: mine })
  })

  it('starts over on Play it again', async () => {
    answerPerfectly()
    await openCafe()
    for (let i = 0; i < youTurnCount(CAFE.turns); i++) {
      await userEvent.click(await screen.findByTestId('roleplay-say'))
    }
    await userEvent.click(await screen.findByRole('button', { name: /play it again/i }))

    expect(screen.queryByTestId('roleplay-score')).not.toBeInTheDocument()
    expect(await screen.findByTestId('roleplay-say')).toBeInTheDocument()
  })
})

describe('Role-play when she gets it wrong', () => {
  it('offers a gentle retry, then reveals the English and lets her carry on', async () => {
    listen.mockResolvedValue('where is the train station')
    await openCafe()

    // First miss: a nudge, the mic is still there, the English still hidden.
    await userEvent.click(screen.getByTestId('roleplay-say'))
    expect(await screen.findByText(/one more go/i)).toBeInTheDocument()
    expect(screen.getByTestId('roleplay-say')).toBeInTheDocument()
    expect(screen.queryByTestId('roleplay-target')).not.toBeInTheDocument()

    // Second miss: the English appears, with a way to hear it and a way on.
    await userEvent.click(screen.getByTestId('roleplay-say'))
    expect(await screen.findByTestId('roleplay-target')).toHaveTextContent(CAFE.turns[1].en)
    expect(screen.queryByTestId('roleplay-say')).not.toBeInTheDocument()

    await userEvent.click(screen.getByTestId('roleplay-hear-it'))
    expect(spoke).toHaveBeenCalledWith(CAFE.turns[1].en, 'en-US', expect.anything())

    // One miss recorded for the line, not two — and she is not stuck.
    expect(speaking()).toEqual({ correct: 0, total: 1 })

    await userEvent.click(screen.getByRole('button', { name: /carry on/i }))
    await waitFor(() => expect(screen.getByText(CAFE.turns[2].en)).toBeInTheDocument())
    expect(await screen.findByTestId('roleplay-say')).toBeInTheDocument()
  })

  it('never grades her when the microphone heard nothing at all', async () => {
    // recognizeOnce resolves '' on error, silence, timeout or a missing API.
    listen.mockResolvedValue('')
    await openCafe()

    await userEvent.click(screen.getByTestId('roleplay-say'))
    expect(await screen.findByText(/didn.t catch that/i)).toBeInTheDocument()
    await userEvent.click(screen.getByTestId('roleplay-say'))
    expect(await screen.findByTestId('roleplay-target')).toBeInTheDocument()

    // A mic that hears nothing tested nothing. No failure on the meter.
    expect(speaking()).toEqual({ correct: 0, total: 0 })

    await userEvent.click(screen.getByRole('button', { name: /carry on/i }))
    expect(await screen.findByTestId('roleplay-say')).toBeInTheDocument()
    expect(speaking()).toEqual({ correct: 0, total: 0 })
  })

  it('does not score a whole run the microphone never heard a word of', async () => {
    // Not exotic: Chrome's Web Speech API needs the network, and this is an
    // app for a plane and a bus. Offline, every `recognizeOnce` resolves ''
    // and she reaches the end card having been heard exactly never. The old
    // end card printed "You nailed 0 of 5 lines" — a mark for her browser.
    listen.mockResolvedValue('')
    await openCafe()

    const mine = youTurnCount(CAFE.turns)
    for (let i = 0; i < mine; i++) {
      // Two "didn't catch that", then the reveal, then onward. Every line.
      await userEvent.click(await screen.findByTestId('roleplay-say'))
      await userEvent.click(await screen.findByTestId('roleplay-say'))
      await userEvent.click(await screen.findByRole('button', { name: /carry on/i }))
    }

    const score = await screen.findByTestId('roleplay-score')
    expect(score).not.toHaveTextContent(/nailed/i)
    expect(score).toHaveTextContent(`all ${mine} of your lines`)
    expect(speaking()).toEqual({ correct: 0, total: 0 })
  })

  it('still scores the run when the microphone heard her even once', async () => {
    // The guard is about a dead microphone, not about a bad day: one line
    // heard is enough to make the number mean something, and she keeps it.
    const first = CAFE.turns.find(t => t.speaker === 'you')!.en
    listen.mockResolvedValueOnce(first).mockResolvedValue('')
    await openCafe()

    const mine = youTurnCount(CAFE.turns)
    await userEvent.click(await screen.findByTestId('roleplay-say'))
    for (let i = 1; i < mine; i++) {
      await userEvent.click(await screen.findByTestId('roleplay-say'))
      await userEvent.click(await screen.findByTestId('roleplay-say'))
      await userEvent.click(await screen.findByRole('button', { name: /carry on/i }))
    }

    expect(await screen.findByTestId('roleplay-score')).toHaveTextContent(`You nailed 1 of ${mine} lines`)
  })

  it('shows the line with fresh state on the next turn, not the last one revealed', async () => {
    listen.mockResolvedValueOnce('where is the train station')
      .mockResolvedValueOnce('where is the train station')
      .mockResolvedValue(CAFE.turns[3].en)
    await openCafe()

    await userEvent.click(screen.getByTestId('roleplay-say'))
    await userEvent.click(await screen.findByTestId('roleplay-say'))
    await userEvent.click(await screen.findByRole('button', { name: /carry on/i }))

    // Her next line starts hidden again — the reveal must not leak across turns.
    await screen.findByTestId('roleplay-say')
    expect(screen.queryByTestId('roleplay-target')).not.toBeInTheDocument()
    expect(screen.getByTestId('roleplay-peek')).toBeInTheDocument()
  })
})

describe('Role-play without a microphone', () => {
  it('shows the English to read out loud and records nothing', async () => {
    canListen.mockReturnValue(false)
    await openCafe()

    expect(screen.getByTestId('roleplay-target')).toHaveTextContent(CAFE.turns[1].en)
    expect(screen.queryByTestId('roleplay-say')).not.toBeInTheDocument()
    expect(screen.getByText(/can.t hear you/i)).toBeInTheDocument()

    const mine = youTurnCount(CAFE.turns)
    for (let i = 0; i < mine; i++) {
      await userEvent.click(await screen.findByRole('button', { name: /next/i }))
    }

    expect(await screen.findByTestId('roleplay-score')).toHaveTextContent(`all ${mine} of your lines`)
    // Nothing measured, so nothing recorded: a false 0% would be a lie about
    // her rather than about the browser.
    expect(speaking()).toEqual({ correct: 0, total: 0 })
    expect(listen).not.toHaveBeenCalled()
  })
})
