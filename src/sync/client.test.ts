import { describe, it, expect } from 'vitest'
import { validateSyncCode, isSyncConfigured, loadProgress, saveProgress } from './client'
import type { AppState } from '../types'

describe('validateSyncCode', () => {
  it('rejects a short code', () => {
    expect(validateSyncCode('ana1')).toMatch(/6 characters/)
  })

  it('rejects a digits-only PIN', () => {
    expect(validateSyncCode('123456')).toMatch(/letter/)
  })

  it('rejects a letters-only code', () => {
    expect(validateSyncCode('anabanana')).toMatch(/number/)
  })

  it('accepts a word plus digits', () => {
    expect(validateSyncCode('kiwi2026')).toBeNull()
  })

  it('ignores surrounding whitespace', () => {
    expect(validateSyncCode('  kiwi2026  ')).toBeNull()
  })
})

// This suite exercises the real isSyncConfigured/loadProgress/saveProgress —
// no mocking — because the brief's single most important requirement is
// that with no .env, the app never constructs a Supabase client, never
// throws, and shows no sync field. That guarantee only means something if
// it's checked against the real (absent) environment, not a mocked one.
//
// These tests depend on this repo having no .env file (and no
// VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY set some other way) when the
// test suite runs. Do NOT "fix" a failure here by adding a .env — if these
// ever start failing because a .env got added, that is the intended alarm
// firing, not a bug in the test. Run the suite that exercises the
// configured path (Settings.sync.test.tsx, etc.) against a mocked client
// instead of giving this file real credentials.
describe('with no Supabase configuration', () => {
  it('reports itself unconfigured', () => {
    expect(isSyncConfigured()).toBe(false)
  })

  it('loads nothing instead of throwing', async () => {
    await expect(loadProgress('kiwi2026')).resolves.toBeNull()
  })

  it('saves nothing instead of throwing', async () => {
    await expect(saveProgress('kiwi2026', {} as AppState)).resolves.toBeUndefined()
  })
})
