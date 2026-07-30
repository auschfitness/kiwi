import type { Card } from '../../types'

export interface ModalityProps {
  card: Card
  /** Report the result. `easy` is true for a fast, confident correct answer. */
  onAnswer: (correct: boolean, easy?: boolean) => void
}
