# Where this project stands

Last updated: 2026-07-31, commit `2159430`.

Read this first if you are picking the project up fresh. The spec and plan in
`docs/superpowers/` describe what was *intended*; this file describes what is
actually true today, including the things that were decided after the plan was
written.

## What it is

An offline-capable PWA that teaches a language to a Brazilian Portuguese
speaker, in two courses for two real people.

**English → New Zealand** is the original and the one that matters most: the
owner's wife uses it daily, moving to NZ, a beginner. **Spanish (Latin
America)** was added on 2026-08-03 for the owner himself, who understands
Spanish but cannot write or speak it.

They need opposite things, and the code says so out loud — see
`src/courses/`. She needs recognition before production and a gate that stops
her skipping ahead; he needs production only, and a gate would just hold him
at "hola" while he needs the subjunctive.

The owner is in marketing, not engineering: explain things plainly and ask
before large changes.

- **Live:** https://kiwi-rust-two.vercel.app
- **Repo:** `auschfitness/kiwi` (public), branch `master`
- **Hosting:** Vercel team `tally4`, project `kiwi`
- **Backend:** Supabase project ref `qtjfquuaeslxsiuqfoig`, organisation `kiwi`
- **Stack:** Vite · React 19 · TypeScript strict · Tailwind · Zustand + persist ·
  vite-plugin-pwa · @supabase/supabase-js
- **State:** 800 unit tests, 4 Playwright E2E, `tsc --noEmit` clean, build clean
- **Corpus:** 581 English cards, 561 Spanish

## The product decisions that must not be quietly undone

1. **She cannot choose her exercise type.** One "Study now" button; the session
   picks the modality per card, rotating on review count. v1 let her choose, she
   picked the easy ones, and said the app was "too easy" — that complaint is the
   reason v2 exists.
2. **There is no placement test.** Removed on request: everyone starts at A1 and
   must reach 80% of a level to unlock the next. Nothing is pre-marked as known.
   Since 2026-08-03 that gate can be lifted per device by a hidden switch —
   seven taps on the version footer in Settings. It is the owner's, for
   reaching any level himself and for handing to whoever he chooses; her app is
   untouched unless someone tells her the gesture. `unlockedLevel` is now the
   badge and `effectiveLevel()` is the gate. See
   `docs/superpowers/specs/2026-08-03-free-access-design.md`.
3. **The app never blames her for her device.** No microphone means no grade. No
   speech recognition means say so. An unpractised skill reads "not practised
   yet", never 0%. This rule is enforced in Session, Shadowing, Speak, Drills,
   Ear training, Role-play and Settings — keep it that way.
4. **Offline-first.** The install stays light (14 precache entries, ~700 KiB).
   The 148 card photos are deliberately *outside* the precache with a
   `card-photos` runtime cache. Do not precache them.
5. **The sync code is the account, and it is mandatory and unique.** Creating
   refuses a code that already exists; signing in requires one that does. It
   yields in exactly two cases: sync unconfigured (empty `.env`), and an
   unreachable server on first run — she is let through and the code is "owed",
   which is *derived* (`isSyncConfigured() && syncCode === null`), not stored.
6. **Content lives in the bundle, not the database.** Supabase stores only her
   progress snapshot. The 581 cards ship with the app so she can study on a
   plane.

## Courses

One course is loaded at a time, chosen at boot and fixed for the life of the
page. Switching writes `english-nz.course` and reloads — that reload is what
lets every module treat "the course" as a constant instead of something that
can change underneath it.

- Each course persists under its own key (`english-nz`, `espanol-latam`), so
  two courses can never mix progress or sync codes. **Never rename
  `english-nz`**: every profile that exists is saved under it.
- Both courses are gated. Spanish shipped ungated on the theory that someone
  who understands it can start in the middle; it opened at "o sea" and the
  owner had never seen it. Passive comprehension and a thousand words ready to
  produce are different abilities — do not confuse them again.
- A course declares its modalities, its speak direction, whether it is gated,
  and whether Practice is offered. `src/content/index.ts` serves the active
  course's decks and everything downstream is unaware there is a second one.
- `Course.practice` lists which Practice features a course has material for —
  per feature, not per course. Spanish has Dialogues, Shadowing and Role-play
  of its own; it has no Drills (the generator speaks English numbers, times,
  dates and spelled-out letters) and no Ear training (Kiwi vowel pairs, which
  a Spanish learner has no use for). A course claiming a feature it cannot
  fill is caught by a test.

## The pronunciation guide is American, on purpose

Asked for on 2026-08-03, done on 2026-08-04, in one pass. It was approved
knowingly, after being told the cost: his wife is moving to New Zealand, where
the rhotic R this introduces is not pronounced — "first" is *fêst* there, not
*fêrst*. He owns the decision. It is recorded here so nobody undoes it as a
mistake, and so the trade-off is not rediscovered.

What the pass covered:

