# English → NZ (v2) — Design

**Date:** 2026-07-30
**Status:** Approved
**Source of truth for content:** `english-nz.html` (v1, in repo root)

## 1. Purpose

A mobile-first PWA that teaches English to a Brazilian Portuguese speaker moving to
New Zealand in ~2 months. The learner is a real person — the owner's wife. Tone is
warm and encouraging throughout.

v1 let her pick her exercise mode, so she picked the easy ones and reported the app
was "too easy at the start". v2 removes that choice. There is exactly one study
button, and the session decides which modality each card is drilled in. Difficulty
ramps through CEFR levels that unlock as she earns them.

### Success criteria

- She can study a full mixed session offline on a phone, with no network.
- She cannot cherry-pick easy modalities.
- Her progress survives clearing the browser (cloud sync by PIN).
- The app places her at a CEFR level and genuinely gets harder as she climbs.
- The owner can upload the build to his own web host as static files.

## 2. Non-negotiables

- Mobile-first installable PWA; portrait phone is the primary target.
- Static output. No server runtime except Supabase (managed).
- Offline-first. Cloud sync is an enhancement and never blocks study.
- No re-authored content: v1's 25 decks / 425 cards and 7 dialogues are migrated,
  not retyped.
- Interface in simple English (immersion); Portuguese shown on cards, toggleable.
- Audio prefers `en-NZ`, falling back `en-AU` → `en-GB` → `en-US`.
- Local storage is the fast layer; the cloud is the durable truth.

## 3. Architecture

```
scripts/extract-content.mjs      one-off: english-nz.html → typed content modules
src/
  content/
    decks.generated.ts           425 cards, 25 decks, levels applied
    dialogues.generated.ts       7 dialogues
    authored/                    hand-written v2 content (irregular verbs, B2 decks)
    index.ts                     merges generated + authored, exports DECKS/DIALOGUES
  core/                          pure functions — no React, no DOM, no I/O
    srs.ts        schedule / isDue / isNew / deckProgress
    text.ts       normalize / isTypable / isSentence
    modality.ts   modality rotation
    queue.ts      session building, interleave, wrong-answer requeue
    placement.ts  placement scoring → start level
    leveling.ts   unlock threshold
    streak.ts     streak + daily counters
    merge.ts      local/remote snapshot conflict resolution
  store/          Zustand store + persist middleware
  audio/          speechSynthesis + SpeechRecognition facade, capability flags
  sync/           SyncClient over Supabase RPCs
  screens/        Home, Placement, Session, Dashboard, Plan, Dialogues, Settings, Done
  components/     modality components + shared UI
supabase/schema.sql
```

**The rule:** every decision the app makes lives in `src/core/` as a pure function.
React components render and dispatch; they do not compute. This makes the §10 test
surface reachable without rendering anything.

### 3.1 Content extraction

`DECKS` (line 391) and `DIALOGUES` (line 1396) are live JS array literals inside
`english-nz.html`. The extraction script slices both literals out, evaluates them in
a sandbox, applies the level mapping, and writes typed modules.

Rationale: 425 cards × 6 fields is ~2,550 values. Hand-transcription drops values
silently; a script is verifiable and re-runnable. Generated and authored content live
in separate files so a re-run never clobbers new work.

### 3.2 Stack

Vite + React 18 + TypeScript + Tailwind + Zustand (`persist` → localStorage) +
`vite-plugin-pwa` (`generateSW`, precaching shell and content) +
`@supabase/supabase-js`. Content bundles into JS (~250KB) — no fetch, offline free.
Vitest + Testing Library for units, Playwright for the E2E smoke.

## 4. Content model

```ts
type PartOfSpeech = 'word'|'noun'|'verb'|'adj'|'number'|'greeting'|'slang'|'phrase'|'grammar';

interface Card {
  id: string;            // `${deckId}_${index}` — stable
  deckId: string;
  en: string;
  pt: string;
  exampleHtml: string;   // target wrapped in <b>…</b>
  examplePt: string;
  pos: PartOfSpeech;
  phonetic?: string;
}

interface Deck { id: string; name: string; emoji: string; desc: string; level: 1|2|3|4; cards: Card[]; }
```

### CEFR level mapping

- **Level 1 — A1 🌱** `survival`, `numbers`, `verbs`, `people`, `feelings`,
  `questions`, `basics`, `emergency`
