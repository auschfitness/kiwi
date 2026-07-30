import type { AppState, CardState, Skill, Skills } from '../types'

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

/** Rank a `YYYY-M-D` day key numerically. `null` (never studied) ranks lowest. */
function dayRank(key: string | null): number {
  if (!key) return -1
  const [y, m, d] = key.split('-').map(Number)
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return -1
  return y * 10_000 + m * 100 + d
}

/** Stable string key over the scalar fields `preferred` selects between. */
function scalarKey(s: AppState): string {
  return JSON.stringify([
    s.profileName, s.syncCode, s.dailyGoal, s.newPerSession,
    s.accent, s.showPortuguese, s.autoPlayAudio, s.lastStudyDay,
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
  // snapshots agree on all eight fields and either answer is the same answer.
  return scalarKey(local) <= scalarKey(remote) ? local : remote
}

/** Deterministic, order-independent, never destructive. */
export function mergeSnapshots(local: AppState, remote: AppState): AppState {
  const newer = preferred(local, remote)

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
    cefrLevel: Math.max(local.cefrLevel, remote.cefrLevel) as AppState['cefrLevel'],
    unlockedLevel: Math.max(local.unlockedLevel, remote.unlockedLevel) as AppState['unlockedLevel'],
    placed: local.placed || remote.placed,
    cards,
    skills: mergeSkills(local.skills, remote.skills),
    dailyGoal: newer.dailyGoal,
    newPerSession: newer.newPerSession,
    accent: newer.accent,
    showPortuguese: newer.showPortuguese,
    autoPlayAudio: newer.autoPlayAudio,
    streak: Math.max(local.streak, remote.streak),
    lastStudyDay: newer.lastStudyDay,
    doneToday: dayOwner.doneToday,
    doneDate: dayOwner.doneDate,
    bestDay: Math.max(local.bestDay, remote.bestDay),
    startedAt: Math.min(local.startedAt, remote.startedAt),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  }
}
