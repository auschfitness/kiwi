import { describe, it, expect, beforeEach } from 'vitest'
import { useStore, cardIdsByLevel } from './useStore'
import { createInitialState } from './defaults'

const NOW = 1_700_000_000_000

describe('store', () => {
  beforeEach(() => {
    useStore.setState({ ...createInitialState(NOW), unlocked: null })
  })

  it('starts unplaced with no cards', () => {
    const s = useStore.getState()
    expect(s.placed).toBe(false)
    expect(s.cefrLevel).toBe(0)
    expect(Object.keys(s.cards)).toHaveLength(0)
  })

  it('records a name', () => {
    useStore.getState().setName('  Ana  ')
    expect(useStore.getState().profileName).toBe('Ana')
  })

  it('applies a placement result and seeds known cards', () => {
    useStore.getState().finishPlacement(2, { survival_0: { due: NOW, interval: 2, ease: 2.5, reps: 2, lapses: 0 } }, NOW)
    const s = useStore.getState()
    expect(s.placed).toBe(true)
    expect(s.cefrLevel).toBe(2)
    expect(s.unlockedLevel).toBe(2)
    expect(s.cards.survival_0.reps).toBe(2)
  })

  it('promotes on a retake that places higher', () => {
    useStore.setState({ unlockedLevel: 1, cefrLevel: 1, placed: true })
    useStore.getState().finishPlacement(3, {}, NOW)
    expect(useStore.getState().unlockedLevel).toBe(3)
    expect(useStore.getState().cefrLevel).toBe(3)
  })

  it('never re-locks content on a retake that places lower', () => {
    // She reached B1, retakes on a bad day and scores A2. cefrLevel follows the
    // new measurement, but content she earned stays unlocked.
    useStore.setState({ unlockedLevel: 3, cefrLevel: 3, placed: true })
    useStore.getState().finishPlacement(2, {}, NOW)
    expect(useStore.getState().unlockedLevel).toBe(3)
    expect(useStore.getState().cefrLevel).toBe(2)
  })

  it('does not crush real scheduling when a retake reseeds', () => {
    const earned = { due: NOW + 40 * 86_400_000, interval: 40, ease: 2.7, reps: 9, lapses: 3 }
    useStore.setState({ cards: { survival_0: { ...earned } }, unlockedLevel: 3, placed: true })

    useStore.getState().finishPlacement(2, {
      survival_0: { due: NOW, interval: 2, ease: 2.5, reps: 2, lapses: 0 },
      survival_1: { due: NOW, interval: 2, ease: 2.5, reps: 2, lapses: 0 },
    }, NOW)

    const s = useStore.getState()
    // Untouched: her 9 reps, 40-day interval and lapse history all survive.
    expect(s.cards.survival_0).toEqual(earned)
    // A card she has no history for is still seeded.
    expect(s.cards.survival_1.reps).toBe(2)
  })

  it('grades a correct item into the card, the skill and the day counter', () => {
    useStore.getState().gradeItem('survival_0', 'listen', 2, NOW)
    const s = useStore.getState()
    expect(s.cards.survival_0.reps).toBe(1)
    expect(s.skills.listening).toEqual({ correct: 1, total: 1 })
    expect(s.doneToday).toBe(1)
    expect(s.streak).toBe(1)
  })

  it('grades a wrong item without crediting the skill', () => {
    useStore.getState().gradeItem('survival_0', 'type', 0, NOW)
    const s = useStore.getState()
    expect(s.skills.vocab).toEqual({ correct: 0, total: 1 })
    expect(s.cards.survival_0.lapses).toBe(1)
  })

  it('counts "hard" as a correct answer for the skill, but schedules it as hard', () => {
    useStore.getState().gradeItem('survival_0', 'listen', 1, NOW)
    const s = useStore.getState()
    // rating > 0 is the whole test of correctness now: she got there, slowly.
    expect(s.skills.listening).toEqual({ correct: 1, total: 1 })
    expect(s.cards.survival_0.lapses).toBe(0)
    // Hard on a brand new card is a ten-minute step, not a day.
    expect(s.cards.survival_0.due).toBeLessThan(NOW + 86_400_000)
  })

  it('passes "easy" straight through to the scheduler instead of inferring it', () => {
    useStore.getState().gradeItem('survival_0', 'listen', 3, NOW)
    const easy = useStore.getState().cards.survival_0

    useStore.setState({ ...createInitialState(NOW), unlocked: null })
    useStore.getState().gradeItem('survival_0', 'listen', 2, NOW)
    const good = useStore.getState().cards.survival_0

    expect(easy.interval).toBeGreaterThan(good.interval)
    expect(easy.ease).toBeGreaterThan(good.ease)
  })

  it('does not credit a skill for the teaching screen', () => {
    useStore.getState().gradeItem('survival_0', 'learn', 2, NOW)
    const s = useStore.getState()
    expect(s.skills.vocab.total).toBe(0)
    expect(s.cards.survival_0.reps).toBe(1)
  })

  it('unlocks the next level when the graded card is the one that crosses 80 percent', () => {
    const ids = cardIdsByLevel[1]
    const need = Math.ceil(ids.length * 0.8)
    const solid = ids.slice(1, need) // need - 1 cards already solid
    const cards = Object.fromEntries([
      ...solid.map(id => [id, { due: NOW, interval: 1, ease: 2.5, reps: 2, lapses: 0 }]),
      // the card we are about to grade is one rep short of counting
      [ids[0], { due: NOW, interval: 1, ease: 2.5, reps: 1, lapses: 0 }],
    ])
    useStore.setState({ cards, unlockedLevel: 1, unlocked: null })

    // Not yet: only need - 1 cards are solid.
    expect(useStore.getState().unlockedLevel).toBe(1)

    useStore.getState().gradeItem(ids[0], 'recognize', 2, NOW)

    expect(useStore.getState().unlockedLevel).toBe(2)
    expect(useStore.getState().unlocked).toBe(2)
    useStore.getState().clearUnlockToast()
    expect(useStore.getState().unlocked).toBeNull()
  })

  it('bumps updatedAt on every mutation', () => {
    const before = useStore.getState().updatedAt
    useStore.getState().gradeItem('survival_0', 'recognize', 2, NOW + 5000)
    expect(useStore.getState().updatedAt).toBeGreaterThan(before)
  })

  it('resets progress but keeps the app usable', () => {
    useStore.getState().gradeItem('survival_0', 'recognize', 2, NOW)
    useStore.getState().resetProgress(NOW)
    expect(useStore.getState().cards).toEqual({})
    expect(useStore.getState().placed).toBe(false)
  })

  it('sends her back to placement without wiping her cards', () => {
    useStore.getState().gradeItem('survival_0', 'recognize', 2, NOW)
    useStore.getState().retakePlacement()
    expect(useStore.getState().placed).toBe(false)
    expect(useStore.getState().cards.survival_0).toBeDefined()
  })

  it('remembers her speech-rate preference', () => {
    useStore.getState().setPref('speechRate', 0.75)
    expect(useStore.getState().speechRate).toBe(0.75)
  })

  it('defaults speechRate to 0.95 — today\'s speed — for a fresh profile', () => {
    expect(useStore.getState().speechRate).toBe(0.95)
  })

  // A profile saved before this feature shipped has no `speechRate` key at
  // all. Zustand's default persist merge is `{ ...currentState, ...persisted
  // }`, so a missing key in the persisted blob falls through to the fresh
  // initial state's default (0.95) rather than becoming `undefined`.
  it('loads an old persisted profile (saved before this feature existed) with the default rate, not undefined', async () => {
    const fresh = createInitialState(NOW)
    const { speechRate: _noRateInOldSave, ...oldProfileShape } = fresh
    localStorage.setItem('english-nz', JSON.stringify({ state: oldProfileShape, version: 1 }))

    await useStore.persist.rehydrate()

    expect(useStore.getState().speechRate).toBe(0.95)
    localStorage.removeItem('english-nz')
  })
})
