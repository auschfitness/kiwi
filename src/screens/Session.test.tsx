import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Session } from './Session'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'
import { recognizeOnce } from '../audio/listen'

// A speak item is the only way to reach the ungraded-skip path, and speak
// items only appear when the browser exposes SpeechRecognition (see the
// stubGlobal in the skip test below).
vi.mock('../audio/listen', () => ({ recognizeOnce: vi.fn(async () => '') }))

afterEach(() => {
  vi.unstubAllGlobals()
})

/** One of the four ratings, scoped to their group so nothing else can match. */
function rating(name: RegExp) {
  const group = screen.getByRole('group', { name: /how well did you know it/i })
  return within(group).getByRole('button', { name })
}

/** Whichever control the current item is showing, tapped. Returns false at the end. */
async function advance(): Promise<boolean> {
  const gotIt = screen.queryByRole('button', { name: /got it/i })
  if (gotIt) { await userEvent.click(gotIt); return true }
  const reveal = screen.queryByRole('button', { name: /show meaning/i })
  if (reveal) { await userEvent.click(reveal); return true }
  const group = screen.queryByRole('group', { name: /how well did you know it/i })
  if (group) { await userEvent.click(within(group).getByRole('button', { name: /^Good/ })); return true }
  return false
}

beforeEach(() => {
  useStore.setState({
    ...createInitialState(Date.now()),
    unlocked: null, unlockedLevel: 1,
    newPerSession: 3, autoPlayAudio: false,
  })
})

