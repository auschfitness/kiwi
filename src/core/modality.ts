import type { Card, CardState, Modality, PartOfSpeech, Skill } from '../types'
import { isSentence, isTypable, DEFAULT_TYPABLE_POS, DEFAULT_TYPABLE_MAX } from './text'
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
  /** Longest target still worth typing. See `DEFAULT_TYPABLE_MAX`. */
  typableMaxChars: number
  /**
   * The one modality this course treats as genuinely spontaneous — nothing
   * on screen to reconstruct from, just the Portuguese and his own head.
   * Weighted into `pickModality`'s wheel the same way a weak-skill `bias`
   * is, so a card cannot coast on easy `build`/`type` passes forever without
   * ever being asked to actually produce it. Unset means "no course opinion
   * here" — English's wheel is untouched, exactly as it was before this
   * field existed.
   */
  spontaneousModality?: Modality
}

/** The English course's rules, and the answer when a caller passes none. */
export const DEFAULT_RULES: CourseRules = {
  modalities: ORDER,
  typablePos: DEFAULT_TYPABLE_POS,
  typableMaxChars: DEFAULT_TYPABLE_MAX,
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
  if (isTypable(card, rules.typablePos, rules.typableMaxChars)) { allowed.add('listen'); allowed.add('type') }
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
  // Same "pull, don't replace" reasoning as the skill bias above: the
  // spontaneous modality goes round a second time rather than swapping out
  // the rotation, so `build`/`type`/`dictate` still come up just as often as
  // each other — only their combined share against the spontaneous one shrinks.
  const spontaneous = rules.spontaneousModality && supported.includes(rules.spontaneousModality)
    ? [rules.spontaneousModality]
    : []
  const wheel = [...supported, ...extra, ...spontaneous]
  return wheel[state!.reps % wheel.length]
}
