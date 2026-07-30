import type { CardState, Level, Skill, Skills } from '../types'

export interface SkillSummary {
  skill: Skill
  correct: number
  total: number
  /** null when the skill has never been practised — render "not practised yet". */
  accuracy: number | null
}

const SKILLS: readonly Skill[] = ['vocab', 'listening', 'grammar', 'speaking']

export function recordSkill(skills: Skills, skill: Skill | null, correct: boolean): Skills {
  if (!skill) return skills
  const prev = skills[skill]
  return {
    ...skills,
    [skill]: { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 },
  }
}

export function skillSummary(skills: Skills): SkillSummary[] {
  return SKILLS.map(skill => {
    const { correct, total } = skills[skill]
    return { skill, correct, total, accuracy: total === 0 ? null : Math.round((correct / total) * 100) }
  })
}

/**
 * The weakest practised skill. Skills with no reviews are excluded — a device
 * without speech recognition never practises speaking, and calling that her
 * weakest skill would be both wrong and discouraging.
 */
export function weakestSkill(skills: Skills): Skill | null {
  const practised = skillSummary(skills).filter(r => r.total > 0)
  if (practised.length === 0) return null
  return practised.reduce((a, b) => (a.accuracy! <= b.accuracy! ? a : b)).skill
}

export function levelBreakdown(
  states: Record<string, CardState>,
  cardsByLevel: Record<Level, string[]>,
): Record<Level, { known: number; total: number }> {
  const out = {} as Record<Level, { known: number; total: number }>
  for (const level of [1, 2, 3, 4] as Level[]) {
    const ids = cardsByLevel[level] ?? []
    out[level] = {
      known: ids.filter(id => (states[id]?.reps ?? 0) > 0).length,
      total: ids.length,
    }
  }
  return out
}
