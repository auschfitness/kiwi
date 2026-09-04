// src/content/pl/verbs.ts
import type { Deck } from '../../types'

/**
 * być (ser/estar), mieć (ter), chcieć (querer), iść (ir), robić (fazer),
 * mówić (falar), rozumieć/wiedzieć (entender/saber) — the handful of verbs
 * that carry most everyday speech, each shown once as the dictionary form
 * and once conjugated, the way the Spanish course's "os seis verbos" deck
 * does it.
 */
export const PL_VERBS_DECK: Deck = {
  id: 'pl_verbs',
  name: 'Verbos do dia a dia',
  emoji: '🔑',
  desc: 'Ser, ter, querer, ir, fazer, falar, entender',
  level: 1,
  cards: [
    { id: 'pl_verbs_0', deckId: 'pl_verbs', en: 'być', pt: 'ser / estar', exampleHtml: 'Chcę <b>być</b> szczęśliwy.', examplePt: 'Eu quero ser feliz.', pos: 'verb' },
    { id: 'pl_verbs_1', deckId: 'pl_verbs', en: 'jestem', pt: 'eu sou / estou', exampleHtml: '<b>Jestem</b> w domu.', examplePt: 'Eu estou em casa.', pos: 'verb' },
    { id: 'pl_verbs_2', deckId: 'pl_verbs', en: 'jesteś', pt: 'você é / está', exampleHtml: '<b>Jesteś</b> bardzo miły.', examplePt: 'Você é muito gentil.', pos: 'verb' },
    { id: 'pl_verbs_3', deckId: 'pl_verbs', en: 'mieć', pt: 'ter', exampleHtml: 'Muszę <b>mieć</b> czas.', examplePt: 'Eu preciso ter tempo.', pos: 'verb' },
    { id: 'pl_verbs_4', deckId: 'pl_verbs', en: 'mam', pt: 'eu tenho', exampleHtml: '<b>Mam</b> czas.', examplePt: 'Eu tenho tempo.', pos: 'verb' },
    { id: 'pl_verbs_5', deckId: 'pl_verbs', en: 'masz', pt: 'você tem', exampleHtml: '<b>Masz</b> rację.', examplePt: 'Você tem razão.', pos: 'verb' },
    { id: 'pl_verbs_6', deckId: 'pl_verbs', en: 'chcieć', pt: 'querer', exampleHtml: 'Ważne jest <b>chcieć</b> się uczyć.', examplePt: 'É importante querer aprender.', pos: 'verb' },
    { id: 'pl_verbs_7', deckId: 'pl_verbs', en: 'chcę', pt: 'eu quero', exampleHtml: '<b>Chcę</b> kawę.', examplePt: 'Eu quero um café.', pos: 'verb' },
    { id: 'pl_verbs_8', deckId: 'pl_verbs', en: 'iść', pt: 'ir (a pé)', exampleHtml: 'Muszę <b>iść</b> do pracy.', examplePt: 'Eu preciso ir para o trabalho.', pos: 'verb' },
    { id: 'pl_verbs_9', deckId: 'pl_verbs', en: 'idę', pt: 'eu vou', exampleHtml: '<b>Idę</b> do domu.', examplePt: 'Eu vou para casa.', pos: 'verb' },
    { id: 'pl_verbs_10', deckId: 'pl_verbs', en: 'robić', pt: 'fazer', exampleHtml: 'Co chcesz <b>robić</b>?', examplePt: 'O que você quer fazer?', pos: 'verb' },
    { id: 'pl_verbs_11', deckId: 'pl_verbs', en: 'robię', pt: 'eu faço', exampleHtml: '<b>Robię</b> śniadanie.', examplePt: 'Eu estou fazendo o café da manhã.', pos: 'verb' },
    { id: 'pl_verbs_12', deckId: 'pl_verbs', en: 'mówić', pt: 'falar', exampleHtml: 'Nie mogę teraz <b>mówić</b>.', examplePt: 'Eu não posso falar agora.', pos: 'verb' },
    { id: 'pl_verbs_13', deckId: 'pl_verbs', en: 'mówię', pt: 'eu falo', exampleHtml: '<b>Mówię</b> trochę po polsku.', examplePt: 'Eu falo um pouco de polonês.', pos: 'verb' },
    { id: 'pl_verbs_14', deckId: 'pl_verbs', en: 'rozumieć', pt: 'entender', exampleHtml: 'Zaczynam <b>rozumieć</b>.', examplePt: 'Eu estou começando a entender.', pos: 'verb' },
    { id: 'pl_verbs_15', deckId: 'pl_verbs', en: 'wiem', pt: 'eu sei', exampleHtml: 'Nie <b>wiem</b>.', examplePt: 'Eu não sei.', pos: 'verb' },
  ],
}
