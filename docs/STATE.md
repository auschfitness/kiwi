# Where this project stands

Last updated: 2026-07-31, commit `2159430`.

Read this first if you are picking the project up fresh. The spec and plan in
`docs/superpowers/` describe what was *intended*; this file describes what is
actually true today, including the things that were decided after the plan was
written.

## What it is

An offline-capable PWA that teaches English to a Brazilian Portuguese speaker
moving to New Zealand. She is a real person — the owner's wife — and she uses
it daily. The owner is in marketing, not engineering: explain things plainly
and ask before large changes.

- **Live:** https://kiwi-rust-two.vercel.app
- **Repo:** `auschfitness/kiwi` (public), branch `master`
- **Hosting:** Vercel team `tally4`, project `kiwi`
- **Backend:** Supabase project ref `qtjfquuaeslxsiuqfoig`, organisation `kiwi`
- **Stack:** Vite · React 19 · TypeScript strict · Tailwind · Zustand + persist ·
  vite-plugin-pwa · @supabase/supabase-js
- **State:** 736 unit tests, 3 Playwright E2E, `tsc --noEmit` clean, build clean

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