- **Level 2 — A2 🌿** `house`, `body`, `food`, `clothes`, `shopping`, `town`,
  `verbs2`, `power`, `grammar`, `irregular` *(new)*
- **Level 3 — B1 🌳** `money`, `transport`, `smalltalk`, `arrival`, `housing`,
  `health`, `work`, `kiwi`
- **Level 4 — B2 🏔️** entirely new (§9)

`emergency` was absent from the source spec's mapping; assigned to A1 because
emergency vocabulary is survival-tier for a newcomer.

## 5. Learner state

```ts
interface CardState { due: number; interval: number; ease: number; reps: number; lapses: number; }
interface SkillStat { correct: number; total: number; }

interface AppState {
  profileName: string;
  syncCode: string | null;
  cefrLevel: 0|1|2|3|4;          // 0 = not placed
  unlockedLevel: 1|2|3|4;
  placed: boolean;
  cards: Record<string, CardState>;
  skills: { vocab: SkillStat; listening: SkillStat; grammar: SkillStat; speaking: SkillStat };
  dailyGoal: number;             // 20
  newPerSession: number;         // 8
  accent: 'en-NZ'|'en-AU'|'en-GB'|'en-US';
  showPortuguese: boolean;       // true
  autoPlayAudio: boolean;        // true
  streak: number; lastStudyDay: string|null;
  doneToday: number; doneDate: string|null;
  startedAt: number;
  updatedAt: number;
}
```

Persisted locally on every mutation (debounced), mirrored to cloud per §8.

## 6. SRS engine (SM-2 lite)

Ported from v1. Ratings derive from correctness, not from four visible buttons.

- New card, first correct exposure → `interval = 1 day`, `reps = 1`, `ease = 2.5`.
- Subsequent correct: `reps === 2` → 3 days; otherwise
  `interval = max(1, round(interval * ease))`.
- Wrong: `interval = 0`, `ease = max(1.3, ease - 0.2)`, `lapses++`, due in 10 minutes,
  and requeued later in the same session as recognition.
- Easy bonus (fast correct): `ease += 0.1`, larger interval.
- `due` is an absolute timestamp; a card is due when `due <= now`.

Helpers: `isDue`, `isNew`, `schedule(cardId, quality)`, `deckProgress(deckId)`,
`totalKnown` (reps > 0), `totalDue`.

## 7. The unified mandatory session

Home has no Typing / Listening / Quiz buttons. One primary action: **Study now**
(tapping a specific lesson scopes the session to that deck).

### Modalities

1. **Learn** (new) — big word, auto-played audio, PT, example + translation.
   "Got it 👍" schedules as correct. Exposure, not a test.
2. **Recognize** — EN + audio → "Show meaning" → reveal → self-mark. → *vocab*
3. **Type** — PT prompt + cloze example, text input, lenient check. → *vocab*, typable only
4. **Listen** — audio, 4 EN options, pick what you heard. → *listening*, typable only
5. **Dictation** — full sentence audio, type it, lenient compare. → *listening*, sentences
6. **Build** — PT prompt, shuffled EN tokens tapped into order. → *grammar*, 3–9 word sentences
7. **Speak** — mic, transcribe, fuzzy compare. → *speaking*, feature-detected
8. **Shadowing** — dedicated flow, also reachable from Dialogues. Play a line in NZ
   accent at normal or slow rate, show text + PT, she repeats imitating rhythm,
   transcribe and give warm feedback. Built from dialogue lines and longer examples.
   Never blocks on mic errors.

### Filters and rotation

```
isTypable(c) = c.en.length <= 16 && !c.en.includes('…')
               && c.pos ∈ {word,noun,verb,adj,number,greeting,slang}
isSentence(c) = stripped example has 3–9 words
normalize(s)  = lowercase, trim, strip .?!,'’, drop leading "to ", collapse spaces

supported = ['recognize']
  + (isTypable ? ['listen','type'] : [])
  + (isSentence ? ['build','dictate'] : [])
  + (speechRecognitionAvailable ? ['speak'] : [])
modality = supported[reps % supported.length]
```

New cards always start as `learn`. Rotation guarantees even trivial A1 words return
as listening, typing and speaking tests over time.

### Queue building

