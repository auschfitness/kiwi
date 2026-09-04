# Polish Course — Phase 1 (A1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a third course, Polish (`pl-pl`), with a full A1 vocabulary floor (~112 cards across 8 decks), following the English course's beginner template (recognition before production, level-gated), with its own phonetics convention and voice.

**Architecture:** Registers `pl-pl` in the existing `Course` registry (`src/courses/`) exactly the way `es-latam` is registered. Content is hand-authored TypeScript under `src/content/pl/`, one file per deck, merged in `src/content/pl/index.ts` — the same shape as `src/content/es/`, not English's generated pipeline (nothing generates Polish content; every card is written by hand). Pronunciation is a new table, `PHONETICS_PL`, following an extension of the existing "read it like Portuguese" convention. No new engine logic: SRS, modality rotation, and leveling are reused unchanged, matching the design's decision that Polish carries no interference layer.

**Tech Stack:** Vite + React 19 + TypeScript strict + Tailwind + Zustand, Vitest, existing `scripts/fetch-photos.mjs` (Pexels).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-09-01-polish-course-design.md` — read it before starting; this plan implements only its Phase 1.
- Course id: `pl-pl`. Storage key: `polski`. Accent: `pl-PL` (single accent, no picker).
- `modalities: ['recognize', 'listen', 'type', 'build', 'dictate', 'speak']`, `speakDirection: 'repeat'`, `gated: true`, `weanOffPortuguese: false`, `practice: []` (Phase 1 ships no practice feature).
- Every card needs: `id`, `deckId`, `en` (holds the Polish word/phrase — the field is a legacy name from the English course, reused as-is by the Spanish course too), `pt` (Portuguese translation), `exampleHtml` (must contain a `<b>...</b>` around the target word/phrase), `examplePt`, `pos`, `phonetic`.
- `npx vitest run` and `npx tsc --noEmit` must be clean before any task is committed.
- Commit after every task — small, working diffs, matching this project's convention throughout.

---

## Polish phonetics convention (used by every content task below)

This table is the actual rule set — apply it mechanically, don't re-derive it per word:

| Polish | Written as | Notes |
|---|---|---|
| a | a | |
| ą | `on` (before p/b: `om`) | nasal |
| e | é | |
| ę | `en` (before p/b: `em`) | nasal |
| i | i | |
| o | ó | |
| ó, u | u | |
| y | y | kept as its own letter — a more central/closed sound than `i`, explained once in the doc, not re-derived per word |
| ć, ń, ś, ź | kept literal | the palatal set Portuguese has no letter for; `ń` happens to equal Portuguese's own `nh` sound |
| c | ts | |
| cz | tch | |
| sz | x | |
| ż, rz | j | |
| dz | dz | |
| dż | dj | |
| ch, h | rr | |
| w | v | |
| ł | u | "dark l" |
| j (as glide, not the digraphs above) | merges into the adjacent vowel — `ja`→`ia`, `je`→`ié`/`ién` | |
| "ni/si/zi/dzi" + vowel | palatalizes exactly like `ń/ś/ź/dź` — treat `nia`→`ńa`, `sia`→`śa`, `zia`→`źa`, `dzia`→`dźa`, etc. | this is what those spellings mean in Polish orthography |
| stress | never marked | Polish stress is always the second-to-last syllable, no exceptions — the one thing this course doesn't have to teach card by card |
| everything else (b,d,f,g,k,l,m,n,p,r,s,t,z) | itself | read the Portuguese way |

---

### Task 1: Polish section of the phonetics convention doc

**Files:**
- Modify: `src/content/authored/PHONETICS-CONVENTION.md`

**Interfaces:** None — documentation only, no code.

- [ ] **Step 1: Append a new section**

Add this section at the end of the file:

```markdown
---

## 2. Polonês — o que muda

O polonês usa o mesmo princípio ("leia como se fosse português"), mas a
ortografia polonesa já é bem mais regular que a do inglês: cada letra (ou
dígrafo fixo) quase sempre soa do mesmo jeito, e o acento tônico **cai
sempre na penúltima sílaba, sem exceção** — por isso a tabela abaixo não
marca acento tônico em nenhuma palavra, diferente da tabela do inglês.

| Letra polonesa | Escrevemos | Nota |
|---|---|---|
| a | a | |
| ą | `on` (antes de p/b: `om`) | vogal nasal |
| e | é | |
| ę | `en` (antes de p/b: `em`) | vogal nasal |
| i | i | |
| o | ó | |
| ó, u | u | |
| y | y | mantido como letra própria — um som mais fechado/central que `i`, sem letra equivalente em português |
| ć, ń, ś, ź | mantidas como estão | o único grupo que o português genuinamente não tem — `ń` por acaso é exatamente o nosso `nh` |
| c | ts | |
| cz | tch | |
| sz | x | |
| ż, rz | j | |
| dz | dz | |
| dż | dj | |
| ch, h | rr | (o r gutural de "carro") |
| w | v | |
| ł | u | o "l escuro" soa como um "u" |
| j | vira parte da vogal ao lado (`ja`→`ia`, `je`→`ié`) | não é uma consoante isolada aqui |
| "ni/si/zi/dzi" + vogal | vira `ń/ś/ź/dź` + vogal | é assim que essa grafia se lê em polonês |

**Exemplo:** `dziękuję` (obrigado) → `dźenkuién`. `cześć` (oi) → `tchéść`.

Cobertura desta tabela: `authored/phoneticsPl.ts`, nível A1 (Fase 1 do curso
de polonês). Ver `docs/superpowers/specs/2026-09-01-polish-course-design.md`.
```

- [ ] **Step 2: Commit**

```bash
git add src/content/authored/PHONETICS-CONVENTION.md
git commit -m "docs: Polish section of the phonetics convention"
```

---

### Task 2: `pl_hello` deck — first words & courtesy

**Files:**
- Create: `src/content/pl/greetings.ts`
- Create: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Produces: `PL_HELLO_DECK: Deck` (exported from `greetings.ts`), and the start of `PHONETICS_PL: Record<string, string>` (exported from `phoneticsPl.ts`) — later deck tasks append more entries to this same file.

- [ ] **Step 1: Create the deck file**

```typescript
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
```

- [ ] **Step 2: Create the phonetics table with this deck's entries**

```typescript
// src/content/authored/phoneticsPl.ts
/**
 * Pronúncia do polonês escrita "à brasileira" — ver a seção 2 de
 * PHONETICS-CONVENTION.md (mesma pasta). Chave = `Card.id`. Uma chave
 * errada não dá erro: apenas não aparece pronúncia. A junção com os
 * baralhos acontece em `src/content/pl/index.ts`.
 */
