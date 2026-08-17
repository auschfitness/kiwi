/**
 * Turning a voice's BCP-47 language tag into something worth reading.
 *
 * This lives in `src/audio/` because every other module in the app is barred
 * from knowing what an `en-us` is. Ear Training needs to tell her which accent
 * her phone is about to read a minimal pair in — an honest and important line,
 * since half that table is "an American says these almost the same" and a
 * different voice will not — but naming the tags on the screen would put the
 * audio layer's vocabulary in a component. It asks here instead.
 */

const ACCENT_NAMES: Readonly<Record<string, string>> = {
  'en-nz': 'New Zealand',
  'en-au': 'Australian',
  'en-gb': 'British',
  'en-us': 'American',
}

/** The tag of the voice she will actually hear an American lesson in. */
const AMERICAN = 'en-us'

function key(lang: string | null | undefined): string {
  return (lang ?? '').toLowerCase()
}

/**
 * "New Zealand", "American"… or `null` when the tag is one we have no plain
 * name for, which the caller should read as "say nothing confident about it"
 * rather than as a default.
 */
export function accentName(lang: string | null | undefined): string | null {
  return ACCENT_NAMES[key(lang)] ?? null
}

/** True only for an actual American voice. Absent or unknown is not American. */
export function isAmericanVoice(lang: string | null | undefined): boolean {
  return key(lang) === AMERICAN
}
