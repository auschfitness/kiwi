import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SyncSetup } from './SyncSetup'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, profileName: 'Ana' })
})

afterEach(() => {
  goOnline()
})

/** jsdom's navigator.onLine is a getter; this is the only way to move it. */
function setOnLine(value: boolean) {
  Object.defineProperty(navigator, 'onLine', { value, configurable: true })
}

function goOffline() {
  setOnLine(false)
  act(() => { window.dispatchEvent(new Event('offline')) })
}

function goOnline() {
  setOnLine(true)
}

/** The gate as App renders it on first run. */
function renderGate(props: Partial<Parameters<typeof SyncSetup>[0]> = {}) {
  const onCreate = props.onCreate ?? vi.fn().mockResolvedValue('created')
  const onSignIn = props.onSignIn ?? vi.fn().mockResolvedValue('merged')
  render(
    <SyncSetup
      mandatory
      onDone={props.onDone ?? vi.fn()}
      onDefer={props.onDefer ?? vi.fn()}
      onCreate={onCreate}
      onSignIn={onSignIn}
    />,
  )
  return { onCreate, onSignIn }
}

describe('SyncSetup — creating an account', () => {
  it('explains what the code is for before asking for one', () => {
    renderGate()
    // Not "enter a sync code" — the reason, in the order it occurs to her.
    expect(screen.getByText(/how your progress gets saved/i)).toBeInTheDocument()
    expect(screen.getByText(/comes with you if you ever change phone/i)).toBeInTheDocument()
    expect(screen.getByText(/write it down/i)).toBeInTheDocument()
    // The code is an account key now, so the old "anyone who types this same
    // code" framing would be wrong: nobody else can pick hers.
    expect(screen.getByText(/one code, one account/i)).toBeInTheDocument()
  })

  it('suggests the shape of a code in the placeholder, the way Settings does', () => {
    renderGate()
    const input = screen.getByLabelText('Sync code')
    expect(input).toHaveAttribute('placeholder', 'a word plus some numbers, e.g. kiwi2026')
    expect(input).toHaveAttribute('autoCapitalize', 'none')
    expect(input).toHaveAttribute('autoCorrect', 'off')
    expect(input).toHaveAttribute('spellcheck', 'false')
  })

  it('defaults a brand-new profile to "I\'m new here"', () => {
    renderGate()
    expect(screen.getByRole('radio', { name: /i'm new here/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('claims a free code and says it is hers from right now', async () => {
    const { onCreate, onSignIn } = renderGate({ onCreate: vi.fn().mockResolvedValue('created') })
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    expect(onCreate).toHaveBeenCalledWith('kiwi2026')
    expect(onSignIn).not.toHaveBeenCalled()
    expect(await screen.findByText(/that code is yours now/i)).toBeInTheDocument()
    expect(screen.getByText(/in the cloud from right now/i)).toBeInTheDocument()
  })

  it('trims the code before sending it', async () => {
    const { onCreate } = renderGate({ onCreate: vi.fn().mockResolvedValue('created') })
    await userEvent.type(screen.getByLabelText('Sync code'), '  kiwi2026  ')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    expect(onCreate).toHaveBeenCalledWith('kiwi2026')
  })

  /**
   * The sentence this whole change exists for. It has to be unmistakable and
   * it must not read as an accusation — she has done nothing wrong, the code
   * simply is not free — and both ways forward have to be on the screen.
   */
  it('refuses a taken code plainly, and offers both ways forward', async () => {
    const { onCreate } = renderGate({ onCreate: vi.fn().mockResolvedValue('taken') })
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    expect(await screen.findByText(/that code is already taken/i)).toBeInTheDocument()
    expect(screen.getByText(/pick another one/i)).toBeInTheDocument()
    // Not an accusation, and not a dead end: sign in if the code is hers.
    expect(screen.getByRole('button', { name: /sign in with this code instead/i })).toBeInTheDocument()
    // She is still here, still able to try a different one.
    expect(screen.getByRole('button', { name: /make this code mine/i })).toBeEnabled()
    expect(onCreate).toHaveBeenCalledTimes(1)
  })

  it('does not let a refused code count as saved — no way on from a "taken"', async () => {
    renderGate({ onCreate: vi.fn().mockResolvedValue('taken') })
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    await screen.findByText(/that code is already taken/i)
    expect(screen.queryByRole('button', { name: /let's go/i })).not.toBeInTheDocument()
  })

  it('crosses over to sign-in with one tap when the code was in fact hers', async () => {
    const onSignIn = vi.fn().mockResolvedValue('merged')
    renderGate({ onCreate: vi.fn().mockResolvedValue('taken'), onSignIn })
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    await screen.findByText(/that code is already taken/i)

    await userEvent.click(screen.getByRole('button', { name: /sign in with this code instead/i }))
    expect(onSignIn).toHaveBeenCalledWith('kiwi2026')
    expect(await screen.findByText(/found progress already saved under that code/i)).toBeInTheDocument()
  })

  it('shows the validation error inline and never touches the network', async () => {
    const { onCreate, onSignIn } = renderGate({ onCreate: vi.fn() })
    await userEvent.type(screen.getByLabelText('Sync code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    expect(await screen.findByText(/include at least one letter/i)).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
    expect(onSignIn).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /make this code mine/i })).toBeInTheDocument()
  })

  it('rejects a too-short code and a letters-only code the same way', async () => {
    const { onCreate } = renderGate({ onCreate: vi.fn() })
    const input = screen.getByLabelText('Sync code')

    await userEvent.type(input, 'ana1')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    expect(await screen.findByText(/use at least 6 characters/i)).toBeInTheDocument()

    await userEvent.clear(input)
    await userEvent.type(input, 'anabanana')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))
    expect(await screen.findByText(/include at least one number/i)).toBeInTheDocument()

    expect(onCreate).not.toHaveBeenCalled()
  })

  it('swaps the screen for the way forward once the code is hers', async () => {
    const onDone = vi.fn()
    renderGate({ onDone, onCreate: vi.fn().mockResolvedValue('created') })
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    const go = await screen.findByRole('button', { name: /let's go/i })
    await userEvent.click(go)
    expect(onDone).toHaveBeenCalled()
  })
})

describe('SyncSetup — signing in to an account that exists', () => {
  it('loads and merges an existing code', async () => {
    const onSignIn = vi.fn().mockResolvedValue('merged')
    renderGate({ onSignIn })
    await userEvent.click(screen.getByRole('radio', { name: /i already have a code/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /sign in with this code/i }))

    expect(onSignIn).toHaveBeenCalledWith('kiwi2026')
    expect(await screen.findByText(/found progress already saved under that code/i)).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /let's go/i })).toBeInTheDocument()
  })

  it('explains the second-device case rather than the new-code one', async () => {
    renderGate()
    await userEvent.click(screen.getByRole('radio', { name: /i already have a code/i }))
    expect(screen.getByText(/type the code you already use/i)).toBeInTheDocument()
    expect(screen.getByText(/same code, same account/i)).toBeInTheDocument()
  })

  /** A typo must never quietly become a second, empty account. */
  it('says no account uses an unknown code, and offers to create it instead', async () => {
    const onSignIn = vi.fn().mockResolvedValue('unknown')
    const onCreate = vi.fn().mockResolvedValue('created')
    renderGate({ onSignIn, onCreate })

    await userEvent.click(screen.getByRole('radio', { name: /i already have a code/i }))
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /sign in with this code/i }))

    expect(await screen.findByText(/no account is using that code yet/i)).toBeInTheDocument()
    expect(screen.getByText(/have a look at the spelling/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /let's go/i })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /create this code instead/i }))
    expect(onCreate).toHaveBeenCalledWith('kiwi2026')
    expect(await screen.findByText(/that code is yours now/i)).toBeInTheDocument()
  })
})

describe('SyncSetup — mandatory, with its two honest exceptions', () => {
  it('offers no way past when the cloud is reachable', () => {
    renderGate()
    expect(screen.queryByRole('button', { name: /not now/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /carry on for now/i })).not.toBeInTheDocument()
    expect(screen.getByText(/the one thing we ask for before you start/i)).toBeInTheDocument()
  })

  it('opens the door when a request actually fails, and says the question is only postponed', async () => {
    const onDefer = vi.fn()
    renderGate({ onDefer, onCreate: vi.fn().mockResolvedValue('unreachable') })
    await userEvent.type(screen.getByLabelText('Sync code'), 'kiwi2026')
    await userEvent.click(screen.getByRole('button', { name: /make this code mine/i }))

    expect(await screen.findByText(/couldn't reach the cloud just now/i)).toBeInTheDocument()
    const carryOn = screen.getByRole('button', { name: /carry on for now/i })
    expect(screen.getByText(/we'll ask for your code as soon as you're back online/i)).toBeInTheDocument()

    await userEvent.click(carryOn)
    expect(onDefer).toHaveBeenCalled()
    // Nothing was claimed on the way out.
    expect(useStore.getState().syncCode).toBeNull()
  })

  it('does not make an offline browser type a code just to be told so', () => {
    goOffline()
    renderGate()
    expect(screen.getByRole('button', { name: /carry on for now/i })).toBeInTheDocument()
  })

  it('shuts the door again the moment the connection comes back', async () => {
    goOffline()
    renderGate()
    expect(screen.getByRole('button', { name: /carry on for now/i })).toBeInTheDocument()

    setOnLine(true)
    act(() => { window.dispatchEvent(new Event('online')) })
    expect(screen.queryByRole('button', { name: /carry on for now/i })).not.toBeInTheDocument()
  })
})

describe('SyncSetup — reached from Home with a code already set', () => {
  it('is not a gate: it prefills the code, defaults to sign-in, and offers the way back', () => {
    useStore.setState({ syncCode: 'kiwi2026' })
    const onCancel = vi.fn()
    render(
      <SyncSetup
        mandatory={false}
        onDone={vi.fn()}
        onCancel={onCancel}
        onCreate={vi.fn()}
        onSignIn={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Sync code')).toHaveValue('kiwi2026')
    expect(screen.getByRole('radio', { name: /i already have a code/i })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('button', { name: /back home/i })).toBeInTheDocument()
    // Not the gate, so neither the requirement note nor the offline escape.
    expect(screen.queryByText(/the one thing we ask for before you start/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /carry on for now/i })).not.toBeInTheDocument()
  })
})
