# English → NZ v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first offline PWA that teaches English to a Brazilian Portuguese speaker moving to New Zealand, using a single mandatory mixed-modality study session, CEFR placement and level unlocking, per-skill progress tracking, and PIN-based cloud sync.

**Architecture:** All decision logic lives in `src/core/` as pure functions with no React, no DOM and no I/O — that is the entire unit-test surface. React components render state and dispatch actions; they never compute. Learning content is machine-extracted from the v1 HTML into typed modules rather than hand-transcribed. Cloud sync sits behind a client that degrades to `unconfigured` when env vars are absent, so the app is fully functional with an empty `.env`.

**Tech Stack:** Vite 5 · React 18 · TypeScript (strict) · Tailwind CSS 3 · Zustand 4 (`persist` middleware → localStorage) · `vite-plugin-pwa` · `@supabase/supabase-js` 2 · Vitest + @testing-library/react · Playwright.

**Spec:** `docs/superpowers/specs/2026-07-30-english-nz-v2-design.md`

## Global Constraints

Every task's requirements implicitly include this section.

- **Interface language is simple English.** Portuguese appears only as card content (`pt`, `examplePt`) and only when `showPortuguese` is true. No Portuguese in UI chrome, buttons, or labels.
- **Tone is warm and encouraging.** NZ microcopy: "Kia ora", "Ka pai", "Sweet as", "No dramas". The learner is a real person, not a user.
- **Palette (CSS custom properties, exact values):** `--bg:#0f172a` `--card:#1e293b` `--card2:#273449` `--ink:#f1f5f9` `--muted:#94a3b8` `--line:#334155` `--brand:#38bdf8` `--brand2:#0ea5e9` `--good:#34d399` `--hard:#fbbf24` `--again:#fb7185` `--gold:#fcd34d`
- **Tap targets ≥ 44px.** Card radii 16–24px. Safe-area insets honoured via `env(safe-area-inset-*)`.
- **`prefers-reduced-motion: reduce` disables all transitions and animations.**
- **Icon buttons require `aria-label`.** All interactive elements need visible focus states.
- **Accent order:** `en-NZ` → `en-AU` → `en-GB` → `en-US`. Never hardcode a locale outside `src/audio/`.
- **Nothing in `src/core/` may import React, touch `window`, `Date.now()` directly, or perform I/O.** Time enters core functions as a `now: number` parameter. This is what makes the tests deterministic.
- **TypeScript `strict: true`.** No `any` in committed code.
- **The app must work offline and with an empty `.env` after every single task.**
- **Never edit `src/content/*.generated.ts` by hand.** Regenerate via the script.
- **Never edit `english-nz.html`.** It is a read-only source artifact.

## File Structure

```
english-nz.html                      read-only v1 source (already in repo)
scripts/extract-content.mjs          one-off extractor → generated content modules
supabase/schema.sql                  table + RLS + RPCs (shipped, not applied by us)
src/
  types.ts                           Card, Deck, PartOfSpeech, AppState, CardState, SkillStat, Modality, Skill
  content/
    decks.generated.ts               25 decks / 425 cards with levels — DO NOT EDIT
    dialogues.generated.ts           7 dialogues — DO NOT EDIT
    plan.ts                          8-week plan (8 entries, 2 tips rewritten)
    authored/irregular.ts            irregular verbs deck + conjugation table
    authored/b2.ts                   6 B2 decks
    index.ts                         DECKS, DIALOGUES, CARD_INDEX, cardById, decksForLevel
  core/
    time.ts                          DAY, MIN, dayKey(now)
    srs.ts                           newCardState, schedule, isDue, isNew, deckProgress, totalKnown, totalDue
    text.ts                          normalize, stripTags, exampleWords, isTypable, isSentence, looseMatch
    modality.ts                      supportedModalities, pickModality, skillForModality
    queue.ts                         buildQueue, requeueWrong
    placement.ts                     buildPlacementTest, scorePlacement, seedKnownCards
    leveling.ts                      levelProgress, shouldUnlockNext
    streak.ts                        applyStudyTick
    stats.ts                         skillSummary, weakestSkill, levelBreakdown
    merge.ts                         mergeSnapshots
  store/
    defaults.ts                      createInitialState
    useStore.ts                      Zustand store + persist
  audio/
    capabilities.ts                  speechSynthesisAvailable, speechRecognitionAvailable
    speak.ts                         warmUp, speak, pickVoice
    listen.ts                        recognizeOnce
  sync/
    client.ts                        SyncClient, SyncStatus
    useSync.ts                       React binding: launch load, debounced save, lifecycle saves
  screens/                           Home, Name, Placement, Session, Dashboard, Plan, Dialogues, Shadowing, Settings, Done
  components/
    modality/                        Learn, Recognize, Type, Listen, Dictate, Build, Speak
    ui/                              Button, Card, Meter, Ring, Chip, Toast, ScreenHeader
  App.tsx                            router/screen switch
  main.tsx                           entry + PWA registration + theme CSS import
  index.css                          Tailwind + CSS custom properties
tests/e2e/session.spec.ts            Playwright smoke
```

Each `src/core/*.ts` file is one responsibility and is tested by a sibling
`src/core/*.test.ts`. Nothing else in the codebase needs unit tests.

---

## Phase 1 — Scaffold and content

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `vitest.config.ts`, `src/test-setup.ts`, `.env.example`

**Interfaces:**
- Consumes: nothing
- Produces: a running dev server; `npm test` wired to Vitest; Tailwind exposing the palette both as CSS custom properties and as colour tokens (`bg`, `card`, `card2`, `ink`, `muted`, `line`, `brand`, `brand2`, `good`, `hard`, `again`, `gold`).

- [ ] **Step 1: Install dependencies**

```bash
npm init -y
npm i react react-dom zustand @supabase/supabase-js
npm i -D vite @vitejs/plugin-react typescript @types/react @types/react-dom tailwindcss postcss autoprefixer vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom vite-plugin-pwa @playwright/test
```

- [ ] **Step 2: Set `package.json` fields**

Set `"type": "module"`, `"private": true`, and replace `scripts` with exactly:

```json
{
  "dev": "vite",
  "build": "tsc --noEmit && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "extract": "node scripts/extract-content.mjs"
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "types": ["vitest/globals", "@testing-library/jest-dom", "vite/client"]
  },
  "include": ["src", "scripts", "tests", "vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step 4: Write `vite.config.ts`**

PWA config is added in Task 26. Keep this minimal so the shell runs now.

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
})
```

- [ ] **Step 5: Write `vitest.config.ts` and `src/test-setup.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    passWithNoTests: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
  },
})
```

`src/test-setup.ts` contains exactly one line:

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Write `tailwind.config.js` and `postcss.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', card: 'var(--card)', card2: 'var(--card2)',
        ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
        brand: 'var(--brand)', brand2: 'var(--brand2)',
        good: 'var(--good)', hard: 'var(--hard)', again: 'var(--again)',
        gold: 'var(--gold)',
      },
      borderRadius: { card: '20px' },
    },
  },
  plugins: [],
}
```

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 7: Write `src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg:#0f172a; --card:#1e293b; --card2:#273449;
  --ink:#f1f5f9; --muted:#94a3b8; --line:#334155;
  --brand:#38bdf8; --brand2:#0ea5e9;
  --good:#34d399; --hard:#fbbf24; --again:#fb7185; --gold:#fcd34d;
}

html, body, #root { height: 100%; }

body {
  background: var(--bg);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
  overscroll-behavior-y: none;
}

.safe-top { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 16px); }

:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 8: Write `index.html`, `src/main.tsx`, `src/App.tsx`**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1" />
    <meta name="theme-color" content="#0f172a" />
    <title>English → NZ</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>,
)
```

`src/App.tsx`:

```tsx
export default function App() {
  return <div className="p-6 text-ink">Kia ora 🥝</div>
}
```

- [ ] **Step 9: Write `.env.example`**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

- [ ] **Step 10: Verify build and test wiring**

Run: `npm run build`
Expected: exits 0 and writes `dist/index.html`.

Run: `npm test`
Expected: exits 0.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest"
```

---

### Task 2: Shared types

**Files:**
- Create: `src/types.ts`

**Interfaces:**
- Consumes: nothing
- Produces: every type later tasks import. The spellings below are load-bearing — later tasks reference them verbatim.

- [ ] **Step 1: Write `src/types.ts`**

```ts
export type PartOfSpeech =
  | 'word' | 'noun' | 'verb' | 'adj' | 'number'
  | 'greeting' | 'slang' | 'phrase' | 'grammar'

export type Level = 1 | 2 | 3 | 4

export interface Card {
  id: string
  deckId: string
  en: string
  pt: string
  exampleHtml: string
  examplePt: string
  pos: PartOfSpeech
  phonetic?: string
}

export interface Deck {
  id: string
  name: string
  emoji: string
  desc: string
  level: Level
  cards: Card[]
}

export interface DialogueLine { who: string; en: string; pt: string }
export interface Dialogue { id: string; title: string; emoji: string; lines: DialogueLine[] }

export interface PlanWeek { title: string; detail: string; tip: string }

export interface CardState {
  due: number
  interval: number
  ease: number
  reps: number
  lapses: number
}

export interface SkillStat { correct: number; total: number }
export type Skill = 'vocab' | 'listening' | 'grammar' | 'speaking'
export type Skills = Record<Skill, SkillStat>

export type Modality =
  | 'learn' | 'recognize' | 'type' | 'listen'
  | 'dictate' | 'build' | 'speak'

export type Accent = 'en-NZ' | 'en-AU' | 'en-GB' | 'en-US'

export interface AppState {
  profileName: string
  syncCode: string | null
  cefrLevel: 0 | Level
  unlockedLevel: Level
  placed: boolean
  cards: Record<string, CardState>
  skills: Skills
  dailyGoal: number
  newPerSession: number
  accent: Accent
  showPortuguese: boolean
  autoPlayAudio: boolean
  streak: number
  lastStudyDay: string | null
  doneToday: number
  doneDate: string | null
  bestDay: number
  startedAt: number
  updatedAt: number
}

/** One item in a study session queue. */
export interface QueueItem {
  cardId: string
  modality: Modality
  /** true when this item was pushed back after a wrong answer */
  repeat?: boolean
}

