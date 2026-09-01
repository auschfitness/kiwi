# Polish course

Date: 2026-09-01. Status: approved by the owner.

## Why

The app currently serves two people, each already fluent enough in one
language to be missing something specific in another: she recognises no
English at all, he understands Spanish but can't produce it. Lucas — the
owner, not a learner the app has served before — wants a third course: Polish,
for himself, starting from zero, because he may move to Poland. There is no
deadline; this is preparation, not survival Polish for a trip next month.

Zero prior exposure is the detail that matters. English's course opens with
`recognize` because she has never seen the word; Spanish's course skips
`recognize` and adds an interference layer because he already half-knows the
target language through Portuguese. Polish has neither of those shapes: no
false-friend risk to defend against (no lexical relationship to Portuguese to
exploit or confuse), and no existing vocabulary to build recognition on top
of. It needs the beginner shape — recognition before production, a level
gate — without the interference machinery Spanish has. In short: **Polish
follows the English course's template, not Spanish's.**

One more thing worth saying plainly, because it changes how much care this
needs: Gaybiel could proofread the Spanish course himself. Lucas cannot check
Polish. There is no safety net here the way there was there — see
[Content accuracy](#content-accuracy) below.

## Scope

A full course matching English's in structure and scale: ~500+ cards across
CEFR levels A1–B2, delivered in four phases, each one live, tested, and
committed before the next starts — the same cadence as the NZ→US pivot and
the Spanish interference system earlier in this project's history.

- **Phase 1** — course registration, engine wiring, Polish phonetics
  convention, A1 vocabulary (~100–150 cards)
- **Phase 2** — A2 vocabulary (~100–130 cards)
- **Phase 3** — B1 vocabulary (~100–150 cards), including Poland-specific
  administrative/practical vocabulary
- **Phase 4** — B2 vocabulary, plus whichever practice features (dialogues,
  roleplay, drills, ear training) turn out to earn their place — scoped at
  the start of that phase, not now

This document specs the course as a whole (the parts every phase shares) and
Phase 1 in enough detail to plan directly. Phases 2–4 get a short plan of
their own each, written when that phase starts, using this document as the
standing reference for anything that doesn't change per phase (course
registration, phonetics convention, content architecture).

## Approaches considered

**Content architecture.** Two options: follow English's pipeline
(`scripts/extract-content.mjs` generates `decks.generated.ts` from some
external source, hand-authored decks layered on top), or follow Spanish's
(every deck hand-written directly in TypeScript under `src/content/pl/`, no
generation step). English's generator exists because that course grew from an
external word list; nothing like that exists for Polish, and standing up a
generator for a one-time ~500-card course is machinery with no second use.
**Recommendation: follow Spanish's pattern** — thematic hand-authored files
(`basics.ts`, `everyday.ts`, `work.ts`, …) merged in `src/content/pl/index.ts`,
same shape as `src/content/es/index.ts`. Simpler, and it's already a proven
pattern in this codebase.