- Scope = unlocked levels (`deck.level <= unlockedLevel`), or a single tapped deck.
- Due cards + up to `newPerSession` new cards, prioritising new cards nearest `cefrLevel`.
- Interleaved, not front-loaded. Session capped at ~20–25 items.
- Wrong answers push a recognition repeat to the end.
- **Backfill:** if due + new falls short of the cap, top up with the
  least-recently-seen studied cards rather than shipping a stub session. Without
  this, day one is 8 new cards and 14 empty slots.

### Grading

Per answered item: `schedule(cardId, correct ? good : again)`; update the mapped
skill stat; `doneToday++`; update streak (increment if yesterday, reset on a gap);
persist; call `maybeUnlockNextLevel()`. Brief correctness feedback with a Continue
control, except `learn`/`recognize` which flow naturally.

## 8. Placement and leveling

**Placement test** (first launch, retakeable from Settings and Dashboard):
15–18 questions of increasing difficulty, EN→PT multiple choice sampling ~5 cards
each from levels 1/2/3 plus a few level-4 items, distractors drawn from other cards'
PT meanings. 2–3 harder items are "type the word" or "pick the correct sentence" to
blunt guessing.

Scoring: a band passes at ≥60%. `startLevel` = count of consecutive bands passed,
clamped 1–4. On finish `placed = true`, `cefrLevel = unlockedLevel = startLevel`.

Cards below `startLevel` seed as known-but-reviewable —
`{reps: 2, interval: 2, ease: 2.5, due: now + 1–4 days spread}` — so easy material
still resurfaces through SRS in varied modalities without being ground from zero.
Cards at `startLevel` stay new.

**Name prompt:** a one-screen name question precedes the placement test. The home
header greets by name, so the name must exist before home is ever rendered.

**Unlock:** decks above `unlockedLevel` show 🔒 with "Finish {level} to unlock".
`maybeUnlockNextLevel()` increments `unlockedLevel` (cap 4) once ≥80% of the current
level's cards have `reps >= 2`, and celebrates ("🎉 New level unlocked: B1").

## 9. New content

**Irregular verbs** (`id: 'irregular'`, level 2, 🔄, `pos: 'grammar'` so it routes to
recognize/build rather than type). ~14 cards: go/went, have/had, be/was-were, do/did,
say/said, make/made, take/took, come/came, see/saw, get/got, give/gave, know/knew,
think/thought, find/found. `en` reads `"go → went"`; example uses the past form in
`<b>…</b>`. A base · past · past-participle reference table is reachable from the deck.

**B2 decks** (~120–160 cards total): phrasal verbs; connectors and linkers; opinions
and discussion; workplace and professional (including KiwiSaver, roster, annual
leave, notice period); idioms and collocations (heaps of, keen as, chock-a-block,
give it a go, no dramas, flat out, hard yakka); complex tenses (present perfect,
conditionals, used to, going to vs will).

All authored content uses the exact card tuple shape and the `<b>…</b>` convention so
every modality works on it automatically.

## 10. Skills and dashboard

Four accumulators — `vocab`, `listening`, `grammar`, `speaking` — as `{correct,total}`.

Dashboard (📊 Progress): CEFR badge and a bar toward the next unlock; four skill bars
with accuracy and volume ("Listening — 82% · 140 reviews"); words learned with a
per-level breakdown; streak, due today, best day; and a gentle weakest-skill nudge
that also biases the next session's modality rotation.

**Untouched skills read "not practised yet", not 0%.** On devices without
`SpeechRecognition` (iOS Safari) the speaking modality never runs, and a 0% bar would
tell her she is bad at something she was never asked to do. The weakest-skill nudge
ignores skills with `total === 0`.

## 11. Home and navigation

Header: "Kia ora, {name} 👋", time-of-day encouragement, ⚙️. Three tiles: 🔥 streak ·
words learned · to review. Today's-goal ring. Primary button **▶︎ Study now**, label
adapting to "Review N cards" / "Learn new words" / "All done for now". A slim
four-meter skills strip linking to the dashboard. An Explore row:
📊 Progress · 🗺️ 8-week plan · 🗣️ Dialogues — resources, not study modes. Lessons
grouped by CEFR level with per-group headers and dimmed locked groups.

Screens: Home, Name, Placement, Session, Dashboard, Plan, Dialogues, Settings, Done.
The 8-week plan and Dialogues (with Play-all TTS) port from v1; each dialogue gains a
Shadowing button.