export const PHONETICS_PL: Record<string, string> = {
  // ── pl_hello · Primeiras palavras ────────────────────────────────────────
  pl_hello_0: 'tchéść',
  pl_hello_1: 'dźéń dóbry',
  pl_hello_2: 'viétchur',
  pl_hello_3: 'dóbranots',
  pl_hello_4: 'dó vidzéńa',
  pl_hello_5: 'pa',
  pl_hello_6: 'próxen',
  pl_hello_7: 'dźenkuién',
  pl_hello_8: 'pjépraxam',
  pl_hello_9: 'tak',
  pl_hello_10: 'ńé',
  pl_hello_11: 'iak śen max',
  pl_hello_12: 'miuó mi',
  pl_hello_13: 'nazyvam śen',
}
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/greetings.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): first words & courtesy deck"
```

---

### Task 3: `pl_numbers` deck — numbers & time

**Files:**
- Create: `src/content/pl/numbers.ts`
- Modify: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Consumes: `PHONETICS_PL` (from Task 2, appends to it).
- Produces: `PL_NUMBERS_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/numbers.ts
import type { Deck } from '../../types'

export const PL_NUMBERS_DECK: Deck = {
  id: 'pl_numbers',
  name: 'Números e tempo',
  emoji: '🔢',
  desc: 'Contar até dez e falar de hoje, ontem, amanhã',
  level: 1,
  cards: [
    { id: 'pl_numbers_0', deckId: 'pl_numbers', en: 'zero', pt: 'zero', exampleHtml: '<b>Zero</b> stopni na dworze.', examplePt: 'Zero graus lá fora.', pos: 'number' },
    { id: 'pl_numbers_1', deckId: 'pl_numbers', en: 'jeden', pt: 'um', exampleHtml: 'Mam <b>jeden</b> telefon.', examplePt: 'Eu tenho um telefone.', pos: 'number' },
    { id: 'pl_numbers_2', deckId: 'pl_numbers', en: 'dwa', pt: 'dois', exampleHtml: 'To jest numer <b>dwa</b>.', examplePt: 'Este é o número dois.', pos: 'number' },
    { id: 'pl_numbers_3', deckId: 'pl_numbers', en: 'trzy', pt: 'três', exampleHtml: 'Mam <b>trzy</b> koty.', examplePt: 'Eu tenho três gatos.', pos: 'number' },
    { id: 'pl_numbers_4', deckId: 'pl_numbers', en: 'cztery', pt: 'quatro', exampleHtml: 'Są <b>cztery</b> pory roku.', examplePt: 'Há quatro estações do ano.', pos: 'number' },
    { id: 'pl_numbers_5', deckId: 'pl_numbers', en: 'pięć', pt: 'cinco', exampleHtml: '<b>Pięć</b> minut, proszę.', examplePt: 'Cinco minutos, por favor.', pos: 'number' },
    { id: 'pl_numbers_6', deckId: 'pl_numbers', en: 'sześć', pt: 'seis', exampleHtml: 'Mam <b>sześć</b> jabłek.', examplePt: 'Eu tenho seis maçãs.', pos: 'number' },
    { id: 'pl_numbers_7', deckId: 'pl_numbers', en: 'siedem', pt: 'sete', exampleHtml: '<b>Siedem</b> dni w tygodniu.', examplePt: 'Sete dias na semana.', pos: 'number' },
    { id: 'pl_numbers_8', deckId: 'pl_numbers', en: 'osiem', pt: 'oito', exampleHtml: 'Mam <b>osiem</b> lat.', examplePt: 'Eu tenho oito anos.', pos: 'number' },
    { id: 'pl_numbers_9', deckId: 'pl_numbers', en: 'dziewięć', pt: 'nove', exampleHtml: '<b>Dziewięć</b> razy próbowałem.', examplePt: 'Tentei nove vezes.', pos: 'number' },
    { id: 'pl_numbers_10', deckId: 'pl_numbers', en: 'dziesięć', pt: 'dez', exampleHtml: 'Liczę do <b>dziesięć</b>.', examplePt: 'Eu conto até dez.', pos: 'number' },
    { id: 'pl_numbers_11', deckId: 'pl_numbers', en: 'dzisiaj', pt: 'hoje', exampleHtml: '<b>Dzisiaj</b> jest piękny dzień.', examplePt: 'Hoje é um dia lindo.', pos: 'word' },
    { id: 'pl_numbers_12', deckId: 'pl_numbers', en: 'jutro', pt: 'amanhã', exampleHtml: 'Zobaczymy się <b>jutro</b>.', examplePt: 'Nos vemos amanhã.', pos: 'word' },
    { id: 'pl_numbers_13', deckId: 'pl_numbers', en: 'wczoraj', pt: 'ontem', exampleHtml: '<b>Wczoraj</b> było zimno.', examplePt: 'Ontem estava frio.', pos: 'word' },
    { id: 'pl_numbers_14', deckId: 'pl_numbers', en: 'teraz', pt: 'agora', exampleHtml: 'Muszę iść <b>teraz</b>.', examplePt: 'Eu preciso ir agora.', pos: 'word' },
    { id: 'pl_numbers_15', deckId: 'pl_numbers', en: 'godzina', pt: 'hora', exampleHtml: 'To zajmie jedną <b>godzinę</b>.', examplePt: 'Isso vai levar uma hora.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

Add before the closing `}` of `PHONETICS_PL` in `src/content/authored/phoneticsPl.ts`:

```typescript
  // ── pl_numbers · Números e tempo ─────────────────────────────────────────
  pl_numbers_0: 'zéró',
  pl_numbers_1: 'iédén',
  pl_numbers_2: 'dva',
  pl_numbers_3: 'tchy',
  pl_numbers_4: 'tchtéry',
  pl_numbers_5: 'pjenć',
  pl_numbers_6: 'xéść',
  pl_numbers_7: 'śédém',
  pl_numbers_8: 'óśém',
  pl_numbers_9: 'dźévjeńć',
  pl_numbers_10: 'dźéśeńć',
  pl_numbers_11: 'dźiśai',
  pl_numbers_12: 'iutró',
  pl_numbers_13: 'vtchórai',
  pl_numbers_14: 'téraz',
  pl_numbers_15: 'gódzina',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/numbers.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): numbers & time deck"
```

---

### Task 4: `pl_verbs` deck — everyday verbs

**Files:**
- Create: `src/content/pl/verbs.ts`
- Modify: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_VERBS_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/verbs.ts
import type { Deck } from '../../types'

/**
 * być (ser/estar), mieć (ter), chcieć (querer), iść (ir), robić (fazer),
 * mówić (falar), rozumieć/wiedzieć (entender/saber) — the handful of verbs
 * that carry most everyday speech, each shown once as the dictionary form
 * and once conjugated, the way the Spanish course's "os seis verbos" deck
 * does it.
 */
export const PL_VERBS_DECK: Deck = {
  id: 'pl_verbs',
  name: 'Verbos do dia a dia',
  emoji: '🔑',
  desc: 'Ser, ter, querer, ir, fazer, falar, entender',
  level: 1,
  cards: [
    { id: 'pl_verbs_0', deckId: 'pl_verbs', en: 'być', pt: 'ser / estar', exampleHtml: 'Chcę <b>być</b> szczęśliwy.', examplePt: 'Eu quero ser feliz.', pos: 'verb' },
    { id: 'pl_verbs_1', deckId: 'pl_verbs', en: 'jestem', pt: 'eu sou / estou', exampleHtml: '<b>Jestem</b> w domu.', examplePt: 'Eu estou em casa.', pos: 'verb' },
    { id: 'pl_verbs_2', deckId: 'pl_verbs', en: 'jesteś', pt: 'você é / está', exampleHtml: '<b>Jesteś</b> bardzo miły.', examplePt: 'Você é muito gentil.', pos: 'verb' },
    { id: 'pl_verbs_3', deckId: 'pl_verbs', en: 'mieć', pt: 'ter', exampleHtml: 'Muszę <b>mieć</b> czas.', examplePt: 'Eu preciso ter tempo.', pos: 'verb' },
    { id: 'pl_verbs_4', deckId: 'pl_verbs', en: 'mam', pt: 'eu tenho', exampleHtml: '<b>Mam</b> czas.', examplePt: 'Eu tenho tempo.', pos: 'verb' },
    { id: 'pl_verbs_5', deckId: 'pl_verbs', en: 'masz', pt: 'você tem', exampleHtml: '<b>Masz</b> rację.', examplePt: 'Você tem razão.', pos: 'verb' },
    { id: 'pl_verbs_6', deckId: 'pl_verbs', en: 'chcieć', pt: 'querer', exampleHtml: 'Ważne jest <b>chcieć</b> się uczyć.', examplePt: 'É importante querer aprender.', pos: 'verb' },
    { id: 'pl_verbs_7', deckId: 'pl_verbs', en: 'chcę', pt: 'eu quero', exampleHtml: '<b>Chcę</b> kawę.', examplePt: 'Eu quero um café.', pos: 'verb' },
    { id: 'pl_verbs_8', deckId: 'pl_verbs', en: 'iść', pt: 'ir (a pé)', exampleHtml: 'Muszę <b>iść</b> do pracy.', examplePt: 'Eu preciso ir para o trabalho.', pos: 'verb' },
    { id: 'pl_verbs_9', deckId: 'pl_verbs', en: 'idę', pt: 'eu vou', exampleHtml: '<b>Idę</b> do domu.', examplePt: 'Eu vou para casa.', pos: 'verb' },
    { id: 'pl_verbs_10', deckId: 'pl_verbs', en: 'robić', pt: 'fazer', exampleHtml: 'Co chcesz <b>robić</b>?', examplePt: 'O que você quer fazer?', pos: 'verb' },
    { id: 'pl_verbs_11', deckId: 'pl_verbs', en: 'robię', pt: 'eu faço', exampleHtml: '<b>Robię</b> śniadanie.', examplePt: 'Eu estou fazendo o café da manhã.', pos: 'verb' },
    { id: 'pl_verbs_12', deckId: 'pl_verbs', en: 'mówić', pt: 'falar', exampleHtml: 'Nie mogę teraz <b>mówić</b>.', examplePt: 'Eu não posso falar agora.', pos: 'verb' },
    { id: 'pl_verbs_13', deckId: 'pl_verbs', en: 'mówię', pt: 'eu falo', exampleHtml: '<b>Mówię</b> trochę po polsku.', examplePt: 'Eu falo um pouco de polonês.', pos: 'verb' },
    { id: 'pl_verbs_14', deckId: 'pl_verbs', en: 'rozumieć', pt: 'entender', exampleHtml: 'Zaczynam <b>rozumieć</b>.', examplePt: 'Eu estou começando a entender.', pos: 'verb' },
    { id: 'pl_verbs_15', deckId: 'pl_verbs', en: 'wiem', pt: 'eu sei', exampleHtml: 'Nie <b>wiem</b>.', examplePt: 'Eu não sei.', pos: 'verb' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_verbs · Verbos do dia a dia ───────────────────────────────────────
  pl_verbs_0: 'być',
  pl_verbs_1: 'iéstém',
  pl_verbs_2: 'iéstéś',
  pl_verbs_3: 'miéć',
  pl_verbs_4: 'mam',
  pl_verbs_5: 'max',
  pl_verbs_6: 'rrćéć',
  pl_verbs_7: 'rrtsén',
  pl_verbs_8: 'iść',
  pl_verbs_9: 'idén',
  pl_verbs_10: 'róbić',
  pl_verbs_11: 'róbjen',
  pl_verbs_12: 'muvić',
  pl_verbs_13: 'muvjen',
  pl_verbs_14: 'rózumiéć',
  pl_verbs_15: 'viém',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/verbs.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): everyday verbs deck"
```

---

### Task 5: `pl_people` deck — family & people

**Files:**
- Create: `src/content/pl/people.ts`
- Modify: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_PEOPLE_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/people.ts
import type { Deck } from '../../types'

export const PL_PEOPLE_DECK: Deck = {
  id: 'pl_people',
  name: 'Família e pessoas',
  emoji: '👪',
  desc: 'Falar da família e das pessoas ao redor',
  level: 1,
  cards: [
    { id: 'pl_people_0', deckId: 'pl_people', en: 'rodzina', pt: 'família', exampleHtml: 'Moja <b>rodzina</b> jest duża.', examplePt: 'Minha família é grande.', pos: 'noun' },
    { id: 'pl_people_1', deckId: 'pl_people', en: 'mama', pt: 'mãe', exampleHtml: 'To jest moja <b>mama</b>.', examplePt: 'Esta é a minha mãe.', pos: 'noun' },
    { id: 'pl_people_2', deckId: 'pl_people', en: 'tata', pt: 'pai', exampleHtml: 'To jest mój <b>tata</b>.', examplePt: 'Este é o meu pai.', pos: 'noun' },
    { id: 'pl_people_3', deckId: 'pl_people', en: 'brat', pt: 'irmão', exampleHtml: 'Mam jednego <b>brata</b>.', examplePt: 'Eu tenho um irmão.', pos: 'noun' },
    { id: 'pl_people_4', deckId: 'pl_people', en: 'siostra', pt: 'irmã', exampleHtml: 'Moja <b>siostra</b> mieszka w Warszawie.', examplePt: 'Minha irmã mora em Varsóvia.', pos: 'noun' },
    { id: 'pl_people_5', deckId: 'pl_people', en: 'syn', pt: 'filho', exampleHtml: 'Mam <b>syna</b>.', examplePt: 'Eu tenho um filho.', pos: 'noun' },
    { id: 'pl_people_6', deckId: 'pl_people', en: 'córka', pt: 'filha', exampleHtml: 'Moja <b>córka</b> ma pięć lat.', examplePt: 'Minha filha tem cinco anos.', pos: 'noun' },
    { id: 'pl_people_7', deckId: 'pl_people', en: 'mąż', pt: 'marido', exampleHtml: 'Mój <b>mąż</b> gotuje kolację.', examplePt: 'Meu marido está cozinhando o jantar.', pos: 'noun' },
    { id: 'pl_people_8', deckId: 'pl_people', en: 'żona', pt: 'esposa', exampleHtml: 'Jego <b>żona</b> jest lekarką.', examplePt: 'A esposa dele é médica.', pos: 'noun' },
    { id: 'pl_people_9', deckId: 'pl_people', en: 'dziecko', pt: 'criança', exampleHtml: 'To <b>dziecko</b> jest bardzo grzeczne.', examplePt: 'Essa criança é muito educada.', pos: 'noun' },
    { id: 'pl_people_10', deckId: 'pl_people', en: 'przyjaciel', pt: 'amigo', exampleHtml: 'Mój <b>przyjaciel</b> mieszka blisko.', examplePt: 'Meu amigo mora perto.', pos: 'noun' },
    { id: 'pl_people_11', deckId: 'pl_people', en: 'dziewczyna', pt: 'namorada / menina', exampleHtml: 'Ta <b>dziewczyna</b> jest miła.', examplePt: 'Essa menina é gentil.', pos: 'noun' },
    { id: 'pl_people_12', deckId: 'pl_people', en: 'chłopak', pt: 'namorado / menino', exampleHtml: 'Ten <b>chłopak</b> jest wysoki.', examplePt: 'Esse menino é alto.', pos: 'noun' },
    { id: 'pl_people_13', deckId: 'pl_people', en: 'człowiek', pt: 'pessoa', exampleHtml: 'To jest dobry <b>człowiek</b>.', examplePt: 'Essa é uma boa pessoa.', pos: 'noun' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_people · Família e pessoas ────────────────────────────────────────
  pl_people_0: 'ródzina',
  pl_people_1: 'mama',
  pl_people_2: 'tata',
  pl_people_3: 'brat',
  pl_people_4: 'śóstra',
  pl_people_5: 'syn',
  pl_people_6: 'tsurka',
  pl_people_7: 'monj',
  pl_people_8: 'jóna',
  pl_people_9: 'dźétsko',
  pl_people_10: 'pjyiaćél',
  pl_people_11: 'dźévtchyna',
  pl_people_12: 'rruópak',
  pl_people_13: 'tchuóviék',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/people.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): family & people deck"
```

---

### Task 6: `pl_emergency` deck — emergencies & help

**Files:**
- Create: `src/content/pl/emergency.ts`
- Modify: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_EMERGENCY_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/emergency.ts
import type { Deck } from '../../types'

export const PL_EMERGENCY_DECK: Deck = {
  id: 'pl_emergency',
  name: 'Emergências e ajuda',
  emoji: '🚨',
  desc: 'Pedir ajuda e nomear os serviços de emergência',
  level: 1,
  cards: [
    { id: 'pl_emergency_0', deckId: 'pl_emergency', en: 'pomocy!', pt: 'socorro!', exampleHtml: '<b>Pomocy</b>! Ktoś mi pomóż!', examplePt: 'Socorro! Alguém me ajude!', pos: 'noun' },
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
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_emergency · Emergências e ajuda ───────────────────────────────────
  pl_emergency_0: 'pómótsy',
  pl_emergency_1: 'pómóts',
  pl_emergency_2: 'pólitsia',
  pl_emergency_3: 'xpital',
  pl_emergency_4: 'lékaj',
  pl_emergency_5: 'karétka',
  pl_emergency_6: 'pójar',
  pl_emergency_7: 'ńébézpiétchéństvó',
  pl_emergency_8: 'zgubiuém śen',
  pl_emergency_9: 'pótjébujén pómótsy',
  pl_emergency_10: 'zadzvóń pó pómóts',
  pl_emergency_11: 'iéstém rróry',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/emergency.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): emergencies & help deck"
```

---

### Task 7: `pl_feelings` deck — feelings & states

**Files:**
- Create: `src/content/pl/feelings.ts`
- Modify: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_FEELINGS_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/feelings.ts
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
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_feelings · Sentimentos e estados ──────────────────────────────────
  pl_feelings_0: 'xtchénślivy',
  pl_feelings_1: 'smutny',
  pl_feelings_2: 'zméntchóny',
  pl_feelings_3: 'guódny',
  pl_feelings_4: 'spragnióny',
  pl_feelings_5: 'zuy',
  pl_feelings_6: 'pjéstraxóny',
  pl_feelings_7: 'zaskótchóny',
  pl_feelings_8: 'rróry',
  pl_feelings_9: 'zdróvy',
  pl_feelings_10: 'zaieńty',
  pl_feelings_11: 'vólny',
  pl_feelings_12: 'dóbje',
  pl_feelings_13: 'źlé',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/feelings.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): feelings & states deck"
```

---

### Task 8: `pl_questions` deck — question & linking words

**Files:**
- Create: `src/content/pl/questions.ts`
- Modify: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_QUESTIONS_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/questions.ts
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
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_questions · Perguntas e conectivos ────────────────────────────────
  pl_questions_0: 'tsó',
  pl_questions_1: 'któ',
  pl_questions_2: 'gdźé',
  pl_questions_3: 'kiédy',
  pl_questions_4: 'dlatchégó',
  pl_questions_5: 'iak',
  pl_questions_6: 'ilé',
  pl_questions_7: 'ktury',
  pl_questions_8: 'i',
  pl_questions_9: 'alé',
  pl_questions_10: 'albó',
  pl_questions_11: 'bó',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/questions.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): question & linking words deck"
```

---

### Task 9: `pl_basics` deck — colors & describing

**Files:**
- Create: `src/content/pl/basics.ts`
- Modify: `src/content/authored/phoneticsPl.ts`

**Interfaces:**
- Consumes: `PHONETICS_PL` (appends).
- Produces: `PL_BASICS_DECK: Deck`.

- [ ] **Step 1: Create the deck file**

```typescript
// src/content/pl/basics.ts
import type { Deck } from '../../types'

export const PL_BASICS_DECK: Deck = {
  id: 'pl_basics',
  name: 'Cores e descrições',
  emoji: '🎨',
  desc: 'Cores e os adjetivos mais comuns',
  level: 1,
  cards: [
    { id: 'pl_basics_0', deckId: 'pl_basics', en: 'czerwony', pt: 'vermelho', exampleHtml: 'Ten kolor jest <b>czerwony</b>.', examplePt: 'Essa cor é vermelha.', pos: 'adj' },
    { id: 'pl_basics_1', deckId: 'pl_basics', en: 'niebieski', pt: 'azul', exampleHtml: 'Ten kolor jest <b>niebieski</b>.', examplePt: 'Essa cor é azul.', pos: 'adj' },
    { id: 'pl_basics_2', deckId: 'pl_basics', en: 'zielony', pt: 'verde', exampleHtml: 'Ten kolor jest <b>zielony</b>.', examplePt: 'Essa cor é verde.', pos: 'adj' },
    { id: 'pl_basics_3', deckId: 'pl_basics', en: 'żółty', pt: 'amarelo', exampleHtml: 'Ten kolor jest <b>żółty</b>.', examplePt: 'Essa cor é amarela.', pos: 'adj' },
    { id: 'pl_basics_4', deckId: 'pl_basics', en: 'czarny', pt: 'preto', exampleHtml: 'Ten kolor jest <b>czarny</b>.', examplePt: 'Essa cor é preta.', pos: 'adj' },
    { id: 'pl_basics_5', deckId: 'pl_basics', en: 'biały', pt: 'branco', exampleHtml: 'Ten kolor jest <b>biały</b>.', examplePt: 'Essa cor é branca.', pos: 'adj' },
    { id: 'pl_basics_6', deckId: 'pl_basics', en: 'duży', pt: 'grande', exampleHtml: 'To jest <b>duży</b> dom.', examplePt: 'Essa é uma casa grande.', pos: 'adj' },
    { id: 'pl_basics_7', deckId: 'pl_basics', en: 'mały', pt: 'pequeno', exampleHtml: 'To jest <b>mały</b> pies.', examplePt: 'Esse é um cachorro pequeno.', pos: 'adj' },
    { id: 'pl_basics_8', deckId: 'pl_basics', en: 'nowy', pt: 'novo', exampleHtml: 'Mam <b>nowy</b> telefon.', examplePt: 'Eu tenho um telefone novo.', pos: 'adj' },
    { id: 'pl_basics_9', deckId: 'pl_basics', en: 'stary', pt: 'velho', exampleHtml: 'To jest <b>stary</b> samochód.', examplePt: 'Esse é um carro velho.', pos: 'adj' },
    { id: 'pl_basics_10', deckId: 'pl_basics', en: 'dobry', pt: 'bom', exampleHtml: 'To jest <b>dobry</b> pomysł.', examplePt: 'Essa é uma boa ideia.', pos: 'adj' },
    { id: 'pl_basics_11', deckId: 'pl_basics', en: 'zły', pt: 'ruim', exampleHtml: 'To jest <b>zły</b> pomysł.', examplePt: 'Essa é uma má ideia.', pos: 'adj' },
    { id: 'pl_basics_12', deckId: 'pl_basics', en: 'ładny', pt: 'bonito', exampleHtml: 'To jest <b>ładny</b> widok.', examplePt: 'Essa é uma bela vista.', pos: 'adj' },
    { id: 'pl_basics_13', deckId: 'pl_basics', en: 'brzydki', pt: 'feio', exampleHtml: 'To jest <b>brzydki</b> sweter.', examplePt: 'Esse é um suéter feio.', pos: 'adj' },
  ],
}
```

- [ ] **Step 2: Append to the phonetics table**

```typescript
  // ── pl_basics · Cores e descrições ───────────────────────────────────────
  pl_basics_0: 'tchérvóny',
  pl_basics_1: 'ńébiéski',
  pl_basics_2: 'źélóny',
  pl_basics_3: 'júuty',
  pl_basics_4: 'tcharny',
  pl_basics_5: 'biauy',
  pl_basics_6: 'dujy',
  pl_basics_7: 'mauy',
  pl_basics_8: 'nóvy',
  pl_basics_9: 'stary',
  pl_basics_10: 'dóbry',
  pl_basics_11: 'zuy',
  pl_basics_12: 'uadny',
  pl_basics_13: 'bjydki',
```

- [ ] **Step 3: Confirm it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/content/pl/basics.ts src/content/authored/phoneticsPl.ts
git commit -m "feat(pl): colors & describing deck"
```

---

### Task 10: Assemble `PL_DECKS` and test the corpus

**Files:**
- Create: `src/content/pl/index.ts`
- Create: `src/content/pl/pl.test.ts`

**Interfaces:**
- Consumes: `PL_HELLO_DECK, PL_NUMBERS_DECK, PL_VERBS_DECK, PL_PEOPLE_DECK, PL_EMERGENCY_DECK, PL_FEELINGS_DECK, PL_QUESTIONS_DECK, PL_BASICS_DECK` (Tasks 2–9), `PHONETICS_PL` (Tasks 2–9), `photoSrc` from `../photoSrc` (existing).
- Produces: `PL_DECKS: Deck[]` — consumed by Task 11's course registration.

- [ ] **Step 1: Write the failing test**

```typescript
// src/content/pl/pl.test.ts
import { describe, it, expect } from 'vitest'
import { PL_DECKS } from './index'
import { isSentence } from '../../core/text'

const PL_CARDS = PL_DECKS.flatMap(d => d.cards)

describe('Polish corpus', () => {
  it('ships an A1 floor worth studying', () => {
    expect(PL_CARDS.length).toBeGreaterThanOrEqual(100)
  })

  it('gives every card the fields a session needs', () => {
    for (const c of PL_CARDS) {
      expect(c.id, c.id).toBeTruthy()
      expect(c.en.trim(), c.id).not.toBe('')
      expect(c.pt.trim(), c.id).not.toBe('')
      expect(c.examplePt.trim(), c.id).not.toBe('')
      expect(c.exampleHtml, c.id).toContain('<b>')
    }
  })

  it('keeps every card inside the deck that owns it', () => {
    for (const deck of PL_DECKS) {
      for (const c of deck.cards) expect(c.deckId, c.id).toBe(deck.id)
    }
  })

  it('gives every card a unique id', () => {
    const ids = PL_CARDS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('starts every deck at level 1 — this phase is the A1 floor only', () => {
    for (const deck of PL_DECKS) expect(deck.level, deck.id).toBe(1)
  })

  it('gives most cards a sentence to build and dictate', () => {
    const withSentence = PL_CARDS.filter(isSentence).length
    expect(withSentence / PL_CARDS.length).toBeGreaterThan(0.6)
  })

  it('gives every card a pronunciation', () => {
    const missing = PL_CARDS.filter(c => !c.phonetic?.trim())
    expect(missing.map(c => c.id)).toEqual([])
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: FAIL — `Cannot find module './index'` (it doesn't exist yet).

- [ ] **Step 3: Write `src/content/pl/index.ts`**

```typescript
// src/content/pl/index.ts
import type { Deck } from '../../types'
import { PL_HELLO_DECK } from './greetings'
import { PL_NUMBERS_DECK } from './numbers'
import { PL_VERBS_DECK } from './verbs'
import { PL_PEOPLE_DECK } from './people'
import { PL_EMERGENCY_DECK } from './emergency'
import { PL_FEELINGS_DECK } from './feelings'
import { PL_QUESTIONS_DECK } from './questions'
import { PL_BASICS_DECK } from './basics'
import { PHONETICS_PL } from '../authored/phoneticsPl'
import { PHOTOS_PL } from '../authored/photosPl'
import { photoSrc } from '../photoSrc'

const RAW_DECKS: Deck[] = [
  PL_HELLO_DECK,
  PL_NUMBERS_DECK,
  PL_VERBS_DECK,
  PL_PEOPLE_DECK,
  PL_EMERGENCY_DECK,
  PL_FEELINGS_DECK,
  PL_QUESTIONS_DECK,
  PL_BASICS_DECK,
]

/**
 * The Polish course's decks, with pronunciation and photographs attached —
 * the same merge english.ts and content/es/index.ts each do for their own
 * course. PHONETICS_PL is hand-authored (see
 * authored/PHONETICS-CONVENTION.md §2); PHOTOS_PL is written by
 * `node scripts/fetch-photos.mjs --course=pl` (Task 13) and starts empty, so
 * this file is correct before that script has ever run.
 */
export const PL_DECKS: Deck[] = RAW_DECKS.map(deck => ({
  ...deck,
  cards: deck.cards.map(card => ({
    ...card,
    phonetic: PHONETICS_PL[card.id] ?? card.phonetic,
    photo: photoSrc(PHOTOS_PL, card.id) ?? card.photo,
  })),
}))
```

- [ ] **Step 4: Create the empty photos table it imports**

```typescript
// src/content/authored/photosPl.ts
// GENERATED by scripts/fetch-photos.mjs — DO NOT EDIT BY HAND.
//
// Card id -> public path of its photograph. Merged onto the Polish decks,
// the same way PHOTOS_ES is for Spanish. Empty until Task 13 runs the
// script; a card with no entry here simply renders without a picture.
export const PHOTOS_PL: Record<string, string> = {}
```

- [ ] **Step 5: Run the test again to verify it passes**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: PASS — 7 tests green.

- [ ] **Step 6: Commit**

```bash
git add src/content/pl/index.ts src/content/pl/pl.test.ts src/content/authored/photosPl.ts
git commit -m "feat(pl): assemble the A1 deck set"
```

---

### Task 11: Register the `pl-pl` course

**Files:**
- Modify: `src/types.ts`
- Modify: `src/courses/types.ts`
- Modify: `src/courses/active.ts`
- Modify: `src/courses/index.ts`
- Modify: `src/courses/courses.test.ts`

**Interfaces:**
- Consumes: `PL_DECKS` (Task 10).
- Produces: `courseById('pl-pl'): Course`, `ALL_COURSES` including it — consumed by Home/Settings (already generic) and Task 12's course-switcher fix.

- [ ] **Step 1: Write the failing tests**

In `src/courses/courses.test.ts`, change the existing test and add new ones:

```typescript
// Replace this existing test:
  it('offers exactly the two courses', () => {
    expect(ALL_COURSES.map(c => c.id)).toEqual(['en-nz', 'es-latam'])
  })
// with:
  it('offers all three courses', () => {
    expect(ALL_COURSES.map(c => c.id)).toEqual(['en-nz', 'es-latam', 'pl-pl'])
  })
```

Then add, inside the same `describe('course registry', ...)` block:

```typescript
  it('starts the Polish course in its own voice, with no accent picker', () => {
    const pl = courseById('pl-pl')
    expect(pl.defaultAccent).toBe('pl-PL')
    expect(pl.accents).toEqual(['pl-PL'])
  })

  it('gives Polish English\'s beginner shape, not Spanish\'s', () => {
    const pl = courseById('pl-pl')
    expect(pl.modalities).toContain('recognize')
    expect(pl.speakDirection).toBe('repeat')
    expect(pl.gated).toBe(true)
    expect(pl.weanOffPortuguese).toBe(false)
  })

  it('ships no practice feature for Polish yet — Phase 1 is vocabulary only', () => {
    expect(courseById('pl-pl').practice).toEqual([])
  })
```

`ACTIVE_RULES`'s two Spanish-only overrides are already conditioned on
`ACTIVE_COURSE.id === 'es-latam'`, so they take the default for Polish the
same way they already do for English — there's no new branch to add or test,
and `ACTIVE_COURSE` is a load-time constant this test file can't switch to
`pl-pl` anyway (see `src/courses/active.ts`), so no test is added for
`ACTIVE_RULES` here.

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/courses/courses.test.ts`
Expected: FAIL — `courseById('pl-pl')` returns the English course (unknown id falls back to `DEFAULT_COURSE`), so `defaultAccent`/`accents`/etc. assertions fail, and the three-course list assertion fails.

- [ ] **Step 3: Add `'pl-PL'` to `Accent`**

In `src/types.ts`, change:

```typescript
export type Accent =
  | 'en-NZ' | 'en-AU' | 'en-GB' | 'en-US'
  | 'es-419' | 'es-MX' | 'es-AR' | 'es-ES'
```

to:

```typescript
export type Accent =
  | 'en-NZ' | 'en-AU' | 'en-GB' | 'en-US'
  | 'es-419' | 'es-MX' | 'es-AR' | 'es-ES'
  | 'pl-PL'
```

- [ ] **Step 4: Add `'pl-pl'` to `CourseId`**

In `src/courses/types.ts`, change:

```typescript
export type CourseId = 'en-nz' | 'es-latam'
```

to:

```typescript
export type CourseId = 'en-nz' | 'es-latam' | 'pl-pl'
```

- [ ] **Step 5: Add `'pl-pl'` to the known-ids list**

In `src/courses/active.ts`, change:

```typescript
const KNOWN: readonly CourseId[] = ['en-nz', 'es-latam']
```

to:

```typescript
const KNOWN: readonly CourseId[] = ['en-nz', 'es-latam', 'pl-pl']
```

- [ ] **Step 6: Register the course**

In `src/courses/index.ts`, add the import and the `Course` object, and wire it into the registry. Add near the other content imports:

```typescript
import { PL_DECKS } from '../content/pl'
```

Add after the `ES_LATAM` object (before `const COURSES = {...}`):

```typescript
const PL_PL: Course = {
  id: 'pl-pl',
  name: 'Polonês',
  shortName: 'Polonês',
  emoji: '🦅',
  flag: '🇵🇱',
  storageKey: 'polski',
  // A single standard accent — no picker needed, the same as any course
  // with one sensible voice. pickVoice's family-fallback already handles an
  // unlisted family correctly (see speak.ts), so no FALLBACKS entry either.
  defaultAccent: 'pl-PL',
  accents: ['pl-PL'],
  // Lucas has never seen a word of Polish — this is English's shape, not
  // Spanish's: recognition before production, and a real gate, because
  // there is nothing to skip ahead to yet.
  modalities: ['recognize', 'listen', 'type', 'build', 'dictate', 'speak'],
  speakDirection: 'repeat',
  gated: true,
  // No interference layer exists for Polish — there is no lexical
  // relationship to Portuguese to defend against, so this flag (which only
  // means something for interference-tagged cards) stays off.
  weanOffPortuguese: false,
  // Phase 1 ships vocabulary only. Grows in a later phase once a specific
  // feature has material of its own — see the design doc.
  practice: [],
  decks: PL_DECKS,
  roleplays: [],
  dialogues: [],
}
```

Update the registry and the exported list:

```typescript
const COURSES: Record<CourseId, Course> = {
  'en-nz': EN_NZ,
  'es-latam': ES_LATAM,
  'pl-pl': PL_PL,
}

export const ALL_COURSES: Course[] = [EN_NZ, ES_LATAM, PL_PL]
```

- [ ] **Step 7: Run the tests again to verify they pass**

Run: `npx vitest run src/courses/courses.test.ts`
Expected: PASS — all tests green, including the new ones.

- [ ] **Step 8: Run the full suite and the type-checker**

Run: `npx vitest run`
Expected: PASS, no regressions.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/types.ts src/courses/types.ts src/courses/active.ts src/courses/index.ts src/courses/courses.test.ts
git commit -m "feat(pl): register the Polish course"
```

---

### Task 12: Fix Home's course switcher for three courses

**Context:** `CourseSwitch` in `src/screens/Home.tsx` currently does `ALL_COURSES.find(c => c.id !== ACTIVE_COURSE.id)` — correct for exactly two courses, but with three it silently always lands on the same one of the other two, and there is no way to reach the third course from Home's one-tap shortcut at all (Settings' `CoursePicker` already handles any number of courses correctly and needs no change).

**Files:**
- Modify: `src/screens/Home.tsx`
- Modify: `src/screens/Home.test.tsx`

**Interfaces:**
- Consumes: `ALL_COURSES`, `ACTIVE_COURSE`, `writeActiveCourseId` (existing, from `../courses`).

- [ ] **Step 1: Write the failing test**

Add to `src/screens/Home.test.tsx`, inside a new `describe` block:

```typescript
describe('course switcher', () => {
  it('opens a chip for every other course on tap, not just one', async () => {
    const user = userEvent.setup()
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    await user.click(screen.getByTestId('course-switch'))
    // The active course (English, in these tests) is es-latam and pl-pl's
    // sibling — both of the others must be reachable, not just whichever
    // ALL_COURSES happens to list first.
    expect(screen.getByTestId('course-switch-es-latam')).toBeInTheDocument()
    expect(screen.getByTestId('course-switch-pl-pl')).toBeInTheDocument()
  })

  it('switches straight to the tapped course', async () => {
    const user = userEvent.setup()
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} syncStatus="unconfigured" />)
    await user.click(screen.getByTestId('course-switch'))
    await user.click(screen.getByTestId('course-switch-pl-pl'))
    expect(localStorage.getItem('english-nz.course')).toBe('pl-pl')
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/screens/Home.test.tsx -t "course switcher"`
Expected: FAIL — `course-switch-es-latam` / `course-switch-pl-pl` don't exist; the current button has no such testids and no open/closed state. (`window.location.reload` will also throw in jsdom on the second test — that's expected and covered by Step 3's implementation using the existing guarded pattern below, matching how `CoursePicker` in Settings already calls it.)

- [ ] **Step 3: Replace `CourseSwitch`**

In `src/screens/Home.tsx`, add `useState` to the existing React import (line 1):

```typescript
import { useMemo, useState } from 'react'
```

Replace the whole `CourseSwitch` function with:

```typescript
/**
 * One tap to change language, on the screen he opens every day.
 *
 * Settings has the same switch with an explanation beside it; this is the
 * shortcut for someone who moves between courses often. With only two
 * courses this used to jump straight to "the other one" — that assumption
 * broke the day a third course existed, since there is no longer a single
 * "other" to jump to. So this opens a small chip for each course that isn't
 * the active one, and tapping a chip does what the old button did: writes
 * the choice and reloads (see src/courses/active.ts for why that's the whole
 * trick), no confirmation, because there is nothing to confirm any more —
 * the name and sync code follow the person now, and no progress is touched
 * by moving.
 */
function CourseSwitch() {
  const [open, setOpen] = useState(false)
  const others = ALL_COURSES.filter(c => c.id !== ACTIVE_COURSE.id)
  if (others.length === 0) return null

  if (!open) {
    return (
      <button
        type="button"
        data-testid="course-switch"
        aria-label={`Studying ${ACTIVE_COURSE.name}. Change course`}
        onClick={() => setOpen(true)}
        className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-card2 px-3 text-lg transition active:scale-[0.98]"
      >
        <span aria-hidden="true">{ACTIVE_COURSE.flag}</span>
        <span aria-hidden="true" className="text-xs text-muted">⇄</span>
      </button>
    )
  }

  return (
    <div className="flex h-11 shrink-0 items-center gap-1 rounded-full bg-card2 px-2">
      {others.map(course => (
        <button
          key={course.id}
          type="button"
          data-testid={`course-switch-${course.id}`}
          aria-label={`Switch to ${course.name}`}
          onClick={() => { if (writeActiveCourseId(course.id)) window.location.reload() }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg transition active:scale-[0.98]"
        >
          <span aria-hidden="true">{course.flag}</span>
        </button>
      ))}
      <button
        type="button"
        aria-label="Cancel"
        onClick={() => setOpen(false)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs text-muted"
      >
        ✕
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run the tests again to verify they pass**

Run: `npx vitest run src/screens/Home.test.tsx`
Expected: PASS — all tests in the file, including the two new ones.

- [ ] **Step 5: Run the full suite and the type-checker**

Run: `npx vitest run`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/screens/Home.tsx src/screens/Home.test.tsx
git commit -m "fix: Home's course switcher scales past two courses"
```

---

### Task 13: Photographs for the concrete A1 cards

**Context:** Optional relative to the rest of Phase 1 — the app is fully correct with zero Polish photos (every card just renders without one, the same graceful path English and Spanish both already exercise). This task only needs to run whenever a `PEXELS_API_KEY` is available (shell env or `.env.local`); it is safe to defer to a separate session.

**Files:**
- Modify: `scripts/fetch-photos.mjs`

**Interfaces:** None — a script, not app code.

- [ ] **Step 1: Add a `SELECTION_PL` table and register the `pl` course**

In `scripts/fetch-photos.mjs`, near `SELECTION_ES`, add:

```javascript
// Card id -> Pexels search query, English (Pexels' index is English regardless
// of the course). Only the concrete nouns get a query — family members and
// the emergency services, the same restraint SELECTION_ES uses: an adjective
// like "duży" (big) or a function word like "gdzie" (where) has no single
// honest photo, so it is left out on purpose rather than given a misleading
// stock image.
const SELECTION_PL = {
  pl_people_0: 'family portrait outdoors',
  pl_people_1: 'mother smiling',
  pl_people_2: 'father smiling',
  pl_people_3: 'brother siblings',
  pl_people_4: 'sister siblings',
  pl_people_5: 'son child boy',
  pl_people_6: 'daughter child girl',
  pl_people_7: 'husband and wife',
  pl_people_8: 'wife and husband',
  pl_people_9: 'child playing',
  pl_emergency_2: 'police car',
  pl_emergency_3: 'hospital building exterior',
  pl_emergency_4: 'doctor in white coat',
  pl_emergency_5: 'ambulance vehicle',
  pl_emergency_6: 'house fire flames',
  pl_basics_0: 'red paint background texture',
  pl_basics_1: 'blue paint background texture',
  pl_basics_2: 'green paint background texture',
  pl_basics_3: 'yellow paint background texture',
}
```

Add `pl` to the `COURSES` map:

```javascript
  pl: {
    selection: SELECTION_PL,
    photosTs: path.join(AUTHORED_DIR, 'photosPl.ts'),
    creditsTs: path.join(AUTHORED_DIR, 'photoCreditsPl.ts'),
    photosExport: 'PHOTOS_PL',
    creditsExport: 'PHOTO_CREDITS_PL',
  },
```

Update the unknown-course error message:

```javascript
  console.error(`unknown --course=${COURSE} (expected "en", "es", or "pl")`)
```

- [ ] **Step 2: Run it**

Requires `PEXELS_API_KEY` set (shell env or `.env.local` — see the comment near the top of `scripts/fetch-photos.mjs` for the exact format).

Run: `node scripts/fetch-photos.mjs --course=pl`
Expected: writes `src/content/authored/photosPl.ts` and `photoCreditsPl.ts` with an entry for each id in `SELECTION_PL` (skip this task entirely, leaving `photosPl.ts` as Task 10 left it, if no key is available — nothing else in this plan depends on it).

- [ ] **Step 3: Confirm the corpus test still passes**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add scripts/fetch-photos.mjs src/content/authored/photosPl.ts src/content/authored/photoCreditsPl.ts
git commit -m "feat(pl): photographs for the concrete A1 cards"
```

---

### Task 14: Content self-review pass

**Context:** The design doc's mitigation for "Lucas can't proofread Polish himself" is process, not a person — every card checked against a second independent source before the phase is called done. This task is that check, run once against the finished corpus rather than per-deck, so it catches inconsistencies between decks too (e.g. the same word transliterated two different ways).

**Files:**
- Modify: any of `src/content/pl/*.ts`, `src/content/authored/phoneticsPl.ts` — only where Step 1 finds a real discrepancy.

**Interfaces:** None.

- [ ] **Step 1: Cross-check every word against an independent source**

For each of the 112 cards across `src/content/pl/greetings.ts`, `numbers.ts`, `verbs.ts`, `people.ts`, `emergency.ts`, `feelings.ts`, `questions.ts`, `basics.ts`: look up the Polish word (via `WebSearch`/`WebFetch` against a Polish-English or Polish-Portuguese dictionary — e.g. Wiktionary's Polish entries, or `pl.pons.com`) and confirm:

1. The word means what `pt` says it means.
2. The word is the form claimed (e.g. `jestem` really is first-person singular of `być`, not some other person).
3. No diacritic is missing or extra (Polish spelling is unforgiving here — `ą` vs `a`, `ł` vs `l`, `ć/ń/ś/ź` vs their plain letters are different words).

Fix any card whose `en` or `pt` field turns out wrong. This is expected to be a short list, not a rewrite — the vocabulary was drawn from standard A1 material — but any hit here is a real error a learner would otherwise memorize wrong with no way to notice.

- [ ] **Step 2: Re-derive every `phonetic` entry from the convention table**

Re-read the phonetics convention table at the top of this plan (also now in `PHONETICS-CONVENTION.md` §2, Task 1) and re-apply it to each of the 112 entries in `phoneticsPl.ts` mechanically, word by word. This catches transcription slips made while authoring 112 entries in one pass — a rule applied inconsistently between, say, Task 3 and Task 7. Fix any entry that doesn't match what the table produces.

- [ ] **Step 3: Check the example sentences are grammatically real Polish**

Skim every `exampleHtml`/`examplePt` pair. Polish case-marks nouns and adjectives, so a sentence that looks like a word-for-word template (as several in this plan deliberately are, to dodge case-agreement risk — see the design doc's mitigation) needs confirming it's still natural, not just safe. Reword any sentence that reads as stilted or unnatural to a Polish speaker, keeping the same target word bolded.

- [ ] **Step 4: Run the suite after any fixes**

Run: `npx vitest run src/content/pl/pl.test.ts`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

If Steps 1–3 found nothing to fix, skip the commit — there's nothing to record. Otherwise:

```bash
git add src/content/pl/
git commit -m "fix(pl): content self-review corrections"
```

---

### Task 15: Full verification

**Files:** None — verification only.

- [ ] **Step 1: Full test suite**

Run: `npx vitest run`
Expected: every test passes, including all of `pl.test.ts`, the updated `courses.test.ts`, and the updated `Home.test.tsx`.

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Browser verification**

Start the dev server (`mcp__Claude_Browser__preview_start` with `{name: "kiwi"}`), then in the page:

```javascript
localStorage.setItem('english-nz.course', 'pl-pl')
```

Reload. Confirm via `get_page_text` / `read_page`:
- Home renders with Polish deck names ("Primeiras palavras", "Números e tempo", …) — `unlockedLevel` starts at 1, so only level-1 decks (all of them, in Phase 1) are open.
- Tapping the course switcher (`course-switch`) reveals two chips (English, Spanish) rather than jumping straight to one.
- Opening a deck and studying a card shows the Polish word, its Portuguese translation, and its phonetic guide (e.g. `pl_hello_0` → `cześć` / `oi / olá` / `tchéść`).
- `speak()` requests `pl-PL` (confirm via `read_console_messages` or a quick `javascript_tool` check of `window.speechSynthesis` — this environment has 0 installed voices, same as the other two courses, so silence rather than an error is the expected, already-covered-by-tests outcome; `pickVoice`'s null-return path is what's being exercised, not audio).

- [ ] **Step 4: Report**

Summarize what shipped (deck count, card count, commits) and hand off to Phase 2 planning (A2 vocabulary) whenever the owner wants it — per the design doc, that's its own plan, written fresh when that phase starts.
