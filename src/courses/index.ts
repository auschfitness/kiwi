import type { Course, CourseId } from './types'
import type { CourseRules } from '../core/modality'
import { DEFAULT_TYPABLE_POS } from '../core/text'
import { readActiveCourseId, DEFAULT_COURSE } from './active'
import { ENGLISH_DECKS } from '../content/english'
import { ES_DECKS } from '../content/es'
import { ES_ROLEPLAYS } from '../content/es/roleplays'
import { ES_DIALOGUES } from '../content/es/dialogues'
import { ROLEPLAYS } from '../content/authored/roleplays'
import { DIALOGUES } from '../content/dialogues.generated'

export type { Course, CourseId } from './types'
export { readActiveCourseId, writeActiveCourseId, ACTIVE_COURSE_KEY, DEFAULT_COURSE } from './active'

const EN_NZ: Course = {
  id: 'en-nz',
  name: 'Inglês → Nova Zelândia',
  shortName: 'Inglês',
  emoji: '🥝',
  // The original key, unchanged and unchangeable: every profile that exists
  // today is saved under it. Renaming this would look to her like the app had
  // forgotten her streak.
  storageKey: 'english-nz',
  defaultAccent: 'en-NZ',
  accents: ['en-NZ', 'en-AU', 'en-GB', 'en-US'],
  modalities: ['recognize', 'listen', 'type', 'build', 'dictate', 'speak'],
  speakDirection: 'repeat',
  gated: true,
  practice: ['dialogues', 'shadowing', 'roleplay', 'drills', 'earTraining'],
  decks: ENGLISH_DECKS,
  roleplays: ROLEPLAYS,
  dialogues: DIALOGUES,
}

const ES_LATAM: Course = {
  id: 'es-latam',
  name: 'Espanhol (América Latina)',
  shortName: 'Espanhol',
  emoji: '🌎',
  storageKey: 'espanol-latam',
  // es-419 is the tag for Latin American Spanish. Not every device has a voice
  // for it; pickVoice falls back through the accent list and then to any
  // Spanish voice, so a device with only es-ES still speaks.
  defaultAccent: 'es-419',
  accents: ['es-419', 'es-MX', 'es-AR', 'es-ES'],
  // No `recognize`: he already understands Spanish, and being shown a word to
  // pick its meaning would be time spent proving that. What is missing is
  // production, so the wheel is typing, building, dictation and speaking.
  modalities: ['type', 'build', 'dictate', 'speak'],
  speakDirection: 'produce',
  // No gate. The 80% rule exists to stop a beginner skipping the basics; he
  // would only be held at "hola, gracias" while what he needs is the
  // subjunctive. Spaced repetition alone decides what comes back and when.
  gated: false,
  // Dialogues, Shadowing and Role-play have Spanish material of their own.
  // Drills speak English numbers, times and dates, and Ear training is Kiwi
  // vowel pairs; both are left out rather than shown speaking the wrong
  // language.
  practice: ['dialogues', 'shadowing', 'roleplay'],
  decks: ES_DECKS,
  roleplays: ES_ROLEPLAYS,
  dialogues: ES_DIALOGUES,
}

const COURSES: Record<CourseId, Course> = {
  'en-nz': EN_NZ,
  'es-latam': ES_LATAM,
}

export const ALL_COURSES: Course[] = [EN_NZ, ES_LATAM]

export function courseById(id: CourseId): Course {
  return COURSES[id] ?? COURSES[DEFAULT_COURSE]
}

/**
 * The course this device is studying, fixed for the lifetime of the page.
 *
 * Read once here rather than per call so nothing can observe it changing
 * mid-session: switching courses writes the preference and reloads, which is
 * what lets the rest of the app treat "the course" as a constant.
 */
export const ACTIVE_COURSE: Course = courseById(readActiveCourseId())

/** What the modality router needs to know about the active course. */
export const ACTIVE_RULES: CourseRules = {
  modalities: ACTIVE_COURSE.modalities,
  // Spanish phrase cards are ordinary short things a person says, not the
  // arrow notation the default set exists to keep out. See core/text.ts.
  typablePos: ACTIVE_COURSE.id === 'es-latam'
    ? new Set([...DEFAULT_TYPABLE_POS, 'phrase' as const])
    : DEFAULT_TYPABLE_POS,
}
