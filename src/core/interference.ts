import type { Card, Level, Skills, SkillStat } from '../types'
import { looseMatch } from './text'
import { DAY } from './time'

/**
 * Whether to show the Portuguese scaffolding on this card, right now.
 *
 * A course that wants to wean him off Portuguese (only Spanish does — see
 * `Course.weanOffPortuguese`) still shows it on any tagged card: a
 * false-friend's trap and a similar-different card's contrast *are* the
 * lesson, not a crutch, so hiding them would remove the point of the card,
 * not his dependence on translation. Everything else fades out once he's
 * past the early levels, so reading Spanish stops running through
 * Portuguese first.
 *
 * A course that doesn't opt in (English) is untouched — this always returns
 * `showPortugueseSetting` unchanged for it, the same as before this existed.
 */
export function shouldShowPortuguese(
  card: Card,
  level: Level,
  showPortugueseSetting: boolean,
  weanOffPortuguese: boolean,
): boolean {
  if (!showPortugueseSetting) return false
  if (!weanOffPortuguese || card.interference) return true
  return level <= 2
}

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

/**
 * When a fresh, confirmed trap hit should pull a card's next review closer
 * than the scheduler alone would.
 *
 * Not a punishment layered on top of grading — `schedule()` already sends a
 * rating of 0 to a ten-minute step, and this doesn't touch that. It exists
 * for the other case: he rated the card "good" or "easy" (the interval grew
 * or held), *and* still typed the Portuguese trap. The scheduler saw a
 * decent rating and would happily let the card drift a week or a month out;
 * the trap says the specific contrast is still live regardless.
 *
 * There's no "generate a new card for this" here, on purpose: the course's
 * content is static and bundled, offline-first is the whole reason (see
 * docs/STATE.md) — so more practice on a live contrast means resurfacing the
 * same card sooner, not inventing one. `Math.min` means this only ever pulls
 * a due date closer, never pushes a genuinely-struggling card further out.
 */
export function remedialDue(scheduledDue: number, now: number, interferenceHit: boolean): number {
  if (!interferenceHit) return scheduledDue
  return Math.min(scheduledDue, now + DAY)
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