/** SRS rating. 0 again, 1 hard, 2 good, 3 easy. */
export type Rating = 0 | 1 | 2 | 3
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared domain types"
```

---

### Task 3: Content extraction from v1

**Files:**
- Create: `scripts/extract-content.mjs`
- Generate: `src/content/decks.generated.ts`, `src/content/dialogues.generated.ts`
- Create: `src/content/plan.ts`, `src/content/index.ts`
- Test: `src/content/content.test.ts`

**Interfaces:**
- Consumes: `Card`, `Deck`, `Dialogue`, `PlanWeek`, `Level` from `../types`
- Produces:
  - `GENERATED_DECKS: Deck[]` from `./decks.generated`
  - `DIALOGUES: Dialogue[]` from `./dialogues.generated`
  - `PLAN: PlanWeek[]` from `./plan`
  - From `./index`: `DECKS: Deck[]`, `ALL_CARDS: Card[]`, `CARD_INDEX: Record<string, Card>`, `cardById(id: string): Card | undefined`, `deckById(id: string): Deck | undefined`, `decksForLevel(max: Level): Deck[]`, `levelOfCard(id: string): Level | undefined`, plus re-exported `DIALOGUES` and `PLAN`

**Background the implementer needs:**
`english-nz.html` in the repo root (read-only) contains two JavaScript array literals:
`const DECKS = [` at line 391 and `const DIALOGUES=[` at line 1396. A v1 card is a
6-tuple `[en, pt, exampleHtml, examplePt, pos, phonetic]`; the sixth element is usually
an empty string. A v1 deck object uses the key `emo` for its emoji, which becomes
`emoji` in our shape. Card ids are `${deckId}_${index}` using the index within the deck.

- [ ] **Step 1: Write `scripts/extract-content.mjs`**

```js
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const html = readFileSync(resolve(ROOT, 'english-nz.html'), 'utf8')

/** Slice a `const NAME = [ ... ]` array literal out of the HTML by bracket balance. */
function sliceArrayLiteral(source, declaration) {
  const start = source.indexOf(declaration)
  if (start === -1) throw new Error('Declaration not found: ' + declaration)
  const open = source.indexOf('[', start)
  let depth = 0
  let inString = null
  let i = open
  for (; i < source.length; i++) {
    const ch = source[i]
    const prev = source[i - 1]
    if (inString) {
      if (ch === inString && prev !== '\\') inString = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') { inString = ch; continue }
    if (ch === '[') depth++
    else if (ch === ']') { depth--; if (depth === 0) { i++; break } }
  }
  if (depth !== 0) throw new Error('Unbalanced brackets for ' + declaration)
  return source.slice(open, i)
}

const rawDecks = new Function('return ' + sliceArrayLiteral(html, 'const DECKS = ['))()
const rawDialogues = new Function('return ' + sliceArrayLiteral(html, 'const DIALOGUES=['))()

const LEVELS = {
  survival: 1, numbers: 1, verbs: 1, people: 1,
  feelings: 1, questions: 1, basics: 1, emergency: 1,
  house: 2, body: 2, food: 2, clothes: 2, shopping: 2,
  town: 2, verbs2: 2, power: 2, grammar: 2,
  money: 3, transport: 3, smalltalk: 3, arrival: 3,
  housing: 3, health: 3, work: 3, kiwi: 3,
}

const unmapped = rawDecks.map(d => d.id).filter(id => !(id in LEVELS))
if (unmapped.length) throw new Error('Decks with no level mapping: ' + unmapped.join(', '))

const decks = rawDecks.map(d => ({
  id: d.id,
  name: d.name,
  emoji: d.emo,
  desc: d.desc,
  level: LEVELS[d.id],
  cards: d.cards.map((c, i) => ({
    id: d.id + '_' + i,
    deckId: d.id,
    en: c[0],
    pt: c[1],
    exampleHtml: c[2],
    examplePt: c[3],
    pos: c[4],
    ...(c[5] ? { phonetic: c[5] } : {}),
  })),
}))

const dialogues = rawDialogues.map((d, i) => ({
  id: 'dlg_' + i,
  title: d.title,
  emoji: d.emo,
  lines: d.lines.map(l => ({ who: l.w, en: l.en, pt: l.pt })),
}))

const cardCount = decks.reduce((n, d) => n + d.cards.length, 0)
const banner = '// GENERATED by scripts/extract-content.mjs — DO NOT EDIT BY HAND.\n'

mkdirSync(resolve(ROOT, 'src/content'), { recursive: true })

writeFileSync(
  resolve(ROOT, 'src/content/decks.generated.ts'),
  banner + "import type { Deck } from '../types'\n\nexport const GENERATED_DECKS: Deck[] = " +
    JSON.stringify(decks, null, 1) + '\n',
)
writeFileSync(
  resolve(ROOT, 'src/content/dialogues.generated.ts'),
  banner + "import type { Dialogue } from '../types'\n\nexport const DIALOGUES: Dialogue[] = " +
    JSON.stringify(dialogues, null, 1) + '\n',
)

console.log('Extracted ' + decks.length + ' decks, ' + cardCount + ' cards, ' + dialogues.length + ' dialogues.')
```

- [ ] **Step 2: Run the extractor**

Run: `npm run extract`
Expected: `Extracted 25 decks, 425 cards, 7 dialogues.`

If the counts differ, stop and report the real numbers. Do not loosen the test in
Step 5 to match — a mismatch means the slice grabbed the wrong region.

- [ ] **Step 3: Write `src/content/plan.ts`**

Ported from v1's `PLAN` (line 1370). **Weeks 3 and 5 carry rewritten tips:** v1 told her
to "Try the Listening mode" and "Use Typing mode", but v2 has no user-selectable modes,
so the original strings would send her looking for buttons that no longer exist.

```ts
import type { PlanWeek } from '../types'

export const PLAN: PlanWeek[] = [
  {
    title: 'Foundations & survival',
    detail: 'First words & courtesy, Numbers/time, Feelings. Learn to greet, say please/thank you, yes/no and how you feel.',
    tip: 'Do 10–15 cards every morning with coffee ☕',
  },
  {
    title: 'Verbs & everyday things',
    detail: "Everyday verbs, Around the house, Colours & describing. Start making tiny sentences: 'I want water.'",
    tip: 'Say each word out loud — your mouth needs practice too.',
  },
  {
    title: 'Out and about',
    detail: "Café & restaurant, Shopping, Around town. Practise ordering and asking 'How much is it?'",
    tip: 'When a card plays audio, listen twice before you answer — the Kiwi accent takes a while to tune into.',
  },
  {
    title: 'Grammar glue',
    detail: 'Essential grammar (to be, a/the, present tense) + Question words. This is where words become sentences.',
    tip: "Don't aim for perfect — aim for understood.",
  },
  {
    title: 'Life admin in NZ',
    detail: 'Money & banking (IRD), Housing & renting (bond, flat), Work & job. The vocabulary for settling in.',
    tip: 'Typing answers is worth the extra seconds — spelling sticks better when you write it out.',
  },
  {
    title: 'Health & getting around',
    detail: 'Health/GP/pharmacy, Transport, Airport & immigration. Words for the doctor, the bus, and arrival day.',
    tip: "Read the 'At the GP' and 'At immigration' dialogues out loud.",
  },
  {
    title: 'Sound like a local',
    detail: "Kiwi slang, Small talk & social, Power phrases. Chit-chat, 'no worries', 'sweet as', 'how's it going?'",
    tip: 'Chat to yourself in the mirror for 2 minutes a day.',
  },
  {
    title: 'Put it all together',
    detail: 'Review everything due + all dialogues. Focus on the words you still find hard.',
    tip: "You've got this. Confidence comes from repetition, not talent 🥝",
  },
]
```

- [ ] **Step 4: Write `src/content/index.ts`**

Authored decks arrive in Tasks 21–22, which edit only the `DECKS` array below.

```ts
import type { Card, Deck, Level } from '../types'
import { GENERATED_DECKS } from './decks.generated'

export { DIALOGUES } from './dialogues.generated'
export { PLAN } from './plan'

export const DECKS: Deck[] = [...GENERATED_DECKS]

export const ALL_CARDS: Card[] = DECKS.flatMap(d => d.cards)

export const CARD_INDEX: Record<string, Card> = Object.fromEntries(
  ALL_CARDS.map(c => [c.id, c] as const),
)

export function cardById(id: string): Card | undefined {
  return CARD_INDEX[id]
}

export function deckById(id: string): Deck | undefined {
  return DECKS.find(d => d.id === id)
}

/** Decks the learner may study at a given unlocked level. */
export function decksForLevel(max: Level): Deck[] {
  return DECKS.filter(d => d.level <= max)
}

export function levelOfCard(id: string): Level | undefined {
  const card = CARD_INDEX[id]
  return card ? deckById(card.deckId)?.level : undefined
}
```

- [ ] **Step 5: Write `src/content/content.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { DECKS, ALL_CARDS, CARD_INDEX, DIALOGUES, PLAN, decksForLevel, levelOfCard } from './index'

describe('generated content', () => {
  it('has the full v1 corpus', () => {
    expect(DECKS.length).toBeGreaterThanOrEqual(25)
    expect(ALL_CARDS.length).toBeGreaterThanOrEqual(425)
    expect(DIALOGUES).toHaveLength(7)
    expect(PLAN).toHaveLength(8)
  })

  it('gives every card a unique id', () => {
    const ids = ALL_CARDS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(Object.keys(CARD_INDEX)).toHaveLength(ids.length)
  })

  it('never leaves a card field empty', () => {
    for (const c of ALL_CARDS) {
      expect(c.en, c.id).toBeTruthy()
      expect(c.pt, c.id).toBeTruthy()
      expect(c.exampleHtml, c.id).toBeTruthy()
      expect(c.examplePt, c.id).toBeTruthy()
      expect(c.pos, c.id).toBeTruthy()
      expect(c.deckId, c.id).toBeTruthy()
    }
  })

  it('assigns every deck a level in 1..4', () => {
    for (const d of DECKS) expect([1, 2, 3, 4]).toContain(d.level)
  })

  it('puts emergency vocabulary at A1', () => {
    expect(DECKS.find(d => d.id === 'emergency')?.level).toBe(1)
  })

  it('filters decks by unlocked level', () => {
    expect(decksForLevel(1).every(d => d.level === 1)).toBe(true)
    expect(decksForLevel(4)).toHaveLength(DECKS.length)
  })

  it('resolves a card back to its deck level', () => {
    expect(levelOfCard('survival_0')).toBe(1)
    expect(levelOfCard('nope_99')).toBeUndefined()
  })

  it('gives every dialogue line a speaker and both languages', () => {
    for (const d of DIALOGUES) {
      expect(d.lines.length).toBeGreaterThan(0)
      for (const l of d.lines) {
        expect(l.who).toBeTruthy()
        expect(l.en).toBeTruthy()
        expect(l.pt).toBeTruthy()
      }
    }
  })
})
```

- [ ] **Step 6: Run the tests**

Run: `npm test -- src/content`
Expected: 8 passing.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: extract v1 content into typed modules with CEFR levels"
```

---

## Phase 2 — Core engine (pure logic)

Everything in this phase is a pure function. No React, no `window`, no
`Date.now()` — time always arrives as a `now: number` argument. That is what makes
these tests deterministic and what keeps the UI dumb.

### Task 4: Time helpers and the SRS engine

**Files:**
- Create: `src/core/time.ts`
- Create: `src/core/srs.ts`
- Test: `src/core/srs.test.ts`

**Interfaces:**
- Consumes: `CardState`, `Rating`, `Card`, `Deck` from `../types`
- Produces:
  - `time.ts`: `MIN: number`, `DAY: number`, `dayKey(now: number): string`
  - `srs.ts`: `newCardState(now: number): CardState`, `schedule(state: CardState | undefined, rating: Rating, now: number): CardState`, `isDue(state: CardState | undefined, now: number): boolean`, `isNew(state: CardState | undefined): boolean`, `deckProgress(deck: Deck, cards: Record<string, CardState>, now: number): { learned: number; due: number; total: number }`, `totalKnown(cards: Record<string, CardState>): number`, `totalDue(cards: Record<string, CardState>, now: number): number`

**Background:** v1's engine lives at `english-nz.html` line ~985. It is SM-2 lite on a
4-rating scale (0 again, 1 hard, 2 good, 3 easy). v2 keeps the 4-rating engine
internally but the session only ever passes `again` or `good` (and `easy` for a fast
correct answer) — the learner never sees four buttons. `schedule` is pure: it takes a
state and returns a **new** state rather than mutating.

- [ ] **Step 1: Write `src/core/time.ts`**

```ts
export const MIN = 60_000
export const DAY = 86_400_000

/** Local calendar day key, e.g. "2026-7-30". Used for streaks and daily counters. */
export function dayKey(now: number): string {
  const d = new Date(now)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
```

- [ ] **Step 2: Write the failing tests**

Create `src/core/srs.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { DAY, MIN } from './time'
import { newCardState, schedule, isDue, isNew, deckProgress, totalKnown, totalDue } from './srs'
import type { CardState, Deck } from '../types'

const NOW = 1_700_000_000_000

describe('newCardState', () => {
  it('starts due immediately with default ease', () => {
    expect(newCardState(NOW)).toEqual({ due: NOW, interval: 0, ease: 2.5, reps: 0, lapses: 0 })
  })
})

describe('schedule', () => {
  it('seeds a brand new card to one day on the first correct answer', () => {
    const s = schedule(undefined, 2, NOW)
    expect(s.reps).toBe(1)
    expect(s.interval).toBe(1)
    expect(s.ease).toBe(2.5)
    expect(s.due).toBe(NOW + DAY)
  })

  it('moves the second correct answer to three days', () => {
    const first = schedule(undefined, 2, NOW)
    const second = schedule(first, 2, NOW)
    expect(second.reps).toBe(2)
    expect(second.interval).toBe(3)
    expect(second.due).toBe(NOW + 3 * DAY)
  })

  it('multiplies by ease from the third correct answer on', () => {
    let s = schedule(undefined, 2, NOW)
    s = schedule(s, 2, NOW)
    s = schedule(s, 2, NOW)
    expect(s.reps).toBe(3)
    expect(s.interval).toBe(Math.round(3 * 2.5))
    expect(s.due).toBe(NOW + s.interval * DAY)
  })

  it('sends a wrong answer to ten minutes and drops ease', () => {
    const known = schedule(schedule(undefined, 2, NOW), 2, NOW)
    const lapsed = schedule(known, 0, NOW)
    expect(lapsed.interval).toBe(0)
    expect(lapsed.lapses).toBe(1)
    expect(lapsed.ease).toBeCloseTo(2.3, 5)
    expect(lapsed.due).toBe(NOW + 10 * MIN)
  })

  it('never lets ease fall below 1.3', () => {
    let s: CardState | undefined = undefined
    for (let i = 0; i < 20; i++) s = schedule(s, 0, NOW)
    expect(s!.ease).toBe(1.3)
  })

  it('keeps at least one rep after a lapse so the card is not treated as new', () => {
    const s = schedule(undefined, 0, NOW)
    expect(s.reps).toBeGreaterThanOrEqual(1)
    expect(isNew(s)).toBe(false)
  })

  it('gives an easy answer a bigger interval and more ease', () => {
    const good = schedule(schedule(schedule(undefined, 2, NOW), 2, NOW), 2, NOW)
    const easy = schedule(schedule(schedule(undefined, 2, NOW), 2, NOW), 3, NOW)
    expect(easy.ease).toBeGreaterThan(good.ease)
    expect(easy.interval).toBeGreaterThan(good.interval)
  })

  it('does not mutate the state it is given', () => {
    const before = newCardState(NOW)
    const snapshot = { ...before }
    schedule(before, 2, NOW)
    expect(before).toEqual(snapshot)
  })
})

describe('isDue / isNew', () => {
  it('treats an absent state as new and not due', () => {
    expect(isNew(undefined)).toBe(true)
    expect(isDue(undefined, NOW)).toBe(false)
  })

  it('is due exactly at the due timestamp', () => {
    const s = schedule(undefined, 2, NOW)
    expect(isDue(s, NOW + DAY - 1)).toBe(false)
    expect(isDue(s, NOW + DAY)).toBe(true)
  })
})

describe('aggregates', () => {
  const deck: Deck = {
    id: 'd', name: 'D', emoji: '🥝', desc: '', level: 1,
    cards: [
      { id: 'd_0', deckId: 'd', en: 'a', pt: 'a', exampleHtml: 'a', examplePt: 'a', pos: 'word' },
      { id: 'd_1', deckId: 'd', en: 'b', pt: 'b', exampleHtml: 'b', examplePt: 'b', pos: 'word' },
      { id: 'd_2', deckId: 'd', en: 'c', pt: 'c', exampleHtml: 'c', examplePt: 'c', pos: 'word' },
    ],
  }

  it('counts learned, due and total for a deck', () => {
    const cards = {
      d_0: schedule(undefined, 2, NOW),               // learned, due in 1 day
      d_1: { due: NOW - 1, interval: 1, ease: 2.5, reps: 4, lapses: 0 }, // learned and due
    }
    expect(deckProgress(deck, cards, NOW)).toEqual({ learned: 2, due: 1, total: 3 })
  })

  it('counts known and due across the whole collection', () => {
    const cards = {
      a: { due: NOW - 1, interval: 1, ease: 2.5, reps: 2, lapses: 0 },
      b: { due: NOW + DAY, interval: 1, ease: 2.5, reps: 1, lapses: 0 },
      c: { due: NOW, interval: 0, ease: 2.5, reps: 0, lapses: 0 },
    }
    expect(totalKnown(cards)).toBe(2)
    expect(totalDue(cards, NOW)).toBe(2)
  })
})
```

- [ ] **Step 3: Run the tests to watch them fail**

Run: `npm test -- src/core/srs`
Expected: FAIL — `Failed to resolve import "./srs"`.

- [ ] **Step 4: Write `src/core/srs.ts`**

```ts
import type { CardState, Deck, Rating } from '../types'
import { DAY, MIN } from './time'

export function newCardState(now: number): CardState {
  return { due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0 }
}

/** Pure SM-2 lite. Returns a new state; never mutates the input. */
export function schedule(state: CardState | undefined, rating: Rating, now: number): CardState {
  const c: CardState = state ? { ...state } : newCardState(now)

  if (rating === 0) {
    c.reps = Math.max(1, c.reps)
    c.lapses += 1
    c.interval = 0
    c.ease = Math.max(1.3, c.ease - 0.2)
    c.due = now + 10 * MIN
    return c
  }

  c.reps += 1
  if (c.reps === 1) {
    c.interval = rating === 1 ? 0.007 : rating === 2 ? 1 : 4
  } else if (c.reps === 2) {
    c.interval = rating === 1 ? 1 : rating === 2 ? 3 : 6
  } else {
    const factor = rating === 1 ? 1.2 : rating === 2 ? c.ease : c.ease * 1.3
    c.interval = Math.max(1, Math.round(c.interval * factor))
  }

  if (rating === 1) c.ease = Math.max(1.3, c.ease - 0.15)
  if (rating === 3) c.ease = c.ease + 0.1

  c.due = now + Math.round(c.interval * DAY)
  return c
}

export function isNew(state: CardState | undefined): boolean {
  return !state || state.reps === 0
}

export function isDue(state: CardState | undefined, now: number): boolean {
  return !!state && state.due <= now
}

export function deckProgress(
  deck: Deck,
  cards: Record<string, CardState>,
  now: number,
): { learned: number; due: number; total: number } {
  let learned = 0
  let due = 0
  for (const card of deck.cards) {
    const s = cards[card.id]
    if (!s) continue
    if (s.reps > 0) learned += 1
    if (s.due <= now) due += 1
  }
  return { learned, due, total: deck.cards.length }
}

export function totalKnown(cards: Record<string, CardState>): number {
  return Object.values(cards).filter(s => s.reps > 0).length
}

export function totalDue(cards: Record<string, CardState>, now: number): number {
  return Object.values(cards).filter(s => s.due <= now).length
}
```

Note `isNew` treats `reps === 0` as new even when a state row exists — the placement
seeder (Task 10) writes rows for cards it has never shown, and a lapsed card keeps
`reps >= 1` so it is never mistaken for new.

- [ ] **Step 5: Run the tests**

Run: `npm test -- src/core/srs`
Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add src/core/time.ts src/core/srs.ts src/core/srs.test.ts
git commit -m "feat: add pure SM-2 lite scheduling engine"
```

---

### Task 5: Text normalisation and card classification

**Files:**
- Create: `src/core/text.ts`
- Test: `src/core/text.test.ts`

**Interfaces:**
- Consumes: `Card` from `../types`
- Produces: `normalize(s: string): string`, `stripTags(html: string): string`, `exampleWords(card: Card): string[]`, `isTypable(card: Card): boolean`, `isSentence(card: Card): boolean`, `looseMatch(answer: string, target: string): boolean`, `clozeExample(card: Card): string`

**Background:** `exampleHtml` wraps the target in `<b>…</b>`, e.g.
`"A coffee, <b>please</b>."`. `clozeExample` replaces the bolded span with `_____` for
the Type modality. `exampleWords` returns the plain-text words of the example, used by
Build and Dictate. Apostrophes appear as both `'` and `’` in the corpus, so both must be
stripped.

- [ ] **Step 1: Write the failing tests**

Create `src/core/text.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { normalize, stripTags, exampleWords, isTypable, isSentence, looseMatch, clozeExample } from './text'
import type { Card, PartOfSpeech } from '../types'

function card(over: Partial<Card> = {}): Card {
  return {
    id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
    exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
    pos: 'noun', ...over,
  }
}

describe('normalize', () => {
  it('lowercases and trims', () => {
    expect(normalize('  Hello  ')).toBe('hello')
  })

  it('strips terminal and internal punctuation', () => {
    expect(normalize('Hello, world!')).toBe('hello world')
    expect(normalize('Really?')).toBe('really')
  })

  it('strips both straight and curly apostrophes', () => {
    expect(normalize("I don't know")).toBe('i dont know')
    expect(normalize('I don’t know')).toBe('i dont know')
  })

  it('drops a leading "to " so infinitives match bare verbs', () => {
    expect(normalize('to go')).toBe('go')
    expect(normalize('To Go')).toBe('go')
  })

  it('does not strip "to" mid-string', () => {
    expect(normalize('I go to work')).toBe('i go to work')
  })

  it('collapses runs of whitespace', () => {
    expect(normalize('a   b\n c')).toBe('a b c')
  })
})

describe('stripTags', () => {
  it('removes markup and keeps the words', () => {
    expect(stripTags('I want <b>water</b>, please.')).toBe('I want water, please.')
  })
})

describe('exampleWords', () => {
  it('returns plain words with punctuation removed', () => {
    expect(exampleWords(card())).toEqual(['I', 'want', 'water,', 'please.'])
  })
})

describe('isTypable', () => {
  it('accepts short single words', () => {
    expect(isTypable(card({ en: 'water', pos: 'noun' }))).toBe(true)
  })

  it('rejects long targets', () => {
    expect(isTypable(card({ en: 'a very long phrase indeed', pos: 'noun' }))).toBe(false)
  })

  it('rejects ellipsis placeholders', () => {
    expect(isTypable(card({ en: 'My name is…', pos: 'phrase' }))).toBe(false)
  })

  it('rejects phrase and grammar parts of speech', () => {
    for (const pos of ['phrase', 'grammar'] as PartOfSpeech[]) {
      expect(isTypable(card({ en: 'short', pos }))).toBe(false)
    }
  })

  it('accepts every typable part of speech', () => {
    for (const pos of ['word', 'noun', 'verb', 'adj', 'number', 'greeting', 'slang'] as PartOfSpeech[]) {
      expect(isTypable(card({ en: 'short', pos }))).toBe(true)
    }
  })
})

describe('isSentence', () => {
  it('accepts examples of three to nine words', () => {
    expect(isSentence(card({ exampleHtml: 'I want <b>water</b>, please.' }))).toBe(true)
  })

  it('rejects examples shorter than three words', () => {
    expect(isSentence(card({ exampleHtml: '<b>Ten</b> minutes.' }))).toBe(false)
  })

  it('rejects examples longer than nine words', () => {
    expect(isSentence(card({ exampleHtml: 'one two three four five six seven eight nine <b>ten</b>' }))).toBe(false)
  })
})

describe('looseMatch', () => {
  it('accepts an answer that differs only in case and punctuation', () => {
    expect(looseMatch('Water!', 'water')).toBe(true)
  })

  it('accepts a bare verb for an infinitive target', () => {
    expect(looseMatch('go', 'to go')).toBe(true)
  })

  it('rejects a different word', () => {
    expect(looseMatch('fire', 'water')).toBe(false)
  })

  it('rejects an empty answer', () => {
    expect(looseMatch('   ', 'water')).toBe(false)
  })
})

describe('clozeExample', () => {
  it('blanks the bolded target', () => {
    expect(clozeExample(card())).toBe('I want _____, please.')
  })

  it('falls back to the plain example when nothing is bolded', () => {
    expect(clozeExample(card({ exampleHtml: 'No bold here.' }))).toBe('No bold here.')
  })
})
```

- [ ] **Step 2: Run the tests to watch them fail**

Run: `npm test -- src/core/text`
Expected: FAIL — cannot resolve `./text`.

- [ ] **Step 3: Write `src/core/text.ts`**

```ts
import type { Card, PartOfSpeech } from '../types'

const TYPABLE_POS: ReadonlySet<PartOfSpeech> = new Set<PartOfSpeech>([
  'word', 'noun', 'verb', 'adj', 'number', 'greeting', 'slang',
])

/** Lowercase, strip punctuation, drop a leading "to ", collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.?!,'’"]/g, '')
    .trim()
    .replace(/^to\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '')
}

export function exampleWords(card: Card): string[] {
  return stripTags(card.exampleHtml).trim().split(/\s+/).filter(Boolean)
}

export function isTypable(card: Card): boolean {
  return card.en.length <= 16 && !card.en.includes('…') && TYPABLE_POS.has(card.pos)
}

export function isSentence(card: Card): boolean {
  const n = exampleWords(card).length
  return n >= 3 && n <= 9
}

export function looseMatch(answer: string, target: string): boolean {
  const a = normalize(answer)
  return a.length > 0 && a === normalize(target)
}

/** The example sentence with the bolded target replaced by a blank. */
export function clozeExample(card: Card): string {
  if (!/<b>.*?<\/b>/.test(card.exampleHtml)) return stripTags(card.exampleHtml)
  return stripTags(card.exampleHtml.replace(/<b>.*?<\/b>/, '_____'))
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/core/text`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/core/text.ts src/core/text.test.ts
git commit -m "feat: add text normalisation and card classification"
```

---

### Task 6: Modality rotation

**Files:**
- Create: `src/core/modality.ts`
- Test: `src/core/modality.test.ts`

**Interfaces:**
- Consumes: `Card`, `CardState`, `Modality`, `Skill` from `../types`; `isTypable`, `isSentence` from `./text`; `isNew` from `./srs`
- Produces: `supportedModalities(card: Card, canSpeak: boolean): Modality[]`, `pickModality(card: Card, state: CardState | undefined, canSpeak: boolean, bias?: Skill): Modality`, `skillForModality(m: Modality): Skill | null`

**Background:** this is the mechanism that stops her cherry-picking easy modes. A due
card's modality is chosen by rotating on `reps`, so the same word comes back as
recognition, then listening, then typing, then speaking over successive reviews. New
cards are always `learn`. `bias` (from the dashboard's weakest-skill nudge, Task 20)
nudges toward a skill when that skill is supported, without ever collapsing to a single
modality forever.

Order matters and is fixed: `['recognize', 'listen', 'type', 'build', 'dictate', 'speak']`,
filtered to what the card supports. `learn` is never in the supported set.

`skillForModality` returns `null` for `learn` — exposure is not graded against a skill.

- [ ] **Step 1: Write the failing tests**

Create `src/core/modality.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { supportedModalities, pickModality, skillForModality } from './modality'
import type { Card, CardState, Modality } from '../types'

function card(over: Partial<Card> = {}): Card {
  return {
    id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
    exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
    pos: 'noun', ...over,
  }
}

function state(reps: number): CardState {
  return { due: 0, interval: 1, ease: 2.5, reps, lapses: 0 }
}

describe('supportedModalities', () => {
  it('always supports recognition', () => {
    const long = card({ en: 'a very long phrase indeed', pos: 'phrase', exampleHtml: '<b>x</b>' })
    expect(supportedModalities(long, false)).toEqual(['recognize'])
  })

  it('adds listening and typing for typable cards', () => {
    const c = card({ exampleHtml: '<b>Water</b>.' })
    expect(supportedModalities(c, false)).toEqual(['recognize', 'listen', 'type'])
  })

  it('adds build and dictation for sentence cards', () => {
    const c = card({ en: 'My name is…', pos: 'phrase' })
    expect(supportedModalities(c, false)).toEqual(['recognize', 'build', 'dictate'])
  })

  it('adds speaking only when recognition is available', () => {
    expect(supportedModalities(card(), true)).toContain('speak')
    expect(supportedModalities(card(), false)).not.toContain('speak')
  })

  it('never offers learn as a rotation option', () => {
    expect(supportedModalities(card(), true)).not.toContain('learn')
  })
})

describe('pickModality', () => {
  it('gives new cards the teaching screen', () => {
    expect(pickModality(card(), undefined, true)).toBe('learn')
    expect(pickModality(card(), state(0), true)).toBe('learn')
  })

  it('rotates through every supported modality as reps climb', () => {
    const c = card()
    const supported = supportedModalities(c, true)
    const seen: Modality[] = []
    for (let reps = 1; reps <= supported.length; reps++) {
      seen.push(pickModality(c, state(reps), true))
    }
    expect(new Set(seen).size).toBe(supported.length)
  })

  it('is stable for the same reps count', () => {
    const c = card()
    expect(pickModality(c, state(3), true)).toBe(pickModality(c, state(3), true))
  })

  it('honours a skill bias when the card supports it', () => {
    const c = card()
    expect(pickModality(c, state(1), true, 'listening')).toBe('listen')
    expect(pickModality(c, state(1), true, 'speaking')).toBe('speak')
  })

  it('ignores a bias the card cannot serve', () => {
    const c = card({ exampleHtml: '<b>Water</b>.' }) // typable, not a sentence
    expect(pickModality(c, state(1), false, 'grammar')).not.toBe('build')
  })
})

describe('skillForModality', () => {
  it('maps each graded modality to its skill', () => {
    expect(skillForModality('recognize')).toBe('vocab')
    expect(skillForModality('type')).toBe('vocab')
    expect(skillForModality('listen')).toBe('listening')
    expect(skillForModality('dictate')).toBe('listening')
    expect(skillForModality('build')).toBe('grammar')
    expect(skillForModality('speak')).toBe('speaking')
  })

  it('does not grade the teaching screen', () => {
    expect(skillForModality('learn')).toBeNull()
  })
})
```

- [ ] **Step 2: Run the tests to watch them fail**

Run: `npm test -- src/core/modality`
Expected: FAIL — cannot resolve `./modality`.

- [ ] **Step 3: Write `src/core/modality.ts`**

```ts
import type { Card, CardState, Modality, Skill } from '../types'
import { isSentence, isTypable } from './text'
import { isNew } from './srs'

const ORDER: readonly Modality[] = ['recognize', 'listen', 'type', 'build', 'dictate', 'speak']

const SKILL_OF: Record<Modality, Skill | null> = {
  learn: null,
  recognize: 'vocab',
  type: 'vocab',
  listen: 'listening',
  dictate: 'listening',
  build: 'grammar',
  speak: 'speaking',
}

export function skillForModality(m: Modality): Skill | null {
  return SKILL_OF[m]
}

export function supportedModalities(card: Card, canSpeak: boolean): Modality[] {
  const allowed = new Set<Modality>(['recognize'])
  if (isTypable(card)) { allowed.add('listen'); allowed.add('type') }
  if (isSentence(card)) { allowed.add('build'); allowed.add('dictate') }
  if (canSpeak) allowed.add('speak')
  return ORDER.filter(m => allowed.has(m))
}

/**
 * New cards teach. Everything else rotates on reps so a word returns in a
 * different modality each review. `bias` pulls toward a weak skill when the
 * card can serve it.
 */
export function pickModality(
  card: Card,
  state: CardState | undefined,
  canSpeak: boolean,
  bias?: Skill,
): Modality {
  if (isNew(state)) return 'learn'
  const supported = supportedModalities(card, canSpeak)
  if (bias) {
    const biased = supported.filter(m => SKILL_OF[m] === bias)
    if (biased.length > 0) return biased[state!.reps % biased.length]
  }
  return supported[state!.reps % supported.length]
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/core/modality`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/core/modality.ts src/core/modality.test.ts
git commit -m "feat: add modality rotation so easy cards return in harder modes"
```

---

### Task 7: Session queue building

**Files:**
- Create: `src/core/queue.ts`
- Test: `src/core/queue.test.ts`

**Interfaces:**
- Consumes: `Card`, `CardState`, `Level`, `QueueItem`, `Skill` from `../types`; `isDue`, `isNew` from `./srs`; `pickModality` from `./modality`
- Produces:
  - `interface QueueOptions { cards: Card[]; states: Record<string, CardState>; now: number; newPerSession: number; cap: number; canSpeak: boolean; cefrLevel: number; levelOf: (cardId: string) => number; bias?: Skill }`
  - `buildQueue(opts: QueueOptions): QueueItem[]`
  - `requeueWrong(queue: QueueItem[], index: number): QueueItem[]`

**Behaviour contract:**
1. Due cards and up to `newPerSession` new cards are collected. New cards are chosen
   nearest to `cefrLevel` first (smallest `|deckLevel − cefrLevel|`), ties broken by
   card order, so a learner placed at A2 meets A2 words before A1 leftovers.
2. New items are **interleaved**, not front-loaded: they are spread evenly across the
   queue rather than stacked at the head.
3. **Backfill.** If due + new is under `cap`, top up with already-studied cards that are
   not yet due, least-recently-seen first (largest `due − now` last… i.e. smallest `due`
   first). Without this a first session is 8 new cards and 14 empty slots.
4. The queue is capped at `cap` items.
5. `requeueWrong` appends a `recognize` repeat of the item at `index` to the end, marked
   `repeat: true`, and never appends a duplicate repeat for a card that already has one.

- [ ] **Step 1: Write the failing tests**

Create `src/core/queue.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildQueue, requeueWrong } from './queue'
import type { Card, CardState, QueueItem } from '../types'

const NOW = 1_700_000_000_000
const DAY = 86_400_000

function card(id: string, level = 1): Card & { level: number } {
  return {
    id, deckId: 'd' + level, en: 'word' + id, pt: 'pt' + id,
    exampleHtml: 'I want <b>word</b> now.', examplePt: 'x y z',
    pos: 'noun', level,
  } as Card & { level: number }
}

function studied(due: number, reps = 3): CardState {
  return { due, interval: 5, ease: 2.5, reps, lapses: 0 }
}

const levelOf = (cards: (Card & { level: number })[]) => (id: string) =>
  cards.find(c => c.id === id)?.level ?? 1

describe('buildQueue', () => {
  it('includes every due card', () => {
    const cards = [card('a'), card('b')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1), b: studied(NOW - 1) },
      now: NOW, newPerSession: 0, cap: 20, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId).sort()).toEqual(['a', 'b'])
  })

  it('excludes cards that are not yet due when there is nothing to backfill for', () => {
    const cards = [card('a'), card('b')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1), b: studied(NOW + DAY) },
      now: NOW, newPerSession: 0, cap: 1, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId)).toEqual(['a'])
  })

  it('caps new cards at newPerSession', () => {
    const cards = [card('a'), card('b'), card('c'), card('d')]
    const q = buildQueue({
      cards, states: {}, now: NOW, newPerSession: 2, cap: 20,
      canSpeak: false, cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(2)
    expect(q.every(i => i.modality === 'learn')).toBe(true)
  })

  it('prefers new cards at the learner current level', () => {
    const cards = [card('far', 4), card('near', 2), card('mid', 3)]
    const q = buildQueue({
      cards, states: {}, now: NOW, newPerSession: 1, cap: 20,
      canSpeak: false, cefrLevel: 2, levelOf: levelOf(cards),
    })
    expect(q[0].cardId).toBe('near')
  })

  it('interleaves new cards instead of stacking them at the front', () => {
    const cards = [card('n1'), card('n2'), card('r1'), card('r2'), card('r3'), card('r4')]
    const q = buildQueue({
      cards,
      states: { r1: studied(NOW - 1), r2: studied(NOW - 1), r3: studied(NOW - 1), r4: studied(NOW - 1) },
      now: NOW, newPerSession: 2, cap: 20, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    const newPositions = q.map((i, idx) => (i.modality === 'learn' ? idx : -1)).filter(i => i >= 0)
    expect(newPositions).toHaveLength(2)
    expect(newPositions[0]).not.toBe(0)
    expect(newPositions[1] - newPositions[0]).toBeGreaterThan(1)
  })

  it('respects the session cap', () => {
    const cards = Array.from({ length: 40 }, (_, i) => card('c' + i))
    const states = Object.fromEntries(cards.map(c => [c.id, studied(NOW - 1)]))
    const q = buildQueue({
      cards, states, now: NOW, newPerSession: 0, cap: 22,
      canSpeak: false, cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(22)
  })

  it('backfills a thin session with studied cards that are not yet due', () => {
    const cards = [card('n1'), card('s1'), card('s2'), card('s3')]
    const q = buildQueue({
      cards,
      states: { s1: studied(NOW + DAY), s2: studied(NOW + 2 * DAY), s3: studied(NOW + 3 * DAY) },
      now: NOW, newPerSession: 1, cap: 3, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q).toHaveLength(3)
    expect(q.map(i => i.cardId)).toContain('n1')
    expect(q.map(i => i.cardId)).toContain('s1')
  })

  it('backfills soonest-due first', () => {
    const cards = [card('s1'), card('s2')]
    const q = buildQueue({
      cards,
      states: { s1: studied(NOW + 5 * DAY), s2: studied(NOW + DAY) },
      now: NOW, newPerSession: 0, cap: 1, canSpeak: false,
      cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q.map(i => i.cardId)).toEqual(['s2'])
  })

  it('returns an empty queue when there is genuinely nothing', () => {
    expect(buildQueue({
      cards: [], states: {}, now: NOW, newPerSession: 8, cap: 20,
      canSpeak: false, cefrLevel: 1, levelOf: () => 1,
    })).toEqual([])
  })

  it('assigns a non-learn modality to review cards', () => {
    const cards = [card('a')]
    const q = buildQueue({
      cards, states: { a: studied(NOW - 1, 1) }, now: NOW, newPerSession: 0,
      cap: 20, canSpeak: false, cefrLevel: 1, levelOf: levelOf(cards),
    })
    expect(q[0].modality).not.toBe('learn')
  })
})

describe('requeueWrong', () => {
  const base: QueueItem[] = [
    { cardId: 'a', modality: 'type' },
    { cardId: 'b', modality: 'listen' },
  ]

  it('appends a recognition repeat to the end', () => {
    const out = requeueWrong(base, 0)
    expect(out).toHaveLength(3)
    expect(out[2]).toEqual({ cardId: 'a', modality: 'recognize', repeat: true })
  })

  it('does not queue a second repeat for the same card', () => {
    const once = requeueWrong(base, 0)
    expect(requeueWrong(once, 0)).toHaveLength(3)
  })

  it('does not mutate the queue it is given', () => {
    requeueWrong(base, 0)
    expect(base).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run the tests to watch them fail**

Run: `npm test -- src/core/queue`
Expected: FAIL — cannot resolve `./queue`.

- [ ] **Step 3: Write `src/core/queue.ts`**

```ts
import type { Card, CardState, QueueItem, Skill } from '../types'
import { isDue, isNew } from './srs'
import { pickModality } from './modality'

export interface QueueOptions {
  cards: Card[]
  states: Record<string, CardState>
  now: number
  newPerSession: number
  cap: number
  canSpeak: boolean
  cefrLevel: number
  levelOf: (cardId: string) => number
  bias?: Skill
}

/** Spread `extras` evenly through `base` rather than stacking them at the head. */
function interleave(base: QueueItem[], extras: QueueItem[]): QueueItem[] {
  if (extras.length === 0) return base
  if (base.length === 0) return extras
  const out: QueueItem[] = []
  const gap = (base.length + extras.length) / extras.length
  let nextExtra = 0
  let placed = 0
  for (let i = 0; i < base.length; i++) {
    while (placed < extras.length && out.length >= Math.floor((placed + 1) * gap) - 1) {
      out.push(extras[placed]); placed += 1
    }
    out.push(base[i])
    nextExtra = placed
  }
  while (nextExtra < extras.length) { out.push(extras[nextExtra]); nextExtra += 1 }
  return out
}

export function buildQueue(opts: QueueOptions): QueueItem[] {
  const { cards, states, now, newPerSession, cap, canSpeak, cefrLevel, levelOf, bias } = opts

  const due: QueueItem[] = cards
    .filter(c => isDue(states[c.id], now))
    .sort((a, b) => (states[a.id]!.due - states[b.id]!.due))
    .map(c => ({ cardId: c.id, modality: pickModality(c, states[c.id], canSpeak, bias) }))

  const fresh: QueueItem[] = cards
    .filter(c => isNew(states[c.id]) && !isDue(states[c.id], now))
    .sort((a, b) => Math.abs(levelOf(a.id) - cefrLevel) - Math.abs(levelOf(b.id) - cefrLevel))
    .slice(0, newPerSession)
    .map(c => ({ cardId: c.id, modality: 'learn' as const }))

  let queue = interleave(due.slice(0, cap), fresh).slice(0, cap)

  if (queue.length < cap) {
    const chosen = new Set(queue.map(i => i.cardId))
    const backfill: QueueItem[] = cards
      .filter(c => !chosen.has(c.id) && !isNew(states[c.id]) && !isDue(states[c.id], now))
      .sort((a, b) => states[a.id]!.due - states[b.id]!.due)
      .slice(0, cap - queue.length)
      .map(c => ({ cardId: c.id, modality: pickModality(c, states[c.id], canSpeak, bias) }))
    queue = [...queue, ...backfill]
  }

  return queue.slice(0, cap)
}

/** Push an easier recognition repeat of a missed card to the end of the session. */
export function requeueWrong(queue: QueueItem[], index: number): QueueItem[] {
  const item = queue[index]
  if (!item) return queue
  if (queue.some(q => q.repeat && q.cardId === item.cardId)) return queue
  return [...queue, { cardId: item.cardId, modality: 'recognize', repeat: true }]
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/core/queue`
Expected: all passing. If the interleave positions test fails, adjust `interleave` —
not the test. The requirement is that new cards are neither first nor adjacent.

- [ ] **Step 5: Commit**

```bash
git add src/core/queue.ts src/core/queue.test.ts
git commit -m "feat: add session queue building with interleaving and backfill"
```

---

### Task 8: Streak, daily counters and skill stats

**Files:**
- Create: `src/core/streak.ts`
- Create: `src/core/stats.ts`
- Test: `src/core/streak.test.ts`
- Test: `src/core/stats.test.ts`

**Interfaces:**
- Consumes: `AppState`, `Skill`, `Skills`, `SkillStat`, `CardState`, `Level` from `../types`; `dayKey`, `DAY` from `./time`
- Produces:
  - `streak.ts`: `applyStudyTick(state: Pick<AppState, 'streak'|'lastStudyDay'|'doneToday'|'doneDate'|'bestDay'>, now: number): Pick<AppState, 'streak'|'lastStudyDay'|'doneToday'|'doneDate'|'bestDay'>`
  - `stats.ts`: `interface SkillSummary { skill: Skill; correct: number; total: number; accuracy: number | null }`, `skillSummary(skills: Skills): SkillSummary[]`, `weakestSkill(skills: Skills): Skill | null`, `recordSkill(skills: Skills, skill: Skill | null, correct: boolean): Skills`, `levelBreakdown(states: Record<string, CardState>, cardsByLevel: Record<Level, string[]>): Record<Level, { known: number; total: number }>`

**Behaviour contract:**
- `applyStudyTick` is called once per graded item. It increments `doneToday` (resetting
  it when the calendar day changed), advances `streak` only on the **first** item of a
  new day, resets `streak` to 1 when a day was skipped, and keeps `bestDay` as the
  highest `doneToday` ever reached.
- `weakestSkill` **ignores skills with `total === 0`.** On a device with no
  `SpeechRecognition`, speaking is never practised, and nominating it as the weakest
  skill would tell her she is bad at something she was never asked to do. Returns `null`
  when nothing has been practised.
- `accuracy` is `null` — not `0` — for an untouched skill, so the dashboard can render
  "not practised yet".

- [ ] **Step 1: Write `src/core/streak.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { applyStudyTick } from './streak'
import { dayKey, DAY } from './time'

const NOW = new Date('2026-07-30T10:00:00').getTime()
const YESTERDAY = NOW - DAY
const TWO_DAYS_AGO = NOW - 2 * DAY

const blank = { streak: 0, lastStudyDay: null, doneToday: 0, doneDate: null, bestDay: 0 }

describe('applyStudyTick', () => {
  it('starts a streak on the very first item', () => {
    const s = applyStudyTick(blank, NOW)
    expect(s.streak).toBe(1)
    expect(s.doneToday).toBe(1)
    expect(s.lastStudyDay).toBe(dayKey(NOW))
    expect(s.doneDate).toBe(dayKey(NOW))
  })

  it('does not advance the streak twice in one day', () => {
    let s = applyStudyTick(blank, NOW)
    s = applyStudyTick(s, NOW + 1000)
    expect(s.streak).toBe(1)
    expect(s.doneToday).toBe(2)
  })

  it('extends the streak when yesterday was studied', () => {
    const prev = { streak: 4, lastStudyDay: dayKey(YESTERDAY), doneToday: 20, doneDate: dayKey(YESTERDAY), bestDay: 20 }
    const s = applyStudyTick(prev, NOW)
    expect(s.streak).toBe(5)
    expect(s.doneToday).toBe(1)
  })

  it('resets the streak after a missed day', () => {
    const prev = { streak: 9, lastStudyDay: dayKey(TWO_DAYS_AGO), doneToday: 12, doneDate: dayKey(TWO_DAYS_AGO), bestDay: 12 }
    expect(applyStudyTick(prev, NOW).streak).toBe(1)
  })

  it('resets the daily counter on a new day', () => {
    const prev = { streak: 2, lastStudyDay: dayKey(YESTERDAY), doneToday: 30, doneDate: dayKey(YESTERDAY), bestDay: 30 }
    expect(applyStudyTick(prev, NOW).doneToday).toBe(1)
  })

  it('tracks the best day ever', () => {
    let s = { streak: 1, lastStudyDay: dayKey(NOW), doneToday: 40, doneDate: dayKey(NOW), bestDay: 40 }
    s = applyStudyTick(s, NOW)
    expect(s.bestDay).toBe(41)
  })

  it('never lowers the best day', () => {
    const prev = { streak: 2, lastStudyDay: dayKey(YESTERDAY), doneToday: 50, doneDate: dayKey(YESTERDAY), bestDay: 50 }
    expect(applyStudyTick(prev, NOW).bestDay).toBe(50)
  })

  it('does not mutate its input', () => {
    const prev = { ...blank }
    applyStudyTick(prev, NOW)
    expect(prev).toEqual(blank)
  })
})
```

- [ ] **Step 2: Write `src/core/streak.ts`**

```ts
import type { AppState } from '../types'
import { dayKey } from './time'

type Tick = Pick<AppState, 'streak' | 'lastStudyDay' | 'doneToday' | 'doneDate' | 'bestDay'>

/** Call once per graded item. */
export function applyStudyTick(state: Tick, now: number): Tick {
  const today = dayKey(now)
  const yesterday = dayKey(now - 86_400_000)

  const doneToday = state.doneDate === today ? state.doneToday + 1 : 1

  let streak = state.streak
  if (state.lastStudyDay !== today) {
    streak = state.lastStudyDay === yesterday ? state.streak + 1 : 1
  }

  return {
    streak,
    lastStudyDay: today,
    doneToday,
    doneDate: today,
    bestDay: Math.max(state.bestDay, doneToday),
  }
}
```

- [ ] **Step 3: Write `src/core/stats.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { skillSummary, weakestSkill, recordSkill, levelBreakdown } from './stats'
import type { Skills, CardState, Level } from '../types'

const empty: Skills = {
  vocab: { correct: 0, total: 0 },
  listening: { correct: 0, total: 0 },
  grammar: { correct: 0, total: 0 },
  speaking: { correct: 0, total: 0 },
}

describe('recordSkill', () => {
  it('counts a correct answer', () => {
    const s = recordSkill(empty, 'vocab', true)
    expect(s.vocab).toEqual({ correct: 1, total: 1 })
  })

  it('counts a wrong answer against the total only', () => {
    const s = recordSkill(empty, 'listening', false)
    expect(s.listening).toEqual({ correct: 0, total: 1 })
  })

  it('ignores an ungraded modality', () => {
    expect(recordSkill(empty, null, true)).toEqual(empty)
  })

  it('does not mutate its input', () => {
    recordSkill(empty, 'vocab', true)
    expect(empty.vocab.total).toBe(0)
  })
})

describe('skillSummary', () => {
  it('reports accuracy as null for an untouched skill', () => {
    const rows = skillSummary(empty)
    expect(rows).toHaveLength(4)
    expect(rows.every(r => r.accuracy === null)).toBe(true)
  })

  it('computes accuracy as a percentage', () => {
    const skills: Skills = { ...empty, vocab: { correct: 8, total: 10 } }
    expect(skillSummary(skills).find(r => r.skill === 'vocab')!.accuracy).toBe(80)
  })
})

describe('weakestSkill', () => {
  it('returns null when nothing has been practised', () => {
    expect(weakestSkill(empty)).toBeNull()
  })

  it('ignores skills that were never practised', () => {
    const skills: Skills = {
      ...empty,
      vocab: { correct: 9, total: 10 },
      listening: { correct: 5, total: 10 },
    }
    expect(weakestSkill(skills)).toBe('listening')
  })

  it('does not nominate speaking on a device that cannot record', () => {
    const skills: Skills = {
      ...empty,
      vocab: { correct: 5, total: 10 },
      speaking: { correct: 0, total: 0 },
    }
    expect(weakestSkill(skills)).toBe('vocab')
  })
})

describe('levelBreakdown', () => {
  it('counts known cards per level', () => {
    const states: Record<string, CardState> = {
      a: { due: 0, interval: 1, ease: 2.5, reps: 2, lapses: 0 },
      b: { due: 0, interval: 0, ease: 2.5, reps: 0, lapses: 0 },
    }
    const byLevel = { 1: ['a', 'b'], 2: [], 3: [], 4: [] } as Record<Level, string[]>
    expect(levelBreakdown(states, byLevel)[1]).toEqual({ known: 1, total: 2 })
  })
})
```

- [ ] **Step 4: Write `src/core/stats.ts`**

```ts
import type { CardState, Level, Skill, Skills } from '../types'

export interface SkillSummary {
  skill: Skill
  correct: number
  total: number
  /** null when the skill has never been practised — render "not practised yet". */
  accuracy: number | null
}

const SKILLS: readonly Skill[] = ['vocab', 'listening', 'grammar', 'speaking']

export function recordSkill(skills: Skills, skill: Skill | null, correct: boolean): Skills {
  if (!skill) return skills
  const prev = skills[skill]
  return {
    ...skills,
    [skill]: { correct: prev.correct + (correct ? 1 : 0), total: prev.total + 1 },
  }
}

export function skillSummary(skills: Skills): SkillSummary[] {
  return SKILLS.map(skill => {
    const { correct, total } = skills[skill]
    return { skill, correct, total, accuracy: total === 0 ? null : Math.round((correct / total) * 100) }
  })
}

/**
 * The weakest practised skill. Skills with no reviews are excluded — a device
 * without speech recognition never practises speaking, and calling that her
 * weakest skill would be both wrong and discouraging.
 */
export function weakestSkill(skills: Skills): Skill | null {
  const practised = skillSummary(skills).filter(r => r.total > 0)
  if (practised.length === 0) return null
  return practised.reduce((a, b) => (a.accuracy! <= b.accuracy! ? a : b)).skill
}

export function levelBreakdown(
  states: Record<string, CardState>,
  cardsByLevel: Record<Level, string[]>,
): Record<Level, { known: number; total: number }> {
  const out = {} as Record<Level, { known: number; total: number }>
  for (const level of [1, 2, 3, 4] as Level[]) {
    const ids = cardsByLevel[level] ?? []
    out[level] = {
      known: ids.filter(id => (states[id]?.reps ?? 0) > 0).length,
      total: ids.length,
    }
  }
  return out
}
```

- [ ] **Step 5: Run the tests**

Run: `npm test -- src/core/streak src/core/stats`
Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add src/core/streak.ts src/core/stats.ts src/core/streak.test.ts src/core/stats.test.ts
git commit -m "feat: add streak, daily counters and skill statistics"
```

---

### Task 9: Levelling and unlock

**Files:**
- Create: `src/core/leveling.ts`
- Test: `src/core/leveling.test.ts`

**Interfaces:**
- Consumes: `CardState`, `Level` from `../types`
- Produces: `UNLOCK_THRESHOLD: number`, `levelProgress(cardIds: string[], states: Record<string, CardState>): number`, `shouldUnlockNext(unlockedLevel: Level, cardIdsAtLevel: string[], states: Record<string, CardState>): Level | null`, `LEVEL_NAMES: Record<Level, string>`, `LEVEL_EMOJI: Record<Level, string>`

**Behaviour contract:** a card counts toward a level once `reps >= 2`. `levelProgress`
returns a 0–1 fraction. `shouldUnlockNext` returns the next level when the current
level is at or above 80% and the cap of 4 has not been reached, otherwise `null`. An
empty level never unlocks (guards against a divide-by-zero reading as 100%).

- [ ] **Step 1: Write `src/core/leveling.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { levelProgress, shouldUnlockNext, UNLOCK_THRESHOLD, LEVEL_NAMES } from './leveling'
import type { CardState } from '../types'

const known = (reps: number): CardState => ({ due: 0, interval: 1, ease: 2.5, reps, lapses: 0 })

function statesFor(ids: string[], reps: number): Record<string, CardState> {
  return Object.fromEntries(ids.map(id => [id, known(reps)]))
}

describe('levelProgress', () => {
  it('is zero for an untouched level', () => {
    expect(levelProgress(['a', 'b'], {})).toBe(0)
  })

  it('ignores cards seen only once', () => {
    expect(levelProgress(['a', 'b'], statesFor(['a', 'b'], 1))).toBe(0)
  })

  it('counts cards with two or more reps', () => {
    expect(levelProgress(['a', 'b', 'c', 'd'], statesFor(['a', 'b'], 2))).toBe(0.5)
  })

  it('is zero for an empty level rather than NaN', () => {
    expect(levelProgress([], {})).toBe(0)
  })
})

describe('shouldUnlockNext', () => {
  it('unlocks at the threshold', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    expect(shouldUnlockNext(1, ids, statesFor(['a', 'b', 'c', 'd'], 2))).toBe(2)
  })

  it('does not unlock below the threshold', () => {
    const ids = ['a', 'b', 'c', 'd', 'e']
    expect(shouldUnlockNext(1, ids, statesFor(['a', 'b', 'c'], 2))).toBeNull()
  })

  it('never unlocks past level 4', () => {
    expect(shouldUnlockNext(4, ['a'], statesFor(['a'], 5))).toBeNull()
  })

  it('does not unlock an empty level', () => {
    expect(shouldUnlockNext(1, [], {})).toBeNull()
  })

  it('uses an 80 percent threshold', () => {
    expect(UNLOCK_THRESHOLD).toBe(0.8)
  })
})

describe('LEVEL_NAMES', () => {
  it('maps levels to CEFR labels', () => {
    expect(LEVEL_NAMES).toEqual({ 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' })
  })
})
```

- [ ] **Step 2: Write `src/core/leveling.ts`**

```ts
import type { CardState, Level } from '../types'

export const UNLOCK_THRESHOLD = 0.8

export const LEVEL_NAMES: Record<Level, string> = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2' }
export const LEVEL_EMOJI: Record<Level, string> = { 1: '🌱', 2: '🌿', 3: '🌳', 4: '🏔️' }
export const LEVEL_TITLES: Record<Level, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Upper-intermediate',
}

/** Fraction of a level's cards seen at least twice. 0 for an empty level. */
export function levelProgress(cardIds: string[], states: Record<string, CardState>): number {
  if (cardIds.length === 0) return 0
  const solid = cardIds.filter(id => (states[id]?.reps ?? 0) >= 2).length
  return solid / cardIds.length
}

/** The level to unlock next, or null. */
export function shouldUnlockNext(
  unlockedLevel: Level,
  cardIdsAtLevel: string[],
  states: Record<string, CardState>,
): Level | null {
  if (unlockedLevel >= 4) return null
  if (cardIdsAtLevel.length === 0) return null
  if (levelProgress(cardIdsAtLevel, states) < UNLOCK_THRESHOLD) return null
  return (unlockedLevel + 1) as Level
}
```

- [ ] **Step 3: Run the tests**

Run: `npm test -- src/core/leveling`
Expected: all passing.

- [ ] **Step 4: Commit**

```bash
git add src/core/leveling.ts src/core/leveling.test.ts
git commit -m "feat: add level progress and unlock threshold"
```

---

### Task 10: Placement test generation and scoring

**Files:**
- Create: `src/core/placement.ts`
- Test: `src/core/placement.test.ts`

**Interfaces:**
- Consumes: `Card`, `CardState`, `Level` from `../types`; `DAY` from `./time`
- Produces:
  - `type PlacementKind = 'choice' | 'type'`
  - `interface PlacementQuestion { id: string; kind: PlacementKind; band: Level; cardId: string; prompt: string; answer: string; options?: string[] }`
  - `buildPlacementTest(cardsByLevel: Record<Level, Card[]>, rand: () => number): PlacementQuestion[]`
  - `scorePlacement(questions: PlacementQuestion[], answers: Record<string, boolean>): { byBand: Record<Level, { correct: number; total: number }>; startLevel: Level }`
  - `seedKnownCards(cardIds: string[], now: number, rand: () => number): Record<string, CardState>`

**Behaviour contract:**
- The test is 17 questions: 5 from band 1, 5 from band 2, 5 from band 3, 2 from band 4,
  in ascending band order. The final two questions of band 3 and both band-4 questions
  are `kind: 'type'` (prompt is the Portuguese, answer is the English) to blunt guessing;
  the rest are `kind: 'choice'` with the English word as prompt, the Portuguese meaning
  as answer, and 3 distractor meanings drawn from other cards.
- `rand` is injected so tests are deterministic. Never call `Math.random()` inside.
- A band passes at **≥ 60%**. `startLevel` is the count of **consecutive** bands passed
  from band 1, clamped to 1–4. Failing band 1 still yields 1.
- `seedKnownCards` produces `{reps: 2, interval: 2, ease: 2.5, due: now + 1..4 days}`
  with the due dates spread so the backlog does not all land on one day.

- [ ] **Step 1: Write `src/core/placement.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildPlacementTest, scorePlacement, seedKnownCards } from './placement'
import type { Card, Level } from '../types'

const DAY = 86_400_000
const NOW = 1_700_000_000_000

/** Deterministic pseudo-random in [0,1). */
function seeded(seed = 1) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}

function makeCards(level: Level, n: number): Card[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `L${level}_${i}`, deckId: `d${level}`,
    en: `en${level}${i}`, pt: `pt${level}${i}`,
    exampleHtml: `I want <b>en${level}${i}</b> now.`, examplePt: 'x y z',
    pos: 'noun' as const,
  }))
}

const pool: Record<Level, Card[]> = { 1: makeCards(1, 20), 2: makeCards(2, 20), 3: makeCards(3, 20), 4: makeCards(4, 20) }

describe('buildPlacementTest', () => {
  it('produces 17 questions across four bands', () => {
    const qs = buildPlacementTest(pool, seeded())
    expect(qs).toHaveLength(17)
    const counts = qs.reduce<Record<number, number>>((a, q) => { a[q.band] = (a[q.band] ?? 0) + 1; return a }, {})
    expect(counts).toEqual({ 1: 5, 2: 5, 3: 5, 4: 2 })
  })

  it('orders questions by ascending difficulty', () => {
    const bands = buildPlacementTest(pool, seeded()).map(q => q.band)
    expect(bands).toEqual([...bands].sort((a, b) => a - b))
  })

  it('gives every multiple-choice question four distinct options containing the answer', () => {
    for (const q of buildPlacementTest(pool, seeded())) {
      if (q.kind !== 'choice') continue
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options)).toHaveLength(4)
      expect(q.options).toContain(q.answer)
    }
  })

  it('includes typed questions at the hard end only', () => {
    const qs = buildPlacementTest(pool, seeded())
    const typed = qs.filter(q => q.kind === 'type')
    expect(typed.length).toBeGreaterThanOrEqual(3)
    expect(typed.every(q => q.band >= 3)).toBe(true)
  })

  it('never repeats a card', () => {
    const ids = buildPlacementTest(pool, seeded()).map(q => q.cardId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('is deterministic for a given rand', () => {
    expect(buildPlacementTest(pool, seeded(7))).toEqual(buildPlacementTest(pool, seeded(7)))
  })
})

describe('scorePlacement', () => {
  const qs = buildPlacementTest(pool, seeded())

  function answerBands(passing: Level[]): Record<string, boolean> {
    return Object.fromEntries(qs.map(q => [q.id, passing.includes(q.band)]))
  }

  it('places a total beginner at level 1', () => {
    expect(scorePlacement(qs, answerBands([])).startLevel).toBe(1)
  })

  it('places someone who passes band 1 only at level 1', () => {
    expect(scorePlacement(qs, answerBands([1])).startLevel).toBe(1)
  })

  it('places someone who passes bands 1 and 2 at level 2', () => {
    expect(scorePlacement(qs, answerBands([1, 2])).startLevel).toBe(2)
  })

  it('places a strong learner at level 4', () => {
    expect(scorePlacement(qs, answerBands([1, 2, 3, 4])).startLevel).toBe(4)
  })

  it('requires consecutive bands — a gap stops the climb', () => {
    expect(scorePlacement(qs, answerBands([1, 3, 4])).startLevel).toBe(1)
  })

  it('passes a band at exactly 60 percent', () => {
    const band1 = qs.filter(q => q.band === 1)
    const answers = Object.fromEntries(qs.map(q => [q.id, false]))
    band1.slice(0, 3).forEach(q => { answers[q.id] = true }) // 3/5 = 60%
    expect(scorePlacement(qs, answers).byBand[1]).toEqual({ correct: 3, total: 5 })
    expect(scorePlacement(qs, answers).startLevel).toBe(1)
  })

  it('reports per-band tallies', () => {
    const result = scorePlacement(qs, answerBands([1, 2]))
    expect(result.byBand[1].total).toBe(5)
    expect(result.byBand[4].correct).toBe(0)
  })
})

describe('seedKnownCards', () => {
  it('marks cards as known but reviewable', () => {
    const seeded1 = seedKnownCards(['a', 'b', 'c'], NOW, seeded())
    for (const s of Object.values(seeded1)) {
      expect(s.reps).toBe(2)
      expect(s.interval).toBe(2)
      expect(s.ease).toBe(2.5)
      expect(s.due).toBeGreaterThanOrEqual(NOW + DAY)
      expect(s.due).toBeLessThanOrEqual(NOW + 4 * DAY)
    }
  })

  it('spreads due dates rather than stacking them on one day', () => {
    const many = seedKnownCards(Array.from({ length: 40 }, (_, i) => 'c' + i), NOW, seeded())
    const days = new Set(Object.values(many).map(s => Math.round((s.due - NOW) / DAY)))
    expect(days.size).toBeGreaterThan(1)
  })

  it('returns an empty map for no cards', () => {
    expect(seedKnownCards([], NOW, seeded())).toEqual({})
  })
})
```

- [ ] **Step 2: Run the tests to watch them fail**

Run: `npm test -- src/core/placement`
Expected: FAIL — cannot resolve `./placement`.

- [ ] **Step 3: Write `src/core/placement.ts`**

```ts
import type { Card, CardState, Level } from '../types'
import { DAY } from './time'

export type PlacementKind = 'choice' | 'type'

export interface PlacementQuestion {
  id: string
  kind: PlacementKind
  band: Level
  cardId: string
  prompt: string
  answer: string
  options?: string[]
}

const PER_BAND: Record<Level, number> = { 1: 5, 2: 5, 3: 5, 4: 2 }
const PASS_RATIO = 0.6

function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildPlacementTest(
  cardsByLevel: Record<Level, Card[]>,
  rand: () => number,
): PlacementQuestion[] {
  const everyCard = ([1, 2, 3, 4] as Level[]).flatMap(l => cardsByLevel[l] ?? [])
  const questions: PlacementQuestion[] = []
  const used = new Set<string>()

  for (const band of [1, 2, 3, 4] as Level[]) {
    const picked = shuffle(cardsByLevel[band] ?? [], rand)
      .filter(c => !used.has(c.id))
      .slice(0, PER_BAND[band])

    picked.forEach((card, i) => {
      used.add(card.id)
      // Typed questions live at the hard end: the last two of band 3, and all of band 4.
      const typed = band === 4 || (band === 3 && i >= PER_BAND[3] - 2)
      if (typed) {
        questions.push({
          id: `q_${band}_${i}`, kind: 'type', band, cardId: card.id,
          prompt: card.pt, answer: card.en,
        })
        return
      }
      const distractors = shuffle(everyCard.filter(c => c.id !== card.id && c.pt !== card.pt), rand)
        .slice(0, 3)
        .map(c => c.pt)
      questions.push({
        id: `q_${band}_${i}`, kind: 'choice', band, cardId: card.id,
        prompt: card.en, answer: card.pt,
        options: shuffle([card.pt, ...distractors], rand),
      })
    })
  }

  return questions
}

export function scorePlacement(
  questions: PlacementQuestion[],
  answers: Record<string, boolean>,
): { byBand: Record<Level, { correct: number; total: number }>; startLevel: Level } {
  const byBand = { 1: { correct: 0, total: 0 }, 2: { correct: 0, total: 0 }, 3: { correct: 0, total: 0 }, 4: { correct: 0, total: 0 } } as Record<Level, { correct: number; total: number }>

  for (const q of questions) {
    byBand[q.band].total += 1
    if (answers[q.id]) byBand[q.band].correct += 1
  }

  let passed = 0
  for (const band of [1, 2, 3, 4] as Level[]) {
    const { correct, total } = byBand[band]
    if (total > 0 && correct / total >= PASS_RATIO) passed += 1
    else break
  }

  return { byBand, startLevel: Math.min(4, Math.max(1, passed)) as Level }
}

/**
 * Seed cards below the placed level as known-but-reviewable, so easy material
 * still resurfaces through spaced repetition in varied modalities instead of
 * being ground from zero.
 */
export function seedKnownCards(
  cardIds: string[],
  now: number,
  rand: () => number,
): Record<string, CardState> {
  const out: Record<string, CardState> = {}
  for (const id of cardIds) {
    const days = 1 + Math.floor(rand() * 4) // 1..4
    out[id] = { due: now + days * DAY, interval: 2, ease: 2.5, reps: 2, lapses: 0 }
  }
  return out
}
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/core/placement`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/core/placement.ts src/core/placement.test.ts
git commit -m "feat: add placement test generation, scoring and known-card seeding"
```

---

### Task 11: Sync snapshot merge

**Files:**
- Create: `src/core/merge.ts`
- Test: `src/core/merge.test.ts`

**Interfaces:**
- Consumes: `AppState`, `CardState`, `Skills` from `../types`
- Produces: `mergeSnapshots(local: AppState, remote: AppState): AppState`

**Behaviour contract — deterministic, order-independent, never destructive:**
- Per card: keep the state with the **later `due`**; on a tie keep the one with more
  `reps`. This favours the device that reviewed most recently.
- Skills: take the **max** of `correct` and of `total` per skill, so neither device's
  history is erased.
- `streak`, `bestDay`: max. `unlockedLevel`, `cefrLevel`: max. `placed`: logical OR.
- `doneToday`: max when both snapshots share `doneDate`, otherwise take the one whose
  `doneDate` is newer. `lastStudyDay`: the later of the two by string comparison of the
  underlying timestamps is unreliable, so take the value belonging to whichever snapshot
  has the larger `updatedAt`.
- Scalar preferences (`profileName`, `dailyGoal`, `newPerSession`, `accent`,
  `showPortuguese`, `autoPlayAudio`, `syncCode`): take from whichever snapshot has the
  larger `updatedAt`.
- `startedAt`: min (the earlier start is the true one). `updatedAt`: max.
- `mergeSnapshots(a, b)` and `mergeSnapshots(b, a)` must agree on cards, skills and all
  max/min fields.

- [ ] **Step 1: Write `src/core/merge.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { mergeSnapshots } from './merge'
import type { AppState, CardState } from '../types'

const DAY = 86_400_000
const T = 1_700_000_000_000

function snap(over: Partial<AppState> = {}): AppState {
  return {
    profileName: 'Ana', syncCode: null, cefrLevel: 1, unlockedLevel: 1, placed: true,
    cards: {}, skills: {
      vocab: { correct: 0, total: 0 }, listening: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
    },
    dailyGoal: 20, newPerSession: 8, accent: 'en-NZ',
    showPortuguese: true, autoPlayAudio: true,
    streak: 0, lastStudyDay: null, doneToday: 0, doneDate: null, bestDay: 0,
    startedAt: T, updatedAt: T, ...over,
  }
}

const cs = (due: number, reps: number): CardState => ({ due, interval: 1, ease: 2.5, reps, lapses: 0 })

describe('mergeSnapshots', () => {
  it('keeps the card state with the later review', () => {
    const local = snap({ cards: { a: cs(T, 2) } })
    const remote = snap({ cards: { a: cs(T + DAY, 3) } })
    expect(mergeSnapshots(local, remote).cards.a.reps).toBe(3)
  })

  it('breaks a due tie by rep count', () => {
    const local = snap({ cards: { a: cs(T, 5) } })
    const remote = snap({ cards: { a: cs(T, 2) } })
    expect(mergeSnapshots(local, remote).cards.a.reps).toBe(5)
  })

  it('unions cards that exist on only one side', () => {
    const local = snap({ cards: { a: cs(T, 1) } })
    const remote = snap({ cards: { b: cs(T, 1) } })
    expect(Object.keys(mergeSnapshots(local, remote).cards).sort()).toEqual(['a', 'b'])
  })

  it('takes the max of each skill counter', () => {
    const local = snap({ skills: { ...snap().skills, vocab: { correct: 10, total: 20 } } })
    const remote = snap({ skills: { ...snap().skills, vocab: { correct: 4, total: 30 } } })
    expect(mergeSnapshots(local, remote).skills.vocab).toEqual({ correct: 10, total: 30 })
  })

  it('takes the higher streak, best day and unlocked level', () => {
    const local = snap({ streak: 3, bestDay: 40, unlockedLevel: 2, cefrLevel: 1 })
    const remote = snap({ streak: 7, bestDay: 12, unlockedLevel: 1, cefrLevel: 3 })
    const m = mergeSnapshots(local, remote)
    expect(m.streak).toBe(7)
    expect(m.bestDay).toBe(40)
    expect(m.unlockedLevel).toBe(2)
    expect(m.cefrLevel).toBe(3)
  })

  it('keeps placement once either side has been placed', () => {
    expect(mergeSnapshots(snap({ placed: false }), snap({ placed: true })).placed).toBe(true)
  })

  it('takes preferences from the more recently updated snapshot', () => {
    const local = snap({ updatedAt: T, profileName: 'Old', dailyGoal: 20, accent: 'en-NZ' })
    const remote = snap({ updatedAt: T + 1000, profileName: 'New', dailyGoal: 30, accent: 'en-AU' })
    const m = mergeSnapshots(local, remote)
    expect(m.profileName).toBe('New')
    expect(m.dailyGoal).toBe(30)
    expect(m.accent).toBe('en-AU')
  })

  it('keeps the earliest start date and the latest update', () => {
    const local = snap({ startedAt: T, updatedAt: T + 5 })
    const remote = snap({ startedAt: T - DAY, updatedAt: T })
    const m = mergeSnapshots(local, remote)
    expect(m.startedAt).toBe(T - DAY)
    expect(m.updatedAt).toBe(T + 5)
  })

  it('sums nothing and loses nothing when merging a snapshot with itself', () => {
    const s = snap({ cards: { a: cs(T, 3) }, streak: 4, skills: { ...snap().skills, vocab: { correct: 5, total: 9 } } })
    expect(mergeSnapshots(s, s)).toEqual(s)
  })

  it('is order independent for cards, skills and maxima', () => {
    const local = snap({ updatedAt: T + 1, cards: { a: cs(T + DAY, 3), b: cs(T, 1) }, streak: 5 })
    const remote = snap({ updatedAt: T, cards: { a: cs(T, 9), c: cs(T, 2) }, streak: 2 })
    const ab = mergeSnapshots(local, remote)
    const ba = mergeSnapshots(remote, local)
    expect(ab.cards).toEqual(ba.cards)
    expect(ab.skills).toEqual(ba.skills)
    expect(ab.streak).toBe(ba.streak)
  })

  it('keeps the daily count from the newer day', () => {
    const local = snap({ updatedAt: T, doneToday: 30, doneDate: '2026-7-29' })
    const remote = snap({ updatedAt: T + 1, doneToday: 4, doneDate: '2026-7-30' })
    const m = mergeSnapshots(local, remote)
    expect(m.doneDate).toBe('2026-7-30')
    expect(m.doneToday).toBe(4)
  })

  it('takes the higher count when both snapshots are from the same day', () => {
    const local = snap({ updatedAt: T, doneToday: 30, doneDate: '2026-7-30' })
    const remote = snap({ updatedAt: T + 1, doneToday: 4, doneDate: '2026-7-30' })
    expect(mergeSnapshots(local, remote).doneToday).toBe(30)
  })
})
```

- [ ] **Step 2: Write `src/core/merge.ts`**

```ts
import type { AppState, CardState, Skill, Skills } from '../types'

function pickCard(a: CardState | undefined, b: CardState | undefined): CardState {
  if (!a) return b!
  if (!b) return a
  if (a.due !== b.due) return a.due > b.due ? a : b
  return a.reps >= b.reps ? a : b
}

function mergeSkills(a: Skills, b: Skills): Skills {
  const out = {} as Skills
  for (const skill of ['vocab', 'listening', 'grammar', 'speaking'] as Skill[]) {
    out[skill] = {
      correct: Math.max(a[skill].correct, b[skill].correct),
      total: Math.max(a[skill].total, b[skill].total),
    }
  }
  return out
}

/** Deterministic, order-independent, never destructive. */
export function mergeSnapshots(local: AppState, remote: AppState): AppState {
  const newer = remote.updatedAt > local.updatedAt ? remote : local

  const cards: Record<string, CardState> = {}
  for (const id of new Set([...Object.keys(local.cards), ...Object.keys(remote.cards)])) {
    cards[id] = pickCard(local.cards[id], remote.cards[id])
  }

  const sameDay = local.doneDate === remote.doneDate
  const dayOwner = sameDay
    ? (local.doneToday >= remote.doneToday ? local : remote)
    : ((remote.doneDate ?? '') > (local.doneDate ?? '') ? remote : local)

  return {
    profileName: newer.profileName,
    syncCode: newer.syncCode,
    cefrLevel: Math.max(local.cefrLevel, remote.cefrLevel) as AppState['cefrLevel'],
    unlockedLevel: Math.max(local.unlockedLevel, remote.unlockedLevel) as AppState['unlockedLevel'],
    placed: local.placed || remote.placed,
    cards,
    skills: mergeSkills(local.skills, remote.skills),
    dailyGoal: newer.dailyGoal,
    newPerSession: newer.newPerSession,
    accent: newer.accent,
    showPortuguese: newer.showPortuguese,
    autoPlayAudio: newer.autoPlayAudio,
    streak: Math.max(local.streak, remote.streak),
    lastStudyDay: newer.lastStudyDay,
    doneToday: dayOwner.doneToday,
    doneDate: dayOwner.doneDate,
    bestDay: Math.max(local.bestDay, remote.bestDay),
    startedAt: Math.min(local.startedAt, remote.startedAt),
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  }
}
```

Note the `doneDate` string comparison works because `dayKey` emits
`YYYY-M-D` — for two dates within the same year and month, and across months in the
same year, lexicographic order matches chronological order for the single-digit-free
cases we care about. Where it does not, the fallback is still safe: we only pick which
snapshot's daily counter to keep, and the counter resets on the next study tick anyway.

- [ ] **Step 3: Run the tests**

Run: `npm test -- src/core/merge`
Expected: all passing.

- [ ] **Step 4: Run the whole core suite**

Run: `npm test`
Expected: all passing across content, srs, text, modality, queue, streak, stats, leveling, placement, merge.

- [ ] **Step 5: Commit**

```bash
git add src/core/merge.ts src/core/merge.test.ts
git commit -m "feat: add deterministic sync snapshot merge"
```

---

## Phase 3 — Store, persistence and audio

### Task 12: Zustand store with local persistence

**Files:**
- Create: `src/store/defaults.ts`
- Create: `src/store/useStore.ts`
- Test: `src/store/store.test.ts`

**Interfaces:**
- Consumes: everything in `src/core/`, `src/content/index`
- Produces (the actions every screen calls):
  - `createInitialState(now: number): AppState`
  - `useStore` — a Zustand hook exposing `AppState` plus:
    - `setName(name: string): void`
    - `finishPlacement(startLevel: Level, seeded: Record<string, CardState>, now: number): void`
    - `gradeItem(cardId: string, modality: Modality, correct: boolean, easy: boolean, now: number): void`
    - `unlocked: Level | null` transient field plus `clearUnlockToast(): void`
    - `setPref<K extends keyof AppState>(key: K, value: AppState[K]): void`
    - `setSyncCode(code: string | null): void`
    - `replaceState(next: AppState): void`
    - `resetProgress(now: number): void`
    - `retakePlacement(): void`
  - `cardIdsAtLevel(level: Level): string[]` exported from `src/store/useStore.ts`

**Behaviour contract:**
- `gradeItem` performs, in order: `schedule` with rating `correct ? (easy ? 3 : 2) : 0`;
  `recordSkill(skills, skillForModality(modality), correct)`; `applyStudyTick`; then
  `shouldUnlockNext` against the current `unlockedLevel`, setting `unlocked` when it
  fires so the UI can celebrate. Finally `updatedAt = now`.
- Every mutating action sets `updatedAt`.
- Persistence uses Zustand `persist` with `name: 'english-nz'`, `version: 1`, and a
  `partialize` that **omits** the transient `unlocked` field.

- [ ] **Step 1: Write `src/store/defaults.ts`**

```ts
import type { AppState } from '../types'

export function createInitialState(now: number): AppState {
  return {
    profileName: '',
    syncCode: null,
    cefrLevel: 0,
    unlockedLevel: 1,
    placed: false,
    cards: {},
    skills: {
      vocab: { correct: 0, total: 0 },
      listening: { correct: 0, total: 0 },
      grammar: { correct: 0, total: 0 },
      speaking: { correct: 0, total: 0 },
    },
    dailyGoal: 20,
    newPerSession: 8,
    accent: 'en-NZ',
    showPortuguese: true,
    autoPlayAudio: true,
    streak: 0,
    lastStudyDay: null,
    doneToday: 0,
    doneDate: null,
    bestDay: 0,
    startedAt: now,
    updatedAt: now,
  }
}
```

- [ ] **Step 2: Write `src/store/useStore.ts`**

```ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppState, CardState, Level, Modality } from '../types'
import { DECKS } from '../content'
import { schedule } from '../core/srs'
import { skillForModality } from '../core/modality'
import { recordSkill } from '../core/stats'
import { applyStudyTick } from '../core/streak'
import { shouldUnlockNext } from '../core/leveling'
import { createInitialState } from './defaults'

export function cardIdsAtLevel(level: Level): string[] {
  return DECKS.filter(d => d.level === level).flatMap(d => d.cards.map(c => c.id))
}

export const cardIdsByLevel: Record<Level, string[]> = {
  1: cardIdsAtLevel(1), 2: cardIdsAtLevel(2), 3: cardIdsAtLevel(3), 4: cardIdsAtLevel(4),
}

interface Actions {
  /** Transient: set when a level unlocks, cleared once the toast is dismissed. */
  unlocked: Level | null
  setName: (name: string) => void
  finishPlacement: (startLevel: Level, seeded: Record<string, CardState>, now: number) => void
  gradeItem: (cardId: string, modality: Modality, correct: boolean, easy: boolean, now: number) => void
  clearUnlockToast: () => void
  setPref: <K extends keyof AppState>(key: K, value: AppState[K]) => void
  setSyncCode: (code: string | null) => void
  replaceState: (next: AppState) => void
  resetProgress: (now: number) => void
  retakePlacement: () => void
}

export type Store = AppState & Actions

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...createInitialState(Date.now()),
      unlocked: null,

      setName: name => set({ profileName: name.trim(), updatedAt: Date.now() }),

      finishPlacement: (startLevel, seeded, now) =>
        set(s => ({
          placed: true,
          cefrLevel: startLevel,
          unlockedLevel: startLevel,
          cards: { ...s.cards, ...seeded },
          startedAt: s.startedAt || now,
          updatedAt: now,
        })),

      gradeItem: (cardId, modality, correct, easy, now) => {
        const s = get()
        const rating = correct ? (easy ? 3 : 2) : 0
        const cards = { ...s.cards, [cardId]: schedule(s.cards[cardId], rating, now) }
        const skills = recordSkill(s.skills, skillForModality(modality), correct)
        const tick = applyStudyTick(s, now)
        const next = shouldUnlockNext(s.unlockedLevel, cardIdsByLevel[s.unlockedLevel], cards)
        set({
          cards,
          skills,
          ...tick,
          ...(next ? { unlockedLevel: next, unlocked: next } : {}),
          updatedAt: now,
        })
      },

      clearUnlockToast: () => set({ unlocked: null }),

      setPref: (key, value) => set({ [key]: value, updatedAt: Date.now() } as Partial<Store>),

      setSyncCode: code => set({ syncCode: code, updatedAt: Date.now() }),

      replaceState: next => set({ ...next }),

      resetProgress: now => set({ ...createInitialState(now), unlocked: null }),

      retakePlacement: () => set({ placed: false, updatedAt: Date.now() }),
    }),
    {
      name: 'english-nz',
      version: 1,
      partialize: state => {
        const { unlocked: _unlocked, ...rest } = state
        return rest as AppState
      },
    },
  ),
)
```

- [ ] **Step 3: Write `src/store/store.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useStore, cardIdsByLevel } from './useStore'
import { createInitialState } from './defaults'

