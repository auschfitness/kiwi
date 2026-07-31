import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * The push client, tested against the case that actually ships today: an
 * empty `.env`. The single most important guarantee in this feature is that
 * with nothing configured the app never subscribes, never builds a Supabase
 * client, never prompts, and never throws — so the first suite here uses the
 * *real* module against the *real* (absent) environment, exactly the way
 * client.test.ts next door does.
 *
 * The configured path then gets its own suite with the environment stubbed
 * and a fake service worker, because there is no other way to reach it
 * without real credentials.
 */

// Hoisted so the vi.mock factory below can see them.
const { rpc, getClient, isSyncConfigured } = vi.hoisted(() => ({
  rpc: vi.fn(),
  getClient: vi.fn(),
  isSyncConfigured: vi.fn(),
}))

vi.mock('./client', async importOriginal => ({
  ...(await importOriginal<typeof import('./client')>()),
  isSyncConfigured,
  getClient,
}))

import { enablePush, disablePush, isPushConfigured, isPushSupported } from './push'

const VAPID = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

/** A minimal stand-in for a real PushSubscription. */
function fakeSubscription(endpoint = 'https://push.example/abc') {
  return {
    endpoint,
    toJSON: () => ({ endpoint, keys: { p256dh: 'p256dh-value', auth: 'auth-value' } }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }
}

/**
 * Stub `navigator.serviceWorker` and `window.PushManager` the way a browser
 * that supports push would present them. `subscribe` and `getSubscription`
 * are handed in so each test can decide what the browser answers.
 */
function stubBrowser(pushManager: { getSubscription: () => unknown; subscribe: (...args: unknown[]) => unknown }) {
  const registration = { pushManager }
  vi.stubGlobal('navigator', {
    ...navigator,
    serviceWorker: { ready: Promise.resolve(registration) },
  })
  // `PushManager` only has to *exist* for the feature detection.
  vi.stubGlobal('PushManager', function PushManager() { /* detection only */ })
  // A browser that has push always has Notification. Tests that care about
  // the permission answer re-stub this afterwards.
  vi.stubGlobal('Notification', { permission: 'granted' })
  return registration
}

beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ error: null })
  getClient.mockReset().mockReturnValue({ rpc })
  isSyncConfigured.mockReset().mockReturnValue(true)
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('isPushConfigured', () => {
  it('is false when there is no Supabase project, even with a VAPID key', () => {
    isSyncConfigured.mockReturnValue(false)
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    expect(isPushConfigured()).toBe(false)
  })

  it('is false when VITE_VAPID_PUBLIC_KEY is absent, even with Supabase configured', () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', undefined)
    expect(isPushConfigured()).toBe(false)
  })

  it('treats an empty VITE_VAPID_PUBLIC_KEY the same as a missing one', () => {
    // .env.example ships the key as a bare `VITE_VAPID_PUBLIC_KEY=`, so ''
    // is the shape the owner actually has before he sets it.
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', '')
    expect(isPushConfigured()).toBe(false)
  })

  it('is true only when both halves are present', () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    expect(isPushConfigured()).toBe(true)
  })
})

