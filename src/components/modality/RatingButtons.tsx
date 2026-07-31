import { useId, useMemo, useState } from 'react'
import type { Rating } from '../../types'
import { previewIntervals } from '../../core/srs'
import { useStore } from '../../store/useStore'
import { Button } from '../ui'

/**
 * The four Anki ratings, in the order she reads them: Again, Hard on the top
 * row, Good, Easy underneath. A 2x2 grid rather than a row of four, so each
 * target stays a comfortable thumb-width on a phone instead of shrinking to a
 * quarter of the screen.
 *
 * `tone` names a palette token; `variant` is the Button that paints it.
 * "brand" is what the primary button already wears, so Easy reuses it.
 */
const CHOICES: { rating: Rating; label: string; variant: 'again' | 'hard' | 'good' | 'primary' }[] = [
  { rating: 0, label: 'Again', variant: 'again' },
  { rating: 1, label: 'Hard', variant: 'hard' },
  { rating: 2, label: 'Good', variant: 'good' },
  { rating: 3, label: 'Easy', variant: 'primary' },
]

export interface RatingButtonsProps {
  /** Whose schedule the interval labels describe. */
  cardId: string
  onRate: (rating: Rating) => void
  /** All four go dead together once one of them has fired. */
  disabled?: boolean
  /**
   * The rating the app would have picked from the answer it already checked.
   * A hint, never a lock: every button stays live so she can overrule it.
   */
  suggested?: Rating
}

export function RatingButtons({ cardId, onRate, disabled = false, suggested }: RatingButtonsProps) {
  const state = useStore(s => s.cards[cardId])
  // Frozen at mount so the labels can't tick over while she is looking at them.
  const [now] = useState(() => Date.now())
  const previews = useMemo(() => previewIntervals(state, now), [state, now])
  const headingId = useId()

  return (
    <div className="flex flex-col gap-2">
      <p id={headingId} className="text-center text-sm text-muted">
        How well did you know it?
      </p>
      <div role="group" aria-labelledby={headingId} className="grid grid-cols-2 gap-3">
        {CHOICES.map(({ rating, label, variant }) => {
          const isSuggested = suggested === rating
          return (
            <Button
              key={rating}
              variant={variant}
              onClick={() => onRate(rating)}
              disabled={disabled}
              data-suggested={isSuggested ? 'true' : undefined}
              // The suggestion is a ring plus a star plus a word to a screen
              // reader — three cues, none of them colour, because the four
              // buttons are already four different colours and a fifth colour
              // difference would be invisible to anyone who can't see them.
              className={`flex flex-col items-center justify-center gap-0.5 py-2 leading-tight ${
                isSuggested ? 'ring-2 ring-ink ring-offset-2 ring-offset-bg' : ''
              }`}
            >
              <span className="flex items-center gap-1 text-base">
                {isSuggested && <span aria-hidden="true">★</span>}
                {label}
              </span>
              <span className="text-xs font-normal opacity-80">{previews[rating]}</span>
              {isSuggested && <span className="sr-only">suggested</span>}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
