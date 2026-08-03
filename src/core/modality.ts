import type { Card, CardState, Modality, PartOfSpeech, Skill } from '../types'
import { isSentence, isTypable, DEFAULT_TYPABLE_POS } from './text'
import { isNew } from './srs'

const ORDER: readonly Modality[] = ['recognize', 'listen', 'type', 'build', 'dictate', 'speak']

/**
 * The parts of a course that change which exercises a card can become.
 *
 * Passed in rather than read from a module global because everything in
 * `src/core/` is pure — and because it makes the rules visible at the call
 * site instead of hidden behind an import.
 */
export interface CourseRules {
  /** Exercises this course uses at all. Spanish leaves out `recognize`. */
  modalities: readonly Modality[]
  typablePos: ReadonlySet<PartOfSpeech>
}

/** The English course's rules, and the answer when a caller passes none. */
export const DEFAULT_RULES: CourseRules = {
  modalities: ORDER,
  typablePos: DEFAULT_TYPABLE_POS,
}

const SKILL_OF: Record<Modality, Skill | null> = {
  learn: null,
  recognize: 'vocab',
  type: 'vocab',
  listen: 'listening',
  dictate: 'listening',
  build: 'grammar',
  speak: 'speaking',
}

export function skillForModality(m: Modality): Skill | null {
  return SKILL_OF[m]
}

export function supportedModalities(
  card: Card,
  canSpeak: boolean,
  rules: CourseRules = DEFAULT_RULES,
): Modality[] {
  const allowed = new Set<Modality>(['recognize'])
  if (isTypable(card, rules.typablePos)) { allowed.add('listen'); allowed.add('type') }
  if (isSentence(card)) { allowed.add('build'); allowed.add('dictate') }
  if (canSpeak) allowed.add('speak')

  const forCard = ORDER.filter(m => allowed.has(m))
  const forCourse = forCard.filter(m => rules.modalities.includes(m))

  // A course that drops `recognize` would otherwise leave nothing at all for a
  // card that supports only `recognize` — and an empty list means `wheel[n %
  // 0]`, which is `undefined`, which is a blank screen mid-session. Falling
  // back to what the card can do costs one off-profile exercise; the
  // alternative costs the session.
  return forCourse.length > 0 ? forCourse : forCard
}

/**
 * New cards teach. Everything else rotates on reps so a word returns in a
 * different modality each review. `bias` pulls toward a weak skill when the
 * card can serve it.
 *
 * "Pulls" is the operative word, and it did not always hold. The bias used to
 * *replace* the rotation: `biased[reps % biased.length]`, which returned only
 * modalities serving the weak skill and nothing else, forever. Speaking is the
 * hardest skill and so is usually the weakest, which meant a learner could end
 * up doing speaking on every review of every card and never be asked to write
 * anything again — reported from real use, not theorised.
 *
 * The fix is to weight the wheel rather than swap it. The weak skill's
 * modalities go round a second time, so they come up about twice as often as
 * they otherwise would, and everything else still comes up.
 */
export function pickModality(
  card: Card,
  state: CardState | undefined,
  canSpeak: boolean,
  bias?: Skill,
  rules: CourseRules = DEFAULT_RULES,
): Modality {
  if (isNew(state)) return 'learn'
  const supported = supportedModalities(card, canSpeak, rules)
  const extra = bias ? supported.filter(m => SKILL_OF[m] === bias) : []
  const wheel = [...supported, ...extra]
  return wheel[state!.reps % wheel.length]
}
