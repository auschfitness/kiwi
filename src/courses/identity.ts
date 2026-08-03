import type { CourseId } from './types'

/**
 * Who is using this device, independent of what they are studying.
 *
 * The name and the sync code belong to the person, not to the course. Making
 * someone type both again to switch from English to Spanish would be asking
 * them to prove they are still themselves.
 *
 * Kept in its own localStorage key, beside the course preference and outside
 * every course profile, so switching courses cannot lose it and no course's
 * sync snapshot carries it to anyone else.
 */
const IDENTITY_KEY = 'english-nz.identity'

export interface Identity {
  name: string
  /** What they typed. Never sent as-is — see `syncCodeFor`. */
  code: string | null
}

const EMPTY: Identity = { name: '', code: null }

export function readIdentity(): Identity {
  try {
    const raw = localStorage.getItem(IDENTITY_KEY)
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<Identity>
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      code: typeof parsed.code === 'string' ? parsed.code : null,
    }
  } catch {
    // Unreadable or malformed: behave as a first run rather than crash. The
    // worst case is being asked for a name once more.
    return EMPTY
  }
}

/** Merges over what is already stored, so saving a name cannot drop the code. */
export function writeIdentity(patch: Partial<Identity>): void {
  try {
    localStorage.setItem(IDENTITY_KEY, JSON.stringify({ ...readIdentity(), ...patch }))
  } catch {
    // Nothing to tell them: the current session works, it just will not be
    // remembered, and the next run asks again.
  }
}

/**
 * The suffix a course's cloud data lives under.
 *
 * `saveProgress` writes to one row per code, so two courses sharing a code
 * would overwrite each other on every sync — one person's Spanish landing on
 * top of their English. Deriving a per-course key keeps a single typed code
 * while giving each course its own row, and it needs no schema change (the
 * Kiwi database cannot be reached from tooling; see docs/STATE.md).
 *
 * English keeps the bare code so every account that exists today keeps working
 * and syncing to exactly the row it always used.
 */
export function syncCodeFor(course: CourseId, base: string | null): string | null {
  if (!base) return null
  return course === 'en-nz' ? base : `${base}-${course}`
}

/** The typed code behind a per-course one, for storing back as the identity. */
export function baseOfSyncCode(course: CourseId, code: string | null): string | null {
  if (!code) return null
  const suffix = `-${course}`
  return course === 'en-nz' ? code : code.replace(new RegExp(`${suffix}$`), '')
}
