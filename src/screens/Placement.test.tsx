import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Placement } from './Placement'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

// buildPlacementTest shuffles with Fisher-Yates: j = floor(rand() * (i + 1)).
// A value just under 1 makes j === i every time, so the shuffle is the identity
// and the correct answer always lands at options[0]. answerAllWrong() clicks the
// LAST option, which is therefore always a distractor — deterministically wrong.
// With real Math.random this test failed about 1 run in 93.
beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.999999)
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

afterEach(() => {
  vi.restoreAllMocks()
})

async function answerAllWrong() {
  for (let i = 0; i < 20; i++) {
    const options = screen.queryAllByTestId('placement-option')
    if (options.length > 0) { await userEvent.click(options[options.length - 1]); continue }
    const input = screen.queryByRole('textbox')
    if (input) {
      await userEvent.type(input, 'zzzz')
      await userEvent.click(screen.getByRole('button', { name: /next|finish/i }))
      continue
    }
    break
  }
}

describe('Placement', () => {
  it('shows a question counter', () => {
    render(<Placement onDone={vi.fn()} />)
    // buildPlacementTest draws 5 questions each from bands 1-3 and 2 from band 4.
    // Level-4 content doesn't exist until Task 22, so cardsByLevel[4] is empty
    // today and the generated test is 15 questions, not 17. The counter must be
    // derived from questions.length, never hardcoded — this assertion is
    // deliberately count-agnostic so it keeps passing once Task 22 lands B2 decks.
    expect(screen.getByText(/question 1 of \d+/i)).toBeInTheDocument()
  })

  it('gives no per-question feedback', async () => {
    render(<Placement onDone={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('placement-option')[0])
    expect(screen.queryByText(/correct!/i)).not.toBeInTheDocument()
  })

  it('places a learner who answers everything wrong at A1', async () => {
    render(<Placement onDone={vi.fn()} />)
    await answerAllWrong()
    // The store is now written on Continue, not the instant the last
    // question is answered — that's the whole point of the fix (Placement's
    // own result screen has to get a chance to render first). So the store
    // assertion moves to after the Continue tap.
    await userEvent.click(screen.getByRole('button', { name: /continue|start/i }))
    expect(useStore.getState().placed).toBe(true)
    expect(useStore.getState().cefrLevel).toBe(1)
    expect(useStore.getState().unlockedLevel).toBe(1)
  })

  it('seeds nothing below level 1', async () => {
    render(<Placement onDone={vi.fn()} />)
    await answerAllWrong()
    await userEvent.click(screen.getByRole('button', { name: /continue|start/i }))
    expect(Object.keys(useStore.getState().cards)).toHaveLength(0)
  })

  it('announces the result and continues home', async () => {
    const onDone = vi.fn()
    render(<Placement onDone={onDone} />)
    await answerAllWrong()
    expect(screen.getByText(/you're at a1/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /continue|start/i }))
    expect(onDone).toHaveBeenCalled()
  })
})
