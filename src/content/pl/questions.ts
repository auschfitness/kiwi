import type { Deck } from '../../types'

export const PL_QUESTIONS_DECK: Deck = {
  id: 'pl_questions',
  name: 'Perguntas e conectivos',
  emoji: '❓',
  desc: 'O quê, quem, onde, quando, por quê — e como ligar frases',
  level: 1,
  cards: [
    { id: 'pl_questions_0', deckId: 'pl_questions', en: 'co', pt: 'o quê', exampleHtml: '<b>Co</b> to jest?', examplePt: 'O que é isso?', pos: 'word' },
    { id: 'pl_questions_1', deckId: 'pl_questions', en: 'kto', pt: 'quem', exampleHtml: '<b>Kto</b> to jest?', examplePt: 'Quem é?', pos: 'word' },
    { id: 'pl_questions_2', deckId: 'pl_questions', en: 'gdzie', pt: 'onde', exampleHtml: '<b>Gdzie</b> jest łazienka?', examplePt: 'Onde fica o banheiro?', pos: 'word' },
    { id: 'pl_questions_3', deckId: 'pl_questions', en: 'kiedy', pt: 'quando', exampleHtml: '<b>Kiedy</b> zaczynamy?', examplePt: 'Quando a gente começa?', pos: 'word' },
    { id: 'pl_questions_4', deckId: 'pl_questions', en: 'dlaczego', pt: 'por quê', exampleHtml: '<b>Dlaczego</b> jesteś smutny?', examplePt: 'Por que você está triste?', pos: 'word' },
    { id: 'pl_questions_5', deckId: 'pl_questions', en: 'jak', pt: 'como', exampleHtml: '<b>Jak</b> to działa?', examplePt: 'Como isso funciona?', pos: 'word' },
    { id: 'pl_questions_6', deckId: 'pl_questions', en: 'ile', pt: 'quanto', exampleHtml: '<b>Ile</b> to kosztuje?', examplePt: 'Quanto custa isso?', pos: 'word' },
    { id: 'pl_questions_7', deckId: 'pl_questions', en: 'który', pt: 'qual', exampleHtml: '<b>Który</b> to jest?', examplePt: 'Qual é esse?', pos: 'word' },
    { id: 'pl_questions_8', deckId: 'pl_questions', en: 'i', pt: 'e', exampleHtml: 'Ty <b>i</b> ja.', examplePt: 'Você e eu.', pos: 'grammar' },
    { id: 'pl_questions_9', deckId: 'pl_questions', en: 'ale', pt: 'mas', exampleHtml: 'Chcę iść, <b>ale</b> jestem zmęczony.', examplePt: 'Eu quero ir, mas estou cansado.', pos: 'grammar' },
    { id: 'pl_questions_10', deckId: 'pl_questions', en: 'albo', pt: 'ou', exampleHtml: 'Herbata <b>albo</b> kawa?', examplePt: 'Chá ou café?', pos: 'grammar' },
    { id: 'pl_questions_11', deckId: 'pl_questions', en: 'bo', pt: 'porque', exampleHtml: 'Zostaję, <b>bo</b> pada deszcz.', examplePt: 'Eu fico, porque está chovendo.', pos: 'grammar' },
  ],
}