**Phonetics convention.** Two options: extend the existing "read it like
Portuguese" transliteration system (`PHONETICS-CONVENTION.md`) with the new
symbols Polish needs, or design a from-scratch convention for Polish
specifically, closer to showing the real spelling since Polish orthography is
already regular (unlike English's). Polish spelling is in fact far more
learnable than English's — one letter (or fixed digraph) almost always means
one sound, and stress is always the second-to-last syllable, no exceptions to
memorise. That's real, and it means the transliteration layer is carrying
less weight than it did for English. But Lucas is reading Latin-alphabet text
either way, and a second, unrelated convention living next to the first one
is a second thing to remember for no real gain — the "read it like Portuguese"
idea itself still holds for Polish's core sounds.
**Recommendation: extend the existing convention**, adding the handful of
symbols Portuguese has no letters for (see below), documented in its own
section so it doesn't get confused with the English rules that don't apply
here (e.g. Polish stress is entirely predictable, so it will not be marked
card-by-card the way English's is).

**Accent/voice.** Not really a choice — Polish has one standard accent, so
`accents: ['pl-PL']`, `defaultAccent: 'pl-PL'`, no accent picker shown (same
rule that already hides the picker for a course with one voice). No change
needed to the `FALLBACKS` dict in `speak.ts`: an unlisted family already falls
through to "any voice starting with `pl-`", which is correct for a
single-accent language and was exercised by the fallback logic already
written for the Spanish-accent bug fix.

## Course-wide design

### Registration

A third `Course` entry, `pl-pl`, in `src/courses/index.ts`, alongside
`EN_NZ`/`ES_LATAM`, added to `COURSES`, `ALL_COURSES`, and `CourseId` in
`src/courses/types.ts`. `active.ts`'s `KNOWN` list gets `'pl-pl'`. Settings
matching:

| Field | Value | Why |
|---|---|---|
| `storageKey` | `'polski'` | own profile, isolated from the other two courses |
| `defaultAccent` / `accents` | `'pl-PL'` / `['pl-PL']` | one standard accent, no picker |
| `modalities` | `['recognize', 'listen', 'type', 'build', 'dictate', 'speak']` | same as English — he has never seen the word, recognition comes first |
| `speakDirection` | `'repeat'` | word is on screen, he reads it aloud — same reasoning as English |
| `gated` | `true` | same 80%-of-level climb as the other two courses |
| `weanOffPortuguese` | `false` | this flag only means something for a course with `interference`-tagged cards; Polish has none |
| `practice` | `[]` in Phase 1 | grows in Phase 4 once specific features are scoped |

`ACTIVE_RULES` in the same file needs no Polish-specific branch — its two
Spanish-only overrides (`typablePos`, `typableMaxChars`, `spontaneousModality`)
stay conditioned on `es-latam` and fall through to the defaults for Polish,
which is what English gets too.

### Accent type

`Accent` (`src/types.ts`) gains `'pl-PL'`.

### Phonetics convention — new symbols

Written up as a new section in `PHONETICS-CONVENTION.md` (not a new file —
one document, one place to look, sectioned by language), covering the sounds
Portuguese has no letter for:

- **Nasal vowels ą, ę** — close to Portuguese's own nasal vowels (ã, õ);
  written with `n`/`m` the way Portuguese sometimes does (`kã`, `wéwn`),
  since there's no reason to invent a symbol Portuguese speakers already read
  correctly by ear.
- **Palatalized consonants ć, ń, ś, ź vs. their hard counterparts cz, sz, ż,
  dz** — the pair Portuguese genuinely lacks and where a wrong transliteration
  would actively mislead rather than just be imprecise. These get a small,
  explicit table (not a rule Lucas can infer by analogy, the way most of the
  rest of the convention is) with minimal-pair examples.
- **Dark ł** — sounds like an English `w`, written `u` in this convention the
  way `PHONETICS-CONVENTION.md` already writes English's `w`-like sounds.
- **Consonant clusters** (`szcz`, `źdź`, and similar) — no new symbol needed,
  just guidance on breaking them into the syllable-sized chunks the rest of
  the convention already uses.

Stress is not marked per-card the way English's is, since it is always
predictable (second-to-last syllable) — the convention document says this
once, up front, rather than every card repeating information that never
varies.

### Content architecture

`src/content/pl/` mirrors `src/content/es/`: hand-authored deck files grouped
by theme (`basics.ts`, `everyday.ts`, …), merged into `PL_DECKS` in
`src/content/pl/index.ts`, wired into the course as `decks: PL_DECKS`. No
generator script, no `decks.generated.ts` equivalent — every Polish card is
written by hand, same as Spanish's ~600.

Deck **topics and level boundaries mirror English's** (first words, numbers,
everyday verbs, family, emergencies, feelings, question words, colors,
food/café, shopping, house, clothes/weather, body, money, housing, health,
transport, work, immigration/airport, small talk at A1–A2 climbing to B1–B2
connectors/workplace/idioms/tenses) — most of "first words, numbers, food,
housing" is genuinely language-agnostic, and reusing a proven taxonomy means
Phase boundaries and rough card counts can be planned by lifting English's
deck list rather than inventing one from nothing. Poland-specific detail
(PESEL number, zameldowanie/address registration, tram etiquette, etc.) gets
folded into the relevant existing deck (e.g. "Housing", "Work") the same way
US-specific detail was folded into English's decks during the NZ→US pivot,
rather than becoming its own separate deck.

Photos: same mechanism as the other two courses
(`scripts/fetch-photos.mjs --course=pl`, a new `PHOTOS_PL` /
`photoCreditsPl.ts` pair under `src/content/authored/`), run once content
exists to fetch photos for.

### Content accuracy

Lucas cannot proofread Polish the way Gaybiel could proofread Spanish. Since
there is no second reviewer available, the mitigation is process, not a
person: every card gets a same-session self-review pass before a phase is
called done — checked against a second independent source per card (not
generated once and trusted), common beginner-course vocabulary lists cross-
checked rather than invented from memory, and grammatical forms (cases,
verb aspect) kept to what's independently attested rather than improvised.
This is a real limitation, not a solved problem — flagged here so it's a
known trade-off going in, not a surprise later. If Lucas finds an error once
he's using the course, corrections are ordinary content edits like any other
card fix.

### Testing

Same pattern as the Spanish course's tests: a `src/content/pl/pl.test.ts`
checking deck/card shape (unique ids, non-empty fields, valid `pos` values,
level numbers in range), plus `src/courses/courses.test.ts` gaining
assertions for the new course id (`courseById('pl-pl')` returns the right
`accents`/`modalities`/`weanOffPortuguese`, `ACTIVE_RULES` has no
Polish-specific branch to test since it takes the defaults).

## Phase 1 — what ships

1. `Course` registration as specced above (`pl-pl`, empty `practice: []`).
2. `PHONETICS-CONVENTION.md` gains its Polish section.
3. `src/content/pl/` with A1 decks (~100–150 cards): first words/greetings,
   numbers, everyday verbs, family/people, emergencies, feelings — the same
   deck list English opens with.
4. Course switcher (wherever `ALL_COURSES` is rendered — the Home screen course
   picker) shows Polish as a third option.
5. Tests: `pl.test.ts` for deck/card shape, `courses.test.ts` additions.
6. Browser verification: switch to the Polish course, confirm A1 decks are
   studyable, confirm `pl-PL` is requested from `speak()` (falls back
   gracefully — this environment has 0 installed voices, same as the other
   two courses' verification).

Not in Phase 1: any practice feature, A2+ content, Poland-specific
administrative vocabulary (that's Phase 3's Housing/Work decks).

## Testing plan (whole feature)

Unit tests alongside each phase's content (deck shape), `courses.test.ts`
extended once in Phase 1 and left alone after. No new engine logic is being
added — Polish reuses the SRS, modality rotation, and leveling code as-is —
so there is no new `core/` module to test the way `core/interference.ts`
needed one. `npx vitest run` and `npx tsc --noEmit` stay the two commands
that must be clean before any phase is called done, same as every prior
feature in this project.
