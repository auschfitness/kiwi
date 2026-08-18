import type { StudyLog } from './core/studyTime'

export type PartOfSpeech =
  | 'word' | 'noun' | 'verb' | 'adj' | 'number'
  | 'greeting' | 'slang' | 'phrase' | 'grammar'

export type Level = 1 | 2 | 3 | 4

/**
 * How this card relates to what a Portuguese speaker already has in her head.
 *
 * `false-friend`: the word looks like a Portuguese word but means something
 * else — `trap` names the meaning her brain will reach for by mistake
 * ("embarazada" looks like "envergonhada", but means "grávida").
 *
 * `similar-different`: not a lexical trap, a structural one — Portuguese
 * makes a different choice here (ser/estar, por/para, a verb tense) and the
 * two languages' rules genuinely diverge, even though the sentence looks
 * almost identical. No single `trap` word applies; the card's own `pt` is
 * the contrast.
 *
 * Most cards have neither, on purpose: tagging every card would just teach
 * him to distrust everything instead of flagging the specific places
 * Portuguese actually causes errors.
 */
export type InterferenceType = 'false-friend' | 'similar-different'

export interface Interference {
  type: InterferenceType
  /** `false-friend` only: the Portuguese word/meaning this gets mistaken for. */
  trap?: string
}

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
  /** Set only where Portuguese specifically causes an error — see `Interference`. */
  interference?: Interference
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

export type Accent =
  | 'en-NZ' | 'en-AU' | 'en-GB' | 'en-US'
  | 'es-419' | 'es-MX' | 'es-AR' | 'es-ES'

export interface AppState {
  profileName: string
  syncCode: string | null
  /**
   * The highest level she has earned. Everyone starts at 1 and climbs: the
   * only way this moves is the 80%-of-the-current-level rule in
   * `src/core/leveling.ts`. There is no test that can skip her ahead, and no
   * separate "measured" level — this single field is the whole progression.
   */
  unlockedLevel: Level
  cards: Record<string, CardState>
  skills: Skills
  dailyGoal: number
  newPerSession: number
  accent: Accent
  showPortuguese: boolean
  autoPlayAudio: boolean
  /** Passed straight to SpeechSynthesisUtterance.rate. 0.95 is today's speed. */
  speechRate: number
  /** Off until she asks for it — an app that nags uninvited gets deleted. */
  reminderEnabled: boolean
  /** `"HH:MM"`, 24-hour, in her own local time. Default `"19:00"`. */
  reminderTime: string
  streak: number
  lastStudyDay: string | null
  doneToday: number
  doneDate: string | null
  bestDay: number
  /**
   * Milliseconds studied per local calendar day. Written by the study clock
   * (`src/store/useStudyClock.ts`), read by everything that shows hours.
   * See `src/core/studyTime.ts` for why it is a log and not a total.
   */
  studyLog: StudyLog
  /**
   * How he does on cards tagged `interference` versus the rest of the
   * course — see `core/interference.ts`. Tracked the same shape as `skills`
   * on purpose, so the two numbers read the same way: "77% overall, 54% on
   * the ones Portuguese actively fights him on."
   */
  interferenceStats: SkillStat
  /**
   * cardId -> number of times a `type` answer loosely matched the card's
   * own `interference.trap` rather than the Spanish target — the one signal
   * precise enough to name the exact word his brain reached for, not just
   * that he got the card wrong. Only false-friend cards ever get an entry.
   */
  trapHits: Record<string, number>
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
