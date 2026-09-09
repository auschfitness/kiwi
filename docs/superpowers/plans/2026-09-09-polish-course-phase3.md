# Polish Course — Phase 3 (B1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Polish course with a full B1 vocabulary floor (116 cards across 8 new decks: money/banking, housing/renting, health, transport, work, small talk, Poland-specific administration, airport/immigration), continuing from Phase 1 (A1, 112 cards) and Phase 2 (A2, 122 cards), both already live.

**Architecture:** Identical to Phases 1 and 2 — new deck files under `src/content/pl/`, phonetics appended to `src/content/authored/phoneticsPl.ts`, both merged through `src/content/pl/index.ts`. No course-registration or engine changes.

**Tech Stack:** Same as prior phases — Vite + React 19 + TypeScript strict + Tailwind + Zustand, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-01-polish-course-design.md` (Phase 3 scope: ~100-150 B1 cards, including Poland-specific administrative/practical vocabulary — PESEL, address registration, etc.).
- **Level correction, read this before starting:** an earlier fix (commit `f162f85`, after Phase 2 shipped) moved Phase 2's decks from `level: 1` to `level: 2`, because `LEVEL_NAMES`/`LEVEL_TITLES` in `src/core/leveling.ts` are shared across every course and hardcode `1→'A1', 2→'A2', 3→'B1', 4→'B2'` in the Home screen UI — a course cannot put B-level content at a lower number without the UI mislabelling it. **This phase's 8 decks use `level: 3`.**
- New deck ids this phase: `pl_money`, `pl_housing`, `pl_health`, `pl_transport`, `pl_work`, `pl_smalltalk`, `pl_admin`, `pl_airport`.
- Every card needs: `id`, `deckId`, `en` (Polish word/phrase), `pt` (Portuguese translation), `exampleHtml` (must contain `<b>...</b>`), `examplePt`, `pos`, `phonetic`.
- Phonetics: apply the same convention table used in Phases 1-2 (`PHONETICS-CONVENTION.md` §9), including its documented "j overload" simplification (§9's "Limitação conhecida" section) — `j` doing double duty for the ż/rz sound and an inserted palatal glide is a known, accepted trade-off; don't invent a new symbol for it in this phase.
- `npx vitest run` and `npx tsc --noEmit` must be clean before any task is committed.
- Commit after every task.
- This phase, like Phases 1 and 2, ends with a mandatory content self-review task — the same accuracy safeguard, run again because 116 new words carry the same unverifiable-by-the-learner risk as before. Phase 2's version of this task found and fixed 17 issues out of 122 cards; treat a similar hit rate here as expected, not alarming.

---

### Task 1: `pl_money` deck — money & banking

**Files:**
- Create: `src/content/pl/money.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Produces: `PL_MONEY_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
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
```

- [ ] **Step 2: Append to the phonetics table**

Add before the closing `}` of `PHONETICS_PL` in `src/content/authored/phoneticsPl.ts`:

```typescript
  // ── pl_money · Dinheiro e banco ──────────────────────────────────────────
  pl_money_0: 'kóntó',
  pl_money_1: 'krédyt',
  pl_money_2: 'pójytchka',
  pl_money_3: 'óxtchendzać',
  pl_money_4: 'pjélév',
  pl_money_5: 'valuta',
  pl_money_6: 'kurs vymiany',
  pl_money_7: 'bankómat',
  pl_money_8: 'puaćić',
  pl_money_9: 'puatsen',
  pl_money_10: 'pin',
  pl_money_11: 'pódaték',
  pl_money_12: 'pénsia',
  pl_money_13: 'rata',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/money.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): money & banking deck (B1)"
```

---

### Task 2: `pl_housing` deck — housing & renting

