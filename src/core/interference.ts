import type { Card, Skills, SkillStat } from '../types'
import { looseMatch } from './text'

/**
 * Whether a typed answer is the Portuguese trap, not the Spanish target.
 *
 * Deliberately narrow: this is the one case in the whole interference story
 * where the evidence is strong enough to name the exact word his brain
 * reached for, rather than just guessing that a wrong answer was Portuguese-
 * shaped. `similar-different` cards have no single trap string to compare
 * against — the contrast is structural, not lexical — so they are never
 * classified here; see `core/interference.ts`'s use of `interferenceStats`
 * for how those are tracked instead (as a comparison of accuracy, not a
 * per-attempt classification this module doesn't have the evidence for).
 */
export function isTrapAnswer(card: Card, typed: string): boolean {
  const trap = card.interference?.type === 'false-friend' ? card.interference.trap : undefined
  if (!trap || !typed.trim()) return false
  return looseMatch(typed, trap)
}

export interface TrapHit {
  cardId: string
  en: string
  trap: string
  hits: number
}

export interface InterferenceProfile {
  /** Confirmed trap words, worst first. Empty until one is actually typed. */
  traps: TrapHit[]
  /** Accuracy on cards Portuguese specifically fights him on. Null until he's attempted one. */
  taggedAccuracy: number | null
  /** Accuracy on every other card. Null until he's attempted one. */
  restAccuracy: number | null
}

/**
 * Builds the profile shown on Dashboard. Pure and cheap enough to call on
 * every render — it does one pass over the corpus, not the review history.
 *
 * `restAccuracy` isn't its own stored counter: every graded item bumps
 * exactly one entry of `skills` (see `gradeItem`), and `interferenceStats`
 * is bumped alongside it for tagged cards only — so summing `skills` and
 * subtracting `interferenceStats` gives attempts on everything else,
 * without a third counter to keep in sync.
 */
export function buildInterferenceProfile(
  cards: readonly Card[],
  skills: Skills,
  interferenceStats: SkillStat,
  trapHits: Record<string, number>,
): InterferenceProfile {
  const byId = new Map(cards.map(c => [c.id, c]))
  const traps: TrapHit[] = Object.entries(trapHits)
    .filter(([, hits]) => hits > 0)
    .map(([cardId, hits]) => {
      const card = byId.get(cardId)
      return { cardId, en: card?.en ?? cardId, trap: card?.interference?.trap ?? '', hits }
    })
    .sort((a, b) => b.hits - a.hits)

  const accuracy = (s: SkillStat) => (s.total === 0 ? null : Math.round((s.correct / s.total) * 100))

  const overall = Object.values(skills).reduce(
    (a, s) => ({ correct: a.correct + s.correct, total: a.total + s.total }),
    { correct: 0, total: 0 },
  )
  const restStats: SkillStat = {
    correct: overall.correct - interferenceStats.correct,
    total: overall.total - interferenceStats.total,
  }

  return {
    traps,
    taggedAccuracy: accuracy(interferenceStats),
    restAccuracy: accuracy(restStats),
  }
}
