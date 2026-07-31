export type PartOfSpeech =
  | 'word' | 'noun' | 'verb' | 'adj' | 'number'
  | 'greeting' | 'slang' | 'phrase' | 'grammar'

export type Level = 1 | 2 | 3 | 4

export interface Card {
  id: string
  deckId: string
  en: string
  pt: string
  exampleHtml: string
  examplePt: string
  pos: PartOfSpeech
  phonetic?: string
  /** Public path of the card's photograph, e.g. `/photos/food_0.webp`.
   * Only concrete cards have one — see scripts/fetch-photos.mjs. */
  photo?: string
}

/** Who took a card's photograph, and where it lives on Pexels. */
export interface PhotoCredit {
  photographer: string
  url: string
}

export interface Deck {
  id: string
  name: string
  emoji: string
  desc: string
  level: Level
  cards: Card[]
}

export interface DialogueLine { who: string; en: string; pt: string }
export interface Dialogue { id: string; title: string; emoji: string; lines: DialogueLine[] }

export interface PlanWeek { title: string; detail: string; tip: string }

export interface CardState {
  due: number
  interval: number
  ease: number
  reps: number
  lapses: number
}

export interface SkillStat { correct: number; total: number }
export type Skill = 'vocab' | 'listening' | 'grammar' | 'speaking'
export type Skills = Record<Skill, SkillStat>

export type Modality =
  | 'learn' | 'recognize' | 'type' | 'listen'
  | 'dictate' | 'build' | 'speak'

export type Accent = 'en-NZ' | 'en-AU' | 'en-GB' | 'en-US'

export interface AppState {
  profileName: string
  syncCode: string | null
  cefrLevel: 0 | Level
  unlockedLevel: Level
  placed: boolean
  cards: Record<string, CardState>
  skills: Skills
  dailyGoal: number
  newPerSession: number
  accent: Accent
  showPortuguese: boolean
  autoPlayAudio: boolean
  /** Passed straight to SpeechSynthesisUtterance.rate. 0.95 is today's speed. */
  speechRate: number
  streak: number
  lastStudyDay: string | null
  doneToday: number
  doneDate: string | null
  bestDay: number
  startedAt: number
  updatedAt: number
}

/** One item in a study session queue. */
export interface QueueItem {
  cardId: string
  modality: Modality
  /** true when this item was pushed back after a wrong answer */
  repeat?: boolean
}

/** SRS rating. 0 again, 1 hard, 2 good, 3 easy. */
export type Rating = 0 | 1 | 2 | 3