**Files:**
- Create: `src/content/pl/housing.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_HOUSING_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/housing.ts
import type { Deck } from '../../types'

/**
 * "zameldowanie" (address registration) is the one genuinely Poland-specific
 * item in this deck — every long-term resident has to register their
 * address with the local office, a step with no real equivalent in the
 * other two courses' countries. Worth its own card rather than folding it
 * into "adres", since the concept (not just the word) is unfamiliar.
 */
export const PL_HOUSING_DECK: Deck = {
  id: 'pl_housing',
  name: 'Moradia e aluguel',
  emoji: '🔑',
  desc: 'Alugar, contrato, endereço, registro de residência',
  level: 3,
  cards: [
    { id: 'pl_housing_0', deckId: 'pl_housing', en: 'wynajem', pt: 'aluguel', exampleHtml: 'To jest <b>wynajem</b> mieszkania.', examplePt: 'Esse é o aluguel do apartamento.', pos: 'noun' },
    { id: 'pl_housing_1', deckId: 'pl_housing', en: 'wynajmować', pt: 'alugar', exampleHtml: 'Chcę <b>wynajmować</b> mieszkanie.', examplePt: 'Eu quero alugar um apartamento.', pos: 'verb' },
    { id: 'pl_housing_2', deckId: 'pl_housing', en: 'właściciel', pt: 'proprietário', exampleHtml: 'To jest <b>właściciel</b>.', examplePt: 'Esse é o proprietário.', pos: 'noun' },
    { id: 'pl_housing_3', deckId: 'pl_housing', en: 'najemca', pt: 'inquilino', exampleHtml: 'To jest <b>najemca</b>.', examplePt: 'Esse é o inquilino.', pos: 'noun' },
    { id: 'pl_housing_4', deckId: 'pl_housing', en: 'umowa', pt: 'contrato', exampleHtml: 'Podpisuję <b>umowę</b>.', examplePt: 'Eu estou assinando um contrato.', pos: 'noun' },
    { id: 'pl_housing_5', deckId: 'pl_housing', en: 'czynsz', pt: 'aluguel mensal', exampleHtml: 'Płacę <b>czynsz</b> co miesiąc.', examplePt: 'Eu pago o aluguel todo mês.', pos: 'noun' },
    { id: 'pl_housing_6', deckId: 'pl_housing', en: 'kaucja', pt: 'depósito caução', exampleHtml: 'To jest <b>kaucja</b>.', examplePt: 'Esse é o depósito caução.', pos: 'noun' },
    { id: 'pl_housing_7', deckId: 'pl_housing', en: 'zameldowanie', pt: 'registro de endereço', exampleHtml: 'To jest <b>zameldowanie</b>.', examplePt: 'Esse é o registro de endereço.', pos: 'noun' },
    { id: 'pl_housing_8', deckId: 'pl_housing', en: 'zameldować się', pt: 'se registrar (endereço)', exampleHtml: 'Muszę się <b>zameldować</b>.', examplePt: 'Eu preciso me registrar.', pos: 'phrase' },
    { id: 'pl_housing_9', deckId: 'pl_housing', en: 'adres', pt: 'endereço', exampleHtml: 'Jaki jest twój <b>adres</b>?', examplePt: 'Qual é o seu endereço?', pos: 'noun' },
    { id: 'pl_housing_10', deckId: 'pl_housing', en: 'mieszkać', pt: 'morar', exampleHtml: 'Chcę tu <b>mieszkać</b>.', examplePt: 'Eu quero morar aqui.', pos: 'verb' },
    { id: 'pl_housing_11', deckId: 'pl_housing', en: 'mieszkam', pt: 'eu moro', exampleHtml: '<b>Mieszkam</b> w Warszawie.', examplePt: 'Eu moro em Varsóvia.', pos: 'verb' },
    { id: 'pl_housing_12', deckId: 'pl_housing', en: 'sąsiad', pt: 'vizinho', exampleHtml: 'To jest mój <b>sąsiad</b>.', examplePt: 'Esse é meu vizinho.', pos: 'noun' },
    { id: 'pl_housing_13', deckId: 'pl_housing', en: 'winda', pt: 'elevador', exampleHtml: '<b>Winda</b> nie działa.', examplePt: 'O elevador não está funcionando.', pos: 'noun' },
    { id: 'pl_housing_14', deckId: 'pl_housing', en: 'piętro', pt: 'andar', exampleHtml: 'To jest moje <b>piętro</b>.', examplePt: 'Esse é meu andar.', pos: 'noun' },
    { id: 'pl_housing_15', deckId: 'pl_housing', en: 'remont', pt: 'reforma', exampleHtml: 'Robię <b>remont</b>.', examplePt: 'Eu estou fazendo uma reforma.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_housing · Moradia e aluguel ───────────────────────────────────────
  pl_housing_0: 'vynaiém',
  pl_housing_1: 'vynaimóvać',
  pl_housing_2: 'vuaśćićél',
  pl_housing_3: 'naiémtsa',
  pl_housing_4: 'umóva',
  pl_housing_5: 'tchynx',
  pl_housing_6: 'kautsia',
  pl_housing_7: 'zaméldóvańé',
  pl_housing_8: 'zaméldóvać śen',
  pl_housing_9: 'adrés',
  pl_housing_10: 'miéxkać',
  pl_housing_11: 'miéxkam',
  pl_housing_12: 'sońśad',
  pl_housing_13: 'vinda',
  pl_housing_14: 'pjentró',
  pl_housing_15: 'rémónt',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/housing.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): housing & renting deck (B1)"
```

