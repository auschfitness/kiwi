import type { Card, CardState, QueueItem, Skill } from '../types'
import { isDue, isNew } from './srs'
import { pickModality } from './modality'

export interface QueueOptions {
  cards: Card[]
  states: Record<string, CardState>
  now: number
  newPerSession: number
  cap: number
  canSpeak: boolean
  cefrLevel: number
  levelOf: (cardId: string) => number
  bias?: Skill
}

/** Spread `extras` evenly through `base` rather than stacking them at the head. */
function interleave(base: QueueItem[], extras: QueueItem[]): QueueItem[] {
  if (extras.length === 0) return base
  if (base.length === 0) return extras
  const out: QueueItem[] = []
  const gap = (base.length + extras.length) / extras.length
  let nextExtra = 0
  let placed = 0
  for (let i = 0; i < base.length; i++) {
    while (placed < extras.length && out.length >= Math.floor((placed + 1) * gap) - 1) {
      out.push(extras[placed]); placed += 1
    }
    out.push(base[i])
    nextExtra = placed
  }
  while (nextExtra < extras.length) { out.push(extras[nextExtra]); nextExtra += 1 }
  return out
}

export function buildQueue(opts: QueueOptions): QueueItem[] {
  const { cards, states, now, newPerSession, cap, canSpeak, cefrLevel, levelOf, bias } = opts

  const due: QueueItem[] = cards
    .filter(c => isDue(states[c.id], now))
    .sort((a, b) => (states[a.id]!.due - states[b.id]!.due))
    .map(c => ({ cardId: c.id, modality: pickModality(c, states[c.id], canSpeak, bias) }))

  const fresh: QueueItem[] = cards
    .filter(c => isNew(states[c.id]) && !isDue(states[c.id], now))
    .sort((a, b) => Math.abs(levelOf(a.id) - cefrLevel) - Math.abs(levelOf(b.id) - cefrLevel))
    .slice(0, newPerSession)
    .map(c => ({ cardId: c.id, modality: 'learn' as const }))

  let queue = interleave(due.slice(0, cap), fresh).slice(0, cap)

  if (queue.length < cap) {
    const chosen = new Set(queue.map(i => i.cardId))
    const backfill: QueueItem[] = cards
      .filter(c => !chosen.has(c.id) && !isNew(states[c.id]) && !isDue(states[c.id], now))
      .sort((a, b) => states[a.id]!.due - states[b.id]!.due)
      .slice(0, cap - queue.length)
      .map(c => ({ cardId: c.id, modality: pickModality(c, states[c.id], canSpeak, bias) }))
    queue = [...queue, ...backfill]
  }

  return queue.slice(0, cap)
}

/** Push an easier recognition repeat of a missed card to the end of the session. */
export function requeueWrong(queue: QueueItem[], index: number): QueueItem[] {
  const item = queue[index]
  if (!item) return queue
  if (queue.some(q => q.repeat && q.cardId === item.cardId)) return queue
  return [...queue, { cardId: item.cardId, modality: 'recognize', repeat: true }]
}
