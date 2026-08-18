import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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

/**
 * The four ratings live in their own labelled group, so a rating button can
 * never be confused with a multiple-choice option that happens to read "Good".
 */
function rating(name: RegExp) {
  const group = screen.getByRole('group', { name: /how well did you know it/i })
  return within(group).getByRole('button', { name })
}

beforeEach(() => {
  useStore.setState({ ...createInitialState(0), unlocked: null, autoPlayAudio: false })
})

describe('Learn', () => {
  it('teaches the word and reports a plain "good" exposure', async () => {
    const onAnswer = vi.fn()
    render(<Learn card={card} onAnswer={onAnswer} />)
    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByText('água')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    // Was `true`; Learn now speaks the same Rating language as everything else.
    expect(onAnswer).toHaveBeenCalledWith(2)
  })

  it('keeps its single button — teaching is not a test', () => {
    render(<Learn card={card} onAnswer={vi.fn()} />)
    expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /how well did you know it/i })).not.toBeInTheDocument()
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
  it('hides the meaning until asked, then offers all four ratings', async () => {
    render(<Recognize card={card} onAnswer={vi.fn()} />)
    expect(screen.queryByText('água')).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /how well did you know it/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))

    expect(screen.getByText('água')).toBeInTheDocument()
    // Replaces the old "Knew it" / "Didn't" pair: on this screen the four
    // ratings *are* her self-assessment.
    for (const name of [/^Again/, /^Hard/, /^Good/, /^Easy/]) {
      expect(rating(name)).toBeInTheDocument()
    }
  })

  it('reports whichever rating she picks', async () => {
    for (const [name, expected] of [[/^Again/, 0], [/^Hard/, 1], [/^Good/, 2], [/^Easy/, 3]] as const) {
      const onAnswer = vi.fn()
      const { unmount } = render(<Recognize card={card} onAnswer={onAnswer} />)
      await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
      await userEvent.click(rating(name))
      expect(onAnswer).toHaveBeenCalledWith(expected)
      unmount()
    }
  })

  it('suggests nothing — nothing was checked, so the app has no opinion', async () => {
    render(<Recognize card={card} onAnswer={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    for (const name of [/^Again/, /^Hard/, /^Good/, /^Easy/]) {
      expect(rating(name)).not.toHaveAttribute('data-suggested')
    }
  })

  it('does not record a second, contradictory grade', async () => {
    const onAnswer = vi.fn()
    render(<Recognize card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    // Tapping Again and then Easy must leave only the first one standing.
    await userEvent.click(rating(/^Again/))
    await userEvent.click(rating(/^Easy/))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(0)
  })

  it('disables all four the moment one of them fires', async () => {
    render(<Recognize card={card} onAnswer={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(rating(/^Good/))
    for (const name of [/^Again/, /^Hard/, /^Good/, /^Easy/]) {
      expect(rating(name)).toBeDisabled()
    }
  })
})

describe('the photograph on a card', () => {
  const withPhoto: Card = { ...card, photo: '/photos/x_0.webp' }

  it('teaches with the picture on Learn', () => {
    render(<Learn card={withPhoto} onAnswer={vi.fn()} />)
    const img = screen.getByRole('img', { name: 'água' })
    expect(img).toHaveAttribute('src', '/photos/x_0.webp')
    // The alt is the Portuguese meaning, so a screen reader gets the teaching
    // and not "photo of water".
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('keeps the picture behind the reveal on Recognize', async () => {
    render(<Recognize card={withPhoto} onAnswer={vi.fn()} />)
    // The whole point of Recognize is that she has to retrieve the meaning.
    // A photo of the thing sitting above the hidden word hands it to her.
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    expect(screen.getByRole('img', { name: 'água' })).toBeInTheDocument()
  })

  it('never shows the picture on Type, revealed or not', async () => {
    render(<Type card={withPhoto} onAnswer={vi.fn()} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    await userEvent.type(screen.getByRole('textbox'), 'water')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('gets out of the way when the photo will not load', () => {
    // Photos are not precached, so meeting a card for the first time with no
    // signal is a real state. A broken-image icon mid-lesson is worse than
    // no picture.
    render(<Learn card={withPhoto} onAnswer={vi.fn()} />)
    fireEvent.error(screen.getByRole('img', { name: 'água' }))
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('water')).toBeInTheDocument()
  })

  it('renders the card exactly as before when there is no photo', async () => {
    // Four hundred cards are abstract and will never have one.
    render(<Learn card={card} onAnswer={vi.fn()} />)
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('water')).toBeInTheDocument()
  })
})

describe('Type', () => {
  it('suggests Good after a leniently matching answer, and reports what she taps', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'Water!')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(rating(/^Good/)).toHaveAttribute('data-suggested', 'true')
    await userEvent.click(rating(/^Good/))
    // Was `true`; the single Continue button is now the four ratings.
    // The second argument is the interference-trap check — false here since
    // this card carries no `interference` tag at all.
    expect(onAnswer).toHaveBeenCalledWith(2, false)
  })

  it('shows the answer after a miss and suggests Again', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'fire')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(screen.getByText(/water/)).toBeInTheDocument()
    expect(rating(/^Again/)).toHaveAttribute('data-suggested', 'true')
    await userEvent.click(rating(/^Again/))
    expect(onAnswer).toHaveBeenCalledWith(0, false)
  })

  it('lets her overrule the suggestion', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'water')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    // The app suggested Good; she says it was hard work.
    await userEvent.click(rating(/^Hard/))
    expect(onAnswer).toHaveBeenCalledWith(1, false)
  })

  it('blanks the target in the example sentence', () => {
    render(<Type card={card} onAnswer={vi.fn()} />)
    expect(screen.getByText(/I want _____, please\./)).toBeInTheDocument()
  })

  it('does not accept an empty answer as correct', async () => {
    render(<Type card={card} onAnswer={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(rating(/^Again/)).toHaveAttribute('data-suggested', 'true')
  })

  it('grades only once when two different ratings are tapped', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'water')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(rating(/^Easy/))
    await userEvent.click(rating(/^Again/))
    expect(onAnswer).toHaveBeenCalledTimes(1)
    expect(onAnswer).toHaveBeenCalledWith(3, false)
  })
})
