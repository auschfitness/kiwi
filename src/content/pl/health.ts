// src/content/pl/health.ts
import type { Deck } from '../../types'

export const PL_HEALTH_DECK: Deck = {
  id: 'pl_health',
  name: 'Saúde, médico e farmácia',
  emoji: '⚕️',
  desc: 'Sintomas, consultas e remédios',
  level: 3,
  cards: [
    { id: 'pl_health_0', deckId: 'pl_health', en: 'przychodnia', pt: 'clínica', exampleHtml: 'Idę do <b>przychodni</b>.', examplePt: 'Eu vou à clínica.', pos: 'noun' },
    { id: 'pl_health_1', deckId: 'pl_health', en: 'recepta', pt: 'receita médica', exampleHtml: 'To jest <b>recepta</b>.', examplePt: 'Essa é a receita médica.', pos: 'noun' },
    { id: 'pl_health_2', deckId: 'pl_health', en: 'lek', pt: 'remédio', exampleHtml: 'Biorę <b>lek</b> codziennie.', examplePt: 'Eu tomo remédio todo dia.', pos: 'noun' },
    { id: 'pl_health_3', deckId: 'pl_health', en: 'apteka', pt: 'farmácia', exampleHtml: 'Idę do <b>apteki</b>.', examplePt: 'Eu vou à farmácia.', pos: 'noun' },
    { id: 'pl_health_4', deckId: 'pl_health', en: 'gorączka', pt: 'febre', exampleHtml: 'Mam <b>gorączkę</b>.', examplePt: 'Eu estou com febre.', pos: 'noun' },
    { id: 'pl_health_5', deckId: 'pl_health', en: 'kaszel', pt: 'tosse', exampleHtml: 'Mam <b>kaszel</b>.', examplePt: 'Eu estou com tosse.', pos: 'noun' },
    { id: 'pl_health_6', deckId: 'pl_health', en: 'katar', pt: 'coriza', exampleHtml: 'Mam <b>katar</b>.', examplePt: 'Eu estou resfriado (com coriza).', pos: 'noun' },
    { id: 'pl_health_7', deckId: 'pl_health', en: 'ból głowy', pt: 'dor de cabeça', exampleHtml: 'Mam <b>ból głowy</b>.', examplePt: 'Eu estou com dor de cabeça.', pos: 'phrase' },
    { id: 'pl_health_8', deckId: 'pl_health', en: 'ubezpieczenie', pt: 'seguro', exampleHtml: 'Mam <b>ubezpieczenie</b>.', examplePt: 'Eu tenho seguro.', pos: 'noun' },
    { id: 'pl_health_9', deckId: 'pl_health', en: 'szczepienie', pt: 'vacina', exampleHtml: 'To jest <b>szczepienie</b>.', examplePt: 'Essa é a vacina.', pos: 'noun' },
    { id: 'pl_health_10', deckId: 'pl_health', en: 'zastrzyk', pt: 'injeção', exampleHtml: 'To jest <b>zastrzyk</b>.', examplePt: 'Essa é a injeção.', pos: 'noun' },
    { id: 'pl_health_11', deckId: 'pl_health', en: 'pielęgniarka', pt: 'enfermeira', exampleHtml: 'To jest <b>pielęgniarka</b>.', examplePt: 'Essa é a enfermeira.', pos: 'noun' },
    { id: 'pl_health_12', deckId: 'pl_health', en: 'dentysta', pt: 'dentista', exampleHtml: 'Idę do <b>dentysty</b>.', examplePt: 'Eu vou ao dentista.', pos: 'noun' },
    { id: 'pl_health_13', deckId: 'pl_health', en: 'okulista', pt: 'oftalmologista', exampleHtml: 'Idę do <b>okulisty</b>.', examplePt: 'Eu vou ao oftalmologista.', pos: 'noun' },
    { id: 'pl_health_14', deckId: 'pl_health', en: 'recepcja', pt: 'recepção', exampleHtml: 'To jest <b>recepcja</b>.', examplePt: 'Essa é a recepção.', pos: 'noun' },
    { id: 'pl_health_15', deckId: 'pl_health', en: 'zdrowie', pt: 'saúde', exampleHtml: 'Dbam o <b>zdrowie</b>.', examplePt: 'Eu cuido da saúde.', pos: 'noun' },
  ],
}
