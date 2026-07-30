import { useEffect, useRef, useState } from 'react'
import type { Dialogue } from '../types'
import { DIALOGUES } from '../content'
import { useStore } from '../store/useStore'
import { speak, cancelSpeech } from '../audio/speak'
import { ScreenHeader, Button, SpeakerButton } from '../components/ui'

export interface DialoguesProps {
  onBack: () => void
  /** Hand off to Shadowing, scoped to this dialogue's lines. */
  onShadow: (dialogueId: string) => void
}

/** Rough reading time for one line, so "Play all" can pace itself without
 * any callback from speechSynthesis (src/audio/ owns that API — this just
 * waits a sensible amount before moving on). */
function lineDurationMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(900, words * 340) + 400
}

/** Whole conversations to listen to and read along with — a resource, not a
 * study mode. Nothing here is graded. */
export function Dialogues({ onBack, onShadow }: DialoguesProps) {
  const accent = useStore(s => s.accent)
  const showPortuguese = useStore(s => s.showPortuguese)

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [playingId, setPlayingId] = useState<string | null>(null)

  // A monotonic token guards "Play all" against overlapping runs: a run
  // only keeps speaking while its own token still matches the latest one,
  // so a second tap (or a collapse, or leaving the screen) always wins over
  // whatever was already in flight.
  const playTokenRef = useRef(0)
  const timerRef = useRef<number | undefined>(undefined)

  function stopPlayback() {
    playTokenRef.current += 1
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current)
      timerRef.current = undefined
    }
    cancelSpeech()
    setPlayingId(null)
  }

  // Leaving the screen (or the component unmounting for any reason) must not
  // leave a "Play all" run still ticking through setTimeout in the background.
  useEffect(() => () => stopPlayback(), [])

  function toggleExpand(id: string) {
    const next = expandedId === id ? null : id
    // Collapsing the card that's playing, or switching to a different one,
    // must not leave audio running behind a closed card.
    if (playingId !== null && playingId !== next) stopPlayback()
    setExpandedId(next)
  }

  function playAll(dialogue: Dialogue) {
    if (playingId === dialogue.id) {
      stopPlayback()
      return
    }
    playTokenRef.current += 1
    const token = playTokenRef.current
    if (timerRef.current !== undefined) window.clearTimeout(timerRef.current)
    cancelSpeech()
    setPlayingId(dialogue.id)

    let i = 0
    const step = () => {
      if (playTokenRef.current !== token) return
      if (i >= dialogue.lines.length) {
        setPlayingId(null)
        return
      }
      const line = dialogue.lines[i]
      speak(line.en, accent)
      const delay = lineDurationMs(line.en)
      i += 1
      timerRef.current = window.setTimeout(step, delay)
    }
    step()
  }

  return (
    <div className="flex flex-col gap-4 pt-2">
      <ScreenHeader title="Dialogues" onBack={onBack} />

      <div className="flex flex-col gap-3">
        {DIALOGUES.map(dialogue => {
          const expanded = expandedId === dialogue.id
          const isPlaying = playingId === dialogue.id
          return (
            <div
              key={dialogue.id}
              data-testid="dialogue-card"
              role="button"
              tabIndex={0}
              aria-expanded={expanded}
              // Without this, the card's accessible name would be computed
              // from every descendant's text once expanded — swallowing the
              // "Play all" / "Shadow this" buttons inside it and colliding
              // with their own accessible names. This just names the card
              // after the same title that's already shown inside it.
              aria-label={dialogue.title}
              onClick={() => toggleExpand(dialogue.id)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  toggleExpand(dialogue.id)
                }
              }}
              className="cursor-pointer rounded-card border border-line bg-card p-4 transition active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl" aria-hidden="true">{dialogue.emoji}</span>
                <p className="flex-1 font-bold text-ink">{dialogue.title}</p>
                <span className="text-muted" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
              </div>

              {expanded && (
                <div className="mt-3 flex flex-col gap-3" onClick={e => e.stopPropagation()}>
                  {dialogue.lines.map((line, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold uppercase tracking-wide text-muted">{line.who}</p>
                        <p className="text-ink">{line.en}</p>
                        {showPortuguese && (
                          <p data-testid="dialogue-line-pt" className="text-sm text-muted">{line.pt}</p>
                        )}
                      </div>
                      <SpeakerButton text={line.en} />
                    </div>
                  ))}

                  <div className="flex gap-2 pt-1">
                    <Button variant="ghost" size="md" onClick={() => playAll(dialogue)}>
                      {isPlaying ? '⏹ Stop' : '▶️ Play all'}
                    </Button>
                    <Button variant="ghost" size="md" onClick={() => onShadow(dialogue.id)}>
                      🗣️ Shadow this
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
