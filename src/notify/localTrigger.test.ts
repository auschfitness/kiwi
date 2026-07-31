import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  REMINDER_TAG,
  cancelLocalReminder,
  scheduleLocalReminder,
  supportsLocalTrigger,
} from './localTrigger'

/**
 * Layer 3: the locally scheduled notification.
 *
 * Two halves matter equally. On Chromium it must actually queue something, at
 * the right instant, with the same wording a push would have used. Everywhere
 * else — which is Firefox, Safari and therefore every iPhone — it must do
 * nothing, say nothing, and above all throw nothing, because it is a
 * best-effort backstop and not a feature she was ever promised.
 */

interface StubRegistration {
  showNotification: ReturnType<typeof vi.fn>
  getNotifications: ReturnType<typeof vi.fn>
}

/** Present the environment as Chromium-with-Notification-Triggers does. */
function stubChromium(pending: { close: () => void }[] = []): StubRegistration {
  const registration: StubRegistration = {
    showNotification: vi.fn().mockResolvedValue(undefined),
    getNotifications: vi.fn().mockResolvedValue(pending),
  }
  class TimestampTrigger {
    timestamp: number
    constructor(timestamp: number) { this.timestamp = timestamp }
  }
  vi.stubGlobal('TimestampTrigger', TimestampTrigger)
  vi.stubGlobal('Notification', { permission: 'granted' })
  vi.stubGlobal('navigator', { serviceWorker: { ready: Promise.resolve(registration) } })
  return registration
}

const NOW = new Date(2026, 6, 31, 9, 0).getTime()
const TONIGHT = new Date(2026, 6, 31, 19, 0).getTime()

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('supportsLocalTrigger', () => {
  it('is false in a plain environment with no TimestampTrigger', () => {
    // jsdom, and equally Firefox and Safari. This is the majority case.
    expect(supportsLocalTrigger()).toBe(false)
  })

  it('is true once TimestampTrigger, Notification and a service worker exist', () => {
    stubChromium()
    expect(supportsLocalTrigger()).toBe(true)
  })

  it('stays false where triggers exist but there is no service worker', () => {
    vi.stubGlobal('TimestampTrigger', class { })
    vi.stubGlobal('Notification', { permission: 'granted' })
    vi.stubGlobal('navigator', {})
    expect(supportsLocalTrigger()).toBe(false)
  })
})

describe('scheduleLocalReminder where it is not supported', () => {
  it('returns false silently rather than throwing', async () => {
    await expect(scheduleLocalReminder(TONIGHT, NOW)).resolves.toBe(false)
  })

  it('returns false when permission has not been granted', async () => {
    stubChromium()
    vi.stubGlobal('Notification', { permission: 'default' })
    await expect(scheduleLocalReminder(TONIGHT, NOW)).resolves.toBe(false)
  })

  it('returns false when the browser refuses, instead of surfacing the error', async () => {
    const registration = stubChromium()
    registration.showNotification.mockRejectedValue(new Error('quota'))
    await expect(scheduleLocalReminder(TONIGHT, NOW)).resolves.toBe(false)
  })
})

describe('scheduleLocalReminder where it is supported', () => {
  it('queues one notification for the given instant', async () => {
    const registration = stubChromium()

    await expect(scheduleLocalReminder(TONIGHT, NOW)).resolves.toBe(true)

    expect(registration.showNotification).toHaveBeenCalledTimes(1)
    const [title, options] = registration.showNotification.mock.calls[0] as [string, Record<string, unknown>]
    expect(title).toBe('English → NZ')
    expect(options.body).toBe('Time for your daily English 🥝')
    expect(options.tag).toBe(REMINDER_TAG)
    expect(options.data).toEqual({ url: '/' })
    expect((options.showTrigger as { timestamp: number }).timestamp).toBe(TONIGHT)
  })

  it('clears the previous reminder before queueing the next one', async () => {
    // Otherwise a changed reminder time leaves yesterday's 19:00 queued
    // alongside today's 07:30, and she gets buzzed twice.
    const close = vi.fn()
    const registration = stubChromium([{ close }])

    await scheduleLocalReminder(TONIGHT, NOW)

    expect(close).toHaveBeenCalledTimes(1)
    expect(registration.getNotifications).toHaveBeenCalledWith({
      tag: REMINDER_TAG, includeTriggered: true,
    })
  })

  it('refuses an instant that has already gone by', async () => {
    // Scheduling a past trigger fires it immediately — from her side, the app
    // buzzing for no reason the moment she opens it.
    const registration = stubChromium()
    await expect(scheduleLocalReminder(NOW - 1000, NOW)).resolves.toBe(false)
    expect(registration.showNotification).not.toHaveBeenCalled()
  })

  it('refuses a nonsense instant', async () => {
    const registration = stubChromium()
    await expect(scheduleLocalReminder(Number.NaN, NOW)).resolves.toBe(false)
    expect(registration.showNotification).not.toHaveBeenCalled()
  })
})

describe('cancelLocalReminder', () => {
  it('does nothing, and does not throw, where triggers are unsupported', async () => {
    await expect(cancelLocalReminder()).resolves.toBeUndefined()
  })

  it('closes every notification carrying our tag', async () => {
    const close = vi.fn()
    stubChromium([{ close }, { close }])
    await cancelLocalReminder()
    expect(close).toHaveBeenCalledTimes(2)
  })

  it('swallows a failure from getNotifications', async () => {
    const registration = stubChromium()
    registration.getNotifications.mockRejectedValue(new Error('nope'))
    await expect(cancelLocalReminder()).resolves.toBeUndefined()
  })
})
