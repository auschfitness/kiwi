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
