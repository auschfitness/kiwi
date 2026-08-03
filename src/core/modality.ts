import type { Card, CardState, Modality, Skill } from '../types'
import { isSentence, isTypable } from './text'
import { isNew } from './srs'

const ORDER: readonly Modality[] = ['recognize', 'listen', 'type', 'build', 'dictate', 'speak']

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

export function supportedModalities(card: Card, canSpeak: boolean): Modality[] {
  const allowed = new Set<Modality>(['recognize'])
  if (isTypable(card)) { allowed.add('listen'); allowed.add('type') }
  if (isSentence(card)) { allowed.add('build'); allowed.add('dictate') }
  if (canSpeak) allowed.add('speak')
  return ORDER.filter(m => allowed.has(m))
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
): Modality {
  if (isNew(state)) return 'learn'
  const supported = supportedModalities(card, canSpeak)
  const extra = bias ? supported.filter(m => SKILL_OF[m] === bias) : []
  const wheel = [...supported, ...extra]
  return wheel[state!.reps % wheel.length]
}
