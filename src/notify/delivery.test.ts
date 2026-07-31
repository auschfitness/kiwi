import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * The ordering rule, which is the whole point of this module: Layer 2 if it
 * is available, else Layer 3, else Layer 1 alone — and never two of them at
 * once for the same day.
 */

const { enablePush, disablePush, scheduleLocalReminder, cancelLocalReminder } = vi.hoisted(() => ({
  enablePush: vi.fn(),
  disablePush: vi.fn(),
  scheduleLocalReminder: vi.fn(),
  cancelLocalReminder: vi.fn(),
}))

vi.mock('../sync/push', () => ({ enablePush, disablePush }))
vi.mock('./localTrigger', () => ({ scheduleLocalReminder, cancelLocalReminder }))

import { refreshReminderDelivery } from './delivery'

const NOW = new Date(2026, 6, 31, 9, 0).getTime()
const TONIGHT = new Date(2026, 6, 31, 19, 0).getTime()

const ON = { reminderEnabled: true, reminderTime: '19:00', syncCode: 'kiwi2026' }

beforeEach(() => {
  enablePush.mockReset().mockResolvedValue('unconfigured')
  disablePush.mockReset().mockResolvedValue(undefined)
  scheduleLocalReminder.mockReset().mockResolvedValue(true)
  cancelLocalReminder.mockReset().mockResolvedValue(undefined)
})

describe('refreshReminderDelivery — reminders off', () => {
  it('stands both background layers down', async () => {
    await expect(
      refreshReminderDelivery({ ...ON, reminderEnabled: false }, NOW),
    ).resolves.toBe('off')

    expect(cancelLocalReminder).toHaveBeenCalledTimes(1)
    expect(disablePush).toHaveBeenCalledTimes(1)
    expect(enablePush).not.toHaveBeenCalled()
    expect(scheduleLocalReminder).not.toHaveBeenCalled()
  })
})

describe('refreshReminderDelivery — Layer 2 available', () => {
  it('uses push and cancels the local trigger, so she is never buzzed twice', async () => {
    enablePush.mockResolvedValue('subscribed')

    await expect(refreshReminderDelivery(ON, NOW)).resolves.toBe('push')

    expect(enablePush).toHaveBeenCalledWith({ code: 'kiwi2026', reminderTime: '19:00' })
    expect(cancelLocalReminder).toHaveBeenCalledTimes(1)
    expect(scheduleLocalReminder).not.toHaveBeenCalled()
  })
})

describe('refreshReminderDelivery — Layer 2 unavailable', () => {
  // Each of these is a real, ordinary state, not an error: the owner has not
  // deployed the sender yet; her browser cannot do push; she said no to
  // notifications; the push service wobbled.
  const fallbacks = ['unconfigured', 'unsupported', 'denied', 'error'] as const

  for (const outcome of fallbacks) {
    it(`falls back to the local trigger when push says "${outcome}"`, async () => {
      enablePush.mockResolvedValue(outcome)

      await expect(refreshReminderDelivery(ON, NOW)).resolves.toBe('local')

      expect(scheduleLocalReminder).toHaveBeenCalledWith(TONIGHT, NOW)
    })
  }

  it('falls all the way back to the in-app nudge when the local trigger cannot run either', async () => {
    // Firefox, Safari, every iPhone. Layer 1 alone, and that is a complete
    // feature, not a failure.
    scheduleLocalReminder.mockResolvedValue(false)

    await expect(refreshReminderDelivery(ON, NOW)).resolves.toBe('in-app')
  })

  it('schedules tomorrow when today\'s time has already gone by', async () => {
    const lateTonight = new Date(2026, 6, 31, 21, 30).getTime()
    const tomorrow = new Date(2026, 7, 1, 19, 0).getTime()

    await refreshReminderDelivery(ON, lateTonight)

    expect(scheduleLocalReminder).toHaveBeenCalledWith(tomorrow, lateTonight)
  })

  it('stays silent on a reminder time it cannot read, rather than guessing one', async () => {
    await expect(
      refreshReminderDelivery({ ...ON, reminderTime: 'sevenish' }, NOW),
    ).resolves.toBe('in-app')

    expect(scheduleLocalReminder).not.toHaveBeenCalled()
    expect(cancelLocalReminder).toHaveBeenCalledTimes(1)
  })

  it('works for someone who never set up cloud sync', async () => {
    await refreshReminderDelivery({ ...ON, syncCode: null }, NOW)
    expect(enablePush).toHaveBeenCalledWith({ code: null, reminderTime: '19:00' })
  })
})

describe('refreshReminderDelivery — nothing may ever escape', () => {
  it('answers in-app instead of rejecting when a layer throws', async () => {
    enablePush.mockRejectedValue(new Error('boom'))
    await expect(refreshReminderDelivery(ON, NOW)).resolves.toBe('in-app')
  })

  it('answers in-app instead of rejecting when standing down throws', async () => {
    cancelLocalReminder.mockRejectedValue(new Error('boom'))
    await expect(
      refreshReminderDelivery({ ...ON, reminderEnabled: false }, NOW),
    ).resolves.toBe('in-app')
  })
})
