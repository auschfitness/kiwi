// src/content/pl/emergency.ts
import type { Deck } from '../../types'

export const PL_EMERGENCY_DECK: Deck = {
  id: 'pl_emergency',
  name: 'Emergências e ajuda',
  emoji: '🚨',
  desc: 'Pedir ajuda e nomear os serviços de emergência',
  level: 1,
  cards: [
    { id: 'pl_emergency_0', deckId: 'pl_emergency', en: 'pomocy!', pt: 'socorro!', exampleHtml: '<b>Pomocy</b>! Niech ktoś mi pomoże!', examplePt: 'Socorro! Alguém me ajude!', pos: 'noun' },
    { id: 'pl_emergency_1', deckId: 'pl_emergency', en: 'pomoc', pt: 'ajuda', exampleHtml: 'Dziękuję za <b>pomoc</b>.', examplePt: 'Obrigado pela ajuda.', pos: 'noun' },
    { id: 'pl_emergency_2', deckId: 'pl_emergency', en: 'policja', pt: 'polícia', exampleHtml: '<b>Policja</b> już jedzie.', examplePt: 'A polícia já está a caminho.', pos: 'noun' },
    { id: 'pl_emergency_3', deckId: 'pl_emergency', en: 'szpital', pt: 'hospital', exampleHtml: '<b>Szpital</b> jest niedaleko.', examplePt: 'O hospital fica perto.', pos: 'noun' },
    { id: 'pl_emergency_4', deckId: 'pl_emergency', en: 'lekarz', pt: 'médico', exampleHtml: '<b>Lekarz</b> mnie zbadał.', examplePt: 'O médico me examinou.', pos: 'noun' },
    { id: 'pl_emergency_5', deckId: 'pl_emergency', en: 'karetka', pt: 'ambulância', exampleHtml: '<b>Karetka</b> już jedzie.', examplePt: 'A ambulância já está a caminho.', pos: 'noun' },
    { id: 'pl_emergency_6', deckId: 'pl_emergency', en: 'pożar', pt: 'incêndio', exampleHtml: 'W budynku wybuchł <b>pożar</b>.', examplePt: 'Um incêndio começou no prédio.', pos: 'noun' },
    { id: 'pl_emergency_7', deckId: 'pl_emergency', en: 'niebezpieczeństwo', pt: 'perigo', exampleHtml: 'To duże <b>niebezpieczeństwo</b>.', examplePt: 'Isso é um grande perigo.', pos: 'noun' },
    { id: 'pl_emergency_8', deckId: 'pl_emergency', en: 'zgubiłem się', pt: 'eu me perdi', exampleHtml: '<b>Zgubiłem się</b> w mieście.', examplePt: 'Eu me perdi na cidade.', pos: 'phrase' },
    { id: 'pl_emergency_9', deckId: 'pl_emergency', en: 'potrzebuję pomocy', pt: 'eu preciso de ajuda', exampleHtml: '<b>Potrzebuję pomocy</b>, proszę.', examplePt: 'Eu preciso de ajuda, por favor.', pos: 'phrase' },
    { id: 'pl_emergency_10', deckId: 'pl_emergency', en: 'zadzwoń po pomoc', pt: 'chame ajuda', exampleHtml: '<b>Zadzwoń po pomoc</b> natychmiast.', examplePt: 'Chame ajuda imediatamente.', pos: 'phrase' },
    { id: 'pl_emergency_11', deckId: 'pl_emergency', en: 'jestem chory', pt: 'estou doente', exampleHtml: '<b>Jestem chory</b>, potrzebuję lekarza.', examplePt: 'Estou doente, preciso de um médico.', pos: 'phrase' },
  ],
}
