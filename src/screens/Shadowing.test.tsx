import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Shadowing } from './Shadowing'

vi.mock('../audio/listen', () => ({ recognizeOnce: vi.fn(async () => 'Hi there! What can I get you?') }))
vi.mock('../audio/speak', () => ({ speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn() }))

beforeEach(() => { vi.clearAllMocks() })

describe('Shadowing', () => {
  it('shows a line with its translation and a slow replay', () => {
    render(<Shadowing dialogueId="dlg_0" onBack={vi.fn()} />)
    expect(screen.getByRole('button', { name: /slow/i })).toBeInTheDocument()
    expect(screen.getByText(/line 1 of/i)).toBeInTheDocument()
  })

  it('praises a good repetition', async () => {
    render(<Shadowing dialogueId="dlg_0" onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    expect(await screen.findByText(/ka pai/i)).toBeInTheDocument()
  })

  it('moves to the next line', async () => {
    render(<Shadowing dialogueId="dlg_0" onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /next line/i }))
    expect(screen.getByText(/line 2 of/i)).toBeInTheDocument()
  })
})
