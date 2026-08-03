import type { Accent, Deck, Modality } from '../types'

export type CourseId = 'en-nz' | 'es-latam'

/**
 * A course is a language, its content, and how it should be practised.
 *
 * It exists because the two learners this app serves need opposite things. She
 * is a beginner in English: she needs to recognise a word before she can
 * produce it, and a gate that stops her skipping ahead. He already understands
 * Spanish and cannot write or speak it: recognition exercises would be time
 * spent proving what he already knows, and a gate would only hold him at
 * "hola, gracias" while what he needs is the subjunctive.
 *
 * The engine — scheduling, the session, sync, offline — knows none of this. It
 * is handed a course and does the same thing it always did.
 */
export interface Course {
  id: CourseId
  /** Full name, for the course picker. */
  name: string
  /** One word, for places that just need to say which course this is. */
  shortName: string
  emoji: string

  /**
   * Where this course's profile is persisted, and therefore what the sync
   * snapshot for it contains. Separate keys are what keep two courses from
   * ever seeing each other's progress — see ./active.ts.
   */
  storageKey: string

  /** The voice this course is spoken in, and the default of the accent setting. */
  defaultAccent: Accent
  /** Accent choices worth offering. A course with one sensible voice offers none. */
  accents: Accent[]

  /**
   * Which exercises may come up. The rotation draws only from these, so a
   * course can drop a whole modality — Spanish drops `recognize` — without the
   * router needing to know why.
   */
  modalities: Modality[]

  /**
   * `repeat`: the word is on screen and she reads it aloud — right for a
   * beginner, who is practising the sounds of a word she has just met.
   * `produce`: only the Portuguese is shown and he has to come up with the
   * foreign word himself. Reading a word already on the screen would not
   * exercise the thing he is missing.
   */
  speakDirection: 'repeat' | 'produce'

  /** Whether levels are gated by the 80% rule. */
  gated: boolean

  /**
   * Whether the Practice hub is offered.
   *
   * Dialogues, Role-play, Ear training and Shadowing are all built on New
   * Zealand material — Auckland cafés, Kiwi minimal pairs, pronunciation
   * written for a Brazilian learning English. A Spanish course showing them
   * would be worse than a Spanish course without them, so it goes without
   * until it has material of its own.
   */
  hasPractice: boolean

  decks: Deck[]
}
