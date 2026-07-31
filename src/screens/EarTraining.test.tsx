import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EarTraining } from './EarTraining'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'
import { speak, pickVoice } from '../audio/speak'
import { speechSynthesisAvailable } from '../audio/capabilities'
import { MINIMAL_PAIRS } from '../content'
import { quizzablePairs } from '../core/minimalPairs'

vi.mock('../audio/speak', () => ({
  speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn(), setDefaultRate: vi.fn(),
}))
vi.mock('../audio/capabilities', () => ({
  speechSynthesisAvailable: vi.fn(() => true),
  speechRecognitionAvailable: vi.fn(() => false),
}))

const canSpeak = vi.mocked(speechSynthesisAvailable)
const spoke = vi.mocked(speak)

/**
 * Pinning Math.random pins the round: the shuffle and the coin flip both read
 * it, and at 0 the flip always lands on side "a". So the word played is always
 * the pair's first word — a known right answer and a known wrong one.
 */
beforeEach(() => {
  vi.clearAllMocks()
  canSpeak.mockReturnValue(true)
  vi.mocked(pickVoice).mockReturnValue(null)
  vi.spyOn(Math, 'random').mockReturnValue(0)
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true })
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

function listening() {
  return useStore.getState().skills.listening
}

/** The word the quiz just played, read back off the audio stub. */
function lastSpoken(): string {
  return spoke.mock.calls.at(-1)?.[0] ?? ''
}

async function startQuiz() {
  render(<EarTraining onBack={vi.fn()} />)
  await userEvent.click(screen.getByTestId('ear-quiz'))
}

describe('Ear training menu', () => {
  it('offers Compare and the quiz, and explains the Kiwi vowel shift', () => {
    render(<EarTraining onBack={vi.fn()} />)
    expect(screen.getByTestId('ear-compare')).toBeInTheDocument()
    expect(screen.getByTestId('ear-quiz')).toBeInTheDocument()
    expect(screen.getByText(/kiwis move their short vowels/i)).toBeInTheDocument()
  })

  it('goes back to Practice', async () => {
    const onBack = vi.fn()
    render(<EarTraining onBack={onBack} />)
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(onBack).toHaveBeenCalled()
  })
})

