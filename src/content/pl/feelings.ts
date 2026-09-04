import type { Deck } from '../../types'

export const PL_FEELINGS_DECK: Deck = {
  id: 'pl_feelings',
  name: 'Sentimentos e estados',
  emoji: '🙂',
  desc: 'Dizer como você está se sentindo',
  level: 1,
  cards: [
    { id: 'pl_feelings_0', deckId: 'pl_feelings', en: 'szczęśliwy', pt: 'feliz', exampleHtml: 'Jestem <b>szczęśliwy</b>.', examplePt: 'Eu estou feliz.', pos: 'adj' },
    { id: 'pl_feelings_1', deckId: 'pl_feelings', en: 'smutny', pt: 'triste', exampleHtml: 'On jest <b>smutny</b>.', examplePt: 'Ele está triste.', pos: 'adj' },
    { id: 'pl_feelings_2', deckId: 'pl_feelings', en: 'zmęczony', pt: 'cansado', exampleHtml: 'Jestem bardzo <b>zmęczony</b>.', examplePt: 'Eu estou muito cansado.', pos: 'adj' },
    { id: 'pl_feelings_3', deckId: 'pl_feelings', en: 'głodny', pt: 'com fome', exampleHtml: 'Jestem <b>głodny</b>.', examplePt: 'Eu estou com fome.', pos: 'adj' },
    { id: 'pl_feelings_4', deckId: 'pl_feelings', en: 'spragniony', pt: 'com sede', exampleHtml: 'Jestem <b>spragniony</b>.', examplePt: 'Eu estou com sede.', pos: 'adj' },
    // "zły" reaparece no baralho de cores/descrições com o sentido de "ruim" —
    // a mesma palavra cobre "bravo" e "ruim/errado" em polonês, dependendo do
    // contexto, e ambos os sentidos valem a pena ensinar.
    { id: 'pl_feelings_5', deckId: 'pl_feelings', en: 'zły', pt: 'bravo / zangado', exampleHtml: 'On jest <b>zły</b> na mnie.', examplePt: 'Ele está bravo comigo.', pos: 'adj' },
    { id: 'pl_feelings_6', deckId: 'pl_feelings', en: 'przestraszony', pt: 'assustado', exampleHtml: 'Byłem <b>przestraszony</b>.', examplePt: 'Eu estava assustado.', pos: 'adj' },
    { id: 'pl_feelings_7', deckId: 'pl_feelings', en: 'zaskoczony', pt: 'surpreso', exampleHtml: 'Jestem <b>zaskoczony</b>.', examplePt: 'Eu estou surpreso.', pos: 'adj' },
    { id: 'pl_feelings_8', deckId: 'pl_feelings', en: 'chory', pt: 'doente', exampleHtml: 'On jest <b>chory</b>.', examplePt: 'Ele está doente.', pos: 'adj' },
    { id: 'pl_feelings_9', deckId: 'pl_feelings', en: 'zdrowy', pt: 'saudável', exampleHtml: 'Czuję się <b>zdrowy</b>.', examplePt: 'Eu me sinto saudável.', pos: 'adj' },
    { id: 'pl_feelings_10', deckId: 'pl_feelings', en: 'zajęty', pt: 'ocupado', exampleHtml: 'Jestem teraz <b>zajęty</b>.', examplePt: 'Eu estou ocupado agora.', pos: 'adj' },
    { id: 'pl_feelings_11', deckId: 'pl_feelings', en: 'wolny', pt: 'livre', exampleHtml: 'Jestem <b>wolny</b> w piątek.', examplePt: 'Eu estou livre na sexta-feira.', pos: 'adj' },
    { id: 'pl_feelings_12', deckId: 'pl_feelings', en: 'dobrze', pt: 'bem', exampleHtml: 'Czuję się <b>dobrze</b>.', examplePt: 'Eu me sinto bem.', pos: 'word' },
    { id: 'pl_feelings_13', deckId: 'pl_feelings', en: 'źle', pt: 'mal', exampleHtml: 'Czuję się <b>źle</b>.', examplePt: 'Eu me sinto mal.', pos: 'word' },
  ],
}
