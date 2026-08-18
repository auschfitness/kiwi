import type { AppState, CardState, Skill, Skills, SkillStat } from '../types'
import { mergeStudyLogs } from './studyTime'

/** Deterministic and symmetric: prefers the more-progressed state on every tie. */
function pickCard(a: CardState | undefined, b: CardState | undefined): CardState {
  if (!a) return b!
  if (!b) return a
  if (a.due !== b.due) return a.due > b.due ? a : b
  if (a.reps !== b.reps) return a.reps > b.reps ? a : b
  if (a.interval !== b.interval) return a.interval > b.interval ? a : b
  if (a.lapses !== b.lapses) return a.lapses < b.lapses ? a : b
  if (a.ease !== b.ease) return a.ease > b.ease ? a : b
  return a
}

function mergeSkills(a: Skills, b: Skills): Skills {
  const out = {} as Skills
  for (const skill of ['vocab', 'listening', 'grammar', 'speaking'] as Skill[]) {
    out[skill] = {
      correct: Math.max(a[skill].correct, b[skill].correct),
      total: Math.max(a[skill].total, b[skill].total),
    }
  }
  return out
}

/** Same convention as `mergeSkills`: each device's counter only grows, so the
 * higher one is the more-progressed one, not a double-count to add together. */
function mergeStat(a: SkillStat, b: SkillStat): SkillStat {
  return { correct: Math.max(a.correct, b.correct), total: Math.max(a.total, b.total) }
}

/** Per-card, like `cards` — a trap hit tracked on one device must survive a
 * merge even if the other device never saw that card at all. */
function mergeTrapHits(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[id] = Math.max(a[id] ?? 0, b[id] ?? 0)
  }
  return out
}

/** Rank a `YYYY-M-D` day key numerically. `null` (never studied) ranks lowest. */
function dayRank(key: string | null): number {
  if (!key) return -1
  const [y, m, d] = key.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return -1
  return y * 10_000 + m * 100 + d
}

/**
 * What a snapshot that predates a field should be read as.
 *
 * `loadProgress` casts the JSON that comes back off the network straight to
 * `AppState` without checking its shape, so a snapshot written by an older
 * build is missing whichever fields that build did not have. If it wins on
 * `updatedAt`, `newer.speechRate` is `undefined` and the merged state carries
 * that `undefined` all the way to `setDefaultRate` and `shouldNudge`. The
 * store's own `migrate` fills these in for a *local* save; nothing was doing
 * it for a remote one.
 *
 * These three are the fields added after the first release, and they must
 * agree with `createInitialState` in `src/store/defaults.ts` — repeated rather
 * than imported because `src/core/` stays free of store imports.
 */
const FIELD_DEFAULTS: Pick<AppState, 'speechRate' | 'reminderEnabled' | 'reminderTime'> = {
  speechRate: 0.95,
  reminderEnabled: false,
  reminderTime: '19:00',
}

/**
 * The winner's value for `key`, falling back to the *other* snapshot's and
 * then to the default when the winning snapshot simply does not have it.
 *
 * Falling back to the other side rather than to "the local one" specifically
 * is what keeps this function order-independent, which is the promise
 * `mergeSnapshots` makes in its own docstring. In the case this exists for —
 * a newer remote snapshot from an older build — the other side *is* her local
 * state, so she keeps the setting she chose.
 *
 * Reading through `Partial<AppState>` is the point: the declared type promises
 * these are always present, and for anything the app itself wrote they are.
 * This function exists for the snapshots the app did not write.
 */
function scalar<K extends keyof AppState>(
  key: K, newer: AppState, other: AppState, fallback: AppState[K],
): AppState[K] {
  const fromNewer = (newer as Partial<AppState>)[key]
  if (fromNewer !== undefined) return fromNewer
  const fromOther = (other as Partial<AppState>)[key]
  return fromOther !== undefined ? fromOther : fallback
}

/**
 * Stable string key over the scalar fields `preferred` selects between.
 *
 * This list must stay in step with every `newer.*` read in `mergeSnapshots`
 * below — that is the whole contract. A field the winner supplies but this
 * key ignores makes the final tie-break partial: two snapshots differing only
 * in that field would compare equal here, and `<=` would then hand back
 * whichever one happened to be passed first, quietly reintroducing the
 * order-dependence this function exists to remove.
 *
 * The three fields `scalar()` coalesces stay in this list: the winner still
 * decides them whenever it actually has them, so they are still fields
 * `preferred` selects between.
 */
