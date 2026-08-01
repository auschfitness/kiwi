import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppState } from '../types'

export type SyncStatus = 'unconfigured' | 'offline' | 'idle' | 'syncing' | 'synced' | 'error'

/**
 * A sync code is an account key, so there are two different things she can be
 * doing with the field — and they have to be different operations, because
 * they want opposite answers from the cloud.
 *
 * "Create" wants the code to be *free*: if `load_progress` hands back a blob,
 * somebody already owns it and we must refuse rather than push over the top.
 * "Sign in" wants the code to *exist*: a blob is her own progress arriving
 * from another device, and nothing there means she has mistyped it.
 *
 * That split is the whole reason a unique code can still be typed on a second
 * device — same account, not a second one.
 */
export type SyncMode = 'create' | 'signin'

/** `taken` means the code exists and nothing at all was written. */
export type CreateOutcome = 'created' | 'taken' | 'unreachable'

/** `unknown` means no account uses that code and nothing at all was written. */
export type SignInOutcome = 'merged' | 'unknown' | 'unreachable'

export type SyncOutcome = CreateOutcome | SignInOutcome

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSyncConfigured(): boolean {
  return Boolean(URL && KEY)
}

let client: SupabaseClient | null = null

/**
 * The one Supabase client in the app, or `null` when there is nothing to
 * connect to. Exported so `push.ts` shares this instance instead of building
 * a second one — and, more importantly, so the "with an empty .env we never
 * construct a client at all" guarantee is enforced in exactly one place.
 */
export function getClient(): SupabaseClient | null {
  if (!isSyncConfigured()) return null
  if (!client) client = createClient(URL!, KEY!)
  return client
}

export async function loadProgress(code: string): Promise<AppState | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c.rpc('load_progress', { p_code: code })
  if (error) throw error
  return (data as AppState | null) ?? null
}

export async function saveProgress(code: string, data: AppState): Promise<void> {
  const c = getClient()
  if (!c) return
  const { error } = await c.rpc('save_progress', { p_code: code, p_data: data })
  if (error) throw error
}

/** A sync code should be a word plus digits, not a four-digit PIN. */
export function validateSyncCode(code: string): string | null {
  const trimmed = code.trim()
  if (trimmed.length < 6) return 'Use at least 6 characters'
  if (!/[a-zA-Z]/.test(trimmed)) return 'Include at least one letter'
  if (!/[0-9]/.test(trimmed)) return 'Include at least one number'
  return null
}
