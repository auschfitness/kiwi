// src/content/pl/housing.ts
import type { Deck } from '../../types'

/**
 * "zameldowanie" (address registration) is the one genuinely Poland-specific
 * item in this deck — every long-term resident has to register their
 * address with the local office, a step with no real equivalent in the
 * other two courses' countries. Worth its own card rather than folding it
 * into "adres", since the concept (not just the word) is unfamiliar.
 */
export const PL_HOUSING_DECK: Deck = {
  id: 'pl_housing',
  name: 'Moradia e aluguel',
  emoji: '🔑',
  desc: 'Alugar, contrato, endereço, registro de residência',
  level: 3,
  cards: [
    { id: 'pl_housing_0', deckId: 'pl_housing', en: 'wynajem', pt: 'aluguel', exampleHtml: 'To jest <b>wynajem</b> mieszkania.', examplePt: 'Esse é o aluguel do apartamento.', pos: 'noun' },
    { id: 'pl_housing_1', deckId: 'pl_housing', en: 'wynajmować', pt: 'alugar', exampleHtml: 'Chcę <b>wynajmować</b> mieszkanie.', examplePt: 'Eu quero alugar um apartamento.', pos: 'verb' },
    { id: 'pl_housing_2', deckId: 'pl_housing', en: 'właściciel', pt: 'proprietário', exampleHtml: 'To jest <b>właściciel</b>.', examplePt: 'Esse é o proprietário.', pos: 'noun' },
    { id: 'pl_housing_3', deckId: 'pl_housing', en: 'najemca', pt: 'inquilino', exampleHtml: 'To jest <b>najemca</b>.', examplePt: 'Esse é o inquilino.', pos: 'noun' },
    { id: 'pl_housing_4', deckId: 'pl_housing', en: 'umowa', pt: 'contrato', exampleHtml: 'Podpisuję <b>umowę</b>.', examplePt: 'Eu estou assinando um contrato.', pos: 'noun' },
    { id: 'pl_housing_5', deckId: 'pl_housing', en: 'czynsz', pt: 'aluguel mensal', exampleHtml: 'Płacę <b>czynsz</b> co miesiąc.', examplePt: 'Eu pago o aluguel todo mês.', pos: 'noun' },
    { id: 'pl_housing_6', deckId: 'pl_housing', en: 'kaucja', pt: 'depósito caução', exampleHtml: 'To jest <b>kaucja</b>.', examplePt: 'Esse é o depósito caução.', pos: 'noun' },
    { id: 'pl_housing_7', deckId: 'pl_housing', en: 'zameldowanie', pt: 'registro de endereço', exampleHtml: 'To jest <b>zameldowanie</b>.', examplePt: 'Esse é o registro de endereço.', pos: 'noun' },
    { id: 'pl_housing_8', deckId: 'pl_housing', en: 'zameldować się', pt: 'se registrar (endereço)', exampleHtml: 'Muszę się <b>zameldować</b>.', examplePt: 'Eu preciso me registrar.', pos: 'phrase' },
    { id: 'pl_housing_9', deckId: 'pl_housing', en: 'adres', pt: 'endereço', exampleHtml: 'Jaki jest twój <b>adres</b>?', examplePt: 'Qual é o seu endereço?', pos: 'noun' },
    { id: 'pl_housing_10', deckId: 'pl_housing', en: 'mieszkać', pt: 'morar', exampleHtml: 'Chcę tu <b>mieszkać</b>.', examplePt: 'Eu quero morar aqui.', pos: 'verb' },
    { id: 'pl_housing_11', deckId: 'pl_housing', en: 'mieszkam', pt: 'eu moro', exampleHtml: '<b>Mieszkam</b> w Warszawie.', examplePt: 'Eu moro em Varsóvia.', pos: 'verb' },
    { id: 'pl_housing_12', deckId: 'pl_housing', en: 'sąsiad', pt: 'vizinho', exampleHtml: 'To jest mój <b>sąsiad</b>.', examplePt: 'Esse é meu vizinho.', pos: 'noun' },
    { id: 'pl_housing_13', deckId: 'pl_housing', en: 'winda', pt: 'elevador', exampleHtml: '<b>Winda</b> nie działa.', examplePt: 'O elevador não está funcionando.', pos: 'noun' },
    { id: 'pl_housing_14', deckId: 'pl_housing', en: 'piętro', pt: 'andar', exampleHtml: 'To jest moje <b>piętro</b>.', examplePt: 'Esse é meu andar.', pos: 'noun' },
    { id: 'pl_housing_15', deckId: 'pl_housing', en: 'remont', pt: 'reforma', exampleHtml: 'Robię <b>remont</b>.', examplePt: 'Eu estou fazendo uma reforma.', pos: 'noun' },
  ],
}
