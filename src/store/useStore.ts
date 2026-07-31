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
  clearUnlockToast: () => void
  setPref: <K extends keyof AppState>(key: K, value: AppState[K]) => void
  setSyncCode: (code: string | null) => void
  replaceState: (next: AppState) => void
  resetProgress: (now: number) => void
  retakePlacement: () => void
}

export type Store = AppState & Actions

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

      clearUnlockToast: () => set({ unlocked: null }),

      setPref: (key, value) => set({ [key]: value, updatedAt: Date.now() } as Partial<Store>),

      setSyncCode: code => set({ syncCode: code, updatedAt: Date.now() }),

      replaceState: next => set({ ...next }),

      resetProgress: now => set({ ...createInitialState(now), unlocked: null }),

      retakePlacement: () => set({ placed: false, updatedAt: Date.now() }),
    }),
    {
      name: 'english-nz',
      version: 1,
      partialize: state => {
        const { unlocked: _unlocked, ...rest } = state
        return rest as AppState
      },
    },
  ),
)