- All 581 entries in `src/content/authored/phonetics.ts`.
- `PHONETICS-CONVENTION.md`, rewritten around a rhotic system: `êr` for NURSE
  (*work* `uêrk`), `er` for the unstressed lettER (*water* `uóter`), `ár`/`ór`
  for START/NORTH, `ír`/`ér` for NEAR/SQUARE, and `é` for BATH (*ask* `ésk`,
  *can't* `ként`) instead of the British long `áa`.
- `src/content/phonetics.test.ts`: the non-rhotic rule was replaced by a rhotic
  one, and the NZ short-front-vowel test became a plain bad/bed contrast, which
  is the same two letters for a different reason.
- `defaultAccent` on the English course is now `en-US`, with `en-US` first in
  the accent list. A profile created before the switch keeps its saved voice.

Three things stayed Kiwi, deliberately:

- **Ear Training** (`authored/minimalPairs.ts`) still teaches the NZ vowels,
  and its screen now asks for the `en-NZ` voice regardless of her accent
  setting. That is *hearing*, not *speaking* — it is the accent she will
  actually meet, and reading a Kiwi lesson in an American voice would pull the
  two words apart exactly where the lesson is that they are close.
- **The vocabulary** (*flat white*, *EFTPOS*, *dairy*, *jandals*, *kia ora*),
  now transcribed with American phonics.
- The course name, `Inglês → Nova Zelândia`. She is still going there.

## Known debt

`Card.en` means "the word in the course's language" and is no longer English
in half the corpus. Renaming it to `target` is mechanical and the compiler
would find every site, but it touches ~8,000 lines including the generated
decks and the script that writes them, and it was deliberately kept out of the
course change so that neither could be reviewed. Worth doing on its own.

## Conventions

- `src/core/` is pure: no React, no `window`, no `Date.now()`, no
  `Math.random()`. Time arrives as `now`, randomness as an injected `rand`.
  This is what makes the tests deterministic.
- **Never hand-edit `src/content/*.generated.ts`.** They are rebuilt by
  `npm run extract` from `english-nz.html`. Authored content goes in
  `src/content/authored/` and is merged in `src/content/index.ts` — that is how
  the pronunciations and photos attach to migrated cards.
- `src/audio/` is the only place allowed to touch `speechSynthesis` or
  `SpeechRecognition`, and the only place a locale is hardcoded.
- `src/core/merge.ts` has a standing invariant: `scalarKey` must cover exactly
  the fields `preferred()` decides, and the returned object must cover every
  `AppState` field. Adding a field to `AppState` means touching it.
- Persist version is 3. Changing `AppState` means bumping it and writing a
  preserving migration, with a test that loads a realistic old profile.
- Device-scoped state stays out of `AppState`. `freeAccess` lives on the store
  next to `unlocked` and in its own localStorage key, and `persistedFields()`
  strips both — that is what stops one person's switch riding the sync snapshot
  onto another person's phone. There is a test asserting exactly this; do not
  "tidy" the flag into `AppState`.
- Palette tokens only, no raw hex. Every accessible name must contain its
  visible text. Tap targets ≥44px.

## Traps that have already bitten

- **A green `git push` does not mean the site updated.** Seven consecutive
  Vercel deploys sat in `ERROR` unnoticed because the build fails *after* the
  push succeeds. Always check the deployment `state`, not just the push. The
  cause that time was `@types/node` being undeclared — it resolved locally by
  hoisting and failed on a clean install.
- **The Supabase MCP connection only sees the `Tally` organisation.** The Kiwi
  project is in a separate org and is unreachable from tooling. Never apply a
  Kiwi migration to Tally's project. Anything needing SQL has to be handed to
  the owner.
- **Vercel's `list_projects` returns empty** for team `tally4`; `get_project`
  by slug works. There is no MCP tool for setting environment variables.
- **`VITE_*` variables are inlined at build time.** Setting one in the Vercel
  dashboard does nothing until the next build.
- The browser pane in this environment does not hydrate React 19, so
  interactive QA has to go through Playwright rather than clicking.

## Still owed by the owner

None of this blocks her using the app.

1. **Background push reminders.** The Edge Function, the schema additions and a
   step-by-step runbook are committed and documented in `README.md`, but nothing
   is deployed — generating VAPID keys, setting secrets, deploying
   `send-reminders` and scheduling it are his. Until then the in-app nudge
   (Layer 1) and the local trigger (Layer 3) cover it.
2. **A fresh Pexels API key.** The one used to fetch the photos was pasted into
   a chat transcript. Regenerating it costs a minute; photos already fetched are
   unaffected.

## Known limitations, accepted deliberately

- Two people creating the *same* code in the same instant would both pass the
  uniqueness check and the second would absorb the first. Closing it needs an
  `insert … on conflict do nothing` RPC, i.e. SQL that cannot be applied from
  here. Irrelevant at two users; revisit if it ever goes public.
- Chrome's Web Speech API needs the network, so speech recognition does not work
  offline. Role-play detects this and switches to ungraded copy rather than
  scoring her zero.
- iOS Safari has no `SpeechRecognition` at all. Speaking practice degrades to
  read-it-aloud and records nothing.
