import type { Card as CardType } from '../../types'
import { Chip } from './Chip'

/**
 * The Portuguese-interference flag on a card, when it has one.
 *
 * `false-friend` names the trap directly — the word his brain will reach for
 * by mistake — because seeing the wrong word named is what makes it stop
 * looking right. `similar-different` only labels that this is a structural
 * choice Portuguese makes differently; the card's own `pt` is the contrast,
 * so there is nothing to repeat here beyond the flag itself.
 *
 * Renders nothing for the ~90% of cards with neither tag — see the
 * `Interference` doc comment in src/types.ts for why most cards stay
 * untagged on purpose.
 */
export function InterferenceNote({ card }: { card: CardType }) {
  const interference = card.interference
  if (!interference) return null

  if (interference.type === 'false-friend') {
    return (
      <Chip tone="hard">
        {interference.trap ? `⚠️ Parece "${interference.trap}", mas não é` : '⚠️ Falso amigo'}
      </Chip>
    )
  }

  return <Chip tone="brand">⚖️ Diferente do português aqui</Chip>
}
