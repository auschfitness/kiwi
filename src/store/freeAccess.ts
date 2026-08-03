/**
 * The free-access switch, stored on its own.
 *
 * It deliberately does not live in `AppState`. `AppState` is the profile: it
 * is persisted under `english-nz`, it is what the sync snapshot carries, and
 * it is what `merge.ts` reconciles field by field. A flag in there would
 * travel to every device sharing a sync code — which is exactly the thing
 * this feature must not do, since the point is that one person can lift the
 * level gate without lifting it for anyone else.
 *
 * Keeping it here also means `PERSIST_VERSION` stays where it is. Putting a
 * convenience flag in `AppState` would force a migration over profiles that
 * hold real progress, and the trade is not worth it.
 *
 * The cost, accepted knowingly: it is per-device. A second phone needs the
 * gesture again.
 */
export const FREE_ACCESS_KEY = 'english-nz.freeAccess'

/** The only value that reads as on. Anything else is off. */
const ON = '1'

/** Off unless the stored value is exactly `ON`. Never throws. */
export function readFreeAccess(): boolean {
  try {
    return localStorage.getItem(FREE_ACCESS_KEY) === ON
  } catch {
    // Private-mode Safari throws here. Off is the honest fallback: it is the
    // behaviour she already has, and a broken switch must not break the app.
    return false
  }
}

/** Persists the switch. A storage failure is swallowed — the run-time state still flips. */
export function writeFreeAccess(on: boolean): void {
  try {
    if (on) localStorage.setItem(FREE_ACCESS_KEY, ON)
    else localStorage.removeItem(FREE_ACCESS_KEY)
  } catch {
    // Nothing to do and nothing worth telling her: the switch works for this
    // session and simply will not be remembered.
  }
}
