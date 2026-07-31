import type { Card, CardState, QueueItem, Skill } from '../types'
import { isDue, isNew } from './srs'
import { pickModality } from './modality'

/**
 * One in every N review items follows the weak-skill nudge. §10 asks for a
 * nudge ("your next session will focus there"), not a monoculture: applied to
 * every card, the bias collapses a 22-item session into 22 of the same
 * modality, because nearly every card can serve nearly every skill.
 */
const BIAS_EVERY = 3

export interface QueueOptions {
  cards: Card[]
  states: Record<string, CardState>
  now: number
  newPerSession: number
  cap: number
  canSpeak: boolean
  /** A card's CEFR band, 1..4. Used to introduce new cards easiest-first. */
  levelOf: (cardId: string) => number
  bias?: Skill
}

/** Spread `extras` proportionally through `base`, never leading with an extra. */
function interleave<T>(base: T[], extras: T[]): T[] {
  if (extras.length === 0) return [...base]
  if (base.length === 0) return [...extras]
  const total = base.length + extras.length
  const out: T[] = []
  let bi = 0
  let ei = 0
  for (let i = 0; i < total; i++) {
    const targetExtras = ((i + 1) * extras.length) / total
    const takeBase = bi < base.length && (i === 0 || ei >= extras.length || ei + 1 > targetExtras)
    if (takeBase) out.push(base[bi++])
    else out.push(extras[ei++])
  }
  return out
}

/**
 * Apply `bias` to at most one in `BIAS_EVERY` review items, leaving the rest on
 * their normal rotation. `pickModality` decides what the bias means for a single
 * card; this decides how much of the session listens to it.
 */
function applyBias(
  queue: QueueItem[],
  cards: Card[],
  states: Record<string, CardState>,
  canSpeak: boolean,
  bias: Skill,
): QueueItem[] {
  const byId = new Map(cards.map(c => [c.id, c] as const))
  let eligible = 0
  return queue.map(item => {
    if (item.modality === 'learn') return item
    eligible += 1
    if (eligible % BIAS_EVERY !== 0) return item
    const card = byId.get(item.cardId)
    if (!card) return item
    return { ...item, modality: pickModality(card, states[item.cardId], canSpeak, bias) }
  })
}

/**
 * A recall check over the cards this same session just taught. Without it, a
 * day-one session (nothing due, nothing studied, so nothing to backfill with)
 * is `newPerSession` taps of "Got it" and no test at all. She meets a word,
 * then has to produce it again a few minutes later.
 */
function recognitionPass(queue: QueueItem[], cap: number): QueueItem[] {
  // Never shadow a card the queue already reviews in some other modality.
  const covered = new Set(queue.filter(i => i.modality !== 'learn').map(i => i.cardId))
  const extra: QueueItem[] = []
  for (const item of queue) {
    if (queue.length + extra.length >= cap) break
    if (item.modality !== 'learn' || covered.has(item.cardId)) continue
    covered.add(item.cardId)
    extra.push({ cardId: item.cardId, modality: 'recognize' })
  }
  return extra
}

export function buildQueue(opts: QueueOptions): QueueItem[] {
  const { cards, states, now, newPerSession, cap, canSpeak, levelOf, bias } = opts

  const due: QueueItem[] = cards
    .filter(c => isDue(states[c.id], now))
    .sort((a, b) => (states[a.id]!.due - states[b.id]!.due))
    .map(c => ({ cardId: c.id, modality: pickModality(c, states[c.id], canSpeak) }))

  // Easiest first. This used to order by distance from a placement-measured
  // `cefrLevel`; with the placement test gone everyone climbs from A1, so the
  // deck's own level ascending *is* the right order — and within a level the
  // sort is stable, so authored deck order survives.
  const fresh: QueueItem[] = cards
    .filter(c => isNew(states[c.id]) && !isDue(states[c.id], now))
    .sort((a, b) => levelOf(a.id) - levelOf(b.id))
    .map(c => ({ cardId: c.id, modality: 'learn' as const }))

  const newCount = Math.min(newPerSession, fresh.length)
  const dueSlots = Math.max(0, cap - newCount)
  let queue = interleave(due.slice(0, dueSlots), fresh.slice(0, newCount))

  if (queue.length < cap) {
    const chosen = new Set(queue.map(i => i.cardId))
    const backfill: QueueItem[] = cards
      .filter(c => !chosen.has(c.id) && !isNew(states[c.id]) && !isDue(states[c.id], now))
      .sort((a, b) => states[a.id]!.due - states[b.id]!.due)
      .slice(0, cap - queue.length)
      .map(c => ({ cardId: c.id, modality: pickModality(c, states[c.id], canSpeak) }))
    queue = [...queue, ...backfill]
  }

  // The nudge is applied to the assembled review items, not to each card as it
  // is picked, so its share of the session is bounded.
  if (bias) queue = applyBias(queue, cards, states, canSpeak, bias)

  // Last resort, after due + new + backfill: recall checks on this session's
  // own new cards. Deliberately after applyBias — these cards are brand new,
  // so pickModality would send them straight back to 'learn'.
  if (queue.length < cap) queue = [...queue, ...recognitionPass(queue, cap)]

  return queue.slice(0, cap)
}

/** Push an easier recognition repeat of a missed card to the end of the session. */
export function requeueWrong(queue: QueueItem[], index: number): QueueItem[] {
  const item = queue[index]
  if (!item) return queue
  if (queue.some(q => q.repeat && q.cardId === item.cardId)) return queue
  return [...queue, { cardId: item.cardId, modality: 'recognize', repeat: true }]
}
