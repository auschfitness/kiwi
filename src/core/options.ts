function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildChoices(answer: string, pool: string[], rand: () => number, count = 4): string[] {
  const distractors = shuffle([...new Set(pool)].filter(p => p !== answer), rand).slice(0, count - 1)
  return shuffle([answer, ...distractors], rand)
}

/** A shuffle that refuses to return the original order — otherwise Build is free. */
export function shuffleWords(words: string[], rand: () => number): string[] {
  if (new Set(words).size < 2) return [...words]
  for (let attempt = 0; attempt < 10; attempt++) {
    const out = shuffle(words, rand)
    if (out.join(' ') !== words.join(' ')) return out
  }
  return [...words].reverse()
}