---

### Task 3: `pl_health` deck — health, doctor & pharmacy

**Files:**
- Create: `src/content/pl/health.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_HEALTH_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
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
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_health · Saúde, médico e farmácia ─────────────────────────────────
  pl_health_0: 'pjyrródńa',
  pl_health_1: 'rétsépta',
  pl_health_2: 'lék',
  pl_health_3: 'aptéka',
  pl_health_4: 'górontchka',
  pl_health_5: 'kaxél',
  pl_health_6: 'katar',
  pl_health_7: 'bul guóvy',
  pl_health_8: 'ubézpiétchéńé',
  pl_health_9: 'xtchépiéńé',
  pl_health_10: 'zastjyk',
  pl_health_11: 'piélengńarka',
  pl_health_12: 'déntysta',
  pl_health_13: 'ókulista',
  pl_health_14: 'rétséptsia',
  pl_health_15: 'zdróvié',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/health.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): health, doctor & pharmacy deck (B1)"
```

---

### Task 4: `pl_transport` deck — getting around

**Files:**
- Create: `src/content/pl/transport.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_TRANSPORT_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
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
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_transport · Transporte ────────────────────────────────────────────
  pl_transport_0: 'bilét',
  pl_transport_1: 'pérón',
  pl_transport_2: 'rózkuad iazdy',
  pl_transport_3: 'pjystanék',
  pl_transport_4: 'taksuvka',
  pl_transport_5: 'róvér',
  pl_transport_6: 'samórrud',
  pl_transport_7: 'právó iazdy',
  pl_transport_8: 'statsia bénzynóva',
  pl_transport_9: 'kórék',
  pl_transport_10: 'iérrać',
  pl_transport_11: 'iaden',
  pl_transport_12: 'pjéśadka',
  pl_transport_13: 'ópuźńéńé',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/transport.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): transport deck (B1)"
```

---

### Task 5: `pl_work` deck — work & job

**Files:**
- Create: `src/content/pl/work.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_WORK_DECK: Deck`.

**Note:** `src/content/es/work.ts` already exists for the Spanish course (unrelated file, different deck id `es_work`) — this task creates a NEW file `src/content/pl/work.ts`, not a modification of the Spanish one.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/work.ts
import type { Deck } from '../../types'

