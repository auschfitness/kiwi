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

/** Deterministic, order-independent, never destructive. */
export function mergeSnapshots(local: AppState, remote: AppState): AppState {
  const newer = remote.updatedAt > local.updatedAt ? remote : local

  const cards: Record<string, CardState> = {}
  for (const id of new Set([...Object.keys(local.cards), ...Object.keys(remote.cards)])) {
    cards[id] = pickCard(local.cards[id], remote.cards[id])
  }

  const sameDay = local.doneDate === remote.doneDate
  const dayOwner = sameDay || local.updatedAt === remote.updatedAt
    ? (local.doneToday >= remote.doneToday ? local : remote)
    : newer

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
