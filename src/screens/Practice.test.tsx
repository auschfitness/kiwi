import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Practice } from './Practice'

// Practice itself makes no audio calls, but it's the front door to screens
// that do (Dialogues, Shadowing) — stub the same way those screen tests do
// so nothing here depends on a real speechSynthesis/SpeechRecognition.
vi.mock('../audio/speak', () => ({ speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn(), setDefaultRate: vi.fn() }))
vi.mock('../audio/listen', () => ({ recognizeOnce: vi.fn(async () => '') }))

describe('Practice', () => {
  it('offers all four practice options', () => {
    render(<Practice onBack={vi.fn()} onNavigate={vi.fn()} />)
    expect(screen.getByText('Dialogues')).toBeInTheDocument()
    expect(screen.getByText('Shadowing')).toBeInTheDocument()
    expect(screen.getByText('Role-play')).toBeInTheDocument()
    expect(screen.getByText('Drills')).toBeInTheDocument()
  })

  it('navigates to Dialogues', async () => {
    const onNavigate = vi.fn()
    render(<Practice onBack={vi.fn()} onNavigate={onNavigate} />)
    await userEvent.click(screen.getByTestId('practice-dialogues'))
    expect(onNavigate).toHaveBeenCalledWith('dialogues')
  })

  it('navigates to Shadowing', async () => {
    const onNavigate = vi.fn()
    render(<Practice onBack={vi.fn()} onNavigate={onNavigate} />)
    await userEvent.click(screen.getByTestId('practice-shadowing'))
    expect(onNavigate).toHaveBeenCalledWith('shadowing')
  })

  it('navigates to Role-play', async () => {
    const onNavigate = vi.fn()
    render(<Practice onBack={vi.fn()} onNavigate={onNavigate} />)
    await userEvent.click(screen.getByTestId('practice-roleplay'))
    expect(onNavigate).toHaveBeenCalledWith('roleplay')
  })

  it('navigates to Drills', async () => {
    const onNavigate = vi.fn()
    render(<Practice onBack={vi.fn()} onNavigate={onNavigate} />)
    await userEvent.click(screen.getByTestId('practice-drills'))
    expect(onNavigate).toHaveBeenCalledWith('drills')
  })

  it('goes back to Home', async () => {
    const onBack = vi.fn()
    render(<Practice onBack={onBack} onNavigate={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /go back/i }))
    expect(onBack).toHaveBeenCalled()
  })
})