export const PL_WORK_DECK: Deck = {
  id: 'pl_work',
  name: 'Trabalho',
  emoji: '💼',
  desc: 'Emprego, escritório, contrato',
  level: 3,
  cards: [
    { id: 'pl_work_0', deckId: 'pl_work', en: 'praca', pt: 'trabalho / emprego', exampleHtml: 'Idę do <b>pracy</b>.', examplePt: 'Eu vou para o trabalho.', pos: 'noun' },
    { id: 'pl_work_1', deckId: 'pl_work', en: 'pracownik', pt: 'funcionário', exampleHtml: 'To jest <b>pracownik</b>.', examplePt: 'Esse é um funcionário.', pos: 'noun' },
    { id: 'pl_work_2', deckId: 'pl_work', en: 'szef', pt: 'chefe', exampleHtml: 'Mój <b>szef</b> jest miły.', examplePt: 'Meu chefe é gentil.', pos: 'noun' },
    { id: 'pl_work_3', deckId: 'pl_work', en: 'kolega z pracy', pt: 'colega de trabalho', exampleHtml: 'To jest mój <b>kolega z pracy</b>.', examplePt: 'Esse é meu colega de trabalho.', pos: 'phrase' },
    { id: 'pl_work_4', deckId: 'pl_work', en: 'biuro', pt: 'escritório', exampleHtml: 'To jest moje <b>biuro</b>.', examplePt: 'Esse é meu escritório.', pos: 'noun' },
    { id: 'pl_work_5', deckId: 'pl_work', en: 'spotkanie', pt: 'reunião', exampleHtml: 'To jest <b>spotkanie</b>.', examplePt: 'Essa é uma reunião.', pos: 'noun' },
    { id: 'pl_work_6', deckId: 'pl_work', en: 'umowa o pracę', pt: 'contrato de trabalho', exampleHtml: 'To jest <b>umowa o pracę</b>.', examplePt: 'Esse é o contrato de trabalho.', pos: 'phrase' },
    { id: 'pl_work_7', deckId: 'pl_work', en: 'wynagrodzenie', pt: 'remuneração', exampleHtml: 'To jest moje <b>wynagrodzenie</b>.', examplePt: 'Essa é a minha remuneração.', pos: 'noun' },
    { id: 'pl_work_8', deckId: 'pl_work', en: 'urlop', pt: 'férias', exampleHtml: 'To jest mój <b>urlop</b>.', examplePt: 'Essas são minhas férias.', pos: 'noun' },
    { id: 'pl_work_9', deckId: 'pl_work', en: 'zwolnienie lekarskie', pt: 'atestado médico', exampleHtml: 'Mam <b>zwolnienie lekarskie</b>.', examplePt: 'Eu tenho um atestado médico.', pos: 'phrase' },
    { id: 'pl_work_10', deckId: 'pl_work', en: 'awans', pt: 'promoção', exampleHtml: 'To jest <b>awans</b>.', examplePt: 'Essa é uma promoção.', pos: 'noun' },
    { id: 'pl_work_11', deckId: 'pl_work', en: 'CV', pt: 'currículo', exampleHtml: 'Wysyłam moje <b>CV</b>.', examplePt: 'Eu estou enviando meu currículo.', pos: 'noun' },
    { id: 'pl_work_12', deckId: 'pl_work', en: 'rozmowa kwalifikacyjna', pt: 'entrevista de emprego', exampleHtml: 'Mam <b>rozmowę kwalifikacyjną</b>.', examplePt: 'Eu tenho uma entrevista de emprego.', pos: 'phrase' },
    { id: 'pl_work_13', deckId: 'pl_work', en: 'pracodawca', pt: 'empregador', exampleHtml: 'To jest mój <b>pracodawca</b>.', examplePt: 'Esse é meu empregador.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_work · Trabalho ────────────────────────────────────────────────────
  pl_work_0: 'pratsa',
  pl_work_1: 'pratsóvnik',
  pl_work_2: 'xéf',
  pl_work_3: 'kóléga z pratsy',
  pl_work_4: 'biuró',
  pl_work_5: 'spótkańé',
  pl_work_6: 'umóva o pratsen',
  pl_work_7: 'vynagródzéńé',
  pl_work_8: 'urlóp',
  pl_work_9: 'zvólńéńé lékarskié',
  pl_work_10: 'avans',
  pl_work_11: 'si vi',
  pl_work_12: 'rózmóva kvalifikatsyina',
  pl_work_13: 'pratsódavtsa',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/work.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): work & job deck (B1)"
```

---

### Task 6: `pl_smalltalk` deck — small talk & social

**Files:**
- Create: `src/content/pl/smalltalk.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_SMALLTALK_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/smalltalk.ts
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
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_smalltalk · Conversa social ───────────────────────────────────────
  pl_smalltalk_0: 'tsó suyrrać?',
  pl_smalltalk_1: 'davnó śen ńé vidźéliśmy',
  pl_smalltalk_2: 'skond iéstéś?',
  pl_smalltalk_3: 'ilé max lat?',
  pl_smalltalk_4: 'gdźé miéxkax?',
  pl_smalltalk_5: 'tchym śen zaimuiéx?',
  pl_smalltalk_6: 'miuó byuó ćen póznać',
  pl_smalltalk_7: 'muśimy śen spótkać',
  pl_smalltalk_8: 'tjymai śen',
  pl_smalltalk_9: 'pózdruv ródzinen',
  pl_smalltalk_10: 'tsó u ćébié?',
  pl_smalltalk_11: 'vxystkiégó nailépxégó',
  pl_smalltalk_12: 'jytchen póvódzéńa',
  pl_smalltalk_13: 'dó usuyxéńa',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/smalltalk.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): small talk & social deck (B1)"
```

---

### Task 7: `pl_admin` deck — Polish bureaucracy

**Files:**
- Create: `src/content/pl/admin.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_ADMIN_DECK: Deck`.

**Context:** This is the deliberately Poland-specific deck the design spec called for — vocabulary that has no real equivalent to translate from in the English or Spanish courses, because it's about Polish civil administration specifically (the PESEL number, the local office, residence cards).

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/admin.ts
import type { Deck } from '../../types'

/**
 * The Poland-specific deck the design doc asked for — PESEL, urząd,
 * residence cards. Nothing here has a real equivalent in the English or
 * Spanish courses; someone who actually moves needs this vocabulary
 * regardless of how good their general Polish gets.
 */
export const PL_ADMIN_DECK: Deck = {
  id: 'pl_admin',
  name: 'Burocracia polonesa',
  emoji: '🗂️',
  desc: 'PESEL, repartições, documentos',
  level: 3,
  cards: [
    { id: 'pl_admin_0', deckId: 'pl_admin', en: 'PESEL', pt: 'número de identificação pessoal (PESEL)', exampleHtml: 'Jaki jest twój numer <b>PESEL</b>?', examplePt: 'Qual é o seu número PESEL?', pos: 'noun' },
    { id: 'pl_admin_1', deckId: 'pl_admin', en: 'urząd', pt: 'repartição pública', exampleHtml: 'Idę do <b>urzędu</b>.', examplePt: 'Eu vou à repartição pública.', pos: 'noun' },
    { id: 'pl_admin_2', deckId: 'pl_admin', en: 'urząd miasta', pt: 'prefeitura', exampleHtml: '<b>Urząd miasta</b> jest zamknięty.', examplePt: 'A prefeitura está fechada.', pos: 'phrase' },
    { id: 'pl_admin_3', deckId: 'pl_admin', en: 'karta pobytu', pt: 'cartão de residência', exampleHtml: 'Mam <b>kartę pobytu</b>.', examplePt: 'Eu tenho um cartão de residência.', pos: 'phrase' },
    { id: 'pl_admin_4', deckId: 'pl_admin', en: 'wiza', pt: 'visto', exampleHtml: 'To jest moja <b>wiza</b>.', examplePt: 'Esse é meu visto.', pos: 'noun' },
    { id: 'pl_admin_5', deckId: 'pl_admin', en: 'obywatelstwo', pt: 'cidadania', exampleHtml: 'Mam polskie <b>obywatelstwo</b>.', examplePt: 'Eu tenho cidadania polonesa.', pos: 'noun' },
    { id: 'pl_admin_6', deckId: 'pl_admin', en: 'dowód osobisty', pt: 'carteira de identidade', exampleHtml: 'To jest mój <b>dowód osobisty</b>.', examplePt: 'Essa é minha carteira de identidade.', pos: 'phrase' },
    { id: 'pl_admin_7', deckId: 'pl_admin', en: 'paszport', pt: 'passaporte', exampleHtml: 'To jest mój <b>paszport</b>.', examplePt: 'Esse é meu passaporte.', pos: 'noun' },
    { id: 'pl_admin_8', deckId: 'pl_admin', en: 'wniosek', pt: 'requerimento', exampleHtml: 'Składam <b>wniosek</b>.', examplePt: 'Eu estou entregando o requerimento.', pos: 'noun' },
    { id: 'pl_admin_9', deckId: 'pl_admin', en: 'podpis', pt: 'assinatura', exampleHtml: 'To jest mój <b>podpis</b>.', examplePt: 'Essa é minha assinatura.', pos: 'noun' },
    { id: 'pl_admin_10', deckId: 'pl_admin', en: 'pieczątka', pt: 'carimbo', exampleHtml: 'To jest <b>pieczątka</b>.', examplePt: 'Esse é o carimbo.', pos: 'noun' },
    { id: 'pl_admin_11', deckId: 'pl_admin', en: 'kolejka', pt: 'fila', exampleHtml: 'Jest długa <b>kolejka</b>.', examplePt: 'Tem uma fila longa.', pos: 'noun' },
    { id: 'pl_admin_12', deckId: 'pl_admin', en: 'numerek', pt: 'senha (numerada, de atendimento)', exampleHtml: 'Mam <b>numerek</b> trzynaście.', examplePt: 'Eu tenho a senha treze.', pos: 'noun' },
    { id: 'pl_admin_13', deckId: 'pl_admin', en: 'formularz', pt: 'formulário', exampleHtml: 'Wypełniam <b>formularz</b>.', examplePt: 'Eu estou preenchendo o formulário.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_admin · Burocracia polonesa ───────────────────────────────────────
  pl_admin_0: 'pésél',
  pl_admin_1: 'ujond',
  pl_admin_2: 'ujond miasta',
  pl_admin_3: 'karta póbytu',
  pl_admin_4: 'viza',
  pl_admin_5: 'óbyvatélstvó',
  pl_admin_6: 'dóvud ósóbisty',
  pl_admin_7: 'paxpórt',
  pl_admin_8: 'vńósék',
  pl_admin_9: 'pódpis',
  pl_admin_10: 'piétchontka',
  pl_admin_11: 'kóléika',
  pl_admin_12: 'numérék',
  pl_admin_13: 'fórmularj',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/admin.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): Polish bureaucracy deck (B1)"
```

---

### Task 8: `pl_airport` deck — airport & immigration

**Files:**
- Create: `src/content/pl/airport.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_AIRPORT_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/airport.ts
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
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_airport · Aeroporto e imigração ───────────────────────────────────
  pl_airport_0: 'bagaj',
  pl_airport_1: 'ódprava',
  pl_airport_2: 'bramka',
  pl_airport_3: 'lót',
  pl_airport_4: 'ópuźńóny',
  pl_airport_5: 'pjylót',
  pl_airport_6: 'ódlót',
  pl_airport_7: 'kóntróla bézpiétchéństva',
  pl_airport_8: 'tsélnik',
  pl_airport_9: 'grańitsa',
  pl_airport_10: 'viazd',
  pl_airport_11: 'vyiazd',
  pl_airport_12: 'zatjymać śen',
  pl_airport_13: 'valizka',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/airport.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): airport & immigration deck (B1)"
```

---

### Task 9: Wire the 8 new decks into `PL_DECKS`

**Files:**
- Modify: `src/content/pl/index.ts`
- Modify: `src/content/pl/pl.test.ts`

**Interfaces:**
- Consumes: `PL_MONEY_DECK, PL_HOUSING_DECK, PL_HEALTH_DECK, PL_TRANSPORT_DECK, PL_WORK_DECK, PL_SMALLTALK_DECK, PL_ADMIN_DECK, PL_AIRPORT_DECK` (Tasks 1–8).
- Produces: `PL_DECKS: Deck[]` now holding all 24 decks (8 A1 + 8 A2 + 8 B1), consumed automatically by `src/courses/index.ts`'s existing `decks: PL_DECKS`.

- [ ] **Step 1: Write the failing tests**

In `src/content/pl/pl.test.ts`, change:

```typescript
  it('ships an A1+A2 floor worth studying', () => {
    expect(PL_CARDS.length).toBeGreaterThanOrEqual(220)
  })

  it('has grown past Phase 1 alone — 16 decks now, not 8', () => {
    expect(PL_DECKS.length).toBeGreaterThanOrEqual(16)
  })
```

to:

```typescript
  it('ships an A1+A2+B1 floor worth studying', () => {
    expect(PL_CARDS.length).toBeGreaterThanOrEqual(340)
  })

  it('has grown past Phase 2 alone — 24 decks now, not 16', () => {
    expect(PL_DECKS.length).toBeGreaterThanOrEqual(24)
  })
```

And change the level-mapping test:

```typescript
  it('puts A1 decks at level 1 and A2 decks at level 2, matching the CEFR labels the UI actually shows', () => {
    const A1_DECK_IDS = new Set([
      'pl_hello', 'pl_numbers', 'pl_verbs', 'pl_people',
      'pl_emergency', 'pl_feelings', 'pl_questions', 'pl_basics',
    ])
    for (const deck of PL_DECKS) {
      expect(deck.level, deck.id).toBe(A1_DECK_IDS.has(deck.id) ? 1 : 2)
    }
  })
```

to:

```typescript
  it('puts each deck at the level matching the CEFR label the UI actually shows for it', () => {
    const LEVEL_BY_DECK: Record<string, number> = {
      pl_hello: 1, pl_numbers: 1, pl_verbs: 1, pl_people: 1,
      pl_emergency: 1, pl_feelings: 1, pl_questions: 1, pl_basics: 1,
      pl_food: 2, pl_shopping: 2, pl_house: 2, pl_clothes: 2,
      pl_body: 2, pl_town: 2, pl_verbs2: 2, pl_power: 2,
      pl_money: 3, pl_housing: 3, pl_health: 3, pl_transport: 3,
      pl_work: 3, pl_smalltalk: 3, pl_admin: 3, pl_airport: 3,
    }
    for (const deck of PL_DECKS) {
      expect(deck.level, deck.id).toBe(LEVEL_BY_DECK[deck.id])
    }
  })
```

(Every other test in the file — unique ids, deck ownership, `<b>` presence, sentence ratio, phonetic presence — already generalizes to the full corpus with no change needed.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: FAIL — `PL_CARDS.length` is still 234 (< 340), `PL_DECKS.length` is still 16 (< 24), and `LEVEL_BY_DECK` has no entries for decks that don't exist in `PL_DECKS` yet (the level-mapping test will fail differently — on `expect(deck.level, deck.id).toBe(undefined)` never triggering since the loop is over existing decks, which are all still correct; this specific test may in fact still PASS at this step since it only checks decks that already exist. That's fine — Step 4 below confirms all 24, including the 8 new ones, once wired).

- [ ] **Step 3: Update `src/content/pl/index.ts`**

Add the 8 new imports alongside the existing 16:

```typescript
import { PL_MONEY_DECK } from './money'
import { PL_HOUSING_DECK } from './housing'
import { PL_HEALTH_DECK } from './health'
import { PL_TRANSPORT_DECK } from './transport'
import { PL_WORK_DECK } from './work'
import { PL_SMALLTALK_DECK } from './smalltalk'
import { PL_ADMIN_DECK } from './admin'
import { PL_AIRPORT_DECK } from './airport'
```

Extend `RAW_DECKS` with these 8 at the end (after the existing 16):

```typescript
  PL_MONEY_DECK,
  PL_HOUSING_DECK,
  PL_HEALTH_DECK,
  PL_TRANSPORT_DECK,
  PL_WORK_DECK,
  PL_SMALLTALK_DECK,
  PL_ADMIN_DECK,
  PL_AIRPORT_DECK,
```

Everything else in the file is unchanged.

- [ ] **Step 4: Run the tests again to verify they pass**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: PASS — all tests green, card count 350 (234 + 116), deck count 24.

- [ ] **Step 5: Run the full suite and the type-checker**

Run: `npx vitest run`
Expected: PASS, no regressions.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/content/pl/index.ts src/content/pl/pl.test.ts
git commit -m "feat(pl): wire the B1 decks into PL_DECKS"
```

---

### Task 10: Content self-review pass

**Context:** Same safeguard as Phases 1 and 2, run again for this phase's 116 new cards. Lucas still cannot proofread Polish himself. Phase 2's version of this task found and fixed 17 issues out of 122 cards — treat a similar hit rate here as the expected baseline, not a sign anything went wrong.

**Files:**
- Modify: any of `src/content/pl/{money,housing,health,transport,work,smalltalk,admin,airport}.ts`, `src/content/authored/phoneticsPl.ts` — only where Step 1 finds a real discrepancy.

**Interfaces:** None.

- [ ] **Step 1: Cross-check every word against an independent source**

For each of the 116 cards across the 8 files listed above: look up the Polish word/phrase (via `WebSearch`/`WebFetch` against Wiktionary, `pl.pons.com`, or similar) and confirm the `pt` meaning, the claimed grammatical form, and every diacritic. Give extra scrutiny to `pl_admin` — it's the deck with the least everyday-vocabulary overlap with a general dictionary (PESEL, karta pobytu, urząd miasta are administrative terms, not conversational ones) — and to the phrase-heavy decks (`pl_smalltalk`, several `pl_work`/`pl_housing`/`pl_transport` cards) where a wrong case or aspect is easy to miss. Concentrate real effort on words you're not confident about, spot-check the rest, and be honest in the report about which is which.

- [ ] **Step 2: Re-derive every phonetic entry from the convention table**

Re-read `PHONETICS-CONVENTION.md` §9 (including its "Limitação conhecida" note on the accepted `j`-overload simplification — don't try to fix that in this pass, it's a documented, deliberate trade-off) and re-apply the rules word by word to this phase's 116 entries in `phoneticsPl.ts`, cross-referencing Phases 1-2's already-corrected entries for precedent on anything the table doesn't spell out explicitly. Fix any mismatch.

- [ ] **Step 3: Check the example sentences read as natural, grammatically real Polish**

Several sentences in this phase were deliberately written with nominative-heavy "To jest mój/moja/moje X" templates to dodge case-agreement risk (the same mitigation used in Phases 1-2). Confirm they still read naturally and reword any that don't, keeping the same target word/phrase bolded in the same place.

- [ ] **Step 4: Run the suite after any fixes**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

If nothing needed fixing, skip the commit and say so plainly in the report. Otherwise:

```bash
git add src/content/pl/
git commit -m "fix(pl): Phase 3 content self-review corrections"
```

---

### Task 11: Full verification

**Files:** None — verification only.

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: every test passes, including all of `pl.test.ts` (350 cards, 24 decks).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Browser verification**

**Important — a prior phase's verification wasted real time on this:** if verifying from a git worktree, `preview_start`'s named launch config can resolve against the wrong checkout (the main repo instead of the worktree) with no error — it will silently serve stale content. Before trusting what the browser shows, confirm which directory is actually being served, e.g. `fetch('/src/content/pl/index.ts').then(r=>r.text())` from the page and check it mentions this phase's new decks. If it doesn't, stop the wrong server and start Vite directly from the worktree (`nohup npx vite --port <unused> --strictPort &`, then `disown`) rather than fighting the launch-config resolution.

Once pointed at the right server: seed `localStorage.setItem('english-nz.course', 'pl-pl')`, onboard (or reload if already onboarded), reload. Confirm via `get_page_text` / `read_page`:
- Home shows three level groups: "🌱 A1 — Beginner" (8 decks), "🌿 A2 — Elementary" (8 decks, locked until A1 is 80% done), and "🌳 B1 — Intermediate" (this phase's 8 decks, locked until A2 is 80% done).
- Opening one of the new decks (e.g. "Dinheiro e banco") shows a card with the right word, phonetic, translation, and example.
- No new console errors.

- [ ] **Step 4: Report**

Summarize what shipped (deck count, card count now 350, commits) and note that Phase 4 (B2 + practice features) is next whenever the owner wants it, per the design doc.
