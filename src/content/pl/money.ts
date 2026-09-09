// src/content/pl/money.ts
import type { Deck } from '../../types'

export const PL_MONEY_DECK: Deck = {
  id: 'pl_money',
  name: 'Dinheiro e banco',
  emoji: '🏦',
  desc: 'Conta, crédito, pagar, poupar',
  level: 3,
  cards: [
    { id: 'pl_money_0', deckId: 'pl_money', en: 'konto', pt: 'conta', exampleHtml: 'Mam <b>konto</b> w banku.', examplePt: 'Eu tenho uma conta no banco.', pos: 'noun' },
    { id: 'pl_money_1', deckId: 'pl_money', en: 'kredyt', pt: 'crédito', exampleHtml: 'To jest <b>kredyt</b>.', examplePt: 'Isso é um crédito.', pos: 'noun' },
    { id: 'pl_money_2', deckId: 'pl_money', en: 'pożyczka', pt: 'empréstimo', exampleHtml: 'To jest <b>pożyczka</b>.', examplePt: 'Isso é um empréstimo.', pos: 'noun' },
    { id: 'pl_money_3', deckId: 'pl_money', en: 'oszczędzać', pt: 'economizar', exampleHtml: 'Chcę <b>oszczędzać</b> pieniądze.', examplePt: 'Eu quero economizar dinheiro.', pos: 'verb' },
    { id: 'pl_money_4', deckId: 'pl_money', en: 'przelew', pt: 'transferência', exampleHtml: 'To jest <b>przelew</b>.', examplePt: 'Essa é uma transferência.', pos: 'noun' },
    { id: 'pl_money_5', deckId: 'pl_money', en: 'waluta', pt: 'moeda (câmbio)', exampleHtml: 'Jaka to <b>waluta</b>?', examplePt: 'Que moeda é essa?', pos: 'noun' },
    { id: 'pl_money_6', deckId: 'pl_money', en: 'kurs wymiany', pt: 'taxa de câmbio', exampleHtml: 'Jaki jest <b>kurs wymiany</b>?', examplePt: 'Qual é a taxa de câmbio?', pos: 'phrase' },
    { id: 'pl_money_7', deckId: 'pl_money', en: 'bankomat', pt: 'caixa eletrônico', exampleHtml: 'Gdzie jest <b>bankomat</b>?', examplePt: 'Onde fica o caixa eletrônico?', pos: 'noun' },
    { id: 'pl_money_8', deckId: 'pl_money', en: 'płacić', pt: 'pagar', exampleHtml: 'Muszę <b>płacić</b> rachunki.', examplePt: 'Eu preciso pagar as contas.', pos: 'verb' },
    { id: 'pl_money_9', deckId: 'pl_money', en: 'płacę', pt: 'eu pago', exampleHtml: '<b>Płacę</b> kartą.', examplePt: 'Eu pago com cartão.', pos: 'verb' },
    { id: 'pl_money_10', deckId: 'pl_money', en: 'pin', pt: 'PIN', exampleHtml: 'To jest mój <b>PIN</b>.', examplePt: 'Esse é o meu PIN.', pos: 'noun' },
    { id: 'pl_money_11', deckId: 'pl_money', en: 'podatek', pt: 'imposto', exampleHtml: 'To jest <b>podatek</b>.', examplePt: 'Isso é um imposto.', pos: 'noun' },
    { id: 'pl_money_12', deckId: 'pl_money', en: 'pensja', pt: 'salário', exampleHtml: 'Moja <b>pensja</b> jest niska.', examplePt: 'Meu salário é baixo.', pos: 'noun' },
    { id: 'pl_money_13', deckId: 'pl_money', en: 'rata', pt: 'parcela', exampleHtml: 'Płacę <b>ratę</b> co miesiąc.', examplePt: 'Eu pago uma parcela todo mês.', pos: 'noun' },
  ],
}