## 12. Cloud sync by PIN

The owner creates the Supabase project himself; the repo ships `supabase/schema.sql`
and README steps.

Schema is a single `public.progress(code text primary key, data jsonb, updated_at)`
table with RLS enabled and **no anon select/update policies**. Access is only through
two `security definer` RPCs, `load_progress(p_code)` and `save_progress(p_code, p_data)`,
with execute granted to `anon`. Row enumeration is therefore impossible; a code is
required to read or write. The UI pushes for a word-plus-digits code rather than a
4-digit PIN.

**Sync must be optional at runtime.** `SyncClient` reports
`unconfigured | offline | syncing | synced | error`. With an empty `.env` the state is
`unconfigured`, Settings shows "Cloud sync not set up yet" instead of a broken PIN
field, and every other feature is unaffected.

Flow: on setup, `load_progress` — if a remote snapshot is newer, offer merge or
replace, otherwise push local up. On launch with a code and network, load and merge
when remote `updatedAt` is newer. Merge is deterministic: per card keep the state with
the later review, union skills by max, take the sensible max of streak and counters.
On change, debounce 3–5s then `save_progress`; also save on `visibilitychange` and
`pagehide`. A tiny status chip shows ✓ / ⟳ / ⚠︎. Local data is never lost to a network
failure.

`.env`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

Merge logic is unit-tested against fixtures, so it is verified even though the live
round-trip is not exercised in this build.

## 13. Design system

Dark theme, matching v1. `--bg:#0f172a` `--card:#1e293b` `--card2:#273449`
`--ink:#f1f5f9` `--muted:#94a3b8` `--line:#334155` `--brand:#38bdf8` `--brand2:#0ea5e9`
`--good:#34d399` `--hard:#fbbf24` `--again:#fb7185` `--gold:#fcd34d`.

Rounded cards (16–24px), soft shadows, ≥44px tap targets, safe-area insets, subtle
fade/slide transitions. Kiwi 🥝 motif and NZ microcopy ("Kia ora", "Ka pai",
"Sweet as"). Icon is 🥝 on `#0f172a`.

Accessibility: sufficient contrast, `aria-label` on icon buttons, visible focus states,
`prefers-reduced-motion` respected, text scales.

## 14. PWA

`vite-plugin-pwa` with a manifest (name "English → NZ", theme `#0f172a`, standalone,
portrait, maskable 🥝 icons) and a service worker precaching shell and content so
study works fully offline. iOS requires a user gesture before speech: v1's warm-up
trick fires `speechSynthesis` on first tap.

## 15. Settings

Name; sync code (set/change, status, restore from code); daily goal stepper; new cards
per session; accent selector; auto-play audio; show Portuguese; retake placement test;
reset progress behind a confirm.

## 16. Testing

**Unit (Vitest):** SRS intervals, lapses and ease clamping; `normalize`; `isTypable` /
`isSentence`; modality rotation; queue building including backfill and wrong-answer
requeue; placement scoring → level; unlock threshold; streak logic; sync merge and
conflict resolution.

**E2E (Playwright, with `speechSynthesis` and `SpeechRecognition` stubbed):** first-run
name → placement → home shows the right level; a full session touching learn,
recognize, type, listen, dictate and build with correct answers; wrong-answer requeue;
progress surviving reload; a locked level refusing study; dashboard reflecting skill
stats.

Scripts: `dev`, `build`, `preview`, `test`, `test:e2e`. README covers Supabase setup
and static hosting.

## 17. Build order

1. Scaffold + content extraction + level mapping
2. SRS engine, persistence, settings, audio
3. Unified session: learn, recognize, type, listen, dictate, build
4. Placement, leveling, level-grouped home
5. Skills tracking + dashboard
6. Irregular verbs (+ table) and B2 decks
7. Speaking + shadowing + dialogue integration
8. Supabase sync layer, merge, status UI
9. Polish, accessibility, tests, README, production build

Commit per phase. The app stays working and offline-capable after every phase.

## 18. Deliverable

A static production build uploadable to the owner's website, plus `supabase/schema.sql`
and a README. Genuinely usable offline on a phone, syncing by PIN, placing the learner,
forcing a mixed-modality daily session, ramping by CEFR level, and showing her progress
per skill.
