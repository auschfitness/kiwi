import { useEffect } from 'react'
import { useStore } from './useStore'
import { STUDY_TICK_MS } from '../core/studyTime'

/**
 * The study clock: the one thing that decides what counts as time studied.
 *
 * It runs while `active` is true — set by `App.tsx` from the screen she is on
 * — and adds one tick to today's total every `STUDY_TICK_MS`. Two rules
 * follow from that, and both are deliberate:
 *
 * **It counts screens, not answers.** Grading a card is not the only study
 * that happens: a dialogue she listens to twice, a minimal pair she plays back
 * and forth, a role-play she stumbles through — all of it is practice, and
 * none of it grades anything. A clock hung off `gradeItem` would tell her
 * that half her evening did not happen.
 *
 * **It stops when she is not there.** Time only accrues while the tab is
 * visible: a session left open on a locked phone is not four hours of study,
 * and a tracker that says it is teaches her to ignore the number. The interval
 * fires either way and simply declines to record — which is also why the
 * check is at fire time and not in the effect body.
 *
 * The first tick lands one interval *after* she arrives, so the clock always
 * under-reports by up to one tick rather than over-reporting by one. Given the
 * choice, a study tracker should be the pessimistic one.
 */
export function useStudyClock(active: boolean): void {
  const addStudyTime = useStore(s => s.addStudyTime)
  const startStudySession = useStore(s => s.startStudySession)

  useEffect(() => {
    if (!active) return
    startStudySession()

    const id = setInterval(() => {
      // jsdom and very old Safari have no `visibilityState`; treat an absent
      // one as "she is looking at it", which is true of every real browser
      // that got this far.
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      addStudyTime(STUDY_TICK_MS, Date.now())
    }, STUDY_TICK_MS)

    return () => clearInterval(id)
  }, [active, addStudyTime, startStudySession])
}
