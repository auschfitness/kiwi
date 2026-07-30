import type { Deck } from '../../types'

/** Reference table for the Conjugation Table screen — one row per verb,
 * covering every card in IRREGULAR_DECK below. */
export const IRREGULAR_TABLE = [
  { base: 'go', past: 'went', participle: 'gone', pt: 'ir' },
  { base: 'have', past: 'had', participle: 'had', pt: 'ter' },
  { base: 'be', past: 'was / were', participle: 'been', pt: 'ser / estar' },
  { base: 'do', past: 'did', participle: 'done', pt: 'fazer' },
  { base: 'say', past: 'said', participle: 'said', pt: 'dizer' },
  { base: 'make', past: 'made', participle: 'made', pt: 'fazer / criar' },
  { base: 'take', past: 'took', participle: 'taken', pt: 'pegar / levar' },
  { base: 'come', past: 'came', participle: 'come', pt: 'vir' },
  { base: 'see', past: 'saw', participle: 'seen', pt: 'ver' },
  { base: 'get', past: 'got', participle: 'got / gotten', pt: 'conseguir / receber' },
  { base: 'give', past: 'gave', participle: 'given', pt: 'dar' },
  { base: 'know', past: 'knew', participle: 'known', pt: 'saber / conhecer' },
  { base: 'think', past: 'thought', participle: 'thought', pt: 'pensar / achar' },
  { base: 'find', past: 'found', participle: 'found', pt: 'encontrar' },
] as const

// pos: 'grammar' on every card here is load-bearing, not cosmetic — isTypable
// excludes 'grammar', so the modality router never asks her to *type*
// "go → went". These are routed to recognize/build/dictate instead.
export const IRREGULAR_DECK: Deck = {
  id: 'irregular',
  name: 'Irregular verbs',
  emoji: '🔄',
  desc: 'The past tense that refuses to follow rules',
  level: 2,
  cards: [
    {
      id: 'irregular_0', deckId: 'irregular',
      en: 'go → went', pt: 'ir (passado: went)',
      exampleHtml: 'I <b>went</b> to the shop yesterday.',
      examplePt: 'Eu fui à loja ontem.',
      pos: 'grammar',
    },
    {
      id: 'irregular_1', deckId: 'irregular',
      en: 'have → had', pt: 'ter (passado: had)',
      exampleHtml: 'We <b>had</b> a great weekend.',
      examplePt: 'Nós tivemos um ótimo fim de semana.',
      pos: 'grammar',
    },
    {
      id: 'irregular_2', deckId: 'irregular',
      en: 'be → was / were', pt: 'ser / estar (passado: was / were)',
      exampleHtml: 'The bus <b>was</b> late this morning.',
      examplePt: 'O ônibus estava atrasado hoje de manhã.',
      pos: 'grammar',
    },
    {
      id: 'irregular_3', deckId: 'irregular',
      en: 'do → did', pt: 'fazer (passado: did)',
      exampleHtml: 'My flatmate <b>did</b> the dishes after dinner.',
      examplePt: 'Meu colega de apartamento lavou a louça depois do jantar.',
      pos: 'grammar',
    },
    {
      id: 'irregular_4', deckId: 'irregular',
      en: 'say → said', pt: 'dizer (passado: said)',
      exampleHtml: 'She <b>said</b> the flat was cold.',
      examplePt: 'Ela disse que o apartamento estava frio.',
      pos: 'grammar',
    },
    {
      id: 'irregular_5', deckId: 'irregular',
      en: 'make → made', pt: 'fazer / criar (passado: made)',
      exampleHtml: 'He <b>made</b> coffee before work.',
      examplePt: 'Ele fez café antes do trabalho.',
      pos: 'grammar',
    },
    {
      id: 'irregular_6', deckId: 'irregular',
      en: 'take → took', pt: 'pegar / levar (passado: took)',
      exampleHtml: 'You <b>took</b> the bus to town today.',
      examplePt: 'Você pegou o ônibus para o centro hoje.',
      pos: 'grammar',
    },
    {
      id: 'irregular_7', deckId: 'irregular',
      en: 'come → came', pt: 'vir (passado: came)',
      exampleHtml: 'They <b>came</b> to New Zealand in June.',
      examplePt: 'Eles vieram para a Nova Zelândia em junho.',
      pos: 'grammar',
    },
    {
      id: 'irregular_8', deckId: 'irregular',
      en: 'see → saw', pt: 'ver (passado: saw)',
      exampleHtml: 'My colleague <b>saw</b> the doctor this morning.',
      examplePt: 'Minha colega viu o médico hoje de manhã.',
      pos: 'grammar',
    },
    {
      id: 'irregular_9', deckId: 'irregular',
      en: 'get → got', pt: 'conseguir / receber (passado: got)',
      exampleHtml: 'I <b>got</b> a text from my boss.',
      examplePt: 'Eu recebi uma mensagem do meu chefe.',
      pos: 'grammar',
    },
    {
      id: 'irregular_10', deckId: 'irregular',
      en: 'give → gave', pt: 'dar (passado: gave)',
      exampleHtml: 'The GP <b>gave</b> me some tablets.',
      examplePt: 'O médico me deu alguns comprimidos.',
      pos: 'grammar',
    },
    {
      id: 'irregular_11', deckId: 'irregular',
      en: 'know → knew', pt: 'saber / conhecer (passado: knew)',
      exampleHtml: 'My partner <b>knew</b> the address by heart.',
      examplePt: 'Meu parceiro sabia o endereço de cor.',
      pos: 'grammar',
    },
    {
      id: 'irregular_12', deckId: 'irregular',
      en: 'think → thought', pt: 'pensar / achar (passado: thought)',
      exampleHtml: 'We <b>thought</b> the rent was high.',
      examplePt: 'Nós achamos o aluguel caro.',
      pos: 'grammar',
    },
    {
      id: 'irregular_13', deckId: 'irregular',
      en: 'find → found', pt: 'encontrar (passado: found)',
      exampleHtml: 'She <b>found</b> a flat near the beach.',
      examplePt: 'Ela encontrou um apartamento perto da praia.',
      pos: 'grammar',
    },
  ],
}
