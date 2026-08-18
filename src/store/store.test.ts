import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useStore, cardIdsByLevel, migrate, PERSIST_VERSION, persistedFields } from './useStore'
import { createInitialState } from './defaults'
import { FREE_ACCESS_KEY, readFreeAccess } from './freeAccess'
import type { AppState } from '../types'

const NOW = 1_700_000_000_000

describe('store', () => {
  beforeEach(() => {
    useStore.setState({ ...createInitialState(NOW), unlocked: null, freeAccess: false })
  })

  /**
   * The whole point of removing the placement test: there is no starting
   * level to be assigned and nothing arrives pre-known. Everyone begins at A1
   * with an empty deck of card states and works up.
   */
  it('starts a brand-new profile at A1 with nothing pre-known', () => {
    const s = useStore.getState()
    expect(s.unlockedLevel).toBe(1)
    expect(s.cards).toEqual({})
    expect(Object.keys(s.cards)).toHaveLength(0)
  })

  it('records a name', () => {
    useStore.getState().setName('  Ana  ')
    expect(useStore.getState().profileName).toBe('Ana')
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

  it('leaves the interference profile untouched for a card that carries no interference tag', () => {
    useStore.getState().gradeItem('survival_0', 'type', 0, NOW, true)
    const s = useStore.getState()
    // `interferenceHit: true` came from the modality anyway (it shouldn't,
    // for an untagged card — see `core/interference.ts`), but the stats
    // must not move for a card whose own `interference` is unset. Trap
    // hits are keyed by card id, not asserted blind.
    expect(s.interferenceStats).toEqual({ correct: 0, total: 0 })
    expect(s.trapHits.survival_0).toBeUndefined()
  })

  it('never pulls the due date in for a card that carries no interference tag', () => {
    // Rated "easy" on a first review schedules 4 days out (see core/srs.ts).
    // If `interferenceHit: true` were wrongly honoured for this untagged
    // card, remedialDue would clamp that down to about a day.
    useStore.getState().gradeItem('survival_0', 'type', 3, NOW, true)
    expect(useStore.getState().cards.survival_0.due).toBe(NOW + 4 * 86_400_000)
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

  it('records speaking practice into the speaking skill and bumps updatedAt', () => {
    const before = useStore.getState().updatedAt
    useStore.getState().recordSpeakingPractice(true)
    const s = useStore.getState()
    expect(s.skills.speaking).toEqual({ correct: 1, total: 1 })
    expect(s.updatedAt).toBeGreaterThanOrEqual(before)

    useStore.getState().recordSpeakingPractice(false)
    expect(useStore.getState().skills.speaking).toEqual({ correct: 1, total: 2 })
  })

  it('records listening practice into the listening skill and bumps updatedAt', () => {
    const before = useStore.getState().updatedAt
    useStore.getState().recordListeningPractice(true)
    const s = useStore.getState()
    expect(s.skills.listening).toEqual({ correct: 1, total: 1 })
    expect(s.updatedAt).toBeGreaterThanOrEqual(before)
  })

  it('leaves every other skill untouched by a speaking/listening practice record', () => {
    useStore.getState().recordSpeakingPractice(true)
    useStore.getState().recordListeningPractice(true)
    const s = useStore.getState()
    expect(s.skills.vocab).toEqual({ correct: 0, total: 0 })
    expect(s.skills.grammar).toEqual({ correct: 0, total: 0 })
  })

  it('never touches speaking/listening stats until a practice action is actually called — an unpractised skill stays unpractised', () => {
    // This is the guarantee the Dashboard's "not practised yet" copy relies
    // on (see src/core/stats.ts): recordSpeakingPractice/recordListeningPractice
    // must never be invoked just to initialise a counter.
    const fresh = useStore.getState()
    expect(fresh.skills.speaking).toEqual({ correct: 0, total: 0 })
    expect(fresh.skills.listening).toEqual({ correct: 0, total: 0 })

    useStore.getState().recordSpeakingPractice(true)

    // Listening stays at 0/0 (still reads "not practised yet") — only the
    // skill actually practised moved.
    expect(useStore.getState().skills.listening).toEqual({ correct: 0, total: 0 })
  })

  it('bumps updatedAt on every mutation', () => {
    const before = useStore.getState().updatedAt
    useStore.getState().gradeItem('survival_0', 'recognize', 2, NOW + 5000)
    expect(useStore.getState().updatedAt).toBeGreaterThan(before)
  })

  it('resets progress back to a brand-new A1 profile', () => {
    useStore.setState({ unlockedLevel: 3 })
    useStore.getState().gradeItem('survival_0', 'recognize', 2, NOW)
    useStore.getState().resetProgress(NOW)
    expect(useStore.getState().cards).toEqual({})
    expect(useStore.getState().unlockedLevel).toBe(1)
    expect(useStore.getState().profileName).toBe('')
  })

  it('remembers her speech-rate preference', () => {
    useStore.getState().setPref('speechRate', 0.75)
    expect(useStore.getState().speechRate).toBe(0.75)
  })

  describe('free access', () => {
    beforeEach(() => localStorage.clear())

    it('is off for a fresh profile', () => {
      expect(useStore.getState().freeAccess).toBe(false)
    })

    it('flips the switch and remembers it', () => {
      useStore.getState().setFreeAccess(true)
      expect(useStore.getState().freeAccess).toBe(true)
      expect(readFreeAccess()).toBe(true)
    })

    /**
     * The test this feature exists to satisfy. `freeAccess` must never reach
     * the persisted profile, because the persisted profile is what the sync
     * snapshot carries: a flag in there would lift the level gate on every
     * device sharing a sync code, which is the one outcome the design forbids.
     */
    it('never enters the persisted profile', () => {
      useStore.getState().setFreeAccess(true)
      const saved = persistedFields(useStore.getState())
      expect(saved).not.toHaveProperty('freeAccess')
      expect(saved).not.toHaveProperty('unlocked')
      expect(JSON.stringify(saved)).not.toContain('freeAccess')
    })

    it('does not touch the earned level', () => {
      useStore.getState().setFreeAccess(true)
      expect(useStore.getState().unlockedLevel).toBe(1)
    })

    // "This erases every card, streak and setting on this device" has to stay
    // true, and the switch is a setting on this device.
    it('is cleared by a reset', () => {
      useStore.getState().setFreeAccess(true)
      useStore.getState().resetProgress(NOW)
      expect(useStore.getState().freeAccess).toBe(false)
      expect(localStorage.getItem(FREE_ACCESS_KEY)).toBeNull()
    })
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

/** The two fields `AppState` used to carry for the placement test's sake. */
type Retired = { placed: boolean; cefrLevel: number }

describe('persisted-state migration (v1/v2 -> v3, the placement test removed)', () => {
  beforeEach(() => {
    useStore.setState({ ...createInitialState(NOW), unlocked: null })
    localStorage.removeItem('english-nz')
  })

  afterEach(() => {
    localStorage.removeItem('english-nz')
  })

  /**
   * A profile exactly as it was written to localStorage before the reminder
   * existed: today's shape, minus the two reminder keys, plus the two
   * placement keys that shape still had — carrying real progress: a streak, a
   * best day, a graded card with 9 reps and a 40-day interval, and B1
   * unlocked.
   *
   * This is her, near enough. Every assertion below is about it surviving.
   */
  function v1Profile(): Omit<AppState, 'reminderEnabled' | 'reminderTime' | 'studyLog'> & Retired {
    const {
      reminderEnabled: _off, reminderTime: _at, studyLog: _log, ...oldShape
    } = createInitialState(NOW)
    return {
      ...oldShape,
      profileName: 'Ana',
      placed: true,
      cefrLevel: 2,
      unlockedLevel: 3,
      cards: { survival_0: { due: NOW + 40 * 86_400_000, interval: 40, ease: 2.7, reps: 9, lapses: 3 } },
      skills: { ...oldShape.skills, vocab: { correct: 210, total: 260 } },
      dailyGoal: 30,
      speechRate: 0.75,
      streak: 12,
      lastStudyDay: '2026-7-29',
      doneToday: 18,
      doneDate: '2026-7-29',
      bestDay: 44,
    }
  }

  /** The same profile as it stood at v2: the reminder fields had arrived. */
  function v2Profile(): Omit<AppState, 'studyLog'> & Retired {
    return { ...v1Profile(), reminderEnabled: true, reminderTime: '07:30' }
  }

  /** v3: the placement fields were gone, and the study clock had not shipped. */
  function v3Profile(): Omit<AppState, 'studyLog'> {
    const { placed: _placed, cefrLevel: _cefrLevel, ...rest } = v2Profile()
    return rest
  }

  it('is on version 5 — removing a field is a real bump too, not a shallow-merge accident', () => {
    expect(PERSIST_VERSION).toBe(5)
    expect(useStore.persist.getOptions().version).toBe(5)
  })

  it('rehydrates a v1 profile with the reminder defaults and every scrap of progress intact', async () => {
    const old = v1Profile()
    localStorage.setItem('english-nz', JSON.stringify({ state: old, version: 1 }))

    await useStore.persist.rehydrate()
    const s = useStore.getState()

    // The new fields arrive at their defaults — off, at 19:00. She is never
    // opted in to a reminder she did not ask for.
    expect(s.reminderEnabled).toBe(false)
    expect(s.reminderTime).toBe('19:00')

    // ...and nothing she had is disturbed. This is the whole point of the
    // migration: it must not look like the app forgot her.
    expect(s.profileName).toBe('Ana')
    expect(s.unlockedLevel).toBe(3)
    expect(s.cards.survival_0).toEqual(old.cards.survival_0)
    expect(s.skills.vocab).toEqual({ correct: 210, total: 260 })
    expect(s.dailyGoal).toBe(30)
    expect(s.speechRate).toBe(0.75)
    expect(s.streak).toBe(12)
    expect(s.lastStudyDay).toBe('2026-7-29')
    expect(s.doneToday).toBe(18)
    expect(s.doneDate).toBe('2026-7-29')
    expect(s.bestDay).toBe(44)
    expect(s.startedAt).toBe(old.startedAt)
  })

  /**
   * The one thing this change must not do. Removing the placement test does
   * not un-place anyone: an existing profile keeps the level it reached and
   * every card state behind it, untouched. Only new profiles start at A1.
   */
  it('leaves an existing v2 profile\'s earned progress completely untouched', async () => {
    const old = v2Profile()
    localStorage.setItem('english-nz', JSON.stringify({ state: old, version: 2 }))

    await useStore.persist.rehydrate()
    const s = useStore.getState()

    expect(s.unlockedLevel).toBe(3)
    expect(s.cards).toEqual(old.cards)
    expect(s.cards.survival_0).toEqual({
      due: NOW + 40 * 86_400_000, interval: 40, ease: 2.7, reps: 9, lapses: 3,
    })
    expect(s.skills).toEqual(old.skills)
    expect(s.streak).toBe(12)
    expect(s.bestDay).toBe(44)
    expect(s.doneToday).toBe(18)
    expect(s.doneDate).toBe('2026-7-29')
    expect(s.lastStudyDay).toBe('2026-7-29')
    expect(s.profileName).toBe('Ana')
    expect(s.dailyGoal).toBe(30)
    expect(s.speechRate).toBe(0.75)
    expect(s.startedAt).toBe(old.startedAt)
    // Her own reminder choice survives the bump too — it is not re-defaulted.
    expect(s.reminderEnabled).toBe(true)
    expect(s.reminderTime).toBe('07:30')
  })

  it('drops the two retired placement fields rather than carrying them forward', () => {
    const out = migrate(v2Profile(), 2) as unknown as Record<string, unknown>
    expect('placed' in out).toBe(false)
    expect('cefrLevel' in out).toBe(false)
    // Dropping them changes nothing else.
    expect(out.unlockedLevel).toBe(3)
  })

  it('gives a v3 profile an empty study log without disturbing anything it earned', async () => {
    // Nobody's hours were measured before the clock existed. The honest
    // migration starts the log at zero and leaves every other number alone —
    // it must not look like the app forgot her streak to make room for a
    // feature she never asked for.
    const old = v3Profile()
    localStorage.setItem('english-nz', JSON.stringify({ state: old, version: 3 }))

    await useStore.persist.rehydrate()
    const s = useStore.getState()

    expect(s.studyLog).toEqual({})
    expect(s.streak).toBe(12)
    expect(s.bestDay).toBe(44)
    expect(s.unlockedLevel).toBe(3)
    expect(s.cards).toEqual(old.cards)
    expect(s.reminderTime).toBe('07:30')
  })

  it('keeps a study log a saved profile already has', () => {
    const withHours = { ...v3Profile(), studyLog: { '2026-7-29': 1_800_000 } }
    expect(migrate(withHours, 3).studyLog).toEqual({ '2026-7-29': 1_800_000 })
  })

  /** v4: the study clock had shipped, but the interference profile had not. */
  function v4Profile(): Omit<AppState, 'interferenceStats' | 'trapHits'> {
    const { interferenceStats: _stats, trapHits: _hits, ...rest } = createInitialState(NOW)
    return { ...rest, streak: 12, bestDay: 44, unlockedLevel: 3, reminderTime: '07:30' }
  }

  it('gives a v4 profile an empty interference profile without disturbing anything it earned', async () => {
    const old = v4Profile()
    localStorage.setItem('english-nz', JSON.stringify({ state: old, version: 4 }))

    await useStore.persist.rehydrate()
    const s = useStore.getState()

    expect(s.interferenceStats).toEqual({ correct: 0, total: 0 })
    expect(s.trapHits).toEqual({})
    expect(s.streak).toBe(12)
    expect(s.bestDay).toBe(44)
    expect(s.unlockedLevel).toBe(3)
    expect(s.reminderTime).toBe('07:30')
  })

  it('keeps interference stats a saved profile already has', () => {
    const withStats = { ...v4Profile(), interferenceStats: { correct: 3, total: 5 }, trapHits: { es_false_0: 2 } }
    const out = migrate(withStats, 4)
    expect(out.interferenceStats).toEqual({ correct: 3, total: 5 })
    expect(out.trapHits).toEqual({ es_false_0: 2 })
  })

  it('leaves a v5 profile exactly as saved, reminder settings included', async () => {
    const current = { ...createInitialState(NOW), profileName: 'Ana', reminderEnabled: true, reminderTime: '07:30', streak: 4 }
    localStorage.setItem('english-nz', JSON.stringify({ state: current, version: PERSIST_VERSION }))

    await useStore.persist.rehydrate()
    const s = useStore.getState()

    expect(s.reminderEnabled).toBe(true)
    expect(s.reminderTime).toBe('07:30')
    expect(s.streak).toBe(4)
  })

  it('never resets a saved `false` — migrate fills only genuinely absent fields', () => {
    // The `??`-not-`||` guarantee. A v1 blob cannot contain these keys, but
    // migrate also runs over hand-repaired and partially-written blobs, and a
    // deliberate "off" must not be read as "missing" and re-defaulted.
    const half = { ...v1Profile(), reminderEnabled: false, reminderTime: '06:00' }
    const out = migrate(half, 1)
    expect(out.reminderEnabled).toBe(false)
    expect(out.reminderTime).toBe('06:00')
  })

  it('survives a corrupt or empty persisted blob instead of throwing', () => {
    expect(() => migrate(undefined, 1)).not.toThrow()
    expect(() => migrate(null, 0)).not.toThrow()
    expect(migrate({}, 1).reminderTime).toBe('19:00')
    expect(migrate({}, 1).reminderEnabled).toBe(false)
  })
})