describe('Session', () => {
  it('teaches new cards first time through', () => {
    render(<Session onDone={vi.fn()} />)
    expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
  })

  it('advances through the queue and finishes', async () => {
    const onDone = vi.fn()
    render(<Session onDone={onDone} />)
    // newPerSession is 3 and nothing is studied, so the queue is 3 teaching
    // items followed by buildQueue's recognition pass — a recall check over
    // those same 3 cards (see src/core/queue.ts). The loop walks whichever
    // control the current item actually shows; the recognition pass now ends
    // in the four ratings rather than a "Knew it" button, so `advance` taps
    // Good there. Good, not Easy: Good is what a thoughtless tap-through used
    // to produce, so the queue length this loop walks is unchanged.
    for (let i = 0; i < 12 && onDone.mock.calls.length === 0; i++) {
      if (!(await advance())) break
    }
    expect(onDone).toHaveBeenCalled()
  })

  it('tests the cards it just taught instead of ending after the learns', async () => {
    const onDone = vi.fn()
    render(<Session onDone={onDone} />)
    for (let i = 0; i < 3; i++) {
      await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    }
    // Before the recognition pass, three taps of "Got it" was the whole
    // session and this called onDone.
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /show meaning/i })).toBeInTheDocument()
  })

  it('records progress in the store as she answers', async () => {
    render(<Session onDone={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(useStore.getState().doneToday).toBe(1)
    expect(Object.keys(useStore.getState().cards).length).toBeGreaterThan(0)
  })

  it('scopes the session to one deck when asked', () => {
    render(<Session deckId="numbers" onDone={vi.fn()} />)
    const ids = Object.keys(useStore.getState().cards)
    expect(ids.every(id => id.startsWith('numbers_') || ids.length === 0)).toBe(true)
  })

  it('shows a friendly empty state when nothing is due', () => {
    useStore.setState({ newPerSession: 0 })
    render(<Session deckId="numbers" onDone={vi.fn()} />)
    expect(screen.getByText(/all done for now/i)).toBeInTheDocument()
  })

  it('lets her leave early', async () => {
    const onDone = vi.fn()
    render(<Session onDone={onDone} />)
    await userEvent.click(screen.getByRole('button', { name: /finish session/i }))
    expect(onDone).toHaveBeenCalled()
  })

  it('brings a missed card back before the session ends', async () => {
    // Card: survival_0 ("Hello", pos "greeting").
    //   isTypable: "Hello".length (5) <= 16, no "…", pos "greeting" is in
    //     TYPABLE_POS -> true, so 'listen' and 'type' are supported.
    //   isSentence: stripTags("<b>Hello</b>, how are you?") -> "Hello, how are
    //     you?" -> 4 words, 3 <= 4 <= 9 -> true, so 'build' and 'dictate' are
    //     supported too. canSpeak is forced false in Session, so 'speak' is not.
    //   supported = ORDER.filter(...) = ['recognize','listen','type','build','dictate']
    //     (length 5).
    //   pickModality returns supported[reps % supported.length]. reps must be
    //   > 0 for the card to count as studied (isNew is reps === 0), so the
    //   smallest reps that lands on index 0 ('recognize') is reps = 5
    //   (5 % 5 === 0).
    useStore.setState({
      ...createInitialState(Date.now()),
      unlocked: null, unlockedLevel: 1,
      newPerSession: 0, autoPlayAudio: false,
      cards: { survival_0: { due: Date.now() - 1000, interval: 1, ease: 2.5, reps: 5, lapses: 0 } },
    })
    const onDone = vi.fn()
    render(<Session deckId="survival" onDone={onDone} />)

    // The one due card, in its recognize form. Was the "Didn't" button; the
    // requeue now hangs off rating 0 rather than a boolean, so this taps Again.
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(rating(/^Again/))

    // It was requeued, so the session is not over and the card is shown again.
    expect(onDone).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /show meaning/i })).toBeInTheDocument()
    expect(useStore.getState().cards.survival_0.lapses).toBe(1)

    // And the repeat arrives alive: without the React key on the modality the
    // previous instance's `answered` flag would survive and all four ratings
    // would come back already dead.
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    for (const name of [/^Again/, /^Hard/, /^Good/, /^Easy/]) {
      expect(rating(name)).toBeEnabled()
    }
  })

  // Same survival_0 / reps-5 reasoning as the requeue test above: it lands on
  // 'recognize', the one graded modality that needs no answer checked first.
  function oneDueRecognizeCard() {
    useStore.setState({
      ...createInitialState(Date.now()),
      unlocked: null, unlockedLevel: 1,
      newPerSession: 0, autoPlayAudio: false,
      cards: { survival_0: { due: Date.now() - 1000, interval: 1, ease: 2.5, reps: 5, lapses: 0 } },
    })
  }

  it('does not bring a card back when she says it was only hard', async () => {
    oneDueRecognizeCard()
    const onDone = vi.fn()
    render(<Session deckId="survival" onDone={onDone} />)

    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(rating(/^Hard/))

    // Only rating 0 requeues. Hard is a pass, so the session ends here.
    expect(onDone).toHaveBeenCalled()
    const after = useStore.getState().cards.survival_0
    expect(after.lapses).toBe(0)
    expect(after.ease).toBeCloseTo(2.35, 5)
  })

  it('does not silently promote a fast answer to Easy any more', async () => {
    // The old speed heuristic turned any correct answer given within three
    // seconds into rating 3. userEvent is far quicker than that, so under the
    // old code this tap arrived as Easy (ease 2.6) even though she said Good.
    oneDueRecognizeCard()
    render(<Session deckId="survival" onDone={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(rating(/^Good/))

    expect(useStore.getState().cards.survival_0.ease).toBe(2.5)
  })

  it('sends Easy through untouched when that is what she taps', async () => {
    oneDueRecognizeCard()
    render(<Session deckId="survival" onDone={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(rating(/^Easy/))

    expect(useStore.getState().cards.survival_0.ease).toBeCloseTo(2.6, 5)
  })

  it('a skipped speak card is not graded — no scheduling, no skill stat, no daily count', async () => {
    // Same survival_0 reasoning as above, but with SpeechRecognition present:
    // supported = ['recognize','listen','type','build','dictate','speak'] (6),
    // so reps = 5 lands on index 5, 'speak'. recognizeOnce is mocked to '' —
    // exactly what a denied microphone returns on Android Chrome, where
    // speechRecognitionAvailable() is still true because permission is only
    // checked at start().
    vi.stubGlobal('SpeechRecognition', class {})
    const state = { due: Date.now() - 1000, interval: 1, ease: 2.5, reps: 5, lapses: 0 }
    useStore.setState({
      ...createInitialState(Date.now()),
      unlocked: null, unlockedLevel: 1,
      newPerSession: 0, autoPlayAudio: false,
      cards: { survival_0: { ...state } },
    })
    vi.mocked(recognizeOnce).mockResolvedValueOnce('')

    const onDone = vi.fn()
    render(<Session deckId="survival" onDone={onDone} />)

    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    await userEvent.click(await screen.findByRole('button', { name: /skip this one/i }))

    // She moved on, but bought nothing: the card keeps the exact scheduling it
    // had, speaking gains no reviews, and the day's counter has not ticked.
    const after = useStore.getState()
    expect(after.cards).toEqual({ survival_0: state })
    expect(after.skills).toEqual(createInitialState(0).skills)
    expect(after.doneToday).toBe(0)
    expect(onDone).toHaveBeenCalled()
  })
})
