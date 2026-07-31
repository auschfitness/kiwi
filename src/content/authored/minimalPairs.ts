import type { EarPair } from '../../core/minimalPairs'

/**
 * New Zealand minimal pairs — the ear-training table.
 *
 * The one accent feature that catches every newcomer here is the short front
 * vowel shift. DRESS climbs towards *i* (Kiwi *pen* lands where your *pin*
 * was), TRAP climbs towards *e* (*bad* towards *bed*), and KIT falls back into
 * a dull schwa (the famous *fush and chups*). On top of that, NEAR and SQUARE
 * have simply merged: for most Kiwis *bear* and *beer* are one word.
 *
 * She is Brazilian, so two of these gaps do not exist at all in her first
 * language: *bad* / *bed* is one vowel in Portuguese, and so is *sheep* /
 * *ship*. That ear has to be built, not corrected — which is why every pair
 * carries a `note`, and why Compare mode is ungraded.
 *
 * Rules this table keeps to:
 *  - Every entry is a genuine minimal pair of two real English words. Nothing
 *    invented to make a point (*hat* / *het* and *fish* / *fush* were both
 *    dropped for this reason).
 *  - `merged: true` means the two words really are the same sound in most Kiwi
 *    mouths. Those are for Compare only — see `quizzablePairs` in
 *    `src/core/minimalPairs.ts`. Grading a distinction that does not exist
 *    would just teach her to distrust her ear.
 *  - `note` is one line of plain English: what the Kiwi mouth does, and how to
 *    tell the two apart. Not phonetics.
 */

export type PairGroup =
  | 'dress-kit' | 'trap-dress' | 'kit-flat' | 'long-short-i' | 'near-square' | 'other'

export interface MinimalPair extends EarPair {
  group: PairGroup
  /** True when Kiwis really do say both words the same — Compare only. */
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
    id: 'dress-kit',
    title: 'The e that climbs',
    blurb: 'A Kiwi "e" is said higher than yours. Their pen lands where your pin was.',
  },
  {
    id: 'trap-dress',
    title: 'The a that climbs',
    blurb: 'Their "a" climbs too, towards "e". Portuguese has no gap here, so this one is new ground.',
  },
  {
    id: 'kit-flat',
    title: 'The flat i',
    blurb: 'Kiwis famously order fush and chups. Their short "i" goes dull and lazy.',
  },
  {
    id: 'long-short-i',
    title: 'Long ee and short i',
    blurb: 'Portuguese gives you one of these. English needs both: sheep is long, ship is short.',
  },
  {
    id: 'near-square',
    title: 'Words that joined up',
    blurb: 'These really are the same sound here. Learn the pair, then stop listening for a difference that is not there.',
  },
  {
    id: 'other',
    title: 'Other easy mix-ups',
    blurb: 'A few more that catch Brazilians in New Zealand, including "th" and "v".',
  },
]

