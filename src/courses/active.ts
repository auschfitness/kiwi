import type { CourseId } from './types'

/**
 * Which course this device is studying.
 *
 * Read once, at boot, before the store is created — the store persists under
 * the active course's key, and that key cannot change under a live store
 * without rehydrating it by hand. So switching courses writes here and reloads
 * the page instead. A reload is a fair price for something done once in a
 * while, and it buys an enormous simplification: at any moment there is
 * exactly one course loaded and nothing in the app has to reason about a
 * second one.
 *
 * Device-scoped and outside `AppState`, for the same reason as
 * `store/freeAccess.ts`: a field in the profile would ride the sync snapshot
 * to another device and switch someone else's app out from under them.
 */
export const ACTIVE_COURSE_KEY = 'english-nz.course'

export const DEFAULT_COURSE: CourseId = 'en-nz'

const KNOWN: readonly CourseId[] = ['en-nz', 'es-latam']

function isCourseId(value: string | null): value is CourseId {
  return value !== null && (KNOWN as readonly string[]).includes(value)
}

/**
 * The stored course id, or the default. Never throws: private-mode Safari
 * throws on `getItem`, and an unreadable preference must not stop the app
 * opening — it just opens the course it has always opened.
 */
export function readActiveCourseId(): CourseId {
  try {
    const stored = localStorage.getItem(ACTIVE_COURSE_KEY)
    return isCourseId(stored) ? stored : DEFAULT_COURSE
  } catch {
    return DEFAULT_COURSE
  }
}

/** Persists the choice. Returns false when storage refused it. */
export function writeActiveCourseId(id: CourseId): boolean {
  try {
    localStorage.setItem(ACTIVE_COURSE_KEY, id)
    return true
  } catch {
    // Writing failed, so a reload would come back to the old course. The
    // caller must not reload on a false, or the switch would look like it
    // silently did nothing.
    return false
  }
}
