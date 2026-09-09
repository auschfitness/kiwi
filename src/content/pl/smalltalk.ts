import type { Deck } from '../../types'

/**
 * Whole conversational phrases rather than single words — same role as
 * `pl_power` in Phase 2, one level up: these are the exchanges that come up
 * once he's making small talk with people, not just surviving transactions.
 */
export const PL_SMALLTALK_DECK: Deck = {
  id: 'pl_smalltalk',
  name: 'Conversa social',
  emoji: '🗣️',
  desc: 'Bater papo, se despedir, desejar coisas boas',
  level: 3,
  cards: [
    { id: 'pl_smalltalk_0', deckId: 'pl_smalltalk', en: 'co słychać?', pt: 'o que tá rolando?', exampleHtml: 'Cześć, <b>co słychać</b>?', examplePt: 'Oi, o que tá rolando?', pos: 'phrase' },
    { id: 'pl_smalltalk_1', deckId: 'pl_smalltalk', en: 'dawno się nie widzieliśmy', pt: 'há quanto tempo não nos vemos', exampleHtml: '<b>Dawno się nie widzieliśmy</b>!', examplePt: 'Há quanto tempo não nos vemos!', pos: 'phrase' },
    { id: 'pl_smalltalk_2', deckId: 'pl_smalltalk', en: 'skąd jesteś?', pt: 'de onde você é?', exampleHtml: '<b>Skąd jesteś</b>?', examplePt: 'De onde você é?', pos: 'phrase' },
    { id: 'pl_smalltalk_3', deckId: 'pl_smalltalk', en: 'ile masz lat?', pt: 'quantos anos você tem?', exampleHtml: '<b>Ile masz lat</b>?', examplePt: 'Quantos anos você tem?', pos: 'phrase' },
    { id: 'pl_smalltalk_4', deckId: 'pl_smalltalk', en: 'gdzie mieszkasz?', pt: 'onde você mora?', exampleHtml: '<b>Gdzie</b> teraz <b>mieszkasz</b>?', examplePt: 'Onde você mora agora?', pos: 'phrase' },
    { id: 'pl_smalltalk_5', deckId: 'pl_smalltalk', en: 'czym się zajmujesz?', pt: 'o que você faz (profissão)?', exampleHtml: 'A <b>czym się zajmujesz</b>?', examplePt: 'E o que você faz (profissão)?', pos: 'phrase' },
    { id: 'pl_smalltalk_6', deckId: 'pl_smalltalk', en: 'miło było cię poznać', pt: 'foi bom te conhecer', exampleHtml: '<b>Miło było cię poznać</b>.', examplePt: 'Foi bom te conhecer.', pos: 'phrase' },
    { id: 'pl_smalltalk_7', deckId: 'pl_smalltalk', en: 'musimy się spotkać', pt: 'precisamos nos encontrar', exampleHtml: '<b>Musimy się</b> kiedyś <b>spotkać</b>.', examplePt: 'Precisamos nos encontrar algum dia.', pos: 'phrase' },
    { id: 'pl_smalltalk_8', deckId: 'pl_smalltalk', en: 'trzymaj się', pt: 'se cuida', exampleHtml: '<b>Trzymaj się</b>, do zobaczenia.', examplePt: 'Se cuida, até logo.', pos: 'phrase' },
    { id: 'pl_smalltalk_9', deckId: 'pl_smalltalk', en: 'pozdrów rodzinę', pt: 'manda lembranças à família', exampleHtml: '<b>Pozdrów rodzinę</b> ode mnie.', examplePt: 'Manda lembranças à família por mim.', pos: 'phrase' },
    { id: 'pl_smalltalk_10', deckId: 'pl_smalltalk', en: 'co u ciebie?', pt: 'e você, como vai?', exampleHtml: 'A <b>co u ciebie</b>?', examplePt: 'E aí, como vai você?', pos: 'phrase' },
    { id: 'pl_smalltalk_11', deckId: 'pl_smalltalk', en: 'wszystkiego najlepszego', pt: 'tudo de bom (parabéns)', exampleHtml: '<b>Wszystkiego najlepszego</b> z okazji urodzin!', examplePt: 'Tudo de bom no seu aniversário!', pos: 'phrase' },
    { id: 'pl_smalltalk_12', deckId: 'pl_smalltalk', en: 'życzę powodzenia', pt: 'desejo boa sorte', exampleHtml: '<b>Życzę powodzenia</b> na egzaminie.', examplePt: 'Desejo boa sorte na prova.', pos: 'phrase' },
    { id: 'pl_smalltalk_13', deckId: 'pl_smalltalk', en: 'do usłyszenia', pt: 'até a próxima (ao telefone)', exampleHtml: '<b>Do usłyszenia</b> jutro.', examplePt: 'Até amanhã (ao telefone).', pos: 'phrase' },
  ],
}
