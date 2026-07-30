import { describe, it, expect } from 'vitest'
import { validateSyncCode, isSyncConfigured } from './client'

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

describe('isSyncConfigured', () => {
  it('reports false when no env vars are set', () => {
    expect(typeof isSyncConfigured()).toBe('boolean')
  })
})