function scalarKey(s: AppState): string {
  return JSON.stringify([
    s.profileName, s.syncCode, s.dailyGoal, s.newPerSession,
    s.accent, s.showPortuguese, s.autoPlayAudio, s.speechRate,
    s.reminderEnabled, s.reminderTime, s.lastStudyDay,
  ])
}

/**
 * Which snapshot's scalar fields win. Recency decides it in every real case;
 * the later comparisons exist so an exact `updatedAt` tie still resolves the
 * same way regardless of which snapshot was passed first.
 */
function preferred(local: AppState, remote: AppState): AppState {
  if (local.updatedAt !== remote.updatedAt) return local.updatedAt > remote.updatedAt ? local : remote
  if (local.bestDay !== remote.bestDay) return local.bestDay > remote.bestDay ? local : remote
  if (local.streak !== remote.streak) return local.streak > remote.streak ? local : remote
  const localDay = dayRank(local.doneDate)
  const remoteDay = dayRank(remote.doneDate)
  if (localDay !== remoteDay) return localDay > remoteDay ? local : remote
  if (local.doneToday !== remote.doneToday) return local.doneToday > remote.doneToday ? local : remote
  // Final fallback: a stable comparison over exactly the fields this choice
  // drives, so a tie on every ranking signal above still resolves the same way
  // whichever snapshot was passed first. If these keys are equal too, the two
  // snapshots agree on every scalar field and either answer is the same answer.
  return scalarKey(local) <= scalarKey(remote) ? local : remote
}

/** Deterministic, order-independent, never destructive. */
export function mergeSnapshots(local: AppState, remote: AppState): AppState {
  const newer = preferred(local, remote)
  /** The snapshot that lost, and the stand-in for anything the winner lacks. */
  const older = newer === local ? remote : local

  const cards: Record<string, CardState> = {}
  for (const id of new Set([...Object.keys(local.cards), ...Object.keys(remote.cards)])) {
    cards[id] = pickCard(local.cards[id], remote.cards[id])
  }

  const sameDay = local.doneDate === remote.doneDate
  const dayOwner = sameDay
    ? (local.doneToday >= remote.doneToday ? local : remote)
    : (dayRank(local.doneDate) !== dayRank(remote.doneDate)
        ? (dayRank(local.doneDate) > dayRank(remote.doneDate) ? local : remote)
        : newer)

  return {
    profileName: newer.profileName,
    syncCode: newer.syncCode,
    // Never lowered by a merge: a level earned on one device stays earned
    // everywhere. It is the only progression signal left.
    unlockedLevel: Math.max(local.unlockedLevel, remote.unlockedLevel) as AppState['unlockedLevel'],
    cards,
    skills: mergeSkills(local.skills, remote.skills),
    dailyGoal: newer.dailyGoal,
    newPerSession: newer.newPerSession,
    accent: newer.accent,
    showPortuguese: newer.showPortuguese,
    autoPlayAudio: newer.autoPlayAudio,
    // Coalesced, not read straight off the winner: these three postdate the
    // first release, so a snapshot from an older build has none of them.
    speechRate: scalar('speechRate', newer, older, FIELD_DEFAULTS.speechRate),
    reminderEnabled: scalar('reminderEnabled', newer, older, FIELD_DEFAULTS.reminderEnabled),
    reminderTime: scalar('reminderTime', newer, older, FIELD_DEFAULTS.reminderTime),
    streak: Math.max(local.streak, remote.streak),
    lastStudyDay: newer.lastStudyDay,
    doneToday: dayOwner.doneToday,
    doneDate: dayOwner.doneDate,
    bestDay: Math.max(local.bestDay, remote.bestDay),
    // Day by day, like `cards` — not a field the winner decides, and so not in
    // `scalarKey`. `?? {}` covers a snapshot written before the study clock
    // existed, the same problem `scalar()` solves for the three fields above.
    studyLog: mergeStudyLogs(local.studyLog ?? {}, remote.studyLog ?? {}),
    // `?? ...` covers a snapshot written before the interference profile
    // existed, the same problem `scalar()` solves for speechRate and friends.
    interferenceStats: mergeStat(
      local.interferenceStats ?? { correct: 0, total: 0 },
      remote.interferenceStats ?? { correct: 0, total: 0 },
    ),
    trapHits: mergeTrapHits(local.trapHits ?? {}, remote.trapHits ?? {}),
    startedAt: Math.min(local.startedAt, remote.startedAt),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  }
}