export const MINIMAL_PAIRS: MinimalPair[] = [
  // ── DRESS climbing towards KIT ───────────────────────────────────────────
  {
    a: 'pen', b: 'pin', group: 'dress-kit', merged: false,
    note: 'A Kiwi "pen" is said high and sounds like your "pin". Their "pin" is flatter, almost "pun".',
  },
  {
    a: 'ten', b: 'tin', group: 'dress-kit', merged: false,
    note: 'At the till, "ten" can land where you expect "tin". The real "tin" sounds duller and shorter.',
  },
  {
    a: 'bed', b: 'bid', group: 'dress-kit', merged: false,
    note: '"Bed" rises here, close to your "bid". Their "bid" drops back, near "bud".',
  },
  {
    a: 'head', b: 'hid', group: 'dress-kit', merged: false,
    note: '"Head" climbs towards "hid". In "hid" the vowel almost disappears.',
  },
  {
    a: 'dead', b: 'did', group: 'dress-kit', merged: false,
    note: '"Dead" is said high, close to "did". Their "did" comes out flat and quick.',
  },
  {
    a: 'sex', b: 'six', group: 'dress-kit', merged: false,
    note: 'The famous one, and worth ten minutes of your life. Kiwi "six" is flat and dull; "sex" is the one that sounds like your "six". Say the number slowly at work.',
  },

  // ── TRAP climbing towards DRESS ──────────────────────────────────────────
  {
    a: 'bad', b: 'bed', group: 'trap-dress', merged: false,
    note: 'Portuguese has one vowel where English has two. Drop your jaw and open wide for "bad"; make a small smile for "bed".',
  },
  {
    a: 'sad', b: 'said', group: 'trap-dress', merged: false,
    note: '"Said" rhymes with "bed", not with "paid". Wide mouth for "sad", small for "said".',
  },
  {
    a: 'man', b: 'men', group: 'trap-dress', merged: false,
    note: 'A Kiwi "man" already sounds like "men" to a new ear. One man, two men — count on the rest of the sentence too.',
  },
  {
    a: 'had', b: 'head', group: 'trap-dress', merged: false,
    note: '"Had" is raised here and gets close to "head". Wider mouth for "had".',
  },
  {
    a: 'gas', b: 'guess', group: 'trap-dress', merged: false,
    note: '"Gas" climbs towards "guess". Open wide for "gas"; "guess" is a small, quick sound.',
  },

  // ── KIT falling back to a schwa ──────────────────────────────────────────
  {
    a: 'bit', b: 'but', group: 'kit-flat', merged: false,
    note: 'This is the fush-and-chups vowel. A Kiwi "bit" goes so flat it can sound like "but". Short and dull is "bit".',
  },
  {
    a: 'fill', b: 'full', group: 'kit-flat', merged: false,
    note: '"Fill in the form" often sounds like "full". Round your lips for "full"; leave them relaxed for "fill".',
  },
  {
    a: 'kit', b: 'cut', group: 'kit-flat', merged: false,
    note: 'A flat Kiwi "kit" drifts towards "cut". Both are short, so listen to the lips: "cut" is further back.',
  },

  // ── Long FLEECE vs short KIT ─────────────────────────────────────────────
  {
    a: 'sheep', b: 'ship', group: 'long-short-i', merged: false,
    note: 'Stretch the "ee" in sheep; clip the "i" in ship. Worth the effort: "sheet", "beach" and "piece" all turn into rude words when the long sound goes short.',
  },
  {
    a: 'cheap', b: 'chip', group: 'long-short-i', merged: false,
    note: 'Long and smiling is "cheap". Short and flat is "chip" — and fish and chips is always the short one.',
  },
  {
    a: 'peach', b: 'pitch', group: 'long-short-i', merged: false,
    note: '"Peach" is long; "pitch" is short and is where the rugby happens.',
  },
  {
    a: 'leave', b: 'live', group: 'long-short-i', merged: false,
    note: '"I leave here" and "I live here" are different lives. Stretch it to leave, clip it to live.',
  },
  {
    a: 'seat', b: 'sit', group: 'long-short-i', merged: false,
    note: '"Take a seat" is long. "Sit down" is short. Your mouth stays smiling for the long one.',
  },

  // ── NEAR and SQUARE, merged in New Zealand ───────────────────────────────
  {
    a: 'chair', b: 'cheer', group: 'near-square', merged: true,
    note: 'Most Kiwis say these exactly the same. Do not hunt for a difference — take it from the sentence: sit on the chair, give a cheer.',
  },
  {
    a: 'bear', b: 'beer', group: 'near-square', merged: true,
    note: 'Twins here. Nobody at the pub is ever confused, because the rest of the sentence tells you which one.',
  },
  {
    a: 'share', b: 'shear', group: 'near-square', merged: true,
    note: 'Same sound for most Kiwis. "Shear" is cutting the wool off a sheep; "share" is everything else.',
  },
  {
    a: 'air', b: 'ear', group: 'near-square', merged: true,
    note: 'These two have joined up in New Zealand. Both come out near "ear". Listen to the words around them.',
  },
  {
    a: 'hair', b: 'here', group: 'near-square', merged: true,
    note: '"Hair" and "here" sound the same to most Kiwis. That is not your ear failing — it is the accent.',
  },

  // ── Other high-value confusions ──────────────────────────────────────────
  {
    a: 'deck', b: 'duck', group: 'other', merged: false,
    note: 'Every Kiwi house has a deck. "Deck" is a small smile; "duck" comes from further back in the mouth.',
  },
  {
    a: 'sale', b: 'sell', group: 'other', merged: false,
    note: '"Sale" has a little glide in it — say-ul. "Sell" is one short sound. On sale, or to sell.',
  },
  {
    a: 'walk', b: 'work', group: 'other', merged: false,
    note: '"Walk" is round, like w-awk. "Work" has no round lips and no "r" sound here — it is more like "wuhk".',
  },
  {
    a: 'thin', b: 'tin', group: 'other', merged: false,
    note: 'Tongue between your teeth and blow for "thin". Portuguese wants to tap a "t" instead — that gives you "tin".',
  },
  {
    a: 'three', b: 'tree', group: 'other', merged: false,
    note: 'Same trick: "three" starts with soft air over the tongue, "tree" starts with a hard "t". Three trees.',
  },
  {
    a: 'very', b: 'berry', group: 'other', merged: false,
    note: 'Top teeth on your bottom lip for "very". Both lips together for "berry". This one changes the meaning fast.',
  },
]
