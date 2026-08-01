import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from './Settings'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

vi.mock('../sync/client', async importOriginal => ({
  ...(await importOriginal<typeof import('../sync/client')>()),
  isSyncConfigured: () => false,
}))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, profileName: 'Ana' })
})

afterEach(() => {
  // Several reminder tests stub a `Notification` global that jsdom does not
  // have. Leaving one behind would quietly change what every later test sees.
  vi.unstubAllGlobals()
})

describe('Settings without Supabase configured', () => {
  it('explains that sync is not set up instead of showing a broken field', () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByText(/cloud sync isn't set up yet/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/sync code/i)).not.toBeInTheDocument()
  })

  it('still exposes every local setting', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByLabelText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/show portuguese/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accent/i)).toBeInTheDocument()
  })

  it('changes a preference in the store', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByLabelText(/show portuguese/i))
    expect(useStore.getState().showPortuguese).toBe(false)
  })

  it('requires a second confirmation before wiping progress', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    expect(screen.getByRole('button', { name: /yes, erase everything/i })).toBeInTheDocument()
    // `placed` is gone; her name is now the marker that nothing was wiped —
    // resetProgress clears it back to '' along with everything else.
    expect(useStore.getState().profileName).toBe('Ana')
  })
})

describe('Settings — additional behaviour (still unconfigured)', () => {
  it('back button calls onBack', async () => {
    const onBack = vi.fn()
    render(<Settings onBack={onBack} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('offers no shortcut past the levels — "Reset progress" is the only level-changing control', () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.queryByRole('button', { name: /placement/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /retake/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset progress/i })).toBeInTheDocument()
  })

  it('only wipes progress on the second tap, and clears it on that tap', async () => {
    useStore.setState({ unlockedLevel: 3 })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    await userEvent.click(screen.getByRole('button', { name: /yes, erase everything/i }))
    expect(useStore.getState().cards).toEqual({})
    // Back to a brand-new profile: no name, and A1 again.
    expect(useStore.getState().profileName).toBe('')
    expect(useStore.getState().unlockedLevel).toBe(1)
  })

  it('cancel on the reset confirm leaves progress untouched', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('button', { name: /yes, erase everything/i })).not.toBeInTheDocument()
    expect(useStore.getState().profileName).toBe('Ana')
  })

  it('daily goal stepper disables decrease at the floor and steps by 5 off it', async () => {
    useStore.setState({ dailyGoal: 5 })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByRole('button', { name: /decrease how many cards a day/i })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: /increase how many cards a day/i }))
    expect(useStore.getState().dailyGoal).toBe(10)
  })

  it('daily goal stepper disables increase at the 100 ceiling', () => {
    useStore.setState({ dailyGoal: 100 })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByRole('button', { name: /increase how many cards a day/i })).toBeDisabled()
  })

  it('new-cards stepper disables decrease at 1 and increase at 20', () => {
    useStore.setState({ newPerSession: 1 })
    const { unmount } = render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByRole('button', { name: /decrease new cards per session/i })).toBeDisabled()
    unmount()

    useStore.setState({ newPerSession: 20 })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByRole('button', { name: /increase new cards per session/i })).toBeDisabled()
  })

  it('accent selector marks the active accent and switches on click', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    const nz = screen.getByRole('radio', { name: /nz/i })
    expect(nz).toHaveAttribute('aria-checked', 'true')

    const au = screen.getByRole('radio', { name: /au/i })
    await userEvent.click(au)
    expect(useStore.getState().accent).toBe('en-AU')
  })

  it('speech-speed selector marks Normal as active by default and switches on click', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    const normal = screen.getByRole('radio', { name: /normal/i })
    expect(normal).toHaveAttribute('aria-checked', 'true')

    const slower = screen.getByRole('radio', { name: /slower/i })
    await userEvent.click(slower)
    expect(useStore.getState().speechRate).toBe(0.75)

    const faster = screen.getByRole('radio', { name: /faster/i })
    await userEvent.click(faster)
    expect(useStore.getState().speechRate).toBe(1.1)
  })

  it('offers the daily reminder switched off, at 19:00, with the iPhone caveat stated up front', () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByLabelText(/daily reminder/i)).not.toBeChecked()
    expect(screen.getByLabelText(/reminder time/i)).toHaveValue('19:00')
    // Honest about the platform: never promise what iOS cannot do.
    expect(screen.getByText(/add this app to your home screen/i)).toBeInTheDocument()
    expect(screen.getByText(/ios 16\.4 or newer/i)).toBeInTheDocument()
  })

  it('says plainly that phone reminders are not set up, and that the in-app one still works', async () => {
    // Today's shipping reality: no VITE_VAPID_PUBLIC_KEY, no sender deployed.
    // She must not be left expecting a buzz on a locked phone that cannot
    // come — and must be told the reminder she *does* have is unaffected.
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    expect(screen.getByText(/aren't set up yet/i)).toBeInTheDocument()
    expect(screen.getByText(/the reminder inside the app works today/i)).toBeInTheDocument()
    expect(screen.queryByText(/your phone can buzz/i)).not.toBeInTheDocument()
  })

  it('turns the reminder on and saves a new time', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    await userEvent.click(screen.getByLabelText(/daily reminder/i))
    expect(useStore.getState().reminderEnabled).toBe(true)

    // The platform picker hands the control a whole "HH:MM" at once rather
    // than a keystroke per digit, so that is what this drives.
    fireEvent.change(screen.getByLabelText(/reminder time/i), { target: { value: '07:30' } })
    expect(useStore.getState().reminderTime).toBe('07:30')
  })

  it('keeps the last good time when the picker is cleared mid-edit', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/reminder time/i), { target: { value: '' } })
    // An empty picker is her halfway through choosing, not a decision to
    // silence the reminder.
    expect(useStore.getState().reminderTime).toBe('19:00')
  })

  it('turns the reminder on even where Notification does not exist at all', async () => {
    // jsdom has no Notification global — the same situation as iOS Safari
    // before 16.4 and a good few in-app browsers. Layer 1 needs no
    // permission, so the switch must still work and nothing may throw.
    expect('Notification' in window).toBe(false)
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(useStore.getState().reminderEnabled).toBe(true)
    expect(screen.queryByText(/said no to notifications/i)).not.toBeInTheDocument()
  })

  it('asks for notification permission the first time she switches the reminder on', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', { permission: 'default', requestPermission })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(requestPermission).toHaveBeenCalledTimes(1)
    expect(useStore.getState().reminderEnabled).toBe(true)
    expect(screen.queryByText(/said no to notifications/i)).not.toBeInTheDocument()
  })

  it('does not re-ask when permission was already granted', async () => {
    const requestPermission = vi.fn().mockResolvedValue('granted')
    vi.stubGlobal('Notification', { permission: 'granted', requestPermission })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(requestPermission).not.toHaveBeenCalled()
    expect(useStore.getState().reminderEnabled).toBe(true)
  })

  it('explains a denial calmly, and keeps the in-app reminder on regardless', async () => {
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(screen.getByText(/said no to notifications/i)).toBeInTheDocument()
    expect(screen.getByText(/browser settings/i)).toBeInTheDocument()
    // The promise the copy makes must be true: the preference is on.
    expect(screen.getByText(/still shows up inside the app/i)).toBeInTheDocument()
    expect(useStore.getState().reminderEnabled).toBe(true)
  })

  it('clears the denial note when she switches the reminder back off', async () => {
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockResolvedValue('denied'),
    })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))
    expect(screen.getByText(/said no to notifications/i)).toBeInTheDocument()

    await userEvent.click(screen.getByLabelText(/daily reminder/i))
    expect(useStore.getState().reminderEnabled).toBe(false)
    expect(screen.queryByText(/said no to notifications/i)).not.toBeInTheDocument()
  })

  it('still turns the reminder on when requestPermission throws', async () => {
    vi.stubGlobal('Notification', {
      permission: 'default',
      requestPermission: vi.fn().mockRejectedValue(new Error('nope')),
    })
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)

    await userEvent.click(screen.getByLabelText(/daily reminder/i))

    expect(useStore.getState().reminderEnabled).toBe(true)
  })

  it('commits an edited name on blur, ignoring an attempt to clear it', async () => {
    render(<Settings onBack={vi.fn()} syncStatus="unconfigured" onCreate={vi.fn()} onSignIn={vi.fn()} />)
    const input = screen.getByDisplayValue('Ana')
    await userEvent.clear(input)
    await userEvent.tab()
    expect(useStore.getState().profileName).toBe('Ana')

    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, 'Beatriz')
    await userEvent.tab()
    expect(useStore.getState().profileName).toBe('Beatriz')
  })
})
