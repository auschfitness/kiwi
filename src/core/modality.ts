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
 */
export function pickModality(
  card: Card,
  state: CardState | undefined,
  canSpeak: boolean,
  bias?: Skill,
): Modality {
  if (isNew(state)) return 'learn'
  const supported = supportedModalities(card, canSpeak)
  if (bias) {
    const biased = supported.filter(m => SKILL_OF[m] === bias)
    if (biased.length > 0) return biased[state!.reps % biased.length]
  }
  return supported[state!.reps % supported.length]
}
