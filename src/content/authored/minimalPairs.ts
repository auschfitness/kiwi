import type { EarPair } from '../../core/minimalPairs'

/**
 * American minimal pairs — the ear-training table.
 *
 * She is Brazilian, so two of these gaps do not exist at all in her first
 * language: *sheep* / *ship* is one vowel in Portuguese, and Portuguese has
 * no "th" sound at all. On top of that, General American is fully rhotic —
 * every r is said, including the ones British and NZ English drop — which
 * Portuguese speakers tend to under-produce, and it flaps its t's into a
 * quick d-tap between vowels, which genuinely merges some pairs. That ear
 * has to be built, not corrected — which is why every pair carries a `note`,
 * and why Compare mode is ungraded.
 *
 * Rules this table keeps to:
 *  - Every entry is a genuine minimal pair of two real English words. Nothing
 *    invented to make a point.
 *  - `merged: true` means the two words really do come out as the same sound
 *    in fast General American speech — the flap-t merges. Those are for
 *    Compare only — see `quizzablePairs` in `src/core/minimalPairs.ts`.
 *    Grading a distinction that isn't reliably there would just teach her to
 *    distrust her ear.
 *  - `note` is one line of plain English: what the American mouth does, and
 *    how to tell the two apart. Not phonetics.
 */

export type PairGroup =
  | 'long-short-i' | 'th-sounds' | 'v-b' | 'flap-t' | 'r-colored' | 'other'

export interface MinimalPair extends EarPair {
  group: PairGroup
  /** True when Americans really do say both words the same — Compare only. */
  merged: boolean
}

export interface PairGroupInfo {
  id: PairGroup
  title: string
  blurb: string
}

/** Section headings for Compare mode, in teaching order. */
export const PAIR_GROUPS: readonly PairGroupInfo[] = [
  {
    id: 'long-short-i',
    title: 'Long ee and short i',
    blurb: 'Portuguese gives you one of these. English needs both: sheep is long, ship is short.',
  },
  {
    id: 'th-sounds',
    title: 'Th that isn’t t or d',
    blurb: 'Portuguese has no "th" sound, so the tongue reaches for the nearest thing it knows.',
  },
  {
    id: 'v-b',
    title: 'V that isn’t b',
    blurb: 'Portuguese blurs these together. English keeps them firmly apart.',
  },
  {
    id: 'flap-t',
    title: 'The American d that used to be a t',
    blurb: 'Say "water" fast and the t turns into a quick d. These pairs really do sound the same.',
  },
  {
    id: 'r-colored',
    title: 'The r you have to say',
    blurb: 'General American pronounces every r. Skip it, the way Portuguese would, and one word turns into another.',
  },
  {
    id: 'other',
    title: 'Other easy mix-ups',
    blurb: 'A few more that catch Brazilians learning American English.',
  },
]

