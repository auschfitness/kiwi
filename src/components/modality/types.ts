import type { Card, Rating } from '../../types'

export interface ModalityProps {
  card: Card
  /**
   * Report how it went, in her words: 0 again, 1 hard, 2 good, 3 easy. The
   * rating goes straight to the scheduler, and anything above 0 counts as a
   * correct answer for the skill stats.
   */
  onAnswer: (rating: Rating) => void
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
