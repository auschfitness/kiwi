# Polish Course — Phase 2 (A2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Polish course with a full A2 vocabulary floor (122 cards across 8 new hand-authored decks: food, shopping, house, clothes/weather, body, town, more verbs, frequent phrases), continuing directly from Phase 1 (A1, 112 cards, already live).

**Architecture:** Identical to Phase 1's — new deck files under `src/content/pl/`, phonetics appended to the existing `src/content/authored/phoneticsPl.ts`, both merged through the existing `src/content/pl/index.ts`. No course-registration or engine changes: `Course.decks: PL_DECKS` already points at that array, so it grows automatically. No new phonetics rules: this phase reuses the convention already documented in `PHONETICS-CONVENTION.md` §9 and the precedent already set in Phase 1's 112 entries.

**Tech Stack:** Same as Phase 1 — Vite + React 19 + TypeScript strict + Tailwind + Zustand, Vitest.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-01-polish-course-design.md` (Phase 2 scope: ~100-130 A2 cards).
- Prior work: `docs/superpowers/plans/2026-09-01-polish-course-phase1.md` — read `src/content/authored/phoneticsPl.ts` and any one Phase 1 deck file (e.g. `src/content/pl/greetings.ts`) before starting, to see the established shape and phonetic precedent this phase must match.
- New deck ids this phase: `pl_food`, `pl_shopping`, `pl_house`, `pl_clothes`, `pl_body`, `pl_town`, `pl_verbs2`, `pl_power`. All `level: 1` still — Phase 2 content is still A1/A2 floor material studied alongside Phase 1's, not gated behind a new level (the app's `Level` type only distinguishes 4 broad tiers, not CEFR sub-levels 1:1; Phase 3/4 will use `level: 2+`).
- Every card needs: `id`, `deckId`, `en` (Polish word/phrase), `pt` (Portuguese translation), `exampleHtml` (must contain `<b>...</b>`), `examplePt`, `pos`, `phonetic`.
- `npx vitest run` and `npx tsc --noEmit` must be clean before any task is committed.
- Commit after every task.
- This phase, like Phase 1, ends with a mandatory content self-review task (Task 10) — the same accuracy safeguard, run again because 122 new words carry the same unverifiable-by-the-learner risk as the first 112 did.

---

### Task 1: `pl_food` deck — food & restaurant

**Files:**
- Create: `src/content/pl/food.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Produces: `PL_FOOD_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/food.ts
import type { Deck } from '../../types'

export const PL_FOOD_DECK: Deck = {
  id: 'pl_food',
  name: 'Comida e restaurante',
  emoji: '🍽️',
  desc: 'Comidas e bebidas do dia a dia, café da manhã, almoço, jantar',
  level: 1,
  cards: [
    { id: 'pl_food_0', deckId: 'pl_food', en: 'chleb', pt: 'pão', exampleHtml: 'Lubię <b>chleb</b>.', examplePt: 'Eu gosto de pão.', pos: 'noun' },
    { id: 'pl_food_1', deckId: 'pl_food', en: 'woda', pt: 'água', exampleHtml: '<b>Woda</b> jest zimna.', examplePt: 'A água está fria.', pos: 'noun' },
    { id: 'pl_food_2', deckId: 'pl_food', en: 'kawa', pt: 'café', exampleHtml: 'Piję <b>kawę</b> rano.', examplePt: 'Eu bebo café de manhã.', pos: 'noun' },
    { id: 'pl_food_3', deckId: 'pl_food', en: 'herbata', pt: 'chá', exampleHtml: '<b>Herbata</b> jest gorąca.', examplePt: 'O chá está quente.', pos: 'noun' },
    { id: 'pl_food_4', deckId: 'pl_food', en: 'mleko', pt: 'leite', exampleHtml: 'Piję <b>mleko</b> codziennie.', examplePt: 'Eu bebo leite todo dia.', pos: 'noun' },
    { id: 'pl_food_5', deckId: 'pl_food', en: 'jajko', pt: 'ovo', exampleHtml: 'Jem <b>jajko</b> na śniadanie.', examplePt: 'Eu como ovo no café da manhã.', pos: 'noun' },
    { id: 'pl_food_6', deckId: 'pl_food', en: 'ser', pt: 'queijo', exampleHtml: 'Lubię <b>ser</b>.', examplePt: 'Eu gosto de queijo.', pos: 'noun' },
    { id: 'pl_food_7', deckId: 'pl_food', en: 'mięso', pt: 'carne', exampleHtml: 'To jest <b>mięso</b>.', examplePt: 'Isso é carne.', pos: 'noun' },
    { id: 'pl_food_8', deckId: 'pl_food', en: 'ryba', pt: 'peixe', exampleHtml: '<b>Ryba</b> jest świeża.', examplePt: 'O peixe está fresco.', pos: 'noun' },
    { id: 'pl_food_9', deckId: 'pl_food', en: 'warzywa', pt: 'vegetais', exampleHtml: 'Lubię <b>warzywa</b>.', examplePt: 'Eu gosto de vegetais.', pos: 'noun' },
    { id: 'pl_food_10', deckId: 'pl_food', en: 'owoce', pt: 'frutas', exampleHtml: 'Lubię <b>owoce</b>.', examplePt: 'Eu gosto de frutas.', pos: 'noun' },
    { id: 'pl_food_11', deckId: 'pl_food', en: 'cukier', pt: 'açúcar', exampleHtml: 'To jest <b>cukier</b>.', examplePt: 'Isso é açúcar.', pos: 'noun' },
    { id: 'pl_food_12', deckId: 'pl_food', en: 'sól', pt: 'sal', exampleHtml: 'Proszę o <b>sól</b>.', examplePt: 'Por favor, me passe o sal.', pos: 'noun' },
    { id: 'pl_food_13', deckId: 'pl_food', en: 'śniadanie', pt: 'café da manhã', exampleHtml: 'Jem <b>śniadanie</b>.', examplePt: 'Eu como o café da manhã.', pos: 'noun' },
    { id: 'pl_food_14', deckId: 'pl_food', en: 'obiad', pt: 'almoço', exampleHtml: 'Jem <b>obiad</b>.', examplePt: 'Eu almoço.', pos: 'noun' },
    { id: 'pl_food_15', deckId: 'pl_food', en: 'kolacja', pt: 'jantar', exampleHtml: '<b>Kolacja</b> jest gotowa.', examplePt: 'O jantar está pronto.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

Add before the closing `}` of `PHONETICS_PL` in `src/content/authored/phoneticsPl.ts`:

```typescript
  // ── pl_food · Comida e restaurante ───────────────────────────────────────
  pl_food_0: 'rrléb',
  pl_food_1: 'vóda',
  pl_food_2: 'kava',
  pl_food_3: 'rrérbata',
  pl_food_4: 'mlékó',
  pl_food_5: 'iaaikó',
  pl_food_6: 'sér',
  pl_food_7: 'mjensó',
  pl_food_8: 'ryba',
  pl_food_9: 'vajyva',
  pl_food_10: 'óvótsé',
  pl_food_11: 'tsukiér',
  pl_food_12: 'sul',
  pl_food_13: 'śńadańé',
  pl_food_14: 'óbiad',
  pl_food_15: 'kólatsia',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/food.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): food & restaurant deck (A2)"
