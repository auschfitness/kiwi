import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from './Settings'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

/**
 * Settings with background push fully wired — the state the app reaches only
 * after the owner has generated VAPID keys, deployed the sender and set
 * `VITE_VAPID_PUBLIC_KEY`. Its own file, like Settings.sync.test.tsx, so the
 * mock is static and cannot leak into the suites that test today's reality.
 */

const { refreshReminderDelivery } = vi.hoisted(() => ({ refreshReminderDelivery: vi.fn() }))

vi.mock('../sync/client', async importOriginal => ({
  ...(await importOriginal<typeof import('../sync/client')>()),
  isSyncConfigured: () => true,
}))

// Stubbed rather than exercised: this file is about what Settings *says* and
// *triggers*, and the delivery module has its own suite in src/notify.
vi.mock('../notify/delivery', () => ({ refreshReminderDelivery }))

const VAPID = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U'

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true, profileName: 'Ana' })
  refreshReminderDelivery.mockReset().mockResolvedValue('push')
  vi.stubEnv('VITE_VAPID_PUBLIC_KEY', VAPID)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
})

describe('Settings with background push configured', () => {
  it('says her phone can buzz, and drops the "not set up yet" line', () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    expect(screen.getByText(/your phone can buzz at this time/i)).toBeInTheDocument()
    expect(screen.queryByText(/aren't set up yet/i)).not.toBeInTheDocument()
  })

  it('still states the iPhone caveat — a VAPID key does not make iOS behave', () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)
    expect(screen.getByText(/add this app to your home screen/i)).toBeInTheDocument()
  })

  it('re-arms delivery after the permission prompt answers, not just when the switch flips', async () => {
    // The order that matters: setPref fires while permission is still
    // 'default', so the only useful moment to subscribe is after the prompt
    // comes back.
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(requestPermission).toHaveBeenCalledTimes(1)
    expect(refreshReminderDelivery).toHaveBeenCalledTimes(1)
    expect(refreshReminderDelivery.mock.calls[0][0]).toMatchObject({
      reminderEnabled: true, reminderTime: '19:00',
    })
  })

  it('re-arms delivery without a prompt when permission was already granted', async () => {
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(refreshReminderDelivery).toHaveBeenCalledTimes(1)
  })

  it('stands delivery down when she switches the reminder off', async () => {
    useStore.setState({ reminderEnabled: true })
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission: vi.fn() })
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(refreshReminderDelivery.mock.calls[0][0]).toMatchObject({ reminderEnabled: false })
  })

  it('does not throw where Notification does not exist, even with push configured', async () => {
    // A configured backend cannot conjure an API the browser lacks.
    expect('Notification' in window).toBe(false)
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} syncStatus="idle" onRestore={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(useStore.getState().reminderEnabled).toBe(true)
  })
})
