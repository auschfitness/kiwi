import type { Deck } from '../../types'

export const PL_AIRPORT_DECK: Deck = {
  id: 'pl_airport',
  name: 'Aeroporto e imigração',
  emoji: '✈️',
  desc: 'Check-in, bagagem, fronteira',
  level: 3,
  cards: [
    { id: 'pl_airport_0', deckId: 'pl_airport', en: 'bagaż', pt: 'bagagem', exampleHtml: 'To jest mój <b>bagaż</b>.', examplePt: 'Essa é minha bagagem.', pos: 'noun' },
    { id: 'pl_airport_1', deckId: 'pl_airport', en: 'odprawa', pt: 'check-in', exampleHtml: 'Idę na <b>odprawę</b>.', examplePt: 'Eu vou fazer o check-in.', pos: 'noun' },
    { id: 'pl_airport_2', deckId: 'pl_airport', en: 'bramka', pt: 'portão de embarque', exampleHtml: 'To jest <b>bramka</b>.', examplePt: 'Esse é o portão de embarque.', pos: 'noun' },
    { id: 'pl_airport_3', deckId: 'pl_airport', en: 'lot', pt: 'voo', exampleHtml: 'Mój <b>lot</b> jest opóźniony.', examplePt: 'Meu voo está atrasado.', pos: 'noun' },
    { id: 'pl_airport_4', deckId: 'pl_airport', en: 'opóźniony', pt: 'atrasado', exampleHtml: 'Ten lot jest <b>opóźniony</b>.', examplePt: 'Esse voo está atrasado.', pos: 'adj' },
    { id: 'pl_airport_5', deckId: 'pl_airport', en: 'przylot', pt: 'chegada (do voo)', exampleHtml: 'To jest <b>przylot</b>.', examplePt: 'Essa é a chegada do voo.', pos: 'noun' },
    { id: 'pl_airport_6', deckId: 'pl_airport', en: 'odlot', pt: 'partida (do voo)', exampleHtml: 'To jest <b>odlot</b>.', examplePt: 'Essa é a partida do voo.', pos: 'noun' },
    { id: 'pl_airport_7', deckId: 'pl_airport', en: 'kontrola bezpieczeństwa', pt: 'controle de segurança', exampleHtml: 'To jest <b>kontrola bezpieczeństwa</b>.', examplePt: 'Esse é o controle de segurança.', pos: 'phrase' },
    { id: 'pl_airport_8', deckId: 'pl_airport', en: 'celnik', pt: 'fiscal aduaneiro', exampleHtml: '<b>Celnik</b> sprawdza paszport.', examplePt: 'O fiscal aduaneiro está checando o passaporte.', pos: 'noun' },
    { id: 'pl_airport_9', deckId: 'pl_airport', en: 'granica', pt: 'fronteira', exampleHtml: 'To jest <b>granica</b>.', examplePt: 'Essa é a fronteira.', pos: 'noun' },
    { id: 'pl_airport_10', deckId: 'pl_airport', en: 'wjazd', pt: 'entrada (imigração)', exampleHtml: 'To jest <b>wjazd</b>.', examplePt: 'Essa é a entrada.', pos: 'noun' },
    { id: 'pl_airport_11', deckId: 'pl_airport', en: 'wyjazd', pt: 'saída (imigração)', exampleHtml: 'To jest <b>wyjazd</b>.', examplePt: 'Essa é a saída.', pos: 'noun' },
    { id: 'pl_airport_12', deckId: 'pl_airport', en: 'zatrzymać się', pt: 'se hospedar', exampleHtml: 'Chcę się <b>zatrzymać</b> w hotelu.', examplePt: 'Eu quero me hospedar em um hotel.', pos: 'verb' },
    { id: 'pl_airport_13', deckId: 'pl_airport', en: 'walizka', pt: 'mala', exampleHtml: 'To jest moja <b>walizka</b>.', examplePt: 'Essa é minha mala.', pos: 'noun' },
  ],
}
