import type { Card } from '../../types'

export interface ModalityProps {
  card: Card
  /** Report the result. `easy` is true for a fast, confident correct answer. */
  onAnswer: (correct: boolean, easy?: boolean) => void
  /**
   * Move past this item without grading it — no scheduling, no skill stat, no
   * daily count. Used when the device, not she, failed (a microphone that
   * catches nothing): grading such an attempt wrong would punish her for a
   * broken mic, and grading it correct would hand out real SRS progress for a
   * review she never did. The card simply stays due and comes back.
   *
   * Optional: a modality with no ungradeable path never needs it, and a
   * modality that has one must hide its skip control when it is absent rather
   * than fall back to grading.
   */
  onSkip?: () => void
}
