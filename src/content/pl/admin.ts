import type { Deck } from '../../types'

/**
 * The Poland-specific deck the design doc asked for — PESEL, urząd,
 * residence cards. Nothing here has a real equivalent in the English or
 * Spanish courses; someone who actually moves needs this vocabulary
 * regardless of how good their general Polish gets.
 */
export const PL_ADMIN_DECK: Deck = {
  id: 'pl_admin',
  name: 'Burocracia polonesa',
  emoji: '🗂️',
  desc: 'PESEL, repartições, documentos',
  level: 3,
  cards: [
    { id: 'pl_admin_0', deckId: 'pl_admin', en: 'PESEL', pt: 'número de identificação pessoal (PESEL)', exampleHtml: 'Jaki jest twój numer <b>PESEL</b>?', examplePt: 'Qual é o seu número PESEL?', pos: 'noun' },
    { id: 'pl_admin_1', deckId: 'pl_admin', en: 'urząd', pt: 'repartição pública', exampleHtml: 'Idę do <b>urzędu</b>.', examplePt: 'Eu vou à repartição pública.', pos: 'noun' },
    { id: 'pl_admin_2', deckId: 'pl_admin', en: 'urząd miasta', pt: 'prefeitura', exampleHtml: '<b>Urząd miasta</b> jest zamknięty.', examplePt: 'A prefeitura está fechada.', pos: 'phrase' },
    { id: 'pl_admin_3', deckId: 'pl_admin', en: 'karta pobytu', pt: 'cartão de residência', exampleHtml: 'Mam <b>kartę pobytu</b>.', examplePt: 'Eu tenho um cartão de residência.', pos: 'phrase' },
    { id: 'pl_admin_4', deckId: 'pl_admin', en: 'wiza', pt: 'visto', exampleHtml: 'To jest moja <b>wiza</b>.', examplePt: 'Esse é meu visto.', pos: 'noun' },
    { id: 'pl_admin_5', deckId: 'pl_admin', en: 'obywatelstwo', pt: 'cidadania', exampleHtml: 'Mam polskie <b>obywatelstwo</b>.', examplePt: 'Eu tenho cidadania polonesa.', pos: 'noun' },
    { id: 'pl_admin_6', deckId: 'pl_admin', en: 'dowód osobisty', pt: 'carteira de identidade', exampleHtml: 'To jest mój <b>dowód osobisty</b>.', examplePt: 'Essa é minha carteira de identidade.', pos: 'phrase' },
    { id: 'pl_admin_7', deckId: 'pl_admin', en: 'paszport', pt: 'passaporte', exampleHtml: 'To jest mój <b>paszport</b>.', examplePt: 'Esse é meu passaporte.', pos: 'noun' },
    { id: 'pl_admin_8', deckId: 'pl_admin', en: 'wniosek', pt: 'requerimento', exampleHtml: 'Składam <b>wniosek</b>.', examplePt: 'Eu estou entregando o requerimento.', pos: 'noun' },
    { id: 'pl_admin_9', deckId: 'pl_admin', en: 'podpis', pt: 'assinatura', exampleHtml: 'To jest mój <b>podpis</b>.', examplePt: 'Essa é minha assinatura.', pos: 'noun' },
    { id: 'pl_admin_10', deckId: 'pl_admin', en: 'pieczątka', pt: 'carimbo', exampleHtml: 'To jest <b>pieczątka</b>.', examplePt: 'Esse é o carimbo.', pos: 'noun' },
    { id: 'pl_admin_11', deckId: 'pl_admin', en: 'kolejka', pt: 'fila', exampleHtml: 'Jest długa <b>kolejka</b>.', examplePt: 'Tem uma fila longa.', pos: 'noun' },
    { id: 'pl_admin_12', deckId: 'pl_admin', en: 'numerek', pt: 'senha (numerada, de atendimento)', exampleHtml: 'Mam <b>numerek</b> trzynaście.', examplePt: 'Eu tenho a senha treze.', pos: 'noun' },
    { id: 'pl_admin_13', deckId: 'pl_admin', en: 'formularz', pt: 'formulário', exampleHtml: 'Wypełniam <b>formularz</b>.', examplePt: 'Eu estou preenchendo o formulário.', pos: 'noun' },
  ],
}