export const MINIMAL_PAIRS: MinimalPair[] = [
  // ── Long FLEECE vs short KIT ─────────────────────────────────────────────
  {
    a: 'sheep', b: 'ship', group: 'long-short-i', merged: false,
    note: 'Stretch the "ee" in sheep; clip the "i" in ship. Worth the effort: "sheet", "beach" and "piece" all turn into rude words when the long sound goes short.',
  },
  {
    a: 'cheap', b: 'chip', group: 'long-short-i', merged: false,
    note: 'Long and smiling is "cheap". Short and flat is "chip".',
  },
  {
    a: 'peach', b: 'pitch', group: 'long-short-i', merged: false,
    note: '"Peach" is long, the fruit. "Pitch" is short, the field or the throw.',
  },
  {
    a: 'leave', b: 'live', group: 'long-short-i', merged: false,
    note: '"I leave here" and "I live here" are different lives. Stretch it to leave, clip it to live.',
  },
  {
    a: 'seat', b: 'sit', group: 'long-short-i', merged: false,
    note: '"Take a seat" is long. "Sit down" is short. Your mouth stays smiling for the long one.',
  },

  // ── "Th" that Portuguese has no sound for ────────────────────────────────
  {
    a: 'thin', b: 'tin', group: 'th-sounds', merged: false,
    note: 'Tongue between your teeth and blow for "thin". Portuguese wants to tap a "t" instead — that gives you "tin".',
  },
  {
    a: 'three', b: 'tree', group: 'th-sounds', merged: false,
    note: 'Same trick: "three" starts with soft air over the tongue, "tree" starts with a hard "t". Three trees.',
  },
  {
    a: 'then', b: 'den', group: 'th-sounds', merged: false,
    note: '"Then" needs the tongue between your teeth and a voiced buzz. Drop that and you get "den".',
  },
  {
    a: 'thank', b: 'tank', group: 'th-sounds', merged: false,
    note: '"Thank" opens with that same soft th. Skip it and you’re saying "tank".',
  },
  {
    a: 'they', b: 'day', group: 'th-sounds', merged: false,
    note: '"They" starts with a buzzing th between the teeth. Drop it and you get "day".',
  },

  // ── V that Portuguese blurs into b ────────────────────────────────────────
  {
    a: 'very', b: 'berry', group: 'v-b', merged: false,
    note: 'Top teeth on your bottom lip for "very". Both lips together for "berry". This one changes the meaning fast.',
  },
  {
    a: 'vest', b: 'best', group: 'v-b', merged: false,
    note: '"Vest" bites the lip; "best" closes both lips. Different sound, different word.',
  },
  {
    a: 'van', b: 'ban', group: 'v-b', merged: false,
    note: 'Same trick: lip-and-teeth for "van", both lips pressed shut for "ban".',
  },

  // ── The American flap: t and d merging between vowels ───────────────────
  {
    a: 'latter', b: 'ladder', group: 'flap-t', merged: true,
    note: 'Said at normal speed, American English turns the "t" in "latter" into the same quick tap as the "d" in "ladder". Context is what tells them apart.',
  },
  {
    a: 'petal', b: 'pedal', group: 'flap-t', merged: true,
    note: 'The flower’s "petal" and the bike’s "pedal" land on the same quick tap in fast American speech.',
  },
  {
    a: 'waiting', b: 'wading', group: 'flap-t', merged: true,
    note: '"Waiting" for the bus and "wading" into the pool come out sounding the same here.',
  },
  {
    a: 'bitter', b: 'bidder', group: 'flap-t', merged: true,
    note: 'Bitter coffee and the bidder at an auction — the "t" and the "d" both come out as the same quick tap.',
  },

  // ── The r Portuguese wants to drop ────────────────────────────────────────
  {
    a: 'walk', b: 'work', group: 'r-colored', merged: false,
    note: '"Walk" is round, like w-awk. "Work" needs a real American r curled into the vowel — "wurk". Don’t skip it the way Portuguese would.',
  },
  {
    a: 'cot', b: 'cart', group: 'r-colored', merged: false,
    note: '"Cot" stays short and flat. "Cart" needs the r fully sounded — it reshapes the whole vowel.',
  },
  {
    a: 'bud', b: 'bird', group: 'r-colored', merged: false,
    note: '"Bud" is a short, plain vowel. "Bird" needs the r curled into the vowel itself — almost no vowel left on its own, just "brrd".',
  },
  {
    a: 'hot', b: 'heart', group: 'r-colored', merged: false,
    note: '"Hot" stays short. "Heart" stretches out around a strong American r — don’t let it go quiet.',
  },
  {
    a: 'cod', b: 'card', group: 'r-colored', merged: false,
    note: 'The fish is "cod". The thing you play or mail is "card" — said with the r fully voiced, never dropped.',
  },

  // ── Other high-value confusions ──────────────────────────────────────────
  {
    a: 'pen', b: 'pin', group: 'other', merged: false,
    note: 'Some American speakers, mostly in the South, really do merge these — but General American keeps them apart: "pen" opens wider, "pin" is tighter and higher.',
  },
  {
    a: 'sale', b: 'sell', group: 'other', merged: false,
    note: '"Sale" has a little glide in it — say-ul. "Sell" is one short sound. On sale, or to sell.',
  },
  {
    a: 'man', b: 'men', group: 'other', merged: false,
    note: 'Keep these apart by how wide the mouth opens: "man" opens wide, "men" is a small, tucked sound.',
  },
  {
    a: 'deck', b: 'duck', group: 'other', merged: false,
    note: '"Deck" is a small smile of a sound; "duck" comes from further back in the mouth.',
  },
]