describe('enablePush when nothing is configured', () => {
  it('does not subscribe, does not build a client, and does not throw', async () => {
    isSyncConfigured.mockReturnValue(false)
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', undefined)
    const subscribe = vi.fn()
    stubBrowser({ getSubscription: () => null, subscribe })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('unconfigured')

    expect(subscribe).not.toHaveBeenCalled()
    expect(getClient).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not subscribe when only the VAPID key is missing', async () => {
    // The owner's real state for however long it takes him to deploy: cloud
    // sync live, push keys not yet generated.
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', undefined)
    const subscribe = vi.fn()
    stubBrowser({ getSubscription: () => null, subscribe })
    vi.stubGlobal('Notification', { permission: 'granted' })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('unconfigured')
    expect(subscribe).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('enablePush on a browser that cannot do push', () => {
  it('reports unsupported rather than throwing, with everything else in place', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    // jsdom's bare environment: no serviceWorker, no PushManager.
    expect(isPushSupported()).toBe(false)
    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('unsupported')
    expect(rpc).not.toHaveBeenCalled()
  })
})

describe('enablePush when she has not granted permission', () => {
  it('returns denied and never asks — Settings owns the one prompt', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    const subscribe = vi.fn()
    stubBrowser({ getSubscription: () => null, subscribe })
    const requestPermission = vi.fn()
    vi.stubGlobal('Notification', { permission: 'denied', requestPermission })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('denied')

    expect(requestPermission).not.toHaveBeenCalled()
    expect(subscribe).not.toHaveBeenCalled()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('also declines on a default (never answered) permission', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    const subscribe = vi.fn()
    stubBrowser({ getSubscription: () => null, subscribe })
    vi.stubGlobal('Notification', { permission: 'default', requestPermission: vi.fn() })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('denied')
    expect(subscribe).not.toHaveBeenCalled()
  })
})

describe('enablePush with everything present', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    vi.stubGlobal('Notification', { permission: 'granted' })
  })

  it('subscribes with userVisibleOnly and the VAPID key as bytes', async () => {
    const subscribe = vi.fn().mockResolvedValue(fakeSubscription())
    stubBrowser({ getSubscription: () => null, subscribe })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '07:30' })).resolves.toBe('subscribed')

    expect(subscribe).toHaveBeenCalledTimes(1)
    const options = subscribe.mock.calls[0][0] as PushSubscriptionOptionsInit
    expect(options.userVisibleOnly).toBe(true)
    // The spec requires bytes, not the base64url string the owner pastes in.
    expect(options.applicationServerKey).toBeInstanceOf(Uint8Array)
    // 65 bytes is the length of an uncompressed P-256 public point — the
    // shape every real VAPID key has. A wrong conversion changes this.
    expect((options.applicationServerKey as Uint8Array).length).toBe(65)
    expect((options.applicationServerKey as Uint8Array)[0]).toBe(0x04)
  })

  it('stores the endpoint, keys, her time, her timezone and her code', async () => {
    const subscribe = vi.fn().mockResolvedValue(fakeSubscription('https://push.example/xyz'))
    stubBrowser({ getSubscription: () => null, subscribe })

    await enablePush({ code: 'kiwi2026', reminderTime: '07:30' })

    expect(rpc).toHaveBeenCalledTimes(1)
    const [fn, args] = rpc.mock.calls[0] as [string, Record<string, unknown>]
    expect(fn).toBe('upsert_push_subscription')
    expect(args.p_endpoint).toBe('https://push.example/xyz')
    expect(args.p_keys).toEqual({ p256dh: 'p256dh-value', auth: 'auth-value' })
    expect(args.p_reminder_time).toBe('07:30')
    expect(args.p_code).toBe('kiwi2026')
    // Whatever the machine's zone is, it must be a real IANA-ish string and
    // never empty — `reminder_time` means nothing without it.
    expect(typeof args.p_tz).toBe('string')
    expect(args.p_tz as string).not.toBe('')
  })

  it('reuses an existing subscription instead of making a second one', async () => {
    // Every app open calls this. Subscribing again each time would churn
    // endpoints and leave dead rows behind.
    const subscribe = vi.fn()
    stubBrowser({ getSubscription: () => fakeSubscription(), subscribe })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('subscribed')

    expect(subscribe).not.toHaveBeenCalled()
    expect(rpc).toHaveBeenCalledTimes(1)
  })

  it('accepts a null sync code — push does not require cloud sync', async () => {
    const subscribe = vi.fn().mockResolvedValue(fakeSubscription())
    stubBrowser({ getSubscription: () => null, subscribe })

    await expect(enablePush({ code: null, reminderTime: '19:00' })).resolves.toBe('subscribed')
    expect((rpc.mock.calls[0][1] as Record<string, unknown>).p_code).toBeNull()
  })

  it('reports an error instead of throwing when the browser refuses to subscribe', async () => {
    const subscribe = vi.fn().mockRejectedValue(new Error('registration failed'))
    stubBrowser({ getSubscription: () => null, subscribe })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('error')
  })

  it('reports an error instead of throwing when the RPC fails', async () => {
    rpc.mockResolvedValue({ error: { message: 'nope' } })
    stubBrowser({ getSubscription: () => null, subscribe: vi.fn().mockResolvedValue(fakeSubscription()) })

    await expect(enablePush({ code: 'kiwi2026', reminderTime: '19:00' })).resolves.toBe('error')
  })
})

describe('disablePush', () => {
  it('deletes the row first, then unsubscribes locally', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    const subscription = fakeSubscription()
    stubBrowser({ getSubscription: () => subscription, subscribe: vi.fn() })

    const order: string[] = []
    rpc.mockImplementation(async () => { order.push('rpc'); return { error: null } })
    subscription.unsubscribe.mockImplementation(async () => { order.push('unsubscribe'); return true })

    await disablePush()

    expect(rpc).toHaveBeenCalledWith('delete_push_subscription', { p_endpoint: 'https://push.example/abc' })
    // Row gone before the endpoint becomes unnameable — the other order can
    // strand a live row that keeps pushing at a device that opted out.
    expect(order).toEqual(['rpc', 'unsubscribe'])
  })

  it('does nothing at all on a browser without push', async () => {
    await expect(disablePush()).resolves.toBeUndefined()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('does not throw when there is no subscription to remove', async () => {
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    stubBrowser({ getSubscription: () => null, subscribe: vi.fn() })
    await expect(disablePush()).resolves.toBeUndefined()
    expect(rpc).not.toHaveBeenCalled()
  })

  it('still unsubscribes locally when the row cannot be deleted', async () => {
    // She asked for this off. A failed delete must not leave the endpoint
    // live: unsubscribing kills it, the next send gets a 410, and the sender
    // prunes the row itself.
    vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
    const subscription = fakeSubscription()
    stubBrowser({ getSubscription: () => subscription, subscribe: vi.fn() })
    rpc.mockRejectedValue(new Error('offline'))

    await expect(disablePush()).resolves.toBeUndefined()
    expect(subscription.unsubscribe).toHaveBeenCalledTimes(1)
  })
})