```

---

### Task 2: `pl_shopping` deck — shopping & the supermarket

**Files:**
- Create: `src/content/pl/shopping.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_SHOPPING_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/shopping.ts
import type { Deck } from '../../types'

export const PL_SHOPPING_DECK: Deck = {
  id: 'pl_shopping',
  name: 'Compras e mercado',
  emoji: '🛒',
  desc: 'Loja, preço, pagar, comprar',
  level: 1,
  cards: [
    { id: 'pl_shopping_0', deckId: 'pl_shopping', en: 'sklep', pt: 'loja', exampleHtml: 'Idę do <b>sklepu</b>.', examplePt: 'Eu vou à loja.', pos: 'noun' },
    { id: 'pl_shopping_1', deckId: 'pl_shopping', en: 'supermarket', pt: 'supermercado', exampleHtml: 'Idę do <b>supermarketu</b>.', examplePt: 'Eu vou ao supermercado.', pos: 'noun' },
    { id: 'pl_shopping_2', deckId: 'pl_shopping', en: 'pieniądze', pt: 'dinheiro', exampleHtml: 'To są moje <b>pieniądze</b>.', examplePt: 'Este é o meu dinheiro.', pos: 'noun' },
    { id: 'pl_shopping_3', deckId: 'pl_shopping', en: 'cena', pt: 'preço', exampleHtml: 'Jaka jest <b>cena</b>?', examplePt: 'Qual é o preço?', pos: 'noun' },
    { id: 'pl_shopping_4', deckId: 'pl_shopping', en: 'tani', pt: 'barato', exampleHtml: 'Ten sklep jest <b>tani</b>.', examplePt: 'Essa loja é barata.', pos: 'adj' },
    { id: 'pl_shopping_5', deckId: 'pl_shopping', en: 'drogi', pt: 'caro', exampleHtml: 'Ten produkt jest <b>drogi</b>.', examplePt: 'Esse produto é caro.', pos: 'adj' },
    { id: 'pl_shopping_6', deckId: 'pl_shopping', en: 'kupować', pt: 'comprar', exampleHtml: 'Lubię <b>kupować</b> ubrania.', examplePt: 'Eu gosto de comprar roupas.', pos: 'verb' },
    { id: 'pl_shopping_7', deckId: 'pl_shopping', en: 'kupuję', pt: 'eu compro', exampleHtml: '<b>Kupuję</b> chleb.', examplePt: 'Eu compro pão.', pos: 'verb' },
    { id: 'pl_shopping_8', deckId: 'pl_shopping', en: 'sprzedawać', pt: 'vender', exampleHtml: 'On chce <b>sprzedawać</b> dom.', examplePt: 'Ele quer vender a casa.', pos: 'verb' },
    { id: 'pl_shopping_9', deckId: 'pl_shopping', en: 'rachunek', pt: 'conta / recibo', exampleHtml: 'Proszę o <b>rachunek</b>.', examplePt: 'A conta, por favor.', pos: 'noun' },
    { id: 'pl_shopping_10', deckId: 'pl_shopping', en: 'gotówka', pt: 'dinheiro em espécie', exampleHtml: 'Mam <b>gotówkę</b>.', examplePt: 'Eu tenho dinheiro em espécie.', pos: 'noun' },
    { id: 'pl_shopping_11', deckId: 'pl_shopping', en: 'karta', pt: 'cartão', exampleHtml: 'Mam <b>kartę</b>.', examplePt: 'Eu tenho um cartão.', pos: 'noun' },
    { id: 'pl_shopping_12', deckId: 'pl_shopping', en: 'torba', pt: 'bolsa / sacola', exampleHtml: 'To jest moja <b>torba</b>.', examplePt: 'Essa é minha bolsa.', pos: 'noun' },
    { id: 'pl_shopping_13', deckId: 'pl_shopping', en: 'paragon', pt: 'recibo / nota fiscal', exampleHtml: 'Proszę o <b>paragon</b>.', examplePt: 'Por favor, me dê o recibo.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_shopping · Compras e mercado ──────────────────────────────────────
  pl_shopping_0: 'sklép',
  pl_shopping_1: 'supérmárket',
  pl_shopping_2: 'piéńondzé',
  pl_shopping_3: 'tséna',
  pl_shopping_4: 'tańi',
  pl_shopping_5: 'drógi',
  pl_shopping_6: 'kupóvać',
  pl_shopping_7: 'kupuién',
  pl_shopping_8: 'spjédavać',
  pl_shopping_9: 'rarrunék',
  pl_shopping_10: 'gótuvka',
  pl_shopping_11: 'karta',
  pl_shopping_12: 'tórba',
  pl_shopping_13: 'paragón',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/shopping.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): shopping & supermarket deck (A2)"
```

---

### Task 3: `pl_house` deck — the house

**Files:**
- Create: `src/content/pl/house.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_HOUSE_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/house.ts
import type { Deck } from '../../types'

export const PL_HOUSE_DECK: Deck = {
  id: 'pl_house',
  name: 'Casa',
  emoji: '🏠',
  desc: 'Cômodos, móveis e objetos da casa',
  level: 1,
  cards: [
    { id: 'pl_house_0', deckId: 'pl_house', en: 'dom', pt: 'casa', exampleHtml: 'To jest mój <b>dom</b>.', examplePt: 'Essa é minha casa.', pos: 'noun' },
    { id: 'pl_house_1', deckId: 'pl_house', en: 'mieszkanie', pt: 'apartamento', exampleHtml: 'To jest moje <b>mieszkanie</b>.', examplePt: 'Esse é meu apartamento.', pos: 'noun' },
    { id: 'pl_house_2', deckId: 'pl_house', en: 'pokój', pt: 'quarto / cômodo', exampleHtml: 'To jest mój <b>pokój</b>.', examplePt: 'Esse é meu quarto.', pos: 'noun' },
    { id: 'pl_house_3', deckId: 'pl_house', en: 'kuchnia', pt: 'cozinha', exampleHtml: '<b>Kuchnia</b> jest duża.', examplePt: 'A cozinha é grande.', pos: 'noun' },
    { id: 'pl_house_4', deckId: 'pl_house', en: 'łazienka', pt: 'banheiro', exampleHtml: 'Gdzie jest <b>łazienka</b>?', examplePt: 'Onde fica o banheiro?', pos: 'noun' },
    { id: 'pl_house_5', deckId: 'pl_house', en: 'sypialnia', pt: 'quarto de dormir', exampleHtml: 'To jest <b>sypialnia</b>.', examplePt: 'Esse é o quarto de dormir.', pos: 'noun' },
    { id: 'pl_house_6', deckId: 'pl_house', en: 'salon', pt: 'sala de estar', exampleHtml: 'To jest <b>salon</b>.', examplePt: 'Essa é a sala de estar.', pos: 'noun' },
    { id: 'pl_house_7', deckId: 'pl_house', en: 'drzwi', pt: 'porta', exampleHtml: '<b>Drzwi</b> są otwarte.', examplePt: 'A porta está aberta.', pos: 'noun' },
    { id: 'pl_house_8', deckId: 'pl_house', en: 'okno', pt: 'janela', exampleHtml: '<b>Okno</b> jest otwarte.', examplePt: 'A janela está aberta.', pos: 'noun' },
    { id: 'pl_house_9', deckId: 'pl_house', en: 'stół', pt: 'mesa', exampleHtml: 'To jest <b>stół</b>.', examplePt: 'Essa é a mesa.', pos: 'noun' },
    { id: 'pl_house_10', deckId: 'pl_house', en: 'krzesło', pt: 'cadeira', exampleHtml: 'To jest <b>krzesło</b>.', examplePt: 'Essa é a cadeira.', pos: 'noun' },
    { id: 'pl_house_11', deckId: 'pl_house', en: 'łóżko', pt: 'cama', exampleHtml: 'To jest moje <b>łóżko</b>.', examplePt: 'Essa é minha cama.', pos: 'noun' },
    { id: 'pl_house_12', deckId: 'pl_house', en: 'klucz', pt: 'chave', exampleHtml: 'Gdzie jest <b>klucz</b>?', examplePt: 'Onde está a chave?', pos: 'noun' },
    { id: 'pl_house_13', deckId: 'pl_house', en: 'światło', pt: 'luz', exampleHtml: 'Włącz <b>światło</b>.', examplePt: 'Acenda a luz.', pos: 'noun' },
    { id: 'pl_house_14', deckId: 'pl_house', en: 'czysty', pt: 'limpo', exampleHtml: 'Ten pokój jest <b>czysty</b>.', examplePt: 'Esse quarto está limpo.', pos: 'adj' },
    { id: 'pl_house_15', deckId: 'pl_house', en: 'brudny', pt: 'sujo', exampleHtml: 'Ten pokój jest <b>brudny</b>.', examplePt: 'Esse quarto está sujo.', pos: 'adj' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_house · Casa ───────────────────────────────────────────────────────
  pl_house_0: 'dóm',
  pl_house_1: 'miéxkańé',
  pl_house_2: 'pókui',
  pl_house_3: 'kurrńa',
  pl_house_4: 'uaźénka',
  pl_house_5: 'sypialńa',
  pl_house_6: 'salón',
  pl_house_7: 'djvi',
  pl_house_8: 'ókno',
  pl_house_9: 'stuu',
  pl_house_10: 'kjésuo',
  pl_house_11: 'uujkó',
  pl_house_12: 'klutch',
  pl_house_13: 'śviatuo',
  pl_house_14: 'tchysty',
  pl_house_15: 'brudny',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/house.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): house deck (A2)"
```

---

### Task 4: `pl_clothes` deck — clothes & weather

**Files:**
- Create: `src/content/pl/clothes.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_CLOTHES_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/clothes.ts
import type { Deck } from '../../types'

export const PL_CLOTHES_DECK: Deck = {
  id: 'pl_clothes',
  name: 'Roupas e clima',
  emoji: '🧥',
  desc: 'O que vestir e como está o tempo',
  level: 1,
  cards: [
    { id: 'pl_clothes_0', deckId: 'pl_clothes', en: 'ubranie', pt: 'roupa', exampleHtml: 'To jest moje <b>ubranie</b>.', examplePt: 'Essa é minha roupa.', pos: 'noun' },
    { id: 'pl_clothes_1', deckId: 'pl_clothes', en: 'koszula', pt: 'camisa', exampleHtml: 'To jest moja <b>koszula</b>.', examplePt: 'Essa é minha camisa.', pos: 'noun' },
    { id: 'pl_clothes_2', deckId: 'pl_clothes', en: 'spodnie', pt: 'calça', exampleHtml: 'To są moje <b>spodnie</b>.', examplePt: 'Essa é minha calça.', pos: 'noun' },
    { id: 'pl_clothes_3', deckId: 'pl_clothes', en: 'sukienka', pt: 'vestido', exampleHtml: 'To jest moja <b>sukienka</b>.', examplePt: 'Esse é meu vestido.', pos: 'noun' },
    { id: 'pl_clothes_4', deckId: 'pl_clothes', en: 'buty', pt: 'sapatos', exampleHtml: 'To są moje <b>buty</b>.', examplePt: 'Esses são meus sapatos.', pos: 'noun' },
    { id: 'pl_clothes_5', deckId: 'pl_clothes', en: 'kurtka', pt: 'jaqueta', exampleHtml: 'To jest moja <b>kurtka</b>.', examplePt: 'Essa é minha jaqueta.', pos: 'noun' },
    { id: 'pl_clothes_6', deckId: 'pl_clothes', en: 'czapka', pt: 'gorro / boné', exampleHtml: 'To jest moja <b>czapka</b>.', examplePt: 'Esse é meu gorro.', pos: 'noun' },
    { id: 'pl_clothes_7', deckId: 'pl_clothes', en: 'pogoda', pt: 'clima', exampleHtml: '<b>Pogoda</b> jest ładna.', examplePt: 'O clima está bonito.', pos: 'noun' },
    { id: 'pl_clothes_8', deckId: 'pl_clothes', en: 'słońce', pt: 'sol', exampleHtml: '<b>Słońce</b> świeci.', examplePt: 'O sol está brilhando.', pos: 'noun' },
    { id: 'pl_clothes_9', deckId: 'pl_clothes', en: 'deszcz', pt: 'chuva', exampleHtml: 'Pada <b>deszcz</b>.', examplePt: 'Está chovendo.', pos: 'noun' },
    { id: 'pl_clothes_10', deckId: 'pl_clothes', en: 'śnieg', pt: 'neve', exampleHtml: 'Pada <b>śnieg</b>.', examplePt: 'Está nevando.', pos: 'noun' },
    { id: 'pl_clothes_11', deckId: 'pl_clothes', en: 'wiatr', pt: 'vento', exampleHtml: 'Jest silny <b>wiatr</b>.', examplePt: 'Está ventando forte.', pos: 'noun' },
    { id: 'pl_clothes_12', deckId: 'pl_clothes', en: 'zimno', pt: 'frio', exampleHtml: 'Jest mi <b>zimno</b>.', examplePt: 'Estou com frio.', pos: 'word' },
    { id: 'pl_clothes_13', deckId: 'pl_clothes', en: 'ciepło', pt: 'quente / calor agradável', exampleHtml: 'Jest mi <b>ciepło</b>.', examplePt: 'Estou com calor agradável.', pos: 'word' },
    { id: 'pl_clothes_14', deckId: 'pl_clothes', en: 'gorąco', pt: 'muito calor', exampleHtml: 'Jest bardzo <b>gorąco</b>.', examplePt: 'Está muito quente.', pos: 'word' },
    { id: 'pl_clothes_15', deckId: 'pl_clothes', en: 'chmura', pt: 'nuvem', exampleHtml: 'Widzę dużą <b>chmurę</b>.', examplePt: 'Eu vejo uma nuvem grande.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_clothes · Roupas e clima ──────────────────────────────────────────
  pl_clothes_0: 'ubrańé',
  pl_clothes_1: 'kóxula',
  pl_clothes_2: 'spódńé',
  pl_clothes_3: 'sukiénka',
  pl_clothes_4: 'buty',
  pl_clothes_5: 'kurtka',
  pl_clothes_6: 'tchapka',
  pl_clothes_7: 'pógóda',
  pl_clothes_8: 'suóńtsé',
  pl_clothes_9: 'déxtch',
  pl_clothes_10: 'śńég',
  pl_clothes_11: 'viatr',
  pl_clothes_12: 'zimnó',
  pl_clothes_13: 'ćépuo',
  pl_clothes_14: 'górontsó',
  pl_clothes_15: 'rrmura',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/clothes.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): clothes & weather deck (A2)"
```

---

### Task 5: `pl_body` deck — the body

**Files:**
- Create: `src/content/pl/body.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_BODY_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/body.ts
import type { Deck } from '../../types'

export const PL_BODY_DECK: Deck = {
  id: 'pl_body',
  name: 'Corpo',
  emoji: '🧍',
  desc: 'Partes do corpo, dizer onde dói',
  level: 1,
  cards: [
    { id: 'pl_body_0', deckId: 'pl_body', en: 'głowa', pt: 'cabeça', exampleHtml: 'Boli mnie <b>głowa</b>.', examplePt: 'Minha cabeça dói.', pos: 'noun' },
    { id: 'pl_body_1', deckId: 'pl_body', en: 'ręka', pt: 'mão / braço', exampleHtml: 'To jest moja <b>ręka</b>.', examplePt: 'Essa é minha mão.', pos: 'noun' },
    { id: 'pl_body_2', deckId: 'pl_body', en: 'noga', pt: 'perna', exampleHtml: 'To jest moja <b>noga</b>.', examplePt: 'Essa é minha perna.', pos: 'noun' },
    { id: 'pl_body_3', deckId: 'pl_body', en: 'oko', pt: 'olho', exampleHtml: 'To jest moje <b>oko</b>.', examplePt: 'Esse é meu olho.', pos: 'noun' },
    { id: 'pl_body_4', deckId: 'pl_body', en: 'ucho', pt: 'orelha', exampleHtml: 'To jest moje <b>ucho</b>.', examplePt: 'Essa é minha orelha.', pos: 'noun' },
    { id: 'pl_body_5', deckId: 'pl_body', en: 'usta', pt: 'boca', exampleHtml: 'Otwórz <b>usta</b>.', examplePt: 'Abra a boca.', pos: 'noun' },
    { id: 'pl_body_6', deckId: 'pl_body', en: 'nos', pt: 'nariz', exampleHtml: 'To jest mój <b>nos</b>.', examplePt: 'Esse é meu nariz.', pos: 'noun' },
    { id: 'pl_body_7', deckId: 'pl_body', en: 'serce', pt: 'coração', exampleHtml: 'Moje <b>serce</b> bije szybko.', examplePt: 'Meu coração bate rápido.', pos: 'noun' },
    { id: 'pl_body_8', deckId: 'pl_body', en: 'żołądek', pt: 'estômago', exampleHtml: 'Boli mnie <b>żołądek</b>.', examplePt: 'Minha barriga dói.', pos: 'noun' },
    { id: 'pl_body_9', deckId: 'pl_body', en: 'plecy', pt: 'costas', exampleHtml: 'Bolą mnie <b>plecy</b>.', examplePt: 'Minhas costas doem.', pos: 'noun' },
    { id: 'pl_body_10', deckId: 'pl_body', en: 'palec', pt: 'dedo', exampleHtml: 'To jest mój <b>palec</b>.', examplePt: 'Esse é meu dedo.', pos: 'noun' },
    { id: 'pl_body_11', deckId: 'pl_body', en: 'włosy', pt: 'cabelo', exampleHtml: 'Mam ciemne <b>włosy</b>.', examplePt: 'Eu tenho cabelo escuro.', pos: 'noun' },
    { id: 'pl_body_12', deckId: 'pl_body', en: 'twarz', pt: 'rosto', exampleHtml: 'To jest moja <b>twarz</b>.', examplePt: 'Esse é meu rosto.', pos: 'noun' },
    { id: 'pl_body_13', deckId: 'pl_body', en: 'ząb', pt: 'dente', exampleHtml: 'Boli mnie <b>ząb</b>.', examplePt: 'Meu dente dói.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_body · Corpo ───────────────────────────────────────────────────────
  pl_body_0: 'guóva',
  pl_body_1: 'renka',
  pl_body_2: 'nóga',
  pl_body_3: 'óko',
  pl_body_4: 'urró',
  pl_body_5: 'usta',
  pl_body_6: 'nós',
  pl_body_7: 'sértsé',
  pl_body_8: 'jóuondék',
  pl_body_9: 'plétsy',
  pl_body_10: 'palets',
  pl_body_11: 'vuósy',
  pl_body_12: 'tvaj',
  pl_body_13: 'zomb',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/body.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): body deck (A2)"
```

---

### Task 6: `pl_town` deck — around town

**Files:**
- Create: `src/content/pl/town.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_TOWN_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/town.ts
import type { Deck } from '../../types'

export const PL_TOWN_DECK: Deck = {
  id: 'pl_town',
  name: 'Cidade',
  emoji: '🏙️',
  desc: 'Lugares e transporte pela cidade',
  level: 1,
  cards: [
    { id: 'pl_town_0', deckId: 'pl_town', en: 'miasto', pt: 'cidade', exampleHtml: 'To jest moje <b>miasto</b>.', examplePt: 'Essa é minha cidade.', pos: 'noun' },
    { id: 'pl_town_1', deckId: 'pl_town', en: 'ulica', pt: 'rua', exampleHtml: 'To jest moja <b>ulica</b>.', examplePt: 'Essa é minha rua.', pos: 'noun' },
    { id: 'pl_town_2', deckId: 'pl_town', en: 'plac', pt: 'praça', exampleHtml: 'To jest <b>plac</b>.', examplePt: 'Essa é a praça.', pos: 'noun' },
    { id: 'pl_town_3', deckId: 'pl_town', en: 'kościół', pt: 'igreja', exampleHtml: 'To jest <b>kościół</b>.', examplePt: 'Essa é a igreja.', pos: 'noun' },
    { id: 'pl_town_4', deckId: 'pl_town', en: 'szkoła', pt: 'escola', exampleHtml: 'Moje dzieci idą do <b>szkoły</b>.', examplePt: 'Meus filhos vão à escola.', pos: 'noun' },
    { id: 'pl_town_5', deckId: 'pl_town', en: 'bank', pt: 'banco', exampleHtml: 'Idę do <b>banku</b>.', examplePt: 'Eu vou ao banco.', pos: 'noun' },
    { id: 'pl_town_6', deckId: 'pl_town', en: 'poczta', pt: 'correio', exampleHtml: 'Idę na <b>pocztę</b>.', examplePt: 'Eu vou ao correio.', pos: 'noun' },
    { id: 'pl_town_7', deckId: 'pl_town', en: 'park', pt: 'parque', exampleHtml: 'Idziemy do <b>parku</b>.', examplePt: 'Nós vamos ao parque.', pos: 'noun' },
    { id: 'pl_town_8', deckId: 'pl_town', en: 'most', pt: 'ponte', exampleHtml: 'To jest <b>most</b>.', examplePt: 'Essa é a ponte.', pos: 'noun' },
    { id: 'pl_town_9', deckId: 'pl_town', en: 'rzeka', pt: 'rio', exampleHtml: 'To jest <b>rzeka</b>.', examplePt: 'Esse é o rio.', pos: 'noun' },
    { id: 'pl_town_10', deckId: 'pl_town', en: 'autobus', pt: 'ônibus', exampleHtml: 'To jest <b>autobus</b>.', examplePt: 'Esse é o ônibus.', pos: 'noun' },
    { id: 'pl_town_11', deckId: 'pl_town', en: 'pociąg', pt: 'trem', exampleHtml: 'To jest <b>pociąg</b>.', examplePt: 'Esse é o trem.', pos: 'noun' },
    { id: 'pl_town_12', deckId: 'pl_town', en: 'lotnisko', pt: 'aeroporto', exampleHtml: 'Jedziemy na <b>lotnisko</b>.', examplePt: 'Nós vamos ao aeroporto.', pos: 'noun' },
    { id: 'pl_town_13', deckId: 'pl_town', en: 'dworzec', pt: 'estação', exampleHtml: 'To jest <b>dworzec</b>.', examplePt: 'Essa é a estação.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_town · Cidade ──────────────────────────────────────────────────────
  pl_town_0: 'miastó',
  pl_town_1: 'ulitsa',
  pl_town_2: 'plats',
  pl_town_3: 'kóściuu',
  pl_town_4: 'xkóua',
  pl_town_5: 'bank',
  pl_town_6: 'pótchta',
  pl_town_7: 'park',
  pl_town_8: 'móst',
  pl_town_9: 'jéka',
  pl_town_10: 'autóbus',
  pl_town_11: 'póćong',
  pl_town_12: 'lótńiskó',
  pl_town_13: 'dvójéts',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/town.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): town deck (A2)"
```

---

### Task 7: `pl_verbs2` deck — more everyday verbs

**Files:**
- Create: `src/content/pl/verbs2.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_VERBS2_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/verbs2.ts
import type { Deck } from '../../types'

export const PL_VERBS2_DECK: Deck = {
  id: 'pl_verbs2',
  name: 'Mais verbos do dia a dia',
  emoji: '🔁',
  desc: 'Ver, ler, escrever, comer, beber, dormir, trabalhar',
  level: 1,
  cards: [
    { id: 'pl_verbs2_0', deckId: 'pl_verbs2', en: 'widzieć', pt: 'ver', exampleHtml: 'Chcę cię <b>widzieć</b>.', examplePt: 'Eu quero te ver.', pos: 'verb' },
    { id: 'pl_verbs2_1', deckId: 'pl_verbs2', en: 'widzę', pt: 'eu vejo', exampleHtml: '<b>Widzę</b> cię.', examplePt: 'Eu te vejo.', pos: 'verb' },
    { id: 'pl_verbs2_2', deckId: 'pl_verbs2', en: 'słyszeć', pt: 'ouvir', exampleHtml: 'Nie mogę cię <b>słyszeć</b>.', examplePt: 'Eu não consigo te ouvir.', pos: 'verb' },
    { id: 'pl_verbs2_3', deckId: 'pl_verbs2', en: 'czytać', pt: 'ler', exampleHtml: 'Lubię <b>czytać</b> książki.', examplePt: 'Eu gosto de ler livros.', pos: 'verb' },
    { id: 'pl_verbs2_4', deckId: 'pl_verbs2', en: 'czytam', pt: 'eu leio', exampleHtml: '<b>Czytam</b> książkę.', examplePt: 'Eu estou lendo um livro.', pos: 'verb' },
    { id: 'pl_verbs2_5', deckId: 'pl_verbs2', en: 'pisać', pt: 'escrever', exampleHtml: 'Muszę <b>pisać</b> e-mail.', examplePt: 'Eu preciso escrever um e-mail.', pos: 'verb' },
    { id: 'pl_verbs2_6', deckId: 'pl_verbs2', en: 'piszę', pt: 'eu escrevo', exampleHtml: '<b>Piszę</b> list.', examplePt: 'Eu estou escrevendo uma carta.', pos: 'verb' },
    { id: 'pl_verbs2_7', deckId: 'pl_verbs2', en: 'jeść', pt: 'comer', exampleHtml: 'Chcę <b>jeść</b>.', examplePt: 'Eu quero comer.', pos: 'verb' },
    { id: 'pl_verbs2_8', deckId: 'pl_verbs2', en: 'jem', pt: 'eu como', exampleHtml: '<b>Jem</b> obiad.', examplePt: 'Eu estou almoçando.', pos: 'verb' },
    { id: 'pl_verbs2_9', deckId: 'pl_verbs2', en: 'pić', pt: 'beber', exampleHtml: 'Chcę <b>pić</b> wodę.', examplePt: 'Eu quero beber água.', pos: 'verb' },
    { id: 'pl_verbs2_10', deckId: 'pl_verbs2', en: 'piję', pt: 'eu bebo', exampleHtml: '<b>Piję</b> kawę.', examplePt: 'Eu estou bebendo café.', pos: 'verb' },
    { id: 'pl_verbs2_11', deckId: 'pl_verbs2', en: 'spać', pt: 'dormir', exampleHtml: 'Muszę <b>spać</b>.', examplePt: 'Eu preciso dormir.', pos: 'verb' },
    { id: 'pl_verbs2_12', deckId: 'pl_verbs2', en: 'śpię', pt: 'eu durmo', exampleHtml: '<b>Śpię</b> osiem godzin.', examplePt: 'Eu durmo oito horas.', pos: 'verb' },
    { id: 'pl_verbs2_13', deckId: 'pl_verbs2', en: 'pracować', pt: 'trabalhar', exampleHtml: 'Lubię <b>pracować</b>.', examplePt: 'Eu gosto de trabalhar.', pos: 'verb' },
    { id: 'pl_verbs2_14', deckId: 'pl_verbs2', en: 'pracuję', pt: 'eu trabalho', exampleHtml: 'Dużo <b>pracuję</b>.', examplePt: 'Eu trabalho muito.', pos: 'verb' },
    { id: 'pl_verbs2_15', deckId: 'pl_verbs2', en: 'kochać', pt: 'amar', exampleHtml: '<b>Kocham</b> moją rodzinę.', examplePt: 'Eu amo minha família.', pos: 'verb' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_verbs2 · Mais verbos do dia a dia ─────────────────────────────────
  pl_verbs2_0: 'vidźéć',
  pl_verbs2_1: 'vidzen',
  pl_verbs2_2: 'suyxéć',
  pl_verbs2_3: 'tchytać',
  pl_verbs2_4: 'tchytam',
  pl_verbs2_5: 'pisać',
  pl_verbs2_6: 'pixen',
  pl_verbs2_7: 'iéść',
  pl_verbs2_8: 'iém',
  pl_verbs2_9: 'pić',
  pl_verbs2_10: 'pijén',
  pl_verbs2_11: 'spać',
  pl_verbs2_12: 'śpjen',
  pl_verbs2_13: 'pratsóvać',
  pl_verbs2_14: 'pratsuién',
  pl_verbs2_15: 'kórrać',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/verbs2.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): more everyday verbs deck (A2)"
```

---

### Task 8: `pl_power` deck — frequent phrases

**Files:**
- Create: `src/content/pl/power.ts`
- Modify: `src/content/authored/phoneticsPl.ts` (append)

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_POWER_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/power.ts
import type { Deck } from '../../types'

/**
 * Whole functional phrases rather than single words — the ones that get used
 * every day once he's actually there (asking for the bill, saying he doesn't
 * understand, asking where the bathroom is), the same role English's "Power
 * phrases" deck plays.
 */
export const PL_POWER_DECK: Deck = {
  id: 'pl_power',
  name: 'Frases de uso frequente',
  emoji: '💬',
  desc: 'Frases prontas pro dia a dia',
  level: 1,
  cards: [
    { id: 'pl_power_0', deckId: 'pl_power', en: 'proszę o rachunek', pt: 'a conta, por favor', exampleHtml: '<b>Proszę o rachunek</b>, dziękuję.', examplePt: 'A conta, por favor, obrigado.', pos: 'phrase' },
    { id: 'pl_power_1', deckId: 'pl_power', en: 'ile to kosztuje?', pt: 'quanto custa isso?', exampleHtml: 'Przepraszam, <b>ile to kosztuje</b>?', examplePt: 'Com licença, quanto custa isso?', pos: 'phrase' },
    { id: 'pl_power_2', deckId: 'pl_power', en: 'nie rozumiem', pt: 'eu não entendo', exampleHtml: 'Przepraszam, <b>nie rozumiem</b>.', examplePt: 'Desculpa, eu não entendo.', pos: 'phrase' },
    { id: 'pl_power_3', deckId: 'pl_power', en: 'czy mówisz po angielsku?', pt: 'você fala inglês?', exampleHtml: '<b>Czy mówisz po angielsku</b>?', examplePt: 'Você fala inglês?', pos: 'phrase' },
    { id: 'pl_power_4', deckId: 'pl_power', en: 'gdzie jest toaleta?', pt: 'onde fica o banheiro?', exampleHtml: 'Przepraszam, <b>gdzie jest toaleta</b>?', examplePt: 'Com licença, onde fica o banheiro?', pos: 'phrase' },
    { id: 'pl_power_5', deckId: 'pl_power', en: 'jestem głodny', pt: 'estou com fome', exampleHtml: '<b>Jestem głodny</b>, chodźmy coś zjeść.', examplePt: 'Estou com fome, vamos comer algo.', pos: 'phrase' },
    { id: 'pl_power_6', deckId: 'pl_power', en: 'mogę prosić o pomoc?', pt: 'posso pedir ajuda?', exampleHtml: 'Przepraszam, <b>mogę prosić o pomoc</b>?', examplePt: 'Com licença, posso pedir ajuda?', pos: 'phrase' },
    { id: 'pl_power_7', deckId: 'pl_power', en: 'co to znaczy?', pt: 'o que isso significa?', exampleHtml: '<b>Co to znaczy</b> po polsku?', examplePt: 'O que isso significa em polonês?', pos: 'phrase' },
    { id: 'pl_power_8', deckId: 'pl_power', en: 'wszystko w porządku', pt: 'está tudo bem', exampleHtml: '<b>Wszystko w porządku</b>, dziękuję.', examplePt: 'Está tudo bem, obrigado.', pos: 'phrase' },
    { id: 'pl_power_9', deckId: 'pl_power', en: 'nie ma sprawy', pt: 'sem problema', exampleHtml: '<b>Nie ma sprawy</b>, do zobaczenia.', examplePt: 'Sem problema, até logo.', pos: 'phrase' },
    { id: 'pl_power_10', deckId: 'pl_power', en: 'do zobaczenia', pt: 'até logo', exampleHtml: '<b>Do zobaczenia</b> jutro!', examplePt: 'Até amanhã!', pos: 'phrase' },
    { id: 'pl_power_11', deckId: 'pl_power', en: 'na zdrowie', pt: 'saúde! (brinde)', exampleHtml: '<b>Na zdrowie</b>! Wszystkiego dobrego.', examplePt: 'Saúde! Tudo de bom.', pos: 'phrase' },
    { id: 'pl_power_12', deckId: 'pl_power', en: 'smacznego', pt: 'bom apetite', exampleHtml: '<b>Smacznego</b>, mamo!', examplePt: 'Bom apetite, mãe!', pos: 'phrase' },
    { id: 'pl_power_13', deckId: 'pl_power', en: 'powodzenia', pt: 'boa sorte', exampleHtml: '<b>Powodzenia</b> na egzaminie!', examplePt: 'Boa sorte na prova!', pos: 'phrase' },
    { id: 'pl_power_14', deckId: 'pl_power', en: 'jak to się mówi po polsku?', pt: 'como se diz isso em polonês?', exampleHtml: '<b>Jak to się mówi po polsku</b>?', examplePt: 'Como se diz isso em polonês?', pos: 'phrase' },
    { id: 'pl_power_15', deckId: 'pl_power', en: 'muszę iść', pt: 'eu preciso ir', exampleHtml: 'Przepraszam, <b>muszę iść</b>.', examplePt: 'Desculpa, eu preciso ir.', pos: 'phrase' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_power · Frases de uso frequente ───────────────────────────────────
  pl_power_0: 'próxen o rarrunék',
  pl_power_1: 'ilé tó kóxtuié?',
  pl_power_2: 'ńé rózumiém',
  pl_power_3: 'tchy muvix pó angiélsku?',
  pl_power_4: 'gdźé iést tóaléta?',
  pl_power_5: 'iéstém guódny',
  pl_power_6: 'mógen próśić o pómóts?',
  pl_power_7: 'tsó tó znatchy?',
  pl_power_8: 'vxystkó v pójondku',
  pl_power_9: 'ńé ma spravy',
  pl_power_10: 'dó zóbatchéńa',
  pl_power_11: 'na zdróvié',
  pl_power_12: 'smatchnégó',
  pl_power_13: 'póvódzéńa',
  pl_power_14: 'iak tó śen muvi pó pólsku?',
  pl_power_15: 'muxen iść',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/power.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): frequent phrases deck (A2)"
```

---

### Task 9: Wire the 8 new decks into `PL_DECKS`

**Files:**
- Modify: `src/content/pl/index.ts`
- Modify: `src/content/pl/pl.test.ts`

**Interfaces:**
- Consumes: `PL_FOOD_DECK, PL_SHOPPING_DECK, PL_HOUSE_DECK, PL_CLOTHES_DECK, PL_BODY_DECK, PL_TOWN_DECK, PL_VERBS2_DECK, PL_POWER_DECK` (Tasks 1–8).
- Produces: `PL_DECKS: Deck[]` now holding all 16 decks (8 from Phase 1 + 8 from this phase), consumed automatically by `src/courses/index.ts`'s existing `decks: PL_DECKS` — no change needed there.

- [ ] **Step 1: Write the failing test**

In `src/content/pl/pl.test.ts`, change:

```typescript
  it('ships an A1 floor worth studying', () => {
    expect(PL_CARDS.length).toBeGreaterThanOrEqual(100)
  })
```

to:

```typescript
  it('ships an A1+A2 floor worth studying', () => {
    expect(PL_CARDS.length).toBeGreaterThanOrEqual(220)
  })

  it('has grown past Phase 1 alone — 16 decks now, not 8', () => {
    expect(PL_DECKS.length).toBeGreaterThanOrEqual(16)
  })
```

(Every other test in the file — unique ids, deck ownership, `<b>` presence, sentence ratio, phonetic presence — already generalizes to the full corpus with no change needed; it loops over `PL_CARDS`/`PL_DECKS`, whatever they contain.)

- [ ] **Step 2: Run the tests to verify the new one fails**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: FAIL — `PL_CARDS.length` is still 112 (< 220) and `PL_DECKS.length` is still 8 (< 16), since `index.ts` hasn't been updated yet.

- [ ] **Step 3: Update `src/content/pl/index.ts`**

Add the 8 new imports alongside the existing 8:

```typescript
import { PL_FOOD_DECK } from './food'
import { PL_SHOPPING_DECK } from './shopping'
import { PL_HOUSE_DECK } from './house'
import { PL_CLOTHES_DECK } from './clothes'
import { PL_BODY_DECK } from './body'
import { PL_TOWN_DECK } from './town'
import { PL_VERBS2_DECK } from './verbs2'
import { PL_POWER_DECK } from './power'
```

Extend `RAW_DECKS`:

```typescript
const RAW_DECKS: Deck[] = [
  PL_HELLO_DECK,
  PL_NUMBERS_DECK,
  PL_VERBS_DECK,
  PL_PEOPLE_DECK,
  PL_EMERGENCY_DECK,
  PL_FEELINGS_DECK,
  PL_QUESTIONS_DECK,
  PL_BASICS_DECK,
  PL_FOOD_DECK,
  PL_SHOPPING_DECK,
  PL_HOUSE_DECK,
  PL_CLOTHES_DECK,
  PL_BODY_DECK,
  PL_TOWN_DECK,
  PL_VERBS2_DECK,
  PL_POWER_DECK,
]
```

Everything else in the file (the `.map(deck => ...)` merge of `PHONETICS_PL`/`PHOTOS_PL`) is unchanged — it already operates generically over whatever `RAW_DECKS` contains.

- [ ] **Step 4: Run the tests again to verify they pass**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: PASS — 9 tests green (the original 7 plus the 2 new ones; card count should land at 234).

- [ ] **Step 5: Run the full suite and the type-checker**

Run: `npx vitest run`
Expected: PASS, no regressions (note: if run from a worktree with the main checkout also present, make sure `vitest.config.ts` excludes `.worktrees/**` — this was already fixed on `master` after Phase 1 shipped; if this worktree was branched before that fix landed, merge/rebase `master` in first).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/content/pl/index.ts src/content/pl/pl.test.ts
git commit -m "feat(pl): wire the A2 decks into PL_DECKS"
```

---

### Task 10: Content self-review pass

**Context:** Same safeguard as Phase 1's Task 14, run again for this phase's 122 new cards. Lucas still cannot proofread Polish himself — this is still the only accuracy check standing between a hand-authored transliteration and something he memorizes as fact. Phase 1's version of this task found and fixed a real bug (a word silently dropped from one transcription) and nine transcription-consistency slips out of 112 entries — treat that as the expected error rate for a review like this, not a sign something went unusually wrong last time.

**Files:**
- Modify: any of `src/content/pl/{food,shopping,house,clothes,body,town,verbs2,power}.ts`, `src/content/authored/phoneticsPl.ts` — only where Step 1 finds a real discrepancy.

**Interfaces:** None.

- [ ] **Step 1: Cross-check every word against an independent source**

For each of the 122 cards across the 8 files listed above: look up the Polish word (via `WebSearch`/`WebFetch` against a Polish-English or Polish-Portuguese dictionary — e.g. Wiktionary, `pl.pons.com`) and confirm the `pt` meaning, the claimed grammatical form, and every diacritic. As in Phase 1, concentrate real verification effort on words you're not confident about and spot-check the rest — be honest in the report about which is which.

Pay particular attention to two things this phase invents beyond Phase 1's precedent, both flagged inline in this plan as judgment calls worth a second look:
- `pl_food_5` (`jajko`, "iaaikó") and any other word with a `j` immediately before a consonant mid-word — the "offglide before a consonant → i" rule was applied by analogy to `wczoraj`'s pattern, not by a written rule, and this is the first word where it happens *mid*-word rather than word-finally.
- `pl_verbs2_10`/`pl_verbs2_12` (`piję`/`śpię`, "pijén"/"śpjen") — these needed a judgment call between two established-but-conflicting precedents (`dziękuję`'s accented `-uién` vs. `robię`/`mówię`'s unaccented `-jen`), resolved here by whether the letter before `ę` is a genuine written `j` or the softness-marking `i`. Check this reasoning holds.

- [ ] **Step 2: Re-derive every phonetic entry from the convention table**

Re-read `PHONETICS-CONVENTION.md` §9 and this phase's 122 entries in `phoneticsPl.ts`, re-applying the rules word by word, cross-referencing against Phase 1's already-corrected 112 entries for precedent on anything the table itself doesn't spell out explicitly (nasal vowel behavior before different consonant classes, `trz`, `pi/bi/wi/mi/ci + vowel` palatalization). Fix any entry that doesn't match.

- [ ] **Step 3: Check the example sentences read as natural, grammatically real Polish**

Several sentences in this phase were deliberately written to avoid case-agreement risk (nominative-heavy templates, "To jest mój/moja/moje X"), the same mitigation Phase 1 used. Confirm they still read as natural Polish, not just grammatically-safe-but-stilted templates, and reword any that don't — keeping the same target word bolded in the same place.

- [ ] **Step 4: Run the suite after any fixes**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

If nothing needed fixing, skip the commit and say so plainly in the report. Otherwise:

```bash
git add src/content/pl/
git commit -m "fix(pl): Phase 2 content self-review corrections"
```

---

### Task 11: Full verification

**Files:** None — verification only.

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: every test passes, including all of `pl.test.ts` (234 cards, 16 decks).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Browser verification**

Start the dev server (in a way that actually serves this branch's code — if working in a worktree, point the preview at the worktree's own directory, not the main checkout, the same care Phase 1's verification needed), seed `localStorage.setItem('english-nz.course', 'pl-pl')`, reload. Confirm via `get_page_text` / `read_page`:
- Home shows 16 Polish decks total (the original 8 plus this phase's 8), all still level 1.
- Opening one of the new decks (e.g. "Comida e restaurante") shows a card with the right word, phonetic, translation, and example — same shape Phase 1's verification confirmed for `pl_hello`.
- No new console errors.

- [ ] **Step 4: Report**

Summarize what shipped (deck count, card count now 234, commits) and note that Phase 3 (B1) is next whenever the owner wants it, per the design doc.
