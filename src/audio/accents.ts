/**
 * Turning a voice's BCP-47 language tag into something worth reading.
 *
 * This lives in `src/audio/` because every other module in the app is barred
 * from knowing what an `en-nz` is. Ear Training needs to tell her which accent
 * her phone is about to read a minimal pair in — an honest and important line,
 * since half that table is "a Kiwi says these almost the same" and an American
 * voice will not — but naming the tags on the screen would put the audio
 * layer's vocabulary in a component. It asks here instead.
 */

const ACCENT_NAMES: Readonly<Record<string, string>> = {
  'en-nz': 'New Zealand',
  'en-au': 'Australian',
  'en-gb': 'British',
  'en-us': 'American',
}

/** The tag of the voice she will actually hear a New Zealand lesson in. */
const KIWI = 'en-nz'

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

/** True only for an actual New Zealand voice. Absent or unknown is not Kiwi. */
export function isKiwiVoice(lang: string | null | undefined): boolean {
  return key(lang) === KIWI
}
