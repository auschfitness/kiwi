import type { SyncStatus } from './client'

/**
 * The subset of `SyncStatus` that is worth showing her a badge for.
 *
 * `unconfigured` is excluded because there is nothing to report — the build
 * has no Supabase project, so a sync badge would be nagging about a feature
 * that cannot exist. `idle` is excluded because it is the split second before
 * the launch pull answers; every screen that shows a badge decides for itself
 * what to do with it (Settings shows nothing, Home shows "syncing", because on
 * Home a code is already set and a pull really is in flight).
 */
export type LiveStatus = 'syncing' | 'synced' | 'offline' | 'error'

/**
 * Symbol first so the state is readable at a glance without colour — the badge
 * is small, and colour alone would be the only signal otherwise.
 */
export const STATUS_LABEL: Record<LiveStatus, string> = {
  syncing: '⟳ syncing',
  synced: '✓ synced',
  offline: '⚠︎ offline',
  error: '⚠︎ error',
}

export const STATUS_TONE: Record<LiveStatus, 'brand' | 'good' | 'hard'> = {
  syncing: 'brand',
  synced: 'good',
  offline: 'hard',
  error: 'hard',
}

export function isLiveStatus(s: SyncStatus): s is LiveStatus {
  return s === 'syncing' || s === 'synced' || s === 'offline' || s === 'error'
}

/**
 * What Home's one-line answer to "is my work safe?" should be.
 *
 * `'owed'` is how a still-missing code is represented, and it is deliberately
 * *derived* rather than a persisted flag. Since the code became mandatory
 * there is exactly one way to be sitting on Home without one: the gate let her
 * through because the cloud could not be reached. So "configured, and no code"
 * already means "she still owes us a code", with no second piece of state to
 * fall out of step with the first, no migration, and no way for a stale flag
 * to nag someone who has since signed in.
 *
 * `'idle'` with a code set becomes `'syncing'`: it only survives the moment
 * between mount and the launch pull answering, and a pull genuinely is in
 * flight, so saying so beats blanking the line and flickering it back in.
 */
export type SyncLineState = 'hidden' | 'owed' | LiveStatus

export function syncLineState(status: SyncStatus, syncCode: string | null): SyncLineState {
  // No Supabase project in this build: nagging her about a feature the app
  // cannot perform is worse than silence.
  if (status === 'unconfigured') return 'hidden'
  if (!syncCode) return 'owed'
  return isLiveStatus(status) ? status : 'syncing'
}
