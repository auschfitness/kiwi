import { useState } from 'react'
import type { Card } from '../../types'

/**
 * The photograph on a card, when it has one.
 *
 * Dual coding: a word learned next to a picture of the thing sticks better
 * than a word learned next to a translation alone. Only concrete cards have a
 * photo (see scripts/fetch-photos.mjs), so this renders nothing at all for the
 * other four hundred — the card then looks exactly as it did before.
 *
 * Three things are load-bearing:
 *
 * - The alt text is the Portuguese meaning, not "photo of water". Someone
 *   using a screen reader should get the same teaching the picture gives,
 *   which is the meaning of the word.
 * - The fixed 3:2 box is reserved before the image arrives. The photos are
 *   fetched from the network, not precached, so without it every card would
 *   jump as its picture landed — under her thumb, mid-tap.
 * - `loading="lazy"`, because the queue renders one card at a time and the
 *   rest of a session's photos should not be pulled down at once.
 *
 * And it removes itself if the fetch fails. That is not a theoretical case:
 * the photos are deliberately not precached, so the first time she meets a
 * card on a plane there is nothing to load, and the browser's default
 * answer to that is a broken-image icon in the middle of the lesson. Better
 * to look exactly like the four hundred cards that never had a photo.
 */
export function CardPhoto({ card }: { card: Card }) {
  const [failed, setFailed] = useState(false)
  if (!card.photo || failed) return null
  return (
    <img
      src={card.photo}
      alt={card.pt}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="w-full aspect-[3/2] rounded-card border border-line object-cover bg-card2"
    />
  )
}
