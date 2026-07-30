import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialogues } from './Dialogues'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

vi.mock('../audio/speak', () => ({ speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn() }))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

describe('Dialogues', () => {
  it('lists all seven dialogues', () => {
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    expect(screen.getAllByTestId('dialogue-card')).toHaveLength(7)
  })

  it('expands to show the lines', async () => {
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument()
  })

  it('starts shadowing for that dialogue', async () => {
    const onShadow = vi.fn()
    render(<Dialogues onBack={vi.fn()} onShadow={onShadow} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    await userEvent.click(screen.getByRole('button', { name: /shadow this/i }))
    expect(onShadow).toHaveBeenCalledWith('dlg_0')
  })

  it('hides Portuguese when the setting is off', async () => {
    useStore.setState({ showPortuguese: false })
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    expect(screen.queryByTestId('dialogue-line-pt')).not.toBeInTheDocument()
  })
})
