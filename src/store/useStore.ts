import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, Level, Modality, Rating } from '../types'
import { DECKS } from '../content'
import { schedule } from '../core/srs'
import { skillForModality } from '../core/modality'
import { recordSkill } from '../core/stats'
import { applyStudyTick } from '../core/streak'
import { shouldUnlockNext } from '../core/leveling'
import { createInitialState } from './defaults'
import { readFreeAccess, writeFreeAccess } from './freeAccess'
import { ACTIVE_COURSE } from '../courses'
import { writeIdentity, baseOfSyncCode, readIdentity, syncCodeFor } from '../courses/identity'

export function cardIdsAtLevel(level: Level): string[] {
  return DECKS.filter(d => d.level === level).flatMap(d => d.cards.map(c => c.id))
}

export const cardIdsByLevel: Record<Level, string[]> = {
  1: cardIdsAtLevel(1), 2: cardIdsAtLevel(2), 3: cardIdsAtLevel(3), 4: cardIdsAtLevel(4),
}

interface Actions {
  /** Transient: set when a level unlocks, cleared once the toast is dismissed. */
  unlocked: Level | null
  /**
   * Whether the level gate is lifted on this device. Device-scoped on purpose
   * — it lives here rather than in `AppState` so it stays out of the persisted
   * profile and therefore out of the sync snapshot. See ./freeAccess.ts.
   */
  freeAccess: boolean
  setFreeAccess: (on: boolean) => void
  setName: (name: string) => void
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
}

export type Store = AppState & Actions

/**
 * 2 when the daily reminder shipped (`reminderEnabled`, `reminderTime`);
 * 3 when the placement test was removed (`placed`, `cefrLevel`). Bump this
 * every time `AppState` gains, loses or changes a field and teach `migrate`
 * below how to handle it — do not lean on zustand's shallow merge to paper
 * over the gap, the way `speechRate` once did. She has real progress in
 * localStorage; a migration that drops a key looks to her like the app forgot
 * her streak.
 */
export const PERSIST_VERSION = 3

/** Fields that used to live in `AppState` and no longer do. */
type RetiredFields = { placed?: boolean; cefrLevel?: number }

/**
 * Upgrade a profile saved under an older `version` to today's shape.
 *
 * Preserving, never corrective. Everything she earned — every card, her
 * `unlockedLevel`, her streak, her counters — is copied through untouched.
 * Only two kinds of change happen here: a genuinely absent field is filled
 * from `createInitialState`, and a field the app no longer has is dropped.
 * `??` (not `||`) does the filling, so a legitimately falsy saved value —
 * `reminderEnabled: false`, a `0` counter — survives instead of being
 * "helpfully" reset.
 *
 * Note what this deliberately does *not* do: removing the placement test does
 * not re-run anyone. A profile that was placed at B1 keeps its `unlockedLevel`
 * and every seeded card exactly as they are — that is work she already did,
 * and Settings' "Reset progress" is the button for the other case. Only new
 * profiles start at A1 with nothing known.
 *
 * zustand then shallow-merges the result over the live initial state, so the
 * actions and any field this function forgot still resolve; the point of
 * doing it explicitly is that the defaults are stated here rather than
 * implied.
 */
export function migrate(persisted: unknown, version: number): Store {
  const saved = (persisted ?? {}) as Partial<AppState> & RetiredFields
  if (version >= PERSIST_VERSION) return saved as Store

  const defaults = createInitialState(Date.now())
  // v2 -> v3: the placement test is gone, and with it the two fields that
  // existed only to serve it. Dropped rather than carried, so a stale `placed`
  // can never route anywhere and a stale `cefrLevel` can never order a queue.
  const { placed: _placed, cefrLevel: _cefrLevel, ...kept } = saved
  return {
    ...kept,
    // v1 -> v2: the daily reminder. Off, at 19:00, for everyone who was
    // already here — she opts in from Settings, she is not opted in for her.
    reminderEnabled: kept.reminderEnabled ?? defaults.reminderEnabled,
    reminderTime: kept.reminderTime ?? defaults.reminderTime,
  } as Store
}

/**
 * Exactly what gets written to localStorage, and so exactly what the sync
 * snapshot carries. Named and exported rather than inlined into `partialize`
 * so a test can assert on it directly: the guarantee that `freeAccess` never
 * leaves this device is only as good as something checking it.
 */
export function persistedFields(state: Store): AppState {
  const { unlocked: _unlocked, freeAccess: _freeAccess, setFreeAccess: _setFreeAccess, ...rest } = state
  return rest as AppState
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createInitialState(Date.now()),
      // The person, inherited across courses, applied at boot rather than
      // inside createInitialState — that function is "a blank profile" to
      // every test that builds one, and must not read the disk.
      profileName: readIdentity().name,
      syncCode: syncCodeFor(ACTIVE_COURSE.id, readIdentity().code),
      unlocked: null,
      freeAccess: readFreeAccess(),

      setFreeAccess: on => {
        writeFreeAccess(on)
        // No updatedAt bump: this is not part of the profile, and touching the
        // timestamp would make a local switch win a sync merge it has no
        // business being involved in.
        set({ freeAccess: on })
      },

      setName: name => {
        const trimmed = name.trim()
        writeIdentity({ name: trimmed })
        set({ profileName: trimmed, updatedAt: Date.now() })
      },

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

      setSyncCode: code => {
        // Store the typed code, not the per-course one, so the other course
        // can derive its own row from it.
        writeIdentity({ code: baseOfSyncCode(ACTIVE_COURSE.id, code) })
        set({ syncCode: code, updatedAt: Date.now() })
      },

      replaceState: next => set({ ...next }),

      // The confirmation promises to erase every setting on this device, and
      // the free-access switch is one, so it goes too.
      resetProgress: now => {
        writeFreeAccess(false)
        set({ ...createInitialState(now), unlocked: null, freeAccess: false })
      },
    }),
    {
      // One key per course, so two courses can never see each other's
      // progress. Fixed for the life of the page: switching courses writes the
      // preference and reloads (src/courses/active.ts), which is what lets
      // this be read once here rather than swapped under a live store.
      name: ACTIVE_COURSE.storageKey,
      version: PERSIST_VERSION,
      partialize: persistedFields,
      migrate,
    },
  ),
)
