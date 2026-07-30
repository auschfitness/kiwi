import type { Card, CardState, Level } from '../types'
import { DAY } from './time'

export type PlacementKind = 'choice' | 'type'

export interface PlacementQuestion {
  id: string
  kind: PlacementKind
  band: Level
  cardId: string
  prompt: string
  answer: string
  options?: string[]
}

const PER_BAND: Record<Level, number> = { 1: 5, 2: 5, 3: 5, 4: 2 }
const PASS_RATIO = 0.6

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildPlacementTest(
  cardsByLevel: Record<Level, Card[]>,
  rand: () => number,
): PlacementQuestion[] {
  const everyCard = ([1, 2, 3, 4] as Level[]).flatMap(l => cardsByLevel[l] ?? [])
  const questions: PlacementQuestion[] = []
  const used = new Set<string>()

  for (const band of [1, 2, 3, 4] as Level[]) {
    const picked = shuffle(cardsByLevel[band] ?? [], rand)
      .filter(c => !used.has(c.id))
      .slice(0, PER_BAND[band])

    picked.forEach((card, i) => {
      used.add(card.id)
      // Typed questions live at the hard end: the last two of band 3, and all of band 4.
      const typed = band === 4 || (band === 3 && i >= PER_BAND[3] - 2)
      if (typed) {
        questions.push({
          id: `q_${band}_${i}`, kind: 'type', band, cardId: card.id,
          prompt: card.pt, answer: card.en,
        })
        return
      }
      const distractors = shuffle(everyCard.filter(c => c.id !== card.id && c.pt !== card.pt), rand)
        .slice(0, 3)
        .map(c => c.pt)
      questions.push({
        id: `q_${band}_${i}`, kind: 'choice', band, cardId: card.id,
        prompt: card.en, answer: card.pt,
        options: shuffle([card.pt, ...distractors], rand),
      })
    })
  }

  return questions
}

export function scorePlacement(
  questions: PlacementQuestion[],
  answers: Record<string, boolean>,
): { byBand: Record<Level, { correct: number; total: number }>; startLevel: Level } {
  const byBand = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } } as Record<Level, { correct: number; total: number }>

  for (const q of questions) {
    byBand[q.band].total += 1
    if (answers[q.id]) byBand[q.band].correct += 1
  }

  let passed = 0
  for (const band of [1, 2, 3, 4] as Level[]) {
    const { correct, total } = byBand[band]
    if (total > 0 && correct / total >= PASS_RATIO) passed += 1
    else break
  }

  return { byBand, startLevel: Math.min(4, Math.max(1, passed)) as Level }
}

/**
 * Seed cards below the placed level as known-but-reviewable, so easy material
 * still resurfaces through spaced repetition in varied modalities instead of
 * being ground from zero.
 */
export function seedKnownCards(
  cardIds: string[],
  now: number,
  rand: () => number,
): Record<string, CardState> {
  const out: Record<string, CardState> = {}
  for (const id of cardIds) {
    const days = 1 + Math.floor(rand() * 4) // 1..4
    out[id] = { due: now + days * DAY, interval: 2, ease: 2.5, reps: 2, lapses: 0 }
  }
  return out
}
