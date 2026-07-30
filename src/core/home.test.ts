import { describe, it, expect } from 'vitest'
import { greeting, studyButtonLabel } from './home'

const at = (h: number) => new Date(2026, 6, 30, h, 0, 0).getTime()

describe('greeting', () => {
  it('greets the morning', () => { expect(greeting(at(8))).toMatch(/morning/i) })
  it('greets the afternoon', () => { expect(greeting(at(14))).toMatch(/afternoon/i) })
  it('greets the evening', () => { expect(greeting(at(20))).toMatch(/evening/i) })
  it('says something kind late at night', () => { expect(greeting(at(2)).length).toBeGreaterThan(0) })
})

describe('studyButtonLabel', () => {
  it('counts the reviews waiting', () => {
    expect(studyButtonLabel(7, 20)).toBe('Review 7 cards')
  })

  it('uses the singular for one card', () => {
    expect(studyButtonLabel(1, 0)).toBe('Review 1 card')
  })

  it('offers new words when nothing is due', () => {
    expect(studyButtonLabel(0, 12)).toBe('Learn new words')
  })

  it('celebrates an empty queue', () => {
    expect(studyButtonLabel(0, 0)).toBe('All done for now')
  })
})
