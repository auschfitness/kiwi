// src/content/pl/shopping.ts
import type { Deck } from '../../types'

export const PL_SHOPPING_DECK: Deck = {
  id: 'pl_shopping',
  name: 'Compras e mercado',
  emoji: '🛒',
  desc: 'Loja, preço, pagar, comprar',
  level: 2,
  cards: [
    { id: 'pl_shopping_0', deckId: 'pl_shopping', en: 'sklep', pt: 'loja', exampleHtml: 'Idę do <b>sklepu</b>.', examplePt: 'Eu vou à loja.', pos: 'noun' },
    { id: 'pl_shopping_1', deckId: 'pl_shopping', en: 'supermarket', pt: 'supermercado', exampleHtml: 'Idę do <b>supermarketu</b>.', examplePt: 'Eu vou ao supermercado.', pos: 'noun' },
    { id: 'pl_shopping_2', deckId: 'pl_shopping', en: 'pieniądze', pt: 'dinheiro', exampleHtml: 'To są moje <b>pieniądze</b>.', examplePt: 'Este é o meu dinheiro.', pos: 'noun' },
    { id: 'pl_shopping_3', deckId: 'pl_shopping', en: 'cena', pt: 'preço', exampleHtml: 'Jaka jest <b>cena</b>?', examplePt: 'Qual é o preço?', pos: 'noun' },
    { id: 'pl_shopping_4', deckId: 'pl_shopping', en: 'tani', pt: 'barato', exampleHtml: 'Ten sklep jest <b>tani</b>.', examplePt: 'Essa loja é barata.', pos: 'adj' },
    { id: 'pl_shopping_5', deckId: 'pl_shopping', en: 'drogi', pt: 'caro', exampleHtml: 'Ten produkt jest <b>drogi</b>.', examplePt: 'Esse produto é caro.', pos: 'adj' },
    { id: 'pl_shopping_6', deckId: 'pl_shopping', en: 'kupować', pt: 'comprar', exampleHtml: 'Lubię <b>kupować</b> ubrania.', examplePt: 'Eu gosto de comprar roupas.', pos: 'verb' },
    { id: 'pl_shopping_7', deckId: 'pl_shopping', en: 'kupuję', pt: 'eu compro', exampleHtml: '<b>Kupuję</b> chleb.', examplePt: 'Eu compro pão.', pos: 'verb' },
    { id: 'pl_shopping_8', deckId: 'pl_shopping', en: 'sprzedawać', pt: 'vender', exampleHtml: 'On chce <b>sprzedawać</b> samochody.', examplePt: 'Ele quer vender carros.', pos: 'verb' },
    { id: 'pl_shopping_9', deckId: 'pl_shopping', en: 'rachunek', pt: 'conta / recibo', exampleHtml: 'Proszę o <b>rachunek</b>.', examplePt: 'A conta, por favor.', pos: 'noun' },
    { id: 'pl_shopping_10', deckId: 'pl_shopping', en: 'gotówka', pt: 'dinheiro em espécie', exampleHtml: 'Mam <b>gotówkę</b>.', examplePt: 'Eu tenho dinheiro em espécie.', pos: 'noun' },
    { id: 'pl_shopping_11', deckId: 'pl_shopping', en: 'karta', pt: 'cartão', exampleHtml: 'Mam <b>kartę</b>.', examplePt: 'Eu tenho um cartão.', pos: 'noun' },
    { id: 'pl_shopping_12', deckId: 'pl_shopping', en: 'torba', pt: 'bolsa / sacola', exampleHtml: 'To jest moja <b>torba</b>.', examplePt: 'Essa é minha bolsa.', pos: 'noun' },
    { id: 'pl_shopping_13', deckId: 'pl_shopping', en: 'paragon', pt: 'recibo / nota fiscal', exampleHtml: 'Proszę o <b>paragon</b>.', examplePt: 'Por favor, me dê o recibo.', pos: 'noun' },
  ],
}
