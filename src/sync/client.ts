import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppState } from '../types'

export type SyncStatus = 'unconfigured' | 'offline' | 'idle' | 'syncing' | 'synced' | 'error'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSyncConfigured(): boolean {
  return Boolean(URL && KEY)
}

let client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
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
