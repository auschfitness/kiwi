import { useEffect, useState } from 'react'
import type { QueueItem, Rating } from '../types'
import { buildQueue, requeueWrong } from '../core/queue'
import { cardById, decksForLevel, deckById, levelOfCard } from '../content'
import { weakestSkill } from '../core/stats'
import { effectiveLevel } from '../core/leveling'
import { useStore } from '../store/useStore'
import { speechRecognitionAvailable } from '../audio/capabilities'
import { Button, Meter } from '../components/ui'
import { Learn } from '../components/modality/Learn'
import { Recognize } from '../components/modality/Recognize'
import { Type } from '../components/modality/Type'
import { Listen } from '../components/modality/Listen'
import { Dictate } from '../components/modality/Dictate'
import { Build } from '../components/modality/Build'
import { Speak } from '../components/modality/Speak'

export interface SessionProps {
  deckId?: string
  onDone: () => void
}

const CAP = 22

export function Session({ deckId, onDone }: SessionProps) {
  const cards = useStore(s => s.cards)
  const skills = useStore(s => s.skills)
  const unlockedLevel = useStore(s => s.unlockedLevel)
  const freeAccess = useStore(s => s.freeAccess)
  const newPerSession = useStore(s => s.newPerSession)
  const gradeItem = useStore(s => s.gradeItem)

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    // Free access widens what the session may draw from; it changes nothing
    // about how it chooses. New cards still arrive easiest-first by level, so
    // an unscoped session on a fresh profile still opens at A1.
    const scope = deckId
      ? (deckById(deckId)?.cards ?? [])
      : decksForLevel(effectiveLevel(unlockedLevel, freeAccess)).flatMap(d => d.cards)

    return buildQueue({
      cards: scope,
      states: cards,
      now: Date.now(),
      newPerSession,
      cap: CAP,
      // True whenever the browser exposes SpeechRecognition (absent on iOS
      // Safari). jsdom has none either, so this stays false in tests and the
      // queue composition they assert on is unchanged.
      canSpeak: speechRecognitionAvailable(),
      // New cards are introduced easiest-first, by their deck's own level.
      levelOf: id => levelOfCard(id) ?? 1,
      bias: weakestSkill(skills) ?? undefined,
    })
  })
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (queue.length > 0 && index >= queue.length) onDone()
  }, [index, queue.length, onDone])

  /**
   * The rating is hers and is passed through untouched. There used to be a
   * speed heuristic here that promoted any sub-3-second correct answer to
   * "easy"; it is gone, because she now says so herself and a second opinion
   * from a stopwatch could only overrule her.
   */
  function handleAnswer(rating: Rating) {
    const item = queue[index]
    if (!item) return
    gradeItem(item.cardId, item.modality, rating, Date.now())
    if (rating === 0) setQueue(q => requeueWrong(q, index))
    setIndex(i => i + 1)
  }

  /**
   * Move on without grading. Deliberately never calls gradeItem: nothing is
   * scheduled, no skill stat moves and doneToday does not tick, so an item the
   * device made impossible (a mic that catches nothing) costs her nothing and
   * earns her nothing. The card keeps whatever due date it already had and
   * comes back on its own.
   */
  function handleSkip() {
    if (!queue[index]) return
    setIndex(i => i + 1)
  }

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16 text-center">
        <p className="text-lg font-bold text-ink">All done for now — nothing due 🥝</p>
        <Button onClick={onDone}>Back home</Button>
      </div>
    )
  }

  const item = queue[index]
  if (!item) return null

  const card = cardById(item.cardId)
  if (!card) {
    // A card id that no longer resolves — this can't happen from a queue built
    // off real Card objects, but render nothing rather than crash if it ever did.
    return null
  }

  return (
    <div className="flex flex-col gap-4 pt-4">
      <div className="flex items-center gap-3">
        <Meter value={index / queue.length} label={`${index + 1} of ${queue.length}`} className="flex-1" />
        <div className="shrink-0">
          <Button variant="ghost" size="md" aria-label="Finish session" onClick={onDone}>
            Finish
          </Button>
        </div>
      </div>

      {renderModality(item, card, handleAnswer, handleSkip, index)}
    </div>
  )
}

function renderModality(
  item: QueueItem,
  card: NonNullable<ReturnType<typeof cardById>>,
  onAnswer: (rating: Rating) => void,
  onSkip: () => void,
  index: number,
) {
  // Keyed on the queue position: without a key, React reuses the previous
  // component instance across queue items (same type, same tree slot) and its
  // internal "answered" flag survives into the next card, leaving it disabled.
  const key = `${index}-${item.cardId}`
  switch (item.modality) {
    case 'learn':
      return <Learn key={key} card={card} onAnswer={onAnswer} />
    case 'recognize':
      return <Recognize key={key} card={card} onAnswer={onAnswer} />
    case 'type':
      return <Type key={key} card={card} onAnswer={onAnswer} />
    case 'listen':
      return <Listen key={key} card={card} onAnswer={onAnswer} />
    case 'dictate':
      return <Dictate key={key} card={card} onAnswer={onAnswer} />
    case 'build':
      return <Build key={key} card={card} onAnswer={onAnswer} />
    case 'speak':
      // The only modality that can hit a dead end through no fault of hers,
      // so the only one handed the ungraded exit.
      return <Speak key={key} card={card} onAnswer={onAnswer} onSkip={onSkip} />
  }
}
