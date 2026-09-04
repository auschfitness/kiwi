// src/content/pl/greetings.ts
import type { Deck } from '../../types'

/**
 * The floor of the course — greetings, courtesy, the six phrases every
 * conversation opens or closes with. Lucas has never seen a word of Polish,
 * so unlike the Spanish course, nothing here assumes anything is already
 * known.
 */
export const PL_HELLO_DECK: Deck = {
  id: 'pl_hello',
  name: 'Primeiras palavras',
  emoji: '👋',
  desc: 'Cumprimentar, se apresentar, ser educado',
  level: 1,
  cards: [
    { id: 'pl_hello_0', deckId: 'pl_hello', en: 'cześć', pt: 'oi / olá', exampleHtml: '<b>Cześć</b>, jak się masz?', examplePt: 'Oi, como você está?', pos: 'greeting' },
    { id: 'pl_hello_1', deckId: 'pl_hello', en: 'dzień dobry', pt: 'bom dia / boa tarde', exampleHtml: '<b>Dzień dobry</b>, pani doktor.', examplePt: 'Bom dia, doutora.', pos: 'greeting' },
    { id: 'pl_hello_2', deckId: 'pl_hello', en: 'dobry wieczór', pt: 'boa noite (ao chegar)', exampleHtml: '<b>Dobry wieczór</b>, jak minął dzień?', examplePt: 'Boa noite, como foi o dia?', pos: 'greeting' },
    { id: 'pl_hello_3', deckId: 'pl_hello', en: 'dobranoc', pt: 'boa noite (ao dormir)', exampleHtml: '<b>Dobranoc</b>, śpij dobrze.', examplePt: 'Boa noite, durma bem.', pos: 'greeting' },
    { id: 'pl_hello_4', deckId: 'pl_hello', en: 'do widzenia', pt: 'tchau / adeus (formal)', exampleHtml: '<b>Do widzenia</b>, do jutra.', examplePt: 'Adeus, até amanhã.', pos: 'greeting' },
    { id: 'pl_hello_5', deckId: 'pl_hello', en: 'pa', pt: 'tchau (informal)', exampleHtml: '<b>Pa</b>, do zobaczenia!', examplePt: 'Tchau, até a próxima!', pos: 'greeting' },
    { id: 'pl_hello_6', deckId: 'pl_hello', en: 'proszę', pt: 'por favor / de nada', exampleHtml: '<b>Proszę</b>, usiądź.', examplePt: 'Por favor, sente-se.', pos: 'greeting' },
    { id: 'pl_hello_7', deckId: 'pl_hello', en: 'dziękuję', pt: 'obrigado', exampleHtml: '<b>Dziękuję</b> bardzo za pomoc.', examplePt: 'Muito obrigado pela ajuda.', pos: 'greeting' },
    { id: 'pl_hello_8', deckId: 'pl_hello', en: 'przepraszam', pt: 'desculpa / com licença', exampleHtml: '<b>Przepraszam</b>, gdzie jest dworzec?', examplePt: 'Com licença, onde fica a estação?', pos: 'greeting' },
    { id: 'pl_hello_9', deckId: 'pl_hello', en: 'tak', pt: 'sim', exampleHtml: '<b>Tak</b>, oczywiście.', examplePt: 'Sim, claro.', pos: 'word' },
    { id: 'pl_hello_10', deckId: 'pl_hello', en: 'nie', pt: 'não', exampleHtml: '<b>Nie</b>, dziękuję.', examplePt: 'Não, obrigado.', pos: 'word' },
    { id: 'pl_hello_11', deckId: 'pl_hello', en: 'jak się masz?', pt: 'como você está?', exampleHtml: '<b>Jak się masz</b> dzisiaj?', examplePt: 'Como você está hoje?', pos: 'phrase' },
    { id: 'pl_hello_12', deckId: 'pl_hello', en: 'miło mi', pt: 'prazer (em conhecer)', exampleHtml: '<b>Miło mi</b> cię poznać.', examplePt: 'Prazer em te conhecer.', pos: 'phrase' },
    { id: 'pl_hello_13', deckId: 'pl_hello', en: 'nazywam się', pt: 'meu nome é', exampleHtml: '<b>Nazywam się</b> Lucas.', examplePt: 'Meu nome é Lucas.', pos: 'phrase' },
  ],
}