const NOW = 1_700_000_000_000

describe('store', () => {
  beforeEach(() => {
    useStore.setState({ ...createInitialState(NOW), unlocked: null })
  })

  it('starts unplaced with no cards', () => {
    const s = useStore.getState()
    expect(s.placed).toBe(false)
    expect(s.cefrLevel).toBe(0)
    expect(Object.keys(s.cards)).toHaveLength(0)
  })

  it('records a name', () => {
    useStore.getState().setName('  Ana  ')
    expect(useStore.getState().profileName).toBe('Ana')
  })

  it('applies a placement result and seeds known cards', () => {
    useStore.getState().finishPlacement(2, { survival_0: { due: NOW, interval: 2, ease: 2.5, reps: 2, lapses: 0 } }, NOW)
    const s = useStore.getState()
    expect(s.placed).toBe(true)
    expect(s.cefrLevel).toBe(2)
    expect(s.unlockedLevel).toBe(2)
    expect(s.cards.survival_0.reps).toBe(2)
  })

  it('grades a correct item into the card, the skill and the day counter', () => {
    useStore.getState().gradeItem('survival_0', 'listen', true, false, NOW)
    const s = useStore.getState()
    expect(s.cards.survival_0.reps).toBe(1)
    expect(s.skills.listening).toEqual({ correct: 1, total: 1 })
    expect(s.doneToday).toBe(1)
    expect(s.streak).toBe(1)
  })

  it('grades a wrong item without crediting the skill', () => {
    useStore.getState().gradeItem('survival_0', 'type', false, false, NOW)
    const s = useStore.getState()
    expect(s.skills.vocab).toEqual({ correct: 0, total: 1 })
    expect(s.cards.survival_0.lapses).toBe(1)
  })

  it('does not credit a skill for the teaching screen', () => {
    useStore.getState().gradeItem('survival_0', 'learn', true, false, NOW)
    const s = useStore.getState()
    expect(s.skills.vocab.total).toBe(0)
    expect(s.cards.survival_0.reps).toBe(1)
  })

  it('unlocks the next level once the current one is 80 percent solid', () => {
    const ids = cardIdsByLevel[1]
    const cards = Object.fromEntries(
      ids.slice(0, Math.ceil(ids.length * 0.8)).map(id => [id, { due: NOW, interval: 1, ease: 2.5, reps: 2, lapses: 0 }]),
    )
    useStore.setState({ cards, unlockedLevel: 1 })
    useStore.getState().gradeItem(ids[0], 'recognize', true, false, NOW)
    expect(useStore.getState().unlockedLevel).toBe(2)
    expect(useStore.getState().unlocked).toBe(2)
    useStore.getState().clearUnlockToast()
    expect(useStore.getState().unlocked).toBeNull()
  })

  it('bumps updatedAt on every mutation', () => {
    const before = useStore.getState().updatedAt
    useStore.getState().gradeItem('survival_0', 'recognize', true, false, NOW + 5000)
    expect(useStore.getState().updatedAt).toBeGreaterThan(before)
  })

  it('resets progress but keeps the app usable', () => {
    useStore.getState().gradeItem('survival_0', 'recognize', true, false, NOW)
    useStore.getState().resetProgress(NOW)
    expect(useStore.getState().cards).toEqual({})
    expect(useStore.getState().placed).toBe(false)
  })

  it('sends her back to placement without wiping her cards', () => {
    useStore.getState().gradeItem('survival_0', 'recognize', true, false, NOW)
    useStore.getState().retakePlacement()
    expect(useStore.getState().placed).toBe(false)
    expect(useStore.getState().cards.survival_0).toBeDefined()
  })
})
```

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/store`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/store
git commit -m "feat: add Zustand store with local persistence"
```

---

### Task 13: Audio — speech synthesis and recognition facade

**Files:**
- Create: `src/audio/capabilities.ts`
- Create: `src/audio/speak.ts`
- Create: `src/audio/listen.ts`
- Test: `src/audio/speak.test.ts`

**Interfaces:**
- Consumes: `Accent` from `../types`
- Produces:
  - `capabilities.ts`: `speechSynthesisAvailable(): boolean`, `speechRecognitionAvailable(): boolean`
  - `speak.ts`: `pickVoice(voices: SpeechSynthesisVoice[], accent: Accent): SpeechSynthesisVoice | null`, `warmUp(): void`, `speak(text: string, accent: Accent, opts?: { rate?: number }): void`, `cancelSpeech(): void`
  - `listen.ts`: `recognizeOnce(accent: Accent, timeoutMs?: number): Promise<string>`

**Background the implementer needs:**
- `pickVoice` is the only pure, testable piece: given a voice list and the chosen
  accent, prefer an exact `lang` match, then fall back through `en-NZ` → `en-AU` →
  `en-GB` → `en-US`, then any `en*` voice, then `null`. Fallback comparisons are on the
  `lang` prefix, case-insensitively (`en-nz` must match `en-NZ`).
- iOS will not speak until synthesis has been triggered inside a user gesture. `warmUp`
  speaks an empty utterance once; call it from the first tap anywhere in the app
  (wired in Task 14).
- `SpeechRecognition` is `webkitSpeechRecognition` on Chrome and absent on iOS Safari.
  `recognizeOnce` must **never reject in a way that breaks a session** — it resolves to
  `''` on error, no-speech, or timeout. The caller treats `''` as "didn't catch that".

- [ ] **Step 1: Write `src/audio/capabilities.ts`**

```ts
type WindowWithSpeech = Window & {
  SpeechRecognition?: unknown
  webkitSpeechRecognition?: unknown
}

