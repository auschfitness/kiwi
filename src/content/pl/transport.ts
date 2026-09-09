// src/content/pl/transport.ts
import type { Deck } from '../../types'

export const PL_TRANSPORT_DECK: Deck = {
  id: 'pl_transport',
  name: 'Transporte',
  emoji: '🚗',
  desc: 'Bilhetes, carro, ônibus, trem',
  level: 3,
  cards: [
    { id: 'pl_transport_0', deckId: 'pl_transport', en: 'bilet', pt: 'bilhete / passagem', exampleHtml: 'Kupuję <b>bilet</b>.', examplePt: 'Eu estou comprando uma passagem.', pos: 'noun' },
    { id: 'pl_transport_1', deckId: 'pl_transport', en: 'peron', pt: 'plataforma', exampleHtml: 'To jest <b>peron</b>.', examplePt: 'Essa é a plataforma.', pos: 'noun' },
    { id: 'pl_transport_2', deckId: 'pl_transport', en: 'rozkład jazdy', pt: 'horário (de transporte)', exampleHtml: 'Sprawdzam <b>rozkład jazdy</b>.', examplePt: 'Eu estou checando o horário.', pos: 'phrase' },
    { id: 'pl_transport_3', deckId: 'pl_transport', en: 'przystanek', pt: 'ponto de ônibus', exampleHtml: 'To jest <b>przystanek</b> autobusowy.', examplePt: 'Esse é o ponto de ônibus.', pos: 'noun' },
    { id: 'pl_transport_4', deckId: 'pl_transport', en: 'taksówka', pt: 'táxi', exampleHtml: 'Zamawiam <b>taksówkę</b>.', examplePt: 'Eu estou chamando um táxi.', pos: 'noun' },
    { id: 'pl_transport_5', deckId: 'pl_transport', en: 'rower', pt: 'bicicleta', exampleHtml: 'To jest mój <b>rower</b>.', examplePt: 'Essa é minha bicicleta.', pos: 'noun' },
    { id: 'pl_transport_6', deckId: 'pl_transport', en: 'samochód', pt: 'carro', exampleHtml: 'To jest mój <b>samochód</b>.', examplePt: 'Esse é meu carro.', pos: 'noun' },
    { id: 'pl_transport_7', deckId: 'pl_transport', en: 'prawo jazdy', pt: 'carteira de motorista', exampleHtml: 'Mam <b>prawo jazdy</b>.', examplePt: 'Eu tenho carteira de motorista.', pos: 'phrase' },
    { id: 'pl_transport_8', deckId: 'pl_transport', en: 'stacja benzynowa', pt: 'posto de gasolina', exampleHtml: 'To jest <b>stacja benzynowa</b>.', examplePt: 'Esse é o posto de gasolina.', pos: 'phrase' },
    { id: 'pl_transport_9', deckId: 'pl_transport', en: 'korek', pt: 'engarrafamento', exampleHtml: 'Jest duży <b>korek</b>.', examplePt: 'Tem um grande engarrafamento.', pos: 'noun' },
    { id: 'pl_transport_10', deckId: 'pl_transport', en: 'jechać', pt: 'ir (de veículo)', exampleHtml: 'Muszę <b>jechać</b> do pracy.', examplePt: 'Eu preciso ir para o trabalho (de carro).', pos: 'verb' },
    { id: 'pl_transport_11', deckId: 'pl_transport', en: 'jadę', pt: 'eu vou (de veículo)', exampleHtml: '<b>Jadę</b> do domu.', examplePt: 'Eu estou indo para casa.', pos: 'verb' },
    { id: 'pl_transport_12', deckId: 'pl_transport', en: 'przesiadka', pt: 'conexão / baldeação', exampleHtml: 'Mam <b>przesiadkę</b> w Warszawie.', examplePt: 'Eu tenho uma conexão em Varsóvia.', pos: 'noun' },
    { id: 'pl_transport_13', deckId: 'pl_transport', en: 'opóźnienie', pt: 'atraso', exampleHtml: 'Jest duże <b>opóźnienie</b>.', examplePt: 'Tem um grande atraso.', pos: 'noun' },
  ],
}
