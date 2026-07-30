import { normalize, stripTags } from './text'
import { ALL_CARDS, DIALOGUES } from '../content'

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i, ...Array(n).fill(0)]
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = curr
  }
  return prev[n]
}

/** 0..1 similarity over normalised text. */
export function similarity(a: string, b: string): number {
  const x = normalize(a)
  const y = normalize(b)
  if (x === y) return 1
  const longest = Math.max(x.length, y.length)
  if (longest === 0) return 1
  if (x.length === 0 || y.length === 0) return 0
  return 1 - levenshtein(x, y) / longest
}

export function judgePronunciation(
  heard: string,
  target: string,
): { ok: boolean; score: number; message: string } {
  if (!heard.trim()) {
    return { ok: false, score: 0, message: "Didn't catch that — have another go 🎤" }
  }
  const h = normalize(heard)
  const t = normalize(target)
  const score = similarity(heard, target)
  const ok = h.includes(t) || score >= 0.75
  return {
    ok,
    score,
    message: ok ? 'Ka pai! That sounded great 👏' : 'Close — listen once more and try again',
  }
}

export interface ShadowingLine { id: string; en: string; pt: string; source: string }

/** Dialogue lines plus the longer card examples — real rhythm to imitate. */
export function shadowingLines(): ShadowingLine[] {
  const fromDialogues: ShadowingLine[] = DIALOGUES.flatMap(d =>
    d.lines.map((l, i) => ({ id: `${d.id}_${i}`, en: l.en, pt: l.pt, source: d.title })),
  )
  const fromCards: ShadowingLine[] = ALL_CARDS
    .filter(c => stripTags(c.exampleHtml).trim().split(/\s+/).length >= 5)
    .map(c => ({ id: `card_${c.id}`, en: stripTags(c.exampleHtml), pt: c.examplePt, source: 'Examples' }))
  return [...fromDialogues, ...fromCards]
}