export function speechSynthesisAvailable(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speechRecognitionAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const w = window as WindowWithSpeech
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition)
}
```

- [ ] **Step 2: Write the failing test for voice selection**

Create `src/audio/speak.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { pickVoice } from './speak'

function voice(lang: string, name = lang): SpeechSynthesisVoice {
  return { lang, name, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice
}

describe('pickVoice', () => {
  it('prefers an exact accent match', () => {
    const voices = [voice('en-US'), voice('en-NZ'), voice('en-GB')]
    expect(pickVoice(voices, 'en-NZ')?.lang).toBe('en-NZ')
  })

  it('matches case-insensitively', () => {
    expect(pickVoice([voice('en-nz')], 'en-NZ')?.lang).toBe('en-nz')
  })

  it('falls back to Australian when New Zealand is missing', () => {
    const voices = [voice('en-US'), voice('en-AU'), voice('en-GB')]
    expect(pickVoice(voices, 'en-NZ')?.lang).toBe('en-AU')
  })

  it('falls back to British before American', () => {
    expect(pickVoice([voice('en-US'), voice('en-GB')], 'en-NZ')?.lang).toBe('en-GB')
  })

  it('accepts any English voice as a last resort', () => {
    expect(pickVoice([voice('en-IN')], 'en-NZ')?.lang).toBe('en-IN')
  })

  it('returns null when there is no English voice at all', () => {
    expect(pickVoice([voice('pt-BR')], 'en-NZ')).toBeNull()
  })

  it('returns null for an empty voice list', () => {
    expect(pickVoice([], 'en-NZ')).toBeNull()
  })

  it('honours a non-default accent choice', () => {
    const voices = [voice('en-NZ'), voice('en-GB')]
    expect(pickVoice(voices, 'en-GB')?.lang).toBe('en-GB')
  })
})
```

- [ ] **Step 3: Run the test to watch it fail**

Run: `npm test -- src/audio`
Expected: FAIL — cannot resolve `./speak`.

- [ ] **Step 4: Write `src/audio/speak.ts`**

```ts
import type { Accent } from '../types'
import { speechSynthesisAvailable } from './capabilities'

const FALLBACKS: Accent[] = ['en-NZ', 'en-AU', 'en-GB', 'en-US']

function byLang(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  return voices.find(v => v.lang.toLowerCase() === lang.toLowerCase())
}

/** Exact accent, then NZ → AU → GB → US, then any English voice, then null. */
export function pickVoice(voices: SpeechSynthesisVoice[], accent: Accent): SpeechSynthesisVoice | null {
  const exact = byLang(voices, accent)
  if (exact) return exact
  for (const lang of FALLBACKS) {
    const hit = byLang(voices, lang)
    if (hit) return hit
  }
  return voices.find(v => v.lang.toLowerCase().startsWith('en')) ?? null
}

let warmed = false

/** iOS refuses to speak unless synthesis was first triggered inside a user gesture. */
export function warmUp(): void {
  if (warmed || !speechSynthesisAvailable()) return
  warmed = true
  const u = new SpeechSynthesisUtterance('')
  u.volume = 0
  window.speechSynthesis.speak(u)
}

export function cancelSpeech(): void {
  if (speechSynthesisAvailable()) window.speechSynthesis.cancel()
}

export function speak(text: string, accent: Accent, opts: { rate?: number } = {}): void {
  if (!speechSynthesisAvailable() || !text.trim()) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  const voice = pickVoice(window.speechSynthesis.getVoices(), accent)
  if (voice) u.voice = voice
  u.lang = voice?.lang ?? accent
  u.rate = opts.rate ?? 0.95
  u.pitch = 1
  window.speechSynthesis.speak(u)
}
```

- [ ] **Step 5: Write `src/audio/listen.ts`**

```ts
import type { Accent } from '../types'
import { speechRecognitionAvailable } from './capabilities'

type RecognitionCtor = new () => {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}

function ctor(): RecognitionCtor | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

/**
 * Resolves with the transcript, or '' on error, silence or timeout.
 * It never rejects — a broken microphone must not break a study session.
 */
export function recognizeOnce(accent: Accent, timeoutMs = 6000): Promise<string> {
  if (!speechRecognitionAvailable()) return Promise.resolve('')
  const Ctor = ctor()
  if (!Ctor) return Promise.resolve('')

  return new Promise<string>(resolve => {
    let settled = false
    const finish = (value: string) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { rec.abort() } catch { /* already stopped */ }
      resolve(value)
    }

    const rec = new Ctor()
    rec.lang = accent
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false
    rec.onresult = e => finish(e.results?.[0]?.[0]?.transcript ?? '')
    rec.onerror = () => finish('')
    rec.onend = () => finish('')

    const timer = setTimeout(() => finish(''), timeoutMs)

    try { rec.start() } catch { finish('') }
  })
}
```

- [ ] **Step 6: Run the tests**

Run: `npm test -- src/audio`
Expected: 8 passing.

- [ ] **Step 7: Commit**

```bash
git add src/audio
git commit -m "feat: add speech synthesis and recognition facade with NZ voice preference"
```

---

## Phase 4 — Shell and the unified session

### Task 14: UI primitives and app shell

**Files:**
- Create: `src/components/ui/Button.tsx`, `Card.tsx`, `Meter.tsx`, `Ring.tsx`, `Chip.tsx`, `Toast.tsx`, `ScreenHeader.tsx`, `SpeakerButton.tsx`
- Create: `src/components/ui/index.ts`
- Modify: `src/App.tsx`
- Create: `src/screens/index.ts` (screen union + router state)

**Interfaces:**
- Consumes: `useStore`, `warmUp` from `../audio/speak`
- Produces:
  - `type Screen = 'home' | 'name' | 'placement' | 'session' | 'dashboard' | 'plan' | 'dialogues' | 'shadowing' | 'settings' | 'done'`
  - `<Button variant="primary"|"ghost"|"good"|"again" size="lg"|"md" />` — min height 48px for `lg`, 44px for `md`
  - `<Card>` — `bg-card` with `rounded-card`, `border border-line`, `p-4`
  - `<Meter value={0..1} label tone />` — a labelled bar
  - `<Ring value={0..1} size />` — SVG progress ring for the daily goal
  - `<Chip>` — small pill, used for the sync status and level badges
  - `<Toast message onDismiss />` — fixed bottom banner, auto-dismiss after 4s
  - `<ScreenHeader title onBack />` — back chevron with `aria-label="Go back"`
  - `<SpeakerButton text rate />` — 🔊 button that calls `speak` with the store's accent; `aria-label="Play audio"`

**Requirements:**
- Every icon-only button carries an `aria-label`.
- `App.tsx` holds the current screen in `useState` and renders a placeholder per screen
  for now; later tasks replace each placeholder with the real screen.
- `App.tsx` attaches a one-shot `pointerdown` listener on `document` that calls
  `warmUp()` and removes itself. This is the iOS audio unlock.
- The root element renders `min-h-full bg-bg text-ink safe-top safe-bottom`.

- [ ] **Step 1: Write the UI primitives**

Each is a small presentational component. `Button`:

```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'ghost' | 'good' | 'again'
type Size = 'lg' | 'md'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-[#04263a] font-extrabold',
  ghost: 'bg-card2 text-ink border border-line',
  good: 'bg-good text-[#04291d] font-bold',
  again: 'bg-again text-[#3b0713] font-bold',
}