describe('Ear training without speech synthesis', () => {
  it('says so honestly and offers neither mode', () => {
    canSpeak.mockReturnValue(false)
    render(<EarTraining onBack={vi.fn()} />)
    expect(screen.getByText(/this browser can.t speak/i)).toBeInTheDocument()
    expect(screen.queryByTestId('ear-quiz')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ear-compare')).not.toBeInTheDocument()
  })
})

describe('the honest note about the voice', () => {
  it('warns her when the phone has no voice list at all', () => {
    render(<EarTraining onBack={vi.fn()} />)
    expect(screen.getByText(/may not have a new zealand voice/i)).toBeInTheDocument()
  })

  it('names the accent her phone is actually going to use', () => {
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.mocked(pickVoice).mockReturnValue({ lang: 'en-US' } as SpeechSynthesisVoice)
    render(<EarTraining onBack={vi.fn()} />)
    expect(screen.getByText(/an American voice, not a Kiwi one/i)).toBeInTheDocument()
  })

  it('says so when the phone really does have a Kiwi voice', () => {
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [],
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.mocked(pickVoice).mockReturnValue({ lang: 'en-NZ' } as SpeechSynthesisVoice)
    render(<EarTraining onBack={vi.fn()} />)
    expect(screen.getByText(/has a new zealand voice/i)).toBeInTheDocument()
  })
})

describe('Compare mode', () => {
  it('plays a word on tap and records absolutely nothing', async () => {
    render(<EarTraining onBack={vi.fn()} />)
    await userEvent.click(screen.getByTestId('ear-compare'))

    await userEvent.click(screen.getByRole('button', { name: 'Play pen' }))
    expect(speak).toHaveBeenCalledWith('pen', 'en-NZ')
    await userEvent.click(screen.getByRole('button', { name: 'Play pin' }))
    expect(speak).toHaveBeenCalledWith('pin', 'en-NZ')

    expect(listening()).toEqual({ correct: 0, total: 0 })
  })

  it('shows the teaching line for every pair, merges included', async () => {
    render(<EarTraining onBack={vi.fn()} />)
    await userEvent.click(screen.getByTestId('ear-compare'))

    for (const pair of MINIMAL_PAIRS) {
      expect(screen.getByText(pair.note), `${pair.a}/${pair.b}`).toBeInTheDocument()
    }
    // The NEAR/SQUARE pairs live here and nowhere else — they are labelled
    // rather than quietly dropped.
    expect(screen.getAllByText(/kiwis say these the same/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Play beer' })).toBeInTheDocument()
  })
})

describe('Ear training quiz', () => {
  it('plays one word of a pair and offers both as choices', async () => {
    await startQuiz()
    const said = lastSpoken()
    expect(said).toBeTruthy()

    const a = screen.getByTestId('ear-choice-a').textContent
    const b = screen.getByTestId('ear-choice-b').textContent
    expect([a, b]).toContain(said)
    expect(screen.getByText('Item 1 of 10')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /play audio/i })).toBeInTheDocument()
  })

  it('never quizzes a pair Kiwis genuinely merge', async () => {
    await startQuiz()
    const merged = new Set(MINIMAL_PAIRS.filter(p => p.merged).flatMap(p => [p.a, p.b]))
    expect(quizzablePairs(MINIMAL_PAIRS).length).toBeLessThan(MINIMAL_PAIRS.length)

    for (let i = 0; i < 10; i++) {
      expect(merged.has(screen.getByTestId('ear-choice-a').textContent ?? '')).toBe(false)
      expect(merged.has(screen.getByTestId('ear-choice-b').textContent ?? '')).toBe(false)
      await userEvent.click(screen.getByTestId('ear-choice-a'))
      await userEvent.click(screen.getByRole('button', { name: i === 9 ? /see my score/i : /next/i }))
    }
  })

  it('records a right answer as listening practice and shows the note', async () => {
    await startQuiz()
    const said = lastSpoken()
    await userEvent.click(screen.getByRole('button', { name: said }))

    expect(screen.getByText(/ka pai/i)).toBeInTheDocument()
    expect(screen.getByText('1 right')).toBeInTheDocument()
    expect(listening()).toEqual({ correct: 1, total: 1 })

    const note = screen.getByTestId('ear-note').textContent ?? ''
    expect(MINIMAL_PAIRS.map(p => p.note)).toContain(note)
  })

  it('records a wrong answer, names the word and still shows the note', async () => {
    await startQuiz()
    const said = lastSpoken()
    const wrong = [
      screen.getByTestId('ear-choice-a'),
      screen.getByTestId('ear-choice-b'),
    ].find(btn => btn.textContent !== said)!

    await userEvent.click(wrong)

    expect(screen.getByText(/not quite/i).textContent).toContain(said)
    expect(screen.getByTestId('ear-note').textContent).toBeTruthy()
    expect(listening()).toEqual({ correct: 0, total: 1 })
  })

  it('grades one question once, however many times a choice fires', async () => {
    await startQuiz()
    const btn = screen.getByTestId('ear-choice-a')
    fireEvent.click(btn)
    fireEvent.click(btn)
    fireEvent.click(btn)
    expect(listening().total).toBe(1)
  })

  it('plays the next question on arrival', async () => {
    await startQuiz()
    expect(speak).toHaveBeenCalledTimes(1)

    await userEvent.click(screen.getByTestId('ear-choice-a'))
    await userEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText('Item 2 of 10')).toBeInTheDocument()
    expect(speak).toHaveBeenCalledTimes(2)
  })

  it('runs to the end and shows a score with a warm line', async () => {
    await startQuiz()
    for (let i = 0; i < 10; i++) {
      await userEvent.click(screen.getByRole('button', { name: lastSpoken() }))
      await userEvent.click(screen.getByRole('button', { name: i === 9 ? /see my score/i : /next/i }))
    }

    expect(screen.getByText('You got 10 out of 10')).toBeInTheDocument()
    expect(screen.getByText(/sweet as/i)).toBeInTheDocument()
    expect(listening()).toEqual({ correct: 10, total: 10 })

    await userEvent.click(screen.getByRole('button', { name: /play again/i }))
    expect(screen.getByText('Item 1 of 10')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(screen.getByTestId('ear-compare')).toBeInTheDocument()
  })
})
