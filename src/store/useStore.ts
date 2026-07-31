import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, CardState, Level, Modality, Rating } from '../types'
import { DECKS } from '../content'
import { schedule } from '../core/srs'
import { skillForModality } from '../core/modality'
import { recordSkill } from '../core/stats'
import { applyStudyTick } from '../core/streak'
import { shouldUnlockNext } from '../core/leveling'
import { createInitialState } from './defaults'

export function cardIdsAtLevel(level: Level): string[] {
  return DECKS.filter(d => d.level === level).flatMap(d => d.cards.map(c => c.id))
}

export const cardIdsByLevel: Record<Level, string[]> = {
  1: cardIdsAtLevel(1), 2: cardIdsAtLevel(2), 3: cardIdsAtLevel(3), 4: cardIdsAtLevel(4),
}

interface Actions {
  /** Transient: set when a level unlocks, cleared once the toast is dismissed. */
  unlocked: Level | null
  setName: (name: string) => void
  finishPlacement: (startLevel: Level, seeded: Record<string, CardState>, now: number) => void
  /** `rating` is hers: 0 again, 1 hard, 2 good, 3 easy. Anything above 0 counts as correct. */
  gradeItem: (cardId: string, modality: Modality, rating: Rating, now: number) => void
  /**
   * Feed one speaking or listening rep from a Practice feature (Shadowing,
   * Role-play, Drills, ...) into the same skill stats gradeItem writes to —
   * so the Dashboard/Home meters pick it up with no other change. Call only
   * for practice she actually did: an unpractised skill reads "not
   * practised yet" rather than "0%" (see src/core/stats.ts), and calling
   * this to merely initialise a counter would falsely convert that to 0%.
   */
  recordSpeakingPractice: (correct: boolean) => void
  recordListeningPractice: (correct: boolean) => void
  clearUnlockToast: () => void
  setPref: <K extends keyof AppState>(key: K, value: AppState[K]) => void
  setSyncCode: (code: string | null) => void
  replaceState: (next: AppState) => void
  resetProgress: (now: number) => void
  retakePlacement: () => void
}

export type Store = AppState & Actions

/**
 * Bumped to 2 when the daily reminder shipped (`reminderEnabled`,
 * `reminderTime`). Bump this every time `AppState` gains or changes a field
 * and teach `migrate` below how to fill it — do not lean on zustand's shallow
 * merge to paper over the gap, the way `speechRate` once did. She has real
 * progress in localStorage; a migration that drops a key looks to her like
 * the app forgot her streak.
 */
export const PERSIST_VERSION = 2

/**
 * Upgrade a profile saved under an older `version` to today's shape.
 *
 * The rule is additive and never destructive: everything she had is copied
 * through untouched, and only genuinely absent fields are filled from
 * `createInitialState`. `??` (not `||`) does the filling, so a legitimately
 * falsy saved value — `reminderEnabled: false`, a `0` counter — survives
 * instead of being "helpfully" reset.
 *
 * zustand then shallow-merges the result over the live initial state, so the
 * actions and any field this function forgot still resolve; the point of
 * doing it explicitly is that the defaults are stated here rather than
 * implied.
 */
export function migrate(persisted: unknown, version: number): Store {
  const saved = (persisted ?? {}) as Partial<AppState>
  if (version >= PERSIST_VERSION) return saved as Store

  const defaults = createInitialState(Date.now())
  return {
    ...saved,
    // v1 -> v2: the daily reminder. Off, at 19:00, for everyone who was
    // already here — she opts in from Settings, she is not opted in for her.
    reminderEnabled: saved.reminderEnabled ?? defaults.reminderEnabled,
    reminderTime: saved.reminderTime ?? defaults.reminderTime,
  } as Store
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createInitialState(Date.now()),
      unlocked: null,

      setName: name => set({ profileName: name.trim(), updatedAt: Date.now() }),

      /**
       * A retake may promote her, never demote her. `cefrLevel` follows the
       * latest test (it is what the test measured today), but `unlockedLevel`
       * only ever climbs, and a card she has actually studied keeps its real
       * scheduling — seeding only fills in cards she has no history for.
       * Without both guards, one bad-day retake re-locks earned content and
       * crushes e.g. reps 9 / interval 40 back to a fresh seed.
       */
      finishPlacement: (startLevel, seeded, now) =>
        set(s => {
          const cards = { ...s.cards }
          for (const [id, state] of Object.entries(seeded)) {
            if (!cards[id]) cards[id] = state
          }
          return {
            placed: true,
            cefrLevel: startLevel,
            unlockedLevel: Math.max(s.unlockedLevel, startLevel) as Level,
            cards,
            startedAt: s.startedAt || now,
            updatedAt: now,
          }
        }),

      gradeItem: (cardId, modality, rating, now) => {
        const s = get()
        // The scheduler gets her rating untouched; the skill stats only care
        // whether she got there at all, so "hard" still counts as a hit.
        const correct = rating > 0
        const cards = { ...s.cards, [cardId]: schedule(s.cards[cardId], rating, now) }
        const skills = recordSkill(s.skills, skillForModality(modality), correct)
        const tick = applyStudyTick(s, now)
        const next = shouldUnlockNext(s.unlockedLevel, cardIdsByLevel[s.unlockedLevel], cards)
        set({
          cards,
          skills,
          ...tick,
          ...(next ? { unlockedLevel: next, unlocked: next } : {}),
          updatedAt: now,
        })
      },

      recordSpeakingPractice: correct =>
        set({ skills: recordSkill(get().skills, 'speaking', correct), updatedAt: Date.now() }),

      recordListeningPractice: correct =>
        set({ skills: recordSkill(get().skills, 'listening', correct), updatedAt: Date.now() }),

      clearUnlockToast: () => set({ unlocked: null }),

      setPref: (key, value) => set({ [key]: value, updatedAt: Date.now() } as Partial<Store>),

      setSyncCode: code => set({ syncCode: code, updatedAt: Date.now() }),

      replaceState: next => set({ ...next }),

      resetProgress: now => set({ ...createInitialState(now), unlocked: null }),

      retakePlacement: () => set({ placed: false, updatedAt: Date.now() }),
    }),
    {
      name: 'english-nz',
      version: PERSIST_VERSION,
      partialize: state => {
        const { unlocked: _unlocked, ...rest } = state
        return rest as AppState
      },
      migrate,
    },
  ),
)