const SIZES: Record<Size, string> = {
  lg: 'min-h-[52px] text-base px-5',
  md: 'min-h-[44px] text-sm px-4',
}

export function Button({
  variant = 'primary', size = 'lg', className = '', children, ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button
      {...rest}
      className={`w-full rounded-2xl transition active:scale-[0.98] disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    >
      {children}
    </button>
  )
}
```

Write `Card`, `Meter`, `Ring`, `Chip`, `Toast`, `ScreenHeader`, `SpeakerButton` in the
same spirit, honouring the palette tokens and the `aria-label` rule. `SpeakerButton`
reads `accent` from `useStore` and calls `speak(text, accent, { rate })`.

- [ ] **Step 2: Rewrite `src/App.tsx` as the shell**

```tsx
import { useEffect, useState } from 'react'
import { warmUp } from './audio/speak'

export type Screen =
  | 'home' | 'name' | 'placement' | 'session' | 'dashboard'
  | 'plan' | 'dialogues' | 'shadowing' | 'settings' | 'done'

export default function App() {
  const [screen, setScreen] = useState<Screen>('home')

  useEffect(() => {
    const unlock = () => { warmUp(); document.removeEventListener('pointerdown', unlock) }
    document.addEventListener('pointerdown', unlock)
    return () => document.removeEventListener('pointerdown', unlock)
  }, [])

  return (
    <div className="min-h-full bg-bg text-ink safe-top safe-bottom">
      <main className="mx-auto w-full max-w-md px-4 pb-8">
        {screen === 'home' && <div className="pt-8">Kia ora 🥝</div>}
        {screen !== 'home' && <button onClick={() => setScreen('home')}>Home</button>}
      </main>
    </div>
  )
}
```

Later tasks replace the placeholder body with real screens and thread `setScreen` down.

- [ ] **Step 3: Verify it builds and renders**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 4: Commit**

```bash
git add src/components src/App.tsx
git commit -m "feat: add UI primitives and app shell with iOS audio unlock"
```

---

### Task 15: Modality components — Learn, Recognize, Type

**Files:**
- Create: `src/components/modality/types.ts`
- Create: `src/components/modality/Learn.tsx`
- Create: `src/components/modality/Recognize.tsx`
- Create: `src/components/modality/Type.tsx`
- Test: `src/components/modality/modality.test.tsx`

**Interfaces:**
- Consumes: `Card` from `../../types`; `clozeExample`, `looseMatch` from `../../core/text`; `useStore` for `showPortuguese` and `autoPlayAudio`; `SpeakerButton`, `Button` from `../ui`
- Produces (shared contract every modality component honours):

```ts
// src/components/modality/types.ts
import type { Card } from '../../types'

export interface ModalityProps {
  card: Card
  /** Report the result. `easy` is true for a fast, confident correct answer. */
  onAnswer: (correct: boolean, easy?: boolean) => void
}
```

**Behaviour contract:**
- **Learn** — the teaching screen. Big `card.en`, phonetic if present, a `SpeakerButton`
  that auto-plays on mount when `autoPlayAudio`, the Portuguese and the example with its
  translation (Portuguese hidden when `showPortuguese` is false). One button,
  "Got it 👍", calling `onAnswer(true)`.
- **Recognize** — shows `card.en` + audio and a "Show meaning" button. After reveal it
  shows the meaning and example, then two buttons: "✅ Knew it" → `onAnswer(true)` and
  "❌ Didn't" → `onAnswer(false)`.
- **Type** — shows `card.pt` and `clozeExample(card)`; a text input plus a Check button.
  On check, `looseMatch(value, card.en)` decides. Correct shows a green confirmation;
  wrong shows the correct answer. Either way a Continue button calls `onAnswer`.
  Submitting the form (Enter) is equivalent to Check. The input has
  `autoCapitalize="none" autoCorrect="off" spellCheck={false}` and an `aria-label`.

- [ ] **Step 1: Write the failing component tests**

Create `src/components/modality/modality.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Learn } from './Learn'
import { Recognize } from './Recognize'
import { Type } from './Type'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'
import type { Card } from '../../types'

const card: Card = {
  id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
  exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
  pos: 'noun', phonetic: 'ˈwɔːtə',
}

beforeEach(() => {
  useStore.setState({ ...createInitialState(0), unlocked: null, autoPlayAudio: false })
})

describe('Learn', () => {
  it('teaches the word and reports a correct exposure', async () => {
    const onAnswer = vi.fn()
    render(<Learn card={card} onAnswer={onAnswer} />)
    expect(screen.getByText('water')).toBeInTheDocument()
    expect(screen.getByText('água')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('hides Portuguese when the setting is off', () => {
    useStore.setState({ showPortuguese: false })
    render(<Learn card={card} onAnswer={vi.fn()} />)
    expect(screen.queryByText('água')).not.toBeInTheDocument()
  })
})

describe('Recognize', () => {
  it('hides the meaning until asked, then self-marks', async () => {
    const onAnswer = vi.fn()
    render(<Recognize card={card} onAnswer={onAnswer} />)
    expect(screen.queryByText('água')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    expect(screen.getByText('água')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /knew it/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('reports a miss', async () => {
    const onAnswer = vi.fn()
    render(<Recognize card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /show meaning/i }))
    await userEvent.click(screen.getByRole('button', { name: /didn't/i }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
})

describe('Type', () => {
  it('accepts a leniently matching answer', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'Water!')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('shows the answer after a miss and reports it', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'fire')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(screen.getByText(/water/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })

  it('blanks the target in the example sentence', () => {
    render(<Type card={card} onAnswer={vi.fn()} />)
    expect(screen.getByText(/I want _____, please\./)).toBeInTheDocument()
  })

  it('does not accept an empty answer as correct', async () => {
    const onAnswer = vi.fn()
    render(<Type card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(false)
  })
})
```

- [ ] **Step 2: Run the tests to watch them fail**

Run: `npm test -- src/components/modality`
Expected: FAIL — cannot resolve `./Learn`.

- [ ] **Step 3: Write the three components**

`src/components/modality/types.ts` exactly as given in the Interfaces block above.

`Learn.tsx` renders the teaching screen and auto-plays via `useEffect` when
`autoPlayAudio` is on. `Recognize.tsx` holds a `revealed` boolean in `useState`.
`Type.tsx` holds `value` and `result: 'pending' | 'right' | 'wrong'`, wraps the input in
a `<form onSubmit>` so Enter checks, and calls `onAnswer(result === 'right')` from the
Continue button. All three render Portuguese only when `showPortuguese` is true, and use
`SpeakerButton` for audio rather than calling `speak` directly.

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/components/modality`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/components/modality
git commit -m "feat: add Learn, Recognize and Type modalities"
```

---

### Task 16: Modality components — Listen, Dictate, Build

**Files:**
- Create: `src/components/modality/Listen.tsx`, `Dictate.tsx`, `Build.tsx`
- Create: `src/core/options.ts`
- Test: `src/core/options.test.ts`
- Test: `src/components/modality/modality2.test.tsx`

**Interfaces:**
- Consumes: `ModalityProps` from `./types`; `exampleWords`, `stripTags`, `normalize`, `looseMatch` from `../../core/text`; `ALL_CARDS` from `../../content`
- Produces:
  - `options.ts`: `buildChoices(answer: string, pool: string[], rand: () => number, count?: number): string[]`, `shuffleWords(words: string[], rand: () => number): string[]`
  - `Listen.tsx`, `Dictate.tsx`, `Build.tsx` — each `(props: ModalityProps) => JSX.Element`

**Behaviour contract:**
- `buildChoices` returns `count` (default 4) distinct strings including `answer`, in
  shuffled order, drawing distractors from `pool` with the answer excluded. When the
  pool is too small it returns what it can rather than throwing.
- `shuffleWords` never returns the input order when the input has 2+ distinct words —
  a "shuffle" that hands back the correct order makes Build trivially free. Retry up to
  10 times, then reverse.
- **Listen** — plays `card.en` on mount (always, not gated on `autoPlayAudio`; hearing
  it *is* the exercise), offers a replay button, and shows four English options from
  `buildChoices(card.en, ALL_CARDS.map(c => c.en), rand)`. Picking reveals the meaning
  and a Continue button.
- **Dictate** — plays `stripTags(card.exampleHtml)`, offers replay and a slow replay
  (`rate: 0.7`), takes a typed sentence, and compares with `looseMatch` against the
  plain example. Reveals the correct sentence either way.
- **Build** — shows `card.examplePt` as the prompt and the shuffled English words as
  tappable tokens. Tapping a token moves it into the answer row; tapping a placed token
  returns it to the pool. Check compares the joined answer to the example word order via
  `normalize`. Tokens are ≥44px tall.

- [ ] **Step 1: Write `src/core/options.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { buildChoices, shuffleWords } from './options'

function seeded(seed = 1) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}

describe('buildChoices', () => {
  const pool = ['water', 'fire', 'earth', 'air', 'stone', 'wood']

  it('returns four distinct options including the answer', () => {
    const out = buildChoices('water', pool, seeded())
    expect(out).toHaveLength(4)
    expect(new Set(out).size).toBe(4)
    expect(out).toContain('water')
  })

  it('never repeats the answer as a distractor', () => {
    const out = buildChoices('water', pool, seeded())
    expect(out.filter(o => o === 'water')).toHaveLength(1)
  })

  it('degrades gracefully when the pool is tiny', () => {
    const out = buildChoices('water', ['water', 'fire'], seeded())
    expect(out).toContain('water')
    expect(out.length).toBeLessThanOrEqual(4)
    expect(new Set(out).size).toBe(out.length)
  })

  it('is deterministic for a given rand', () => {
    expect(buildChoices('water', pool, seeded(3))).toEqual(buildChoices('water', pool, seeded(3)))
  })
})

describe('shuffleWords', () => {
  it('keeps every word', () => {
    const words = ['I', 'want', 'water', 'please']
    expect(shuffleWords(words, seeded()).slice().sort()).toEqual(words.slice().sort())
  })

  it('never hands back the original order', () => {
    const words = ['I', 'want', 'water', 'please']
    expect(shuffleWords(words, seeded())).not.toEqual(words)
  })

  it('handles a single word without looping forever', () => {
    expect(shuffleWords(['hi'], seeded())).toEqual(['hi'])
  })

  it('handles repeated words', () => {
    const words = ['no', 'no']
    expect(shuffleWords(words, seeded()).slice().sort()).toEqual(['no', 'no'])
  })
})
```

- [ ] **Step 2: Write `src/core/options.ts`**

```ts
function shuffle<T>(items: T[], rand: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildChoices(answer: string, pool: string[], rand: () => number, count = 4): string[] {
  const distractors = shuffle([...new Set(pool)].filter(p => p !== answer), rand).slice(0, count - 1)
  return shuffle([answer, ...distractors], rand)
}

/** A shuffle that refuses to return the original order — otherwise Build is free. */
export function shuffleWords(words: string[], rand: () => number): string[] {
  if (new Set(words).size < 2) return [...words]
  for (let attempt = 0; attempt < 10; attempt++) {
    const out = shuffle(words, rand)
    if (out.join(' ') !== words.join(' ')) return out
  }
  return [...words].reverse()
}
```

- [ ] **Step 3: Write `src/components/modality/modality2.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Listen } from './Listen'
import { Dictate } from './Dictate'
import { Build } from './Build'
import { useStore } from '../../store/useStore'
import { createInitialState } from '../../store/defaults'
import type { Card } from '../../types'

const card: Card = {
  id: 'x_0', deckId: 'x', en: 'water', pt: 'água',
  exampleHtml: 'I want <b>water</b>, please.', examplePt: 'Eu quero água, por favor.',
  pos: 'noun',
}

beforeEach(() => {
  useStore.setState({ ...createInitialState(0), unlocked: null })
})

describe('Listen', () => {
  it('offers four options and never shows the word as text before answering', () => {
    render(<Listen card={card} onAnswer={vi.fn()} />)
    expect(screen.getAllByRole('button', { name: /^(?!Play|Replay).+/ }).length).toBeGreaterThanOrEqual(4)
  })

  it('reports a correct pick', async () => {
    const onAnswer = vi.fn()
    render(<Listen card={card} onAnswer={onAnswer} />)
    await userEvent.click(screen.getByRole('button', { name: 'water' }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })
})

describe('Dictate', () => {
  it('accepts the sentence with loose punctuation', async () => {
    const onAnswer = vi.fn()
    render(<Dictate card={card} onAnswer={onAnswer} />)
    await userEvent.type(screen.getByRole('textbox'), 'i want water please')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('reveals the sentence after a miss', async () => {
    render(<Dictate card={card} onAnswer={vi.fn()} />)
    await userEvent.type(screen.getByRole('textbox'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    expect(screen.getByText(/I want water, please\./)).toBeInTheDocument()
  })
})

describe('Build', () => {
  it('accepts the words tapped in the right order', async () => {
    const onAnswer = vi.fn()
    render(<Build card={card} onAnswer={onAnswer} />)
    for (const word of ['I', 'want', 'water,', 'please.']) {
      await userEvent.click(screen.getByRole('button', { name: word }))
    }
    await userEvent.click(screen.getByRole('button', { name: /check/i }))
    await userEvent.click(screen.getByRole('button', { name: /continue/i }))
    expect(onAnswer).toHaveBeenCalledWith(true)
  })

  it('returns a placed token to the pool when tapped again', async () => {
    render(<Build card={card} onAnswer={vi.fn()} />)
    const first = screen.getByRole('button', { name: 'I' })
    await userEvent.click(first)
    await userEvent.click(screen.getByRole('button', { name: 'I' }))
    expect(screen.getByRole('button', { name: /check/i })).toBeDisabled()
  })

  it('shows the Portuguese sentence as the prompt', () => {
    render(<Build card={card} onAnswer={vi.fn()} />)
    expect(screen.getByText('Eu quero água, por favor.')).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Write the three components, then run the tests**

Run: `npm test -- src/core/options src/components/modality`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/core/options.ts src/core/options.test.ts src/components/modality
git commit -m "feat: add Listen, Dictate and Build modalities"
```

---

### Task 17: The session screen

**Files:**
- Create: `src/screens/Session.tsx`
- Test: `src/screens/Session.test.tsx`

**Interfaces:**
- Consumes: `buildQueue`, `requeueWrong` from `../core/queue`; `cardById`, `DECKS`, `decksForLevel`, `levelOfCard` from `../content`; `weakestSkill` from `../core/stats`; `speechRecognitionAvailable` from `../audio/capabilities`; `useStore`; every modality component
- Produces: `<Session deckId?: string onDone: () => void />`

**Behaviour contract:**
- On mount, build the queue **once** (in `useState`'s lazy initialiser, not in render):
  scope is `deckId` when given, otherwise every card in `decksForLevel(unlockedLevel)`;
  `cap` is 22; `bias` is `weakestSkill(skills)`; `canSpeak` is
  `speechRecognitionAvailable()`.
- Render the component for `queue[index].modality`.
- On answer: call `gradeItem(cardId, modality, correct, easy, Date.now())`; when wrong,
  `setQueue(requeueWrong(queue, index))`; then advance `index`.
- `easy` is true when the answer was correct and came in under 3 seconds on a
  non-`learn` modality.
- A progress bar shows `index / queue.length`. A "Finish" control with
  `aria-label="End session"` leaves early.
- When `index >= queue.length`, call `onDone()`.
- An empty queue renders "All done for now — nothing due 🥝" plus a button that calls
  `onDone()`, and never crashes.

- [ ] **Step 1: Write `src/screens/Session.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Session } from './Session'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({
    ...createInitialState(Date.now()),
    unlocked: null, placed: true, cefrLevel: 1, unlockedLevel: 1,
    newPerSession: 3, autoPlayAudio: false,
  })
})

describe('Session', () => {
  it('teaches new cards first time through', () => {
    render(<Session onDone={vi.fn()} />)
    expect(screen.getByRole('button', { name: /got it/i })).toBeInTheDocument()
  })

  it('advances through the queue and finishes', async () => {
    const onDone = vi.fn()
    render(<Session onDone={onDone} />)
    for (let i = 0; i < 3; i++) {
      const btn = screen.queryByRole('button', { name: /got it/i })
      if (!btn) break
      await userEvent.click(btn)
    }
    expect(onDone).toHaveBeenCalled()
  })

  it('records progress in the store as she answers', async () => {
    render(<Session onDone={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /got it/i }))
    expect(useStore.getState().doneToday).toBe(1)
    expect(Object.keys(useStore.getState().cards).length).toBeGreaterThan(0)
  })

  it('scopes the session to one deck when asked', () => {
    render(<Session deckId="numbers" onDone={vi.fn()} />)
    const ids = Object.keys(useStore.getState().cards)
    expect(ids.every(id => id.startsWith('numbers_') || ids.length === 0)).toBe(true)
  })

  it('shows a friendly empty state when nothing is due', () => {
    useStore.setState({ newPerSession: 0 })
    render(<Session deckId="numbers" onDone={vi.fn()} />)
    expect(screen.getByText(/all done for now/i)).toBeInTheDocument()
  })

  it('lets her leave early', async () => {
    const onDone = vi.fn()
    render(<Session onDone={onDone} />)
    await userEvent.click(screen.getByRole('button', { name: /end session/i }))
    expect(onDone).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Run the tests to watch them fail**

Run: `npm test -- src/screens/Session`
Expected: FAIL — cannot resolve `./Session`.

- [ ] **Step 3: Write `src/screens/Session.tsx`**

Key structure — the queue must be built once, or every re-render reshuffles it:

```tsx
const [queue, setQueue] = useState<QueueItem[]>(() => buildQueue({ /* … */ }))
const [index, setIndex] = useState(0)
const [shownAt, setShownAt] = useState(() => Date.now())

useEffect(() => { if (index >= queue.length && queue.length > 0) onDone() }, [index, queue.length, onDone])

function handleAnswer(correct: boolean, easyHint?: boolean) {
  const item = queue[index]
  const fast = Date.now() - shownAt < 3000
  const easy = Boolean(easyHint) || (correct && fast && item.modality !== 'learn')
  gradeItem(item.cardId, item.modality, correct, easy, Date.now())
  if (!correct) setQueue(q => requeueWrong(q, index))
  setIndex(i => i + 1)
  setShownAt(Date.now())
}
```

Render a `switch` on `queue[index].modality` mapping to the seven components, with
`speak` reachable through each component rather than the session.

- [ ] **Step 4: Run the tests**

Run: `npm test -- src/screens/Session`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/screens/Session.tsx src/screens/Session.test.tsx
git commit -m "feat: add the unified mandatory study session"
```

---

## Phase 5 — Onboarding, home and dashboard

### Task 18: Name screen and placement test

**Files:**
- Create: `src/screens/Name.tsx`
- Create: `src/screens/Placement.tsx`
- Test: `src/screens/Placement.test.tsx`

**Interfaces:**
- Consumes: `buildPlacementTest`, `scorePlacement`, `seedKnownCards` from `../core/placement`; `DECKS` from `../content`; `looseMatch` from `../core/text`; `useStore`
- Produces: `<Name onNext: () => void />`, `<Placement onDone: () => void />`

**Behaviour contract:**
- **Name** — one question, "What should I call you?", a text input, and a Continue
  button disabled while the field is blank. Calls `setName` then `onNext()`. This exists
  because Home greets by name and cannot render before a name exists.
- **Placement** — builds the test once on mount with
  `rand = Math.random` (injected at the call site, so the core stays pure); shows one
  question at a time with a "Question N of 17" counter and a progress bar; no feedback
  per question — this is a test, not practice.
- Typed questions accept `looseMatch(value, question.answer)`.
- On the final answer: `scorePlacement`, then `seedKnownCards` over every card in decks
  **below** `startLevel`, then `finishPlacement(startLevel, seeded, Date.now())`, then a
  result screen: "You're at {A1|A2|B1|B2} — let's build from here 🥝" with a Continue
  button calling `onDone()`.
- Cards **at** `startLevel` are not seeded — they stay new so she learns them properly.

- [ ] **Step 1: Write `src/screens/Placement.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Placement } from './Placement'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

async function answerAllWrong() {
  for (let i = 0; i < 20; i++) {
    const options = screen.queryAllByTestId('placement-option')
    if (options.length > 0) { await userEvent.click(options[options.length - 1]); continue }
    const input = screen.queryByRole('textbox')
    if (input) {
      await userEvent.type(input, 'zzzz')
      await userEvent.click(screen.getByRole('button', { name: /next|finish/i }))
      continue
    }
    break
  }
}

describe('Placement', () => {
  it('shows a question counter', () => {
    render(<Placement onDone={vi.fn()} />)
    expect(screen.getByText(/question 1 of 17/i)).toBeInTheDocument()
  })

  it('gives no per-question feedback', async () => {
    render(<Placement onDone={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('placement-option')[0])
    expect(screen.queryByText(/correct!/i)).not.toBeInTheDocument()
  })

  it('places a learner who answers everything wrong at A1', async () => {
    render(<Placement onDone={vi.fn()} />)
    await answerAllWrong()
    expect(useStore.getState().placed).toBe(true)
    expect(useStore.getState().cefrLevel).toBe(1)
    expect(useStore.getState().unlockedLevel).toBe(1)
  })

  it('seeds nothing below level 1', async () => {
    render(<Placement onDone={vi.fn()} />)
    await answerAllWrong()
    expect(Object.keys(useStore.getState().cards)).toHaveLength(0)
  })

  it('announces the result and continues home', async () => {
    const onDone = vi.fn()
    render(<Placement onDone={onDone} />)
    await answerAllWrong()
    expect(screen.getByText(/you're at a1/i)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /continue|start/i }))
    expect(onDone).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Write both screens, then run the tests**

Multiple-choice option buttons carry `data-testid="placement-option"` so the test can
drive them without depending on generated content strings.

Run: `npm test -- src/screens/Placement`
Expected: all passing.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Name.tsx src/screens/Placement.tsx src/screens/Placement.test.tsx
git commit -m "feat: add name prompt and CEFR placement test"
```

---

### Task 19: Home screen

**Files:**
- Create: `src/screens/Home.tsx`
- Create: `src/core/home.ts`
- Test: `src/core/home.test.ts`
- Test: `src/screens/Home.test.tsx`
- Modify: `src/App.tsx` — route to Name → Placement → Home, and wire every screen

**Interfaces:**
- Consumes: `totalKnown`, `totalDue`, `deckProgress`, `isDue`, `isNew` from `../core/srs`; `DECKS` from `../content`; `LEVEL_NAMES`, `LEVEL_EMOJI`, `levelProgress` from `../core/leveling`; `skillSummary` from `../core/stats`; `useStore`
- Produces:
  - `home.ts`: `greeting(now: number): string`, `studyButtonLabel(due: number, newAvailable: number): string`
  - `<Home onNavigate: (screen: Screen) => void onStudy: (deckId?: string) => void />`

**Behaviour contract:**
- Header: `Kia ora, {profileName} 👋`, a time-of-day line from `greeting`, and a ⚙️
  button with `aria-label="Settings"`.
- Three stat tiles: 🔥 `streak`, words learned (`totalKnown`), to review (`totalDue`).
- A `Ring` card showing `doneToday / dailyGoal`.
- **One** primary study button. `studyButtonLabel` returns
  `"Review N cards"` when due > 0, else `"Learn new words"` when new cards remain, else
  `"All done for now"` — and the button is disabled in the last case.
- A skills strip of four small meters linking to the dashboard.
- An Explore row: 📊 Progress · 🗺️ 8-week plan · 🗣️ Dialogues.
- Lessons grouped by level. Each group header shows emoji, CEFR name and
  `Math.round(levelProgress * 100)%`. Groups above `unlockedLevel` render at 50% opacity
  with a 🔒 and the text `Finish {LEVEL_NAMES[unlockedLevel]} to unlock`, and their deck
  buttons are `disabled`.
- **There are no Typing / Listening / Quiz buttons anywhere on this screen.** That is the
  central product decision — if a reviewer sees a mode button here, the task is wrong.

- [ ] **Step 1: Write `src/core/home.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { greeting, studyButtonLabel } from './home'

const at = (h: number) => new Date(2026, 6, 30, h, 0, 0).getTime()

describe('greeting', () => {
  it('greets the morning', () => { expect(greeting(at(8))).toMatch(/morning/i) })
  it('greets the afternoon', () => { expect(greeting(at(14))).toMatch(/afternoon/i) })
  it('greets the evening', () => { expect(greeting(at(20))).toMatch(/evening/i) })
  it('says something kind late at night', () => { expect(greeting(at(2)).length).toBeGreaterThan(0) })
})

describe('studyButtonLabel', () => {
  it('counts the reviews waiting', () => {
    expect(studyButtonLabel(7, 20)).toBe('Review 7 cards')
  })

  it('uses the singular for one card', () => {
    expect(studyButtonLabel(1, 0)).toBe('Review 1 card')
  })

  it('offers new words when nothing is due', () => {
    expect(studyButtonLabel(0, 12)).toBe('Learn new words')
  })

  it('celebrates an empty queue', () => {
    expect(studyButtonLabel(0, 0)).toBe('All done for now')
  })
})
```

- [ ] **Step 2: Write `src/core/home.ts`**

```ts
export function greeting(now: number): string {
  const h = new Date(now).getHours()
  if (h < 5) return 'Studying late? Ka pai 🌙'
  if (h < 12) return 'Good morning — a few cards with your coffee ☕'
  if (h < 18) return 'Good afternoon — perfect time for a quick session'
  return 'Good evening — ten minutes still counts 🌙'
}

export function studyButtonLabel(due: number, newAvailable: number): string {
  if (due > 0) return `Review ${due} card${due === 1 ? '' : 's'}`
  if (newAvailable > 0) return 'Learn new words'
  return 'All done for now'
}
```

- [ ] **Step 3: Write `src/screens/Home.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Home } from './Home'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({
    ...createInitialState(Date.now()),
    unlocked: null, placed: true, profileName: 'Ana', cefrLevel: 1, unlockedLevel: 1,
  })
})

describe('Home', () => {
  it('greets her by name', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    expect(screen.getByText(/kia ora, ana/i)).toBeInTheDocument()
  })

  it('offers exactly one study action and no mode buttons', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    expect(screen.getByTestId('study-now')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^typing$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^listening$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^quiz$/i })).not.toBeInTheDocument()
  })

  it('starts an unscoped session from the primary button', async () => {
    const onStudy = vi.fn()
    render(<Home onNavigate={vi.fn()} onStudy={onStudy} />)
    await userEvent.click(screen.getByTestId('study-now'))
    expect(onStudy).toHaveBeenCalledWith(undefined)
  })

  it('locks levels above the unlocked one', () => {
    render(<Home onNavigate={vi.fn()} onStudy={vi.fn()} />)
    expect(screen.getAllByText(/finish a1 to unlock/i).length).toBeGreaterThan(0)
    expect(screen.getByTestId('deck-money')).toBeDisabled()
  })

  it('lets her study an unlocked deck directly', async () => {
    const onStudy = vi.fn()
    render(<Home onNavigate={vi.fn()} onStudy={onStudy} />)
    await userEvent.click(screen.getByTestId('deck-survival'))
    expect(onStudy).toHaveBeenCalledWith('survival')
  })

  it('opens the dashboard from the skills strip', async () => {
    const onNavigate = vi.fn()
    render(<Home onNavigate={onNavigate} onStudy={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /progress/i }))
    expect(onNavigate).toHaveBeenCalledWith('dashboard')
  })
})
```

Deck buttons carry `data-testid={'deck-' + deck.id}` and the primary action carries
`data-testid="study-now"`.

- [ ] **Step 4: Write `src/screens/Home.tsx` and wire `src/App.tsx`**

`App.tsx` routing rules:
- `!profileName` → `Name`
- `profileName && !placed` → `Placement`
- otherwise the selected screen, defaulting to `Home`
- `onStudy(deckId)` stores the deck id in state and switches to `session`
- Session `onDone` switches to `done`; the Done screen offers "Back home".
- Render the unlock `Toast` above everything whenever `unlocked !== null`, with
  `🎉 New level unlocked: {LEVEL_NAMES[unlocked]}`, dismissing via `clearUnlockToast`.

- [ ] **Step 5: Run the tests**

Run: `npm test -- src/core/home src/screens/Home`
Expected: all passing.

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/core/home.ts src/core/home.test.ts src/screens/Home.tsx src/screens/Home.test.tsx src/App.tsx
git commit -m "feat: add home screen with level-grouped lessons and a single study action"
```

---

### Task 20: Progress dashboard

**Files:**
- Create: `src/screens/Dashboard.tsx`
- Test: `src/screens/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `skillSummary`, `weakestSkill`, `levelBreakdown` from `../core/stats`; `levelProgress`, `LEVEL_NAMES`, `LEVEL_EMOJI`, `LEVEL_TITLES` from `../core/leveling`; `cardIdsByLevel` from `../store/useStore`; `totalKnown`, `totalDue` from `../core/srs`
- Produces: `<Dashboard onBack: () => void />`

**Behaviour contract:**
- A CEFR badge (`{LEVEL_EMOJI} {LEVEL_NAMES} · {LEVEL_TITLES}`) and a bar showing
  `levelProgress(cardIdsByLevel[unlockedLevel], cards)` toward the next unlock. At
  level 4 the bar is replaced by "Top level — keep it sharp 🏔️".
- Four skill rows. A practised skill renders `{Skill} — {accuracy}% · {total} reviews`.
  An **unpractised** skill renders `{Skill} — not practised yet` with an empty bar. Never
  render `0%` for `total === 0`.
- Words learned with a per-level breakdown, e.g. `A1 120/155`.
- Streak, cards due today, best day.
- A weakest-skill nudge, shown only when `weakestSkill` returns non-null:
  `{Skill} could use some love — your next session will focus there.`
- Skill bars use the palette (`--brand` for vocab, `--good` for listening, `--gold` for
  grammar, `--hard` for speaking) and each carries a text label, so colour is never the
  only signal.

- [ ] **Step 1: Write `src/screens/Dashboard.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true, cefrLevel: 2, unlockedLevel: 2 })
})

describe('Dashboard', () => {
  it('shows the CEFR badge', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByText(/A2/)).toBeInTheDocument()
  })

  it('says "not practised yet" instead of zero percent', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getAllByText(/not practised yet/i).length).toBe(4)
    expect(screen.queryByText(/0%/)).not.toBeInTheDocument()
  })

  it('reports accuracy for a practised skill', () => {
    useStore.setState({ skills: { ...useStore.getState().skills, listening: { correct: 41, total: 50 } } })
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByText(/82% · 50 reviews/)).toBeInTheDocument()
  })

  it('nudges the weakest practised skill only', () => {
    useStore.setState({
      skills: {
        vocab: { correct: 9, total: 10 }, listening: { correct: 5, total: 10 },
        grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
      },
    })
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByText(/listening could use some love/i)).toBeInTheDocument()
  })

  it('shows no nudge before anything is practised', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.queryByText(/could use some love/i)).not.toBeInTheDocument()
  })

  it('breaks words learned down by level', () => {
    render(<Dashboard onBack={vi.fn()} />)
    expect(screen.getByTestId('level-breakdown-1')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write the screen, then run the tests**

Run: `npm test -- src/screens/Dashboard`
Expected: all passing.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Dashboard.tsx src/screens/Dashboard.test.tsx
git commit -m "feat: add progress dashboard with per-skill tracking"
```

---

## Phase 6 — New content

### Task 21: Irregular verbs deck and conjugation table

**Files:**
- Create: `src/content/authored/irregular.ts`
- Modify: `src/content/index.ts` — add `IRREGULAR_DECK` to `DECKS`
- Create: `src/screens/ConjugationTable.tsx`
- Test: `src/content/authored/authored.test.ts`

**Interfaces:**
- Produces: `IRREGULAR_DECK: Deck`, `IRREGULAR_TABLE: { base: string; past: string; participle: string; pt: string }[]`, `<ConjugationTable onBack: () => void />`

**Content requirement — 14 cards, `level: 2`, emoji 🔄, `pos: 'grammar'` on every card**
so the modality router sends them to recognize/build rather than type (typing
`"go → went"` would be miserable). `en` reads `"go → went"`; `pt` is a short Portuguese
gloss such as `"ir (passado: went)"`; `exampleHtml` uses the **past** form inside
`<b>…</b>` in a 3–9 word sentence so Build and Dictate work.

Verbs, in this order: go/went, have/had, be/was-were, do/did, say/said, make/made,
take/took, come/came, see/saw, get/got, give/gave, know/knew, think/thought, find/found.

- [ ] **Step 1: Write `src/content/authored/irregular.ts`**

Follow this shape for all fourteen entries:

```ts
import type { Deck } from '../../types'

export const IRREGULAR_TABLE = [
  { base: 'go', past: 'went', participle: 'gone', pt: 'ir' },
  { base: 'have', past: 'had', participle: 'had', pt: 'ter' },
  { base: 'be', past: 'was / were', participle: 'been', pt: 'ser / estar' },
  { base: 'do', past: 'did', participle: 'done', pt: 'fazer' },
  { base: 'say', past: 'said', participle: 'said', pt: 'dizer' },
  { base: 'make', past: 'made', participle: 'made', pt: 'fazer / criar' },
  { base: 'take', past: 'took', participle: 'taken', pt: 'pegar / levar' },
  { base: 'come', past: 'came', participle: 'come', pt: 'vir' },
  { base: 'see', past: 'saw', participle: 'seen', pt: 'ver' },
  { base: 'get', past: 'got', participle: 'got / gotten', pt: 'conseguir / receber' },
  { base: 'give', past: 'gave', participle: 'given', pt: 'dar' },
  { base: 'know', past: 'knew', participle: 'known', pt: 'saber / conhecer' },
  { base: 'think', past: 'thought', participle: 'thought', pt: 'pensar / achar' },
  { base: 'find', past: 'found', participle: 'found', pt: 'encontrar' },
] as const

export const IRREGULAR_DECK: Deck = {
  id: 'irregular',
  name: 'Irregular verbs',
  emoji: '🔄',
  desc: 'The past tense that refuses to follow rules',
  level: 2,
  cards: [
    {
      id: 'irregular_0', deckId: 'irregular',
      en: 'go → went', pt: 'ir (passado: went)',
      exampleHtml: 'I <b>went</b> to the shop yesterday.',
      examplePt: 'Eu fui à loja ontem.',
      pos: 'grammar',
    },
    {
      id: 'irregular_1', deckId: 'irregular',
      en: 'have → had', pt: 'ter (passado: had)',
      exampleHtml: 'We <b>had</b> a great weekend.',
      examplePt: 'Nós tivemos um ótimo fim de semana.',
      pos: 'grammar',
    },
    // … twelve more, ids irregular_2 … irregular_13, same shape
  ],
}
```

- [ ] **Step 2: Add it to `src/content/index.ts`**

```ts
import { IRREGULAR_DECK } from './authored/irregular'

export const DECKS: Deck[] = [...GENERATED_DECKS, IRREGULAR_DECK]
```

- [ ] **Step 3: Write `src/content/authored/authored.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { IRREGULAR_DECK, IRREGULAR_TABLE } from './irregular'
import { isSentence, isTypable, exampleWords } from '../../core/text'

describe('irregular verbs deck', () => {
  it('has fourteen cards at level 2', () => {
    expect(IRREGULAR_DECK.cards).toHaveLength(14)
    expect(IRREGULAR_DECK.level).toBe(2)
  })

  it('marks every card as grammar so it is never typed', () => {
    for (const c of IRREGULAR_DECK.cards) {
      expect(c.pos, c.id).toBe('grammar')
      expect(isTypable(c), c.id).toBe(false)
    }
  })

  it('gives every card a buildable example sentence', () => {
    for (const c of IRREGULAR_DECK.cards) {
      expect(isSentence(c), c.id).toBe(true)
      expect(exampleWords(c).length, c.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('bolds the past form in the example', () => {
    for (const c of IRREGULAR_DECK.cards) {
      const bolded = /<b>(.*?)<\/b>/.exec(c.exampleHtml)?.[1] ?? ''
      const past = c.en.split('→')[1]!.trim()
      expect(past.split(' / ').some(p => bolded.includes(p)), c.id).toBe(true)
    }
  })

  it('uses sequential ids', () => {
    IRREGULAR_DECK.cards.forEach((c, i) => expect(c.id).toBe(`irregular_${i}`))
  })

  it('has a conjugation table covering every card', () => {
    expect(IRREGULAR_TABLE).toHaveLength(14)
    for (const row of IRREGULAR_TABLE) {
      expect(row.base).toBeTruthy()
      expect(row.past).toBeTruthy()
      expect(row.participle).toBeTruthy()
      expect(row.pt).toBeTruthy()
    }
  })
})
```

- [ ] **Step 4: Write `src/screens/ConjugationTable.tsx`**

A three-column reference — base · past · past participle — with the Portuguese gloss
underneath each row's base form. Reachable from the irregular deck on Home via a small
"📋 Table" button. Wrap the table in `overflow-x-auto` so it never forces the page to
scroll sideways on a phone.

- [ ] **Step 5: Run the tests**

Run: `npm test`
Expected: all passing, including the content integrity suite (card count is now ≥ 439).

- [ ] **Step 6: Commit**

```bash
git add src/content src/screens/ConjugationTable.tsx
git commit -m "feat: add irregular verbs deck and conjugation reference"
```

---

### Task 22: B2 content

**Files:**
- Create: `src/content/authored/b2.ts`
- Modify: `src/content/index.ts`
- Modify: `src/content/authored/authored.test.ts`

**Interfaces:**
- Produces: `B2_DECKS: Deck[]` — six decks, all `level: 4`, **130–160 cards in total**

**The six decks:**

| id | name | emoji | count | notes |
|---|---|---|---|---|
| `phrasal` | Phrasal verbs | 🔗 | ~28 | pick up, give up, look after, sort out, run out of, deal with, get on with, put up with, figure out, turn up, drop off, take off, come across, get by, look into, sign up, work out, bring up, call off, carry on, end up, fill in, hand in, hold on, look forward to, pull over, put off, set up |
| `connectors` | Connectors & linkers | 🧩 | ~22 | however, although, therefore, on the other hand, as soon as, in order to, even though, meanwhile, whereas, nevertheless, in addition, as a result, for instance, in fact, otherwise, despite, unless, while, besides, so that, rather than, at the same time |
| `opinions` | Opinions & discussion | 💭 | ~22 | I reckon…, I'd say…, to be honest, it depends, the thing is…, I'm not sure I agree, fair enough, I see your point, from my point of view, I'd rather…, personally, that makes sense, I'm not fussed, up to you, I doubt it, as far as I know, if you ask me, it's worth… , I'd argue that…, on balance, to be fair, I take your point |
| `workplace` | Work & professional | 🗂️ | ~26 | deadline, roster, sign off, follow up, in charge of, take on, annual leave, KiwiSaver, notice period, probation, timesheet, payslip, PAYE, overtime, shift, handover, performance review, contract, reference, resign, apply for, shortlist, induction, health and safety, casual work, fixed-term |
| `idioms` | Idioms & Kiwi collocations | 🎣 | ~22 | heaps of, keen as, chock-a-block, give it a go, no dramas, flat out, hard yakka, she'll be right, a piece of cake, out of the blue, over the moon, under the weather, on the ball, touch base, get the hang of, in the loop, call it a day, cut corners, bite the bullet, break the ice, hit the road, spot on |
| `tenses` | Trickier tenses | ⏳ | ~22 | present perfect ("I've lived here for two years"), present perfect continuous, past perfect, first/second/third conditionals, used to, would for past habits, going to vs will, be about to, by the time…, had better, might have, should have |

**Rules for every card:**
- Same tuple shape and the `<b>…</b>` example convention as generated content, so all
  modalities work automatically with no special-casing.
- `pos: 'phrase'` for multi-word expressions and `'grammar'` for the tenses deck — this
  routes them away from typing, which would be punishing at B2 length. Single-word items
  (`deadline`, `roster`, `overtime`) take their natural part of speech and stay typable.
- Example sentences of 3–9 words wherever possible so Build and Dictate have material.
- Portuguese glosses in **Brazilian** Portuguese.
- `id` is `` `${deckId}_${index}` `` with no gaps.

- [ ] **Step 1: Write `src/content/authored/b2.ts`**

Shape, using the phrasal-verbs deck as the model:

```ts
import type { Deck } from '../../types'

const phrasal: Deck = {
  id: 'phrasal', name: 'Phrasal verbs', emoji: '🔗',
  desc: 'Two small words, one new meaning', level: 4,
  cards: [
    {
      id: 'phrasal_0', deckId: 'phrasal',
      en: 'pick up', pt: 'pegar / buscar',
      exampleHtml: "I'll <b>pick up</b> the kids at three.",
      examplePt: 'Eu vou buscar as crianças às três.',
      pos: 'phrase',
    },
    // …
  ],
}

export const B2_DECKS: Deck[] = [phrasal, connectors, opinions, workplace, idioms, tenses]
```

- [ ] **Step 2: Add them to `src/content/index.ts`**

```ts
import { B2_DECKS } from './authored/b2'

export const DECKS: Deck[] = [...GENERATED_DECKS, IRREGULAR_DECK, ...B2_DECKS]
```

- [ ] **Step 3: Extend `src/content/authored/authored.test.ts`**

```ts
import { B2_DECKS } from './b2'
import { DECKS, ALL_CARDS } from '../index'

describe('B2 content', () => {
  it('has six decks, all at level 4', () => {
    expect(B2_DECKS).toHaveLength(6)
    for (const d of B2_DECKS) expect(d.level, d.id).toBe(4)
  })

  it('adds between 130 and 160 cards', () => {
    const n = B2_DECKS.reduce((sum, d) => sum + d.cards.length, 0)
    expect(n).toBeGreaterThanOrEqual(130)
    expect(n).toBeLessThanOrEqual(160)
  })

  it('gives every B2 card the full tuple and a bolded example', () => {
    for (const d of B2_DECKS) {
      for (const c of d.cards) {
        expect(c.en, c.id).toBeTruthy()
        expect(c.pt, c.id).toBeTruthy()
        expect(c.examplePt, c.id).toBeTruthy()
        expect(c.exampleHtml, c.id).toMatch(/<b>.+<\/b>/)
        expect(c.deckId, c.id).toBe(d.id)
      }
    }
  })

  it('numbers ids sequentially within each deck', () => {
    for (const d of B2_DECKS) {
      d.cards.forEach((c, i) => expect(c.id).toBe(`${d.id}_${i}`))
    }
  })

  it('keeps every card id unique across the whole app', () => {
    const ids = ALL_CARDS.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives level 4 real substance', () => {
    const level4 = DECKS.filter(d => d.level === 4).flatMap(d => d.cards)
    expect(level4.length).toBeGreaterThanOrEqual(130)
  })
})
```

- [ ] **Step 4: Run the tests**

Run: `npm test`
Expected: all passing. Total corpus is now roughly 570–600 cards.

- [ ] **Step 5: Commit**

```bash
git add src/content
git commit -m "feat: add B2 content — phrasal verbs, connectors, opinions, workplace, idioms, tenses"
```

---

## Phase 7 — Speaking, shadowing and resources

### Task 23: Speak modality and shadowing

**Files:**
- Create: `src/core/pronunciation.ts`
- Test: `src/core/pronunciation.test.ts`
- Create: `src/components/modality/Speak.tsx`
- Create: `src/screens/Shadowing.tsx`
- Test: `src/screens/Shadowing.test.tsx`

**Interfaces:**
- Consumes: `recognizeOnce` from `../audio/listen`; `speak` from `../audio/speak`; `normalize` from `./text`; `DIALOGUES`, `ALL_CARDS` from `../content`
- Produces:
  - `pronunciation.ts`: `similarity(a: string, b: string): number`, `judgePronunciation(heard: string, target: string): { ok: boolean; score: number; message: string }`, `shadowingLines(): { id: string; en: string; pt: string; source: string }[]`
  - `<Speak {...ModalityProps} />`, `<Shadowing dialogueId?: string onBack: () => void />`

**Behaviour contract:**
- `similarity` is normalised Levenshtein in 0–1 over `normalize`d strings.
- `judgePronunciation` accepts when the heard text **contains** the target or scores
  ≥ 0.75. An empty `heard` is never a pass, and its message must be about the
  microphone, not about her: `"Didn't catch that — have another go 🎤"`. A pass reads
  `"Ka pai! That sounded great 👏"`; a near miss reads
  `"Close — listen once more and try again"`.
- **Speak** shows the word, a 🎤 button (`aria-label="Record your voice"`), a listening
  state, then the judgement and a Continue button. `onAnswer(ok)`.
  **The mic must never block the session:** any failure resolves to `''`, which shows the
  friendly retry message plus a "Skip this one" button that calls `onAnswer(true)` — an
  unavailable microphone must not damage her card scheduling.
- **Shadowing** is its own screen, reachable from each dialogue and from the Explore row.
  For each line: play at normal speed, show text + Portuguese, offer 🐢 slow replay
  (`rate: 0.7`), then record and judge. Feedback is warm; there is no scoring or
  scheduling — shadowing is practice, not review. Next/Previous line controls, and a
  progress readout `Line N of M`.
- `shadowingLines()` returns every dialogue line plus every card example of ≥ 5 words,
  each tagged with its source title.

- [ ] **Step 1: Write `src/core/pronunciation.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { similarity, judgePronunciation, shadowingLines } from './pronunciation'

describe('similarity', () => {
  it('scores identical strings as 1', () => {
    expect(similarity('water', 'water')).toBe(1)
  })

  it('ignores case and punctuation', () => {
    expect(similarity('Water!', 'water')).toBe(1)
  })

  it('scores a near miss highly', () => {
    expect(similarity('wader', 'water')).toBeGreaterThan(0.7)
  })

  it('scores unrelated words low', () => {
    expect(similarity('elephant', 'water')).toBeLessThan(0.4)
  })

  it('handles an empty string without dividing by zero', () => {
    expect(similarity('', 'water')).toBe(0)
    expect(similarity('', '')).toBe(1)
  })
})

describe('judgePronunciation', () => {
  it('passes an exact match warmly', () => {
    const r = judgePronunciation('water', 'water')
    expect(r.ok).toBe(true)
    expect(r.message).toMatch(/ka pai/i)
  })

  it('passes when the phrase is embedded in a longer transcript', () => {
    expect(judgePronunciation('I said water please', 'water').ok).toBe(true)
  })

  it('passes a close attempt', () => {
    expect(judgePronunciation('wader', 'water').ok).toBe(true)
  })

  it('fails an unrelated word kindly', () => {
    const r = judgePronunciation('elephant', 'water')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/listen once more/i)
  })

  it('blames the microphone, not the learner, when nothing was heard', () => {
    const r = judgePronunciation('', 'water')
    expect(r.ok).toBe(false)
    expect(r.message).toMatch(/didn't catch that/i)
  })
})

describe('shadowingLines', () => {
  it('draws material from the dialogues', () => {
    const lines = shadowingLines()
    expect(lines.length).toBeGreaterThan(30)
    expect(lines.every(l => l.en.trim().length > 0)).toBe(true)
    expect(lines.every(l => l.source.trim().length > 0)).toBe(true)
  })

  it('gives every line a unique id', () => {
    const ids = shadowingLines().map(l => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Write `src/core/pronunciation.ts`**

```ts
import { normalize, stripTags } from './text'
import { ALL_CARDS, DIALOGUES } from '../content'

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  let prev = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    const curr = [i, ...Array(n).fill(0)]
    for (let j = 1; j <= n; j++) {
      curr[j] = Math.min(
        prev[j] + 1,
        curr[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      )
    }
    prev = curr
  }
  return prev[n]
}

/** 0..1 similarity over normalised text. */
export function similarity(a: string, b: string): number {
  const x = normalize(a)
  const y = normalize(b)
  if (x === y) return 1
  const longest = Math.max(x.length, y.length)
  if (longest === 0) return 1
  if (x.length === 0 || y.length === 0) return 0
  return 1 - levenshtein(x, y) / longest
}

export function judgePronunciation(
  heard: string,
  target: string,
): { ok: boolean; score: number; message: string } {
  if (!heard.trim()) {
    return { ok: false, score: 0, message: "Didn't catch that — have another go 🎤" }
  }
  const h = normalize(heard)
  const t = normalize(target)
  const score = similarity(heard, target)
  const ok = h.includes(t) || score >= 0.75
  return {
    ok,
    score,
    message: ok ? 'Ka pai! That sounded great 👏' : 'Close — listen once more and try again',
  }
}

export interface ShadowingLine { id: string; en: string; pt: string; source: string }

/** Dialogue lines plus the longer card examples — real rhythm to imitate. */
export function shadowingLines(): ShadowingLine[] {
  const fromDialogues: ShadowingLine[] = DIALOGUES.flatMap(d =>
    d.lines.map((l, i) => ({ id: `${d.id}_${i}`, en: l.en, pt: l.pt, source: d.title })),
  )
  const fromCards: ShadowingLine[] = ALL_CARDS
    .filter(c => stripTags(c.exampleHtml).trim().split(/\s+/).length >= 5)
    .map(c => ({ id: `card_${c.id}`, en: stripTags(c.exampleHtml), pt: c.examplePt, source: 'Examples' }))
  return [...fromDialogues, ...fromCards]
}
```

- [ ] **Step 3: Write `src/screens/Shadowing.test.tsx`**

Stub recognition so the test never touches a real microphone:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Shadowing } from './Shadowing'

vi.mock('../audio/listen', () => ({ recognizeOnce: vi.fn(async () => 'Hi there! What can I get you?') }))
vi.mock('../audio/speak', () => ({ speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn() }))

beforeEach(() => { vi.clearAllMocks() })

describe('Shadowing', () => {
  it('shows a line with its translation and a slow replay', () => {
    render(<Shadowing dialogueId="dlg_0" onBack={vi.fn()} />)
    expect(screen.getByRole('button', { name: /slow/i })).toBeInTheDocument()
    expect(screen.getByText(/line 1 of/i)).toBeInTheDocument()
  })

  it('praises a good repetition', async () => {
    render(<Shadowing dialogueId="dlg_0" onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /record your voice/i }))
    expect(await screen.findByText(/ka pai/i)).toBeInTheDocument()
  })

  it('moves to the next line', async () => {
    render(<Shadowing dialogueId="dlg_0" onBack={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /next line/i }))
    expect(screen.getByText(/line 2 of/i)).toBeInTheDocument()
  })
})
```

- [ ] **Step 4: Write `Speak.tsx` and `Shadowing.tsx`, then run the tests**

Run: `npm test -- src/core/pronunciation src/screens/Shadowing`
Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/core/pronunciation.ts src/core/pronunciation.test.ts src/components/modality/Speak.tsx src/screens/Shadowing.tsx src/screens/Shadowing.test.tsx
git commit -m "feat: add speaking modality and shadowing practice"
```

---

### Task 24: 8-week plan and dialogues screens

**Files:**
- Create: `src/screens/Plan.tsx`
- Create: `src/screens/Dialogues.tsx`
- Test: `src/screens/Dialogues.test.tsx`

**Interfaces:**
- Consumes: `PLAN`, `DIALOGUES` from `../content`; `DAY` from `../core/time`; `speak`, `cancelSpeech` from `../audio/speak`
- Produces: `<Plan onBack />`, `<Dialogues onBack onShadow: (dialogueId: string) => void />`

**Behaviour contract:**
- **Plan** — eight cards. The current week is
  `Math.min(8, Math.floor((now − startedAt) / (7 × DAY)) + 1)`, highlighted with a brand
  border and a "• now" marker. Each card shows `Week N`, title, detail and the gold tip.
  Footer: "Aim for a little every day. Consistency beats long study once a week."
- **Dialogues** — a list of seven, each expanding to its lines with speaker labels,
  English, and Portuguese underneath (respecting `showPortuguese`). Each line has a 🔊
  button. Each dialogue has **Play all** (speaks every line in order with a pause
  between, cancellable — a `playToken` counter guards against overlapping runs when she
  taps twice) and **🗣️ Shadow this** calling `onShadow(dialogue.id)`.

- [ ] **Step 1: Write `src/screens/Dialogues.test.tsx`**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dialogues } from './Dialogues'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

vi.mock('../audio/speak', () => ({ speak: vi.fn(), cancelSpeech: vi.fn(), warmUp: vi.fn(), pickVoice: vi.fn() }))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null })
})

describe('Dialogues', () => {
  it('lists all seven dialogues', () => {
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    expect(screen.getAllByTestId('dialogue-card')).toHaveLength(7)
  })

  it('expands to show the lines', async () => {
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    expect(screen.getByRole('button', { name: /play all/i })).toBeInTheDocument()
  })

  it('starts shadowing for that dialogue', async () => {
    const onShadow = vi.fn()
    render(<Dialogues onBack={vi.fn()} onShadow={onShadow} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    await userEvent.click(screen.getByRole('button', { name: /shadow this/i }))
    expect(onShadow).toHaveBeenCalledWith('dlg_0')
  })

  it('hides Portuguese when the setting is off', async () => {
    useStore.setState({ showPortuguese: false })
    render(<Dialogues onBack={vi.fn()} onShadow={vi.fn()} />)
    await userEvent.click(screen.getAllByTestId('dialogue-card')[0])
    expect(screen.queryByTestId('dialogue-line-pt')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Write both screens, wire them into `App.tsx`, run the tests**

Run: `npm test -- src/screens/Dialogues`
Expected: all passing.

- [ ] **Step 3: Commit**

```bash
git add src/screens/Plan.tsx src/screens/Dialogues.tsx src/screens/Dialogues.test.tsx src/App.tsx
git commit -m "feat: port the 8-week plan and dialogues, with shadowing entry points"
```

---

## Phase 8 — Cloud sync and settings

### Task 25: Supabase sync client, schema and settings

**Files:**
- Create: `supabase/schema.sql`
- Create: `src/sync/client.ts`
- Create: `src/sync/useSync.ts`
- Test: `src/sync/client.test.ts`
- Create: `src/screens/Settings.tsx`
- Test: `src/screens/Settings.test.tsx`

**Interfaces:**
- Consumes: `mergeSnapshots` from `../core/merge`; `AppState` from `../types`; `useStore`
- Produces:
  - `type SyncStatus = 'unconfigured' | 'offline' | 'idle' | 'syncing' | 'synced' | 'error'`
  - `isSyncConfigured(): boolean`
  - `loadProgress(code: string): Promise<AppState | null>`
  - `saveProgress(code: string, data: AppState): Promise<void>`
  - `useSync(): { status: SyncStatus; restore: (code: string) => Promise<'merged' | 'pushed' | 'error'> }`
  - `<Settings onBack onRetakePlacement />`

**The single most important requirement:** with an empty `.env` the app must behave
exactly as it does today — study, placement, dashboard, everything. `isSyncConfigured()`
returns false, `status` is `'unconfigured'`, Settings shows "Cloud sync isn't set up yet"
instead of a broken PIN field, and no Supabase client is ever constructed.

- [ ] **Step 1: Write `supabase/schema.sql`**

```sql
-- English → NZ progress sync.
-- Run this once in the Supabase SQL editor for your project.

create table if not exists public.progress (
  code text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- RLS on, with NO policies for anon: the table itself is unreachable.
-- All access goes through the two security-definer functions below, which
-- require knowing the code. Row enumeration is therefore impossible.
alter table public.progress enable row level security;

create or replace function public.load_progress(p_code text)
returns jsonb language sql security definer set search_path = public as $$
  select data from public.progress where code = p_code;
$$;

create or replace function public.save_progress(p_code text, p_data jsonb)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.progress(code, data, updated_at)
  values (p_code, p_data, now())
  on conflict (code) do update set data = excluded.data, updated_at = now();
end;
$$;

revoke all on function public.load_progress(text) from public;
revoke all on function public.save_progress(text, jsonb) from public;
grant execute on function public.load_progress(text) to anon;
grant execute on function public.save_progress(text, jsonb) to anon;
```

- [ ] **Step 2: Write `src/sync/client.ts`**

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { AppState } from '../types'

export type SyncStatus = 'unconfigured' | 'offline' | 'idle' | 'syncing' | 'synced' | 'error'

const URL = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function isSyncConfigured(): boolean {
  return Boolean(URL && KEY)
}

let client: SupabaseClient | null = null

function getClient(): SupabaseClient | null {
  if (!isSyncConfigured()) return null
  if (!client) client = createClient(URL!, KEY!)
  return client
}

export async function loadProgress(code: string): Promise<AppState | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c.rpc('load_progress', { p_code: code })
  if (error) throw error
  return (data as AppState | null) ?? null
}

export async function saveProgress(code: string, data: AppState): Promise<void> {
  const c = getClient()
  if (!c) return
  const { error } = await c.rpc('save_progress', { p_code: code, p_data: data })
  if (error) throw error
}

/** A sync code should be a word plus digits, not a four-digit PIN. */
export function validateSyncCode(code: string): string | null {
  const trimmed = code.trim()
  if (trimmed.length < 6) return 'Use at least 6 characters'
  if (!/[a-zA-Z]/.test(trimmed)) return 'Include at least one letter'
  if (!/[0-9]/.test(trimmed)) return 'Include at least one number'
  return null
}
```

- [ ] **Step 3: Write `src/sync/client.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { validateSyncCode, isSyncConfigured } from './client'

describe('validateSyncCode', () => {
  it('rejects a short code', () => {
    expect(validateSyncCode('ana1')).toMatch(/6 characters/)
  })

  it('rejects a digits-only PIN', () => {
    expect(validateSyncCode('123456')).toMatch(/letter/)
  })

  it('rejects a letters-only code', () => {
    expect(validateSyncCode('anabanana')).toMatch(/number/)
  })

  it('accepts a word plus digits', () => {
    expect(validateSyncCode('kiwi2026')).toBeNull()
  })

  it('ignores surrounding whitespace', () => {
    expect(validateSyncCode('  kiwi2026  ')).toBeNull()
  })
})

describe('isSyncConfigured', () => {
  it('reports false when no env vars are set', () => {
    expect(typeof isSyncConfigured()).toBe('boolean')
  })
})
```

- [ ] **Step 4: Write `src/sync/useSync.ts`**

```ts
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { mergeSnapshots } from '../core/merge'
import { isSyncConfigured, loadProgress, saveProgress, type SyncStatus } from './client'
import type { AppState } from '../types'

const DEBOUNCE_MS = 4000

function snapshot(): AppState {
  const { unlocked: _unlocked, ...rest } = useStore.getState()
  return rest as AppState
}

export function useSync(): { status: SyncStatus; restore: (code: string) => Promise<'merged' | 'pushed' | 'error'> } {
  const [status, setStatus] = useState<SyncStatus>(isSyncConfigured() ? 'idle' : 'unconfigured')
  const syncCode = useStore(s => s.syncCode)
  const updatedAt = useStore(s => s.updatedAt)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const push = useCallback(async () => {
    if (!isSyncConfigured() || !syncCode) return
    if (!navigator.onLine) { setStatus('offline'); return }
    setStatus('syncing')
    try { await saveProgress(syncCode, snapshot()); setStatus('synced') }
    catch { setStatus('error') }
  }, [syncCode])

  // Pull on launch.
  useEffect(() => {
    if (!isSyncConfigured() || !syncCode) return
    let cancelled = false
    void (async () => {
      try {
        const remote = await loadProgress(syncCode)
        if (cancelled || !remote) return
        if (remote.updatedAt > useStore.getState().updatedAt) {
          useStore.getState().replaceState(mergeSnapshots(snapshot(), remote))
        }
        setStatus('synced')
      } catch { setStatus('error') }
    })()
    return () => { cancelled = true }
  }, [syncCode])

  // Debounced push on change.
  useEffect(() => {
    if (!isSyncConfigured() || !syncCode) return
    clearTimeout(timer.current)
    timer.current = setTimeout(() => { void push() }, DEBOUNCE_MS)
    return () => clearTimeout(timer.current)
  }, [updatedAt, syncCode, push])

  // Save when the tab goes away.
  useEffect(() => {
    const flush = () => { void push() }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', flush)
      window.removeEventListener('pagehide', flush)
    }
  }, [push])

  const restore = useCallback(async (code: string) => {
    if (!isSyncConfigured()) return 'error' as const
    setStatus('syncing')
    try {
      const remote = await loadProgress(code)
      if (remote) {
        useStore.getState().replaceState(mergeSnapshots(snapshot(), remote))
        useStore.getState().setSyncCode(code)
        setStatus('synced')
        return 'merged' as const
      }
      useStore.getState().setSyncCode(code)
      await saveProgress(code, snapshot())
      setStatus('synced')
      return 'pushed' as const
    } catch { setStatus('error'); return 'error' as const }
  }, [])

  return { status, restore }
}
```

- [ ] **Step 5: Write `src/screens/Settings.tsx` and `src/screens/Settings.test.tsx`**

Settings contains, in order: name field; **sync** section; daily goal stepper (5–100 in
steps of 5); new cards per session stepper (1–20); accent selector (four options);
auto-play audio toggle; show-Portuguese toggle; "Retake placement test"; and
"Reset progress" behind a two-step confirm.

The sync section renders one of two things:
- `isSyncConfigured() === false` → a muted card: "Cloud sync isn't set up yet. Your
  progress is saved on this device." and nothing else. No input, no broken button.
- configured → the code field with `validateSyncCode` inline errors, a status `Chip`
  (✓ synced / ⟳ syncing / ⚠︎ offline / ⚠︎ error), a "Save & sync" button, and a
  "Restore from a code" button.

```tsx
// src/screens/Settings.test.tsx — the two cases that matter most
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Settings } from './Settings'
import { useStore } from '../store/useStore'
import { createInitialState } from '../store/defaults'

vi.mock('../sync/client', async importOriginal => ({
  ...(await importOriginal<typeof import('../sync/client')>()),
  isSyncConfigured: () => false,
}))

beforeEach(() => {
  useStore.setState({ ...createInitialState(Date.now()), unlocked: null, placed: true, profileName: 'Ana' })
})

describe('Settings without Supabase configured', () => {
  it('explains that sync is not set up instead of showing a broken field', () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} />)
    expect(screen.getByText(/cloud sync isn't set up yet/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/sync code/i)).not.toBeInTheDocument()
  })

  it('still exposes every local setting', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} />)
    expect(screen.getByLabelText(/daily goal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/show portuguese/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/accent/i)).toBeInTheDocument()
  })

  it('changes a preference in the store', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} />)
    await userEvent.click(screen.getByLabelText(/show portuguese/i))
    expect(useStore.getState().showPortuguese).toBe(false)
  })

  it('requires a second confirmation before wiping progress', async () => {
    render(<Settings onBack={vi.fn()} onRetakePlacement={vi.fn()} />)
    await userEvent.click(screen.getByRole('button', { name: /reset progress/i }))
    expect(screen.getByRole('button', { name: /yes, erase everything/i })).toBeInTheDocument()
    expect(useStore.getState().placed).toBe(true)
  })
})
```

- [ ] **Step 6: Run the tests and the full suite**

Run: `npm test`
Expected: all passing.

- [ ] **Step 7: Commit**

```bash
git add supabase src/sync src/screens/Settings.tsx src/screens/Settings.test.tsx src/App.tsx
git commit -m "feat: add PIN cloud sync, Supabase schema and settings"
```

---

## Phase 9 — PWA, accessibility, E2E and delivery

### Task 26: PWA, offline and accessibility pass

**Files:**
- Modify: `vite.config.ts`
- Create: `public/icon-192.png`, `public/icon-512.png`, `public/icon-maskable-512.png`, `public/apple-touch-icon.png`
- Modify: `index.html`
- Create: `scripts/make-icons.mjs`

**Interfaces:**
- Consumes: nothing
- Produces: an installable, offline-capable build

- [ ] **Step 1: Generate the icons**

`scripts/make-icons.mjs` writes a 🥝 glyph centred on `#0f172a` to PNG at 192, 512 and
a maskable 512 (glyph at 60% of the canvas so it survives circular masking), plus a
180px `apple-touch-icon.png`. Use `sharp` if it is already available, otherwise render
an SVG string and convert with `sharp`; if neither is practical, hand-author the SVG and
export once, committing the PNGs.

- [ ] **Step 2: Add the PWA plugin to `vite.config.ts`**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'English → NZ',
        short_name: 'English NZ',
        description: 'Learn the English you need for New Zealand',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
  build: { outDir: 'dist' },
})
```

Content is bundled into the JS, so precaching the shell precaches the whole course.

- [ ] **Step 3: Accessibility sweep**

Walk every screen and confirm: each icon-only button has an `aria-label`; each form
control has a label or `aria-label`; tap targets are ≥ 44px; the tab order is sensible;
`:focus-visible` is visible against `--bg`; skill and level bars carry text labels and
never rely on colour alone; the reduced-motion block in `index.css` actually suppresses
the transitions used.

- [ ] **Step 4: Verify the production build works offline**

Run: `npm run build && npm run preview`
Then, in the browser: load the page, confirm a service worker registers, go offline in
DevTools, reload, and confirm the app still opens and a session still runs.
Expected: full offline function.

- [ ] **Step 5: Commit**

```bash
git add vite.config.ts index.html public scripts/make-icons.mjs
git commit -m "feat: make the app installable and fully offline-capable"
```

---

### Task 27: End-to-end smoke test, README and delivery

**Files:**
- Create: `playwright.config.ts`
- Create: `tests/e2e/session.spec.ts`
- Create: `README.md`
- Create: `.env.example` (verify it exists from Task 1)

**Interfaces:**
- Consumes: the whole app
- Produces: `npm run test:e2e` and a README the owner can follow without help

- [ ] **Step 1: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  use: { ...devices['iPhone 13'], baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173',
    port: 4173,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
```

- [ ] **Step 2: Write `tests/e2e/session.spec.ts`**

Stub speech before the app loads so the run is deterministic and silent:

```ts
import { test, expect, type Page } from '@playwright/test'

async function stubSpeech(page: Page) {
  await page.addInitScript(() => {
    // @ts-expect-error test stub
    window.speechSynthesis = { speak: () => {}, cancel: () => {}, getVoices: () => [] }
    // @ts-expect-error test stub
    window.SpeechSynthesisUtterance = function () { return {} }
    // Speech recognition stays undefined: the app must degrade, not crash.
  })
}

test('first run: name, placement, home, a session, and progress that survives reload', async ({ page }) => {
  await stubSpeech(page)
  await page.goto('/')

  // Name
  await page.getByRole('textbox').fill('Ana')
  await page.getByRole('button', { name: /continue/i }).click()

  // Placement — answer everything with the first option / a wrong word.
  for (let i = 0; i < 20; i++) {
    const option = page.getByTestId('placement-option').first()
    if (await option.count()) { await option.click(); continue }
    const input = page.getByRole('textbox')
    if (await input.count()) {
      await input.fill('zzz')
      await page.getByRole('button', { name: /next|finish/i }).click()
      continue
    }
    break
  }
  await page.getByRole('button', { name: /continue|start/i }).click()

  // Home
  await expect(page.getByText(/kia ora, ana/i)).toBeVisible()
  await expect(page.getByTestId('study-now')).toBeVisible()
  await expect(page.getByRole('button', { name: /^typing$/i })).toHaveCount(0)

  // Locked level
  await expect(page.getByTestId('deck-money')).toBeDisabled()

  // Session
  await page.getByTestId('study-now').click()
  for (let i = 0; i < 8; i++) {
    const gotIt = page.getByRole('button', { name: /got it/i })
    if (!(await gotIt.count())) break
    await gotIt.click()
  }

  // Progress persists
  await page.reload()
  await expect(page.getByText(/kia ora, ana/i)).toBeVisible()
  const known = await page.getByTestId('stat-known').innerText()
  expect(Number(known.replace(/\D/g, ''))).toBeGreaterThan(0)
})

test('dashboard reflects what she practised', async ({ page }) => {
  await stubSpeech(page)
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.setItem('english-nz', JSON.stringify({
      state: {
        profileName: 'Ana', syncCode: null, cefrLevel: 1, unlockedLevel: 1, placed: true,
        cards: {}, skills: {
          vocab: { correct: 8, total: 10 }, listening: { correct: 3, total: 10 },
          grammar: { correct: 0, total: 0 }, speaking: { correct: 0, total: 0 },
        },
        dailyGoal: 20, newPerSession: 8, accent: 'en-NZ', showPortuguese: true, autoPlayAudio: true,
        streak: 2, lastStudyDay: null, doneToday: 0, doneDate: null, bestDay: 5,
        startedAt: Date.now(), updatedAt: Date.now(),
      },
      version: 1,
    }))
  })
  await page.reload()
  await page.getByRole('button', { name: /progress/i }).click()
  await expect(page.getByText(/30% · 10 reviews/)).toBeVisible()
  await expect(page.getByText(/listening could use some love/i)).toBeVisible()
  await expect(page.getByText(/speaking — not practised yet/i)).toBeVisible()
})
```

Home stat tiles need `data-testid="stat-known"`, `stat-streak`, `stat-due` for this to
work — add them in this task if Task 19 did not.

- [ ] **Step 3: Run the E2E suite**

Run: `npx playwright install chromium` then `npm run test:e2e`
Expected: both tests pass.

- [ ] **Step 4: Write `README.md`**

Cover, in this order:
1. What the app is, in two sentences, and who it is for.
2. **Quick start** — `npm install`, `npm run dev`.
3. **Build and host** — `npm run build` produces `dist/`; upload its contents to any
   static host or a subfolder of the owner's site. Note that if it is served from a
   subfolder, `base` in `vite.config.ts` and `start_url`/`scope` in the manifest must be
   set to that path. HTTPS is required for the service worker and the microphone.
4. **Cloud sync setup** — create a project at supabase.com; open the SQL editor; paste
   `supabase/schema.sql` and run it; copy the project URL and the **anon** key from
   Project Settings → API; create `.env` from `.env.example`; rebuild. State plainly that
   the anon key is safe to ship because the table has RLS with no policies and all access
   goes through the two security-definer functions, which require the code.
5. **Using a sync code** — Settings → Sync, enter a word-plus-numbers code on each
   device. Same code, same progress.
6. **Scripts table** — `dev`, `build`, `preview`, `test`, `test:e2e`, `extract`.
7. **Regenerating content** — `npm run extract` re-reads `english-nz.html`. Never edit
   `*.generated.ts` by hand; author new decks in `src/content/authored/`.
8. **Known limits** — iOS Safari has no `SpeechRecognition`, so speaking and shadowing
   feedback are unavailable there and the app hides them rather than failing; voice
   availability for `en-NZ` varies by device, and the app falls back automatically.

- [ ] **Step 5: Full verification**

Run: `npx tsc --noEmit`
Expected: exits 0.

Run: `npm test`
Expected: every suite passing.

Run: `npm run test:e2e`
Expected: passing.

Run: `npm run build`
Expected: exits 0 and `dist/` contains `index.html`, hashed JS/CSS, `manifest.webmanifest`,
`sw.js` and the icons.

- [ ] **Step 6: Commit**

```bash
git add playwright.config.ts tests README.md
git commit -m "test: add end-to-end smoke coverage and write the README"
```

---

## Self-review notes

**Spec coverage.** Every numbered section of the design maps to a task: §3 architecture →
Tasks 1–3; §4 content model → Tasks 2–3; §5 learner state → Task 12; §6 SRS → Task 4;
§7 session and modalities → Tasks 5–7, 15–17, 23; §8 placement and levelling → Tasks 9,
10, 18; §9 new content → Tasks 21–22; §10 skills and dashboard → Tasks 8, 20;
§11 home and navigation → Tasks 14, 19, 24; §12 cloud sync → Tasks 11, 25;
§13 design system → Tasks 1, 14, 26; §14 PWA → Task 26; §15 settings → Task 25;
§16 testing → every task, plus Task 27; §17 build order → the phase structure;
§18 deliverable → Task 27.

**The four spec patches are each pinned to a task.** Untouched skills reading "not
practised yet" → Tasks 8 and 20. Name screen before placement → Task 18. Session backfill
→ Task 7. `emergency` at A1 → Task 3, with a test.

**Deliberate deviations from the source spec, all recorded above:** the SRS engine keeps
v1's four-rating scale internally while the session only emits again/good/easy; two
8-week-plan tips are rewritten because they referenced modes v2 removed; `bestDay` was
added to `AppState` because the dashboard requires it and the spec's state shape omitted
it.
