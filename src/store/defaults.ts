import type { AppState } from '../types'

export function createInitialState(now: number): AppState {
  return {
    profileName: '',
    syncCode: null,
    // Everyone starts at A1 with nothing pre-known and works up from there.
    unlockedLevel: 1,
    cards: {},
    skills: {
      vocab: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      speaking: { correct: 0, total: 0 },
    },
    dailyGoal: 20,
    newPerSession: 8,
    accent: 'en-NZ',
    showPortuguese: true,
    autoPlayAudio: true,
    speechRate: 0.95,
    reminderEnabled: false,
    reminderTime: '19:00',
    streak: 0,
    lastStudyDay: null,
    doneToday: 0,
    doneDate: null,
    bestDay: 0,
    startedAt: now,
    updatedAt: now,
  }
}
