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

  it('grades a correct item into the card, the skill and the day counter', () => {
    useStore.getState().gradeItem('survival_0', 'listen', true, false, NOW)
    const s = useStore.getState()
    expect(s.cards.survival_0.reps).toBe(1)
    expect(s.skills.listening).toEqual({ correct: 1, total: 1 })
    expect(s.doneToday).toBe(1)
    expect(s.streak).toBe(1)
  })

  it('grades a wrong item without crediting the skill', () => {
    useStore.getState().gradeItem('survival_0', 'type', false, false, NOW)
    const s = useStore.getState()
    expect(s.skills.vocab).toEqual({ correct: 0, total: 1 })
    expect(s.cards.survival_0.lapses).toBe(1)
  })

  it('does not credit a skill for the teaching screen', () => {
    useStore.getState().gradeItem('survival_0', 'learn', true, false, NOW)
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

    useStore.getState().gradeItem(ids[0], 'recognize', true, false, NOW)

    expect(useStore.getState().unlockedLevel).toBe(2)
    expect(useStore.getState().unlocked).toBe(2)
    useStore.getState().clearUnlockToast()
    expect(useStore.getState().unlocked).toBeNull()
  })

  it('bumps updatedAt on every mutation', () => {
    const before = useStore.getState().updatedAt
    useStore.getState().gradeItem('survival_0', 'recognize', true, false, NOW + 5000)
    expect(useStore.getState().updatedAt).toBeGreaterThan(before)
  })

  it('resets progress but keeps the app usable', () => {
    useStore.getState().gradeItem('survival_0', 'recognize', true, false, NOW)
    useStore.getState().resetProgress(NOW)
    expect(useStore.getState().cards).toEqual({})
    expect(useStore.getState().placed).toBe(false)
  })

  it('sends her back to placement without wiping her cards', () => {
    useStore.getState().gradeItem('survival_0', 'recognize', true, false, NOW)
    useStore.getState().retakePlacement()
    expect(useStore.getState().placed).toBe(false)
    expect(useStore.getState().cards.survival_0).toBeDefined()
  })
})
