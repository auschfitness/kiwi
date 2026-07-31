import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RatingButtons } from './RatingButtons'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'

const CARD_ID = 'x_0'

beforeEach(() => {
  useStore.setState({ ...createInitialState(0), unlocked: null })
})

function group() {
  return screen.getByRole('group', { name: /how well did you know it/i })
}

function button(name: RegExp) {
  return within(group()).getByRole('button', { name })
}

describe('RatingButtons', () => {
  it('offers all four ratings, each reporting its own number', async () => {
    const onRate = vi.fn()
    const labels: [RegExp, number][] = [[/^Again/, 0], [/^Hard/, 1], [/^Good/, 2], [/^Easy/, 3]]

    for (const [name, rating] of labels) {
      onRate.mockClear()
      const { unmount } = render(<RatingButtons cardId={CARD_ID} onRate={onRate} />)
      await userEvent.click(button(name))
      expect(onRate).toHaveBeenCalledWith(rating)
      unmount()
    }
  })

  it('prints the interval each button would produce on a brand new card', () => {
    render(<RatingButtons cardId={CARD_ID} onRate={vi.fn()} />)
    expect(button(/^Again/)).toHaveAccessibleName(/10m/)
    expect(button(/^Hard/)).toHaveAccessibleName(/10m/)
    expect(button(/^Good/)).toHaveAccessibleName(/1d/)
    expect(button(/^Easy/)).toHaveAccessibleName(/4d/)
  })

  it('shows longer intervals as the card matures — the labels are not hardcoded', () => {
    // Two good answers in: reps 2, interval 3, ease 2.5. Good now multiplies
    // (3 * 2.5 -> 8d) instead of using the new-card steps above.
    useStore.setState({
      cards: { [CARD_ID]: { due: 0, interval: 3, ease: 2.5, reps: 2, lapses: 0 } },
    })
    render(<RatingButtons cardId={CARD_ID} onRate={vi.fn()} />)
    expect(button(/^Good/)).toHaveAccessibleName(/8d/)
    expect(button(/^Easy/)).toHaveAccessibleName(/10d/)
    // Again is the one that never grows: always back to the ten-minute step.
    expect(button(/^Again/)).toHaveAccessibleName(/10m/)
  })

  it('marks the suggested rating without colour, and without locking the others', () => {
    render(<RatingButtons cardId={CARD_ID} onRate={vi.fn()} suggested={2} />)
    const good = button(/^Good/)

    // Three non-colour cues: a data hook the ring hangs off, the ring itself
    // (a shape, not a hue), a star glyph, and the word "suggested" for a
    // screen reader.
    expect(good).toHaveAttribute('data-suggested', 'true')
    expect(good.className).toMatch(/ring-2/)
    expect(good).toHaveTextContent('★')
    expect(good).toHaveAccessibleName(/suggested/i)

    // A hint, not a decision: every button stays tappable.
    for (const name of [/^Again/, /^Hard/, /^Good/, /^Easy/]) {
      expect(button(name)).toBeEnabled()
    }
    expect(button(/^Again/)).not.toHaveAttribute('data-suggested')
  })

  it('suggests Again when the answer was wrong', () => {
    render(<RatingButtons cardId={CARD_ID} onRate={vi.fn()} suggested={0} />)
    expect(button(/^Again/)).toHaveAttribute('data-suggested', 'true')
    expect(button(/^Good/)).not.toHaveAttribute('data-suggested')
  })

  it('marks nothing when there is nothing to suggest', () => {
    render(<RatingButtons cardId={CARD_ID} onRate={vi.fn()} />)
    for (const name of [/^Again/, /^Hard/, /^Good/, /^Easy/]) {
      expect(button(name)).not.toHaveAttribute('data-suggested')
    }
  })

  it('disables all four together', () => {
    render(<RatingButtons cardId={CARD_ID} onRate={vi.fn()} disabled />)
    for (const name of [/^Again/, /^Hard/, /^Good/, /^Easy/]) {
      expect(button(name)).toBeDisabled()
    }
  })
})
