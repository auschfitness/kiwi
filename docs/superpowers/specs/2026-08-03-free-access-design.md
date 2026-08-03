# Free access to every level

Date: 2026-08-03. Status: approved by the owner.

## Why

Levels are gated today: reaching 80% of a level unlocks the next one, and
`unlockedLevel` is both the badge she has earned *and* the gate that decides
what she can open. The owner wants to reach any level himself — to look
through the whole app, and to hand the trick to anyone he chooses so they can
do the same on their own profile. He is not asking to remove the gate from
his wife's app, which is the app this progression exists for.

So this is not "delete the gate". It is "let a person who knows the gesture
lift it on their own device", with her experience untouched.

## What ships

A hidden switch in Settings, off by default.

**Turning it on.** A discreet footer at the bottom of Settings shows the app
name and version (`Kiwi · v1.0.0`). Seven taps on it turn free access on. From
the third tap a counter appears ("4 more") so someone who was told the trick
can tell it is working. The seventh shows a toast. This is Android's
developer-mode gesture: easy to pass on in a text message, impossible to hit
by accident.

**Turning it off.** Once on, an ordinary labelled toggle appears in Settings.
Turning it off hides the toggle again and restores the gesture as the only way
back in. Without this there is no exit that does not require knowing the trick
twice.

**With it on:** every deck from A1 to B2 is tappable — no padlock, no dimming;
"Study now" draws from all 581 cards rather than the unlocked levels only.

**With it off:** exactly today's behaviour.

## Design

### `effectiveLevel` is the whole mechanism

```ts
effectiveLevel(unlockedLevel: Level, freeAccess: boolean): Level
```

Returns `4` when free access is on, `unlockedLevel` otherwise. Every screen
that asks "what may she open?" switches from reading `unlockedLevel` to
calling this. Because `decksForLevel` is already cumulative (`d.level <= max`),
level 4 means everything, and the three call sites — Home's deck list, Home's
`newAvailable` count, and Session's queue scope — need no other change.

Pure, in `src/core/leveling.ts`, alongside the rule it modifies.

### `unlockedLevel` becomes a medal, not a gate

It keeps being computed, stored, merged and celebrated exactly as it is now.
`shouldUnlockNext` is untouched, the unlock toast still fires, the Dashboard
badge and the "Progress toward A2" meter still read from it and stay true.
Free access does not award levels; it ignores the gate while it is on. Turn it
off and the gate is exactly where she left it.

This is what keeps the change cheap: no `AppState` field changes, so no
`PERSIST_VERSION` bump, no migration, and `merge.ts` is not touched.

### The flag lives outside the synced profile

`freeAccess` is stored under its own `localStorage` key
(`english-nz.freeAccess`), read once at startup, and held on the store next to
`unlocked` — that is, in `Actions`, *not* in `AppState`. The existing
`partialize` already strips `unlocked` from what is persisted; `freeAccess`
joins it there.

Three consequences, all wanted:

1. It never enters the sync snapshot, so it cannot travel to another person's
   device even if two people shared a sync code.
2. `merge.ts` and its `scalarKey` invariant are untouched.
3. `PERSIST_VERSION` stays at 3, so no profile with real progress is put
   through a migration for a convenience flag.

The cost is that it is per-device: installing on a second phone means
repeating the gesture there. Accepted — the isolation is worth more than the
convenience.

`resetProgress` clears it too, because the confirmation text promises to erase
"every card, streak and setting on this device" and that has to stay true.

### Accessibility

The footer is a real `<button>` whose accessible name contains its visible
text, ≥44px tall, per the standing rules. The counter is rendered text, not a
title attribute. The toggle reuses the existing `Toggle` component, so it is
labelled like every other setting.

## Testing

- `effectiveLevel`: returns 4 when on; returns the passed level when off, at
  each of the four levels.
- Storage: reads a missing key as `false`; survives a round trip; a corrupt
  value reads as `false` rather than throwing.
- Isolation: the object handed to `partialize` carries no `freeAccess` key —
  this is the test that protects her app from his switch, so it is explicit
  rather than implied.
- Gesture: six taps do not turn it on; the seventh does; the counter appears
  on the third.
- Toggle: hidden while off, present once on, turns it back off.
- Home: with free access on, no deck button is `disabled` and no padlock text
  renders; with it off, the existing lock tests still pass unchanged.
- Session: with free access on, the queue may contain cards above
  `unlockedLevel`.
- `resetProgress` clears the flag.

## What this gives up

The 80% unlock is the only progression mechanism left in the app, and it
exists because she called v1 "too easy" after choosing only the easy
exercises. Anyone who is told the gesture can switch that mechanism off for
themselves. That is the owner's call, made knowingly, and it is recorded here
so it is not rediscovered later as a bug.

## Explicitly not in scope

- No level picker. The session stays automatic; free access widens what it may
  draw from and changes nothing about how it chooses.
- No change to `shouldUnlockNext`, `merge.ts`, `PERSIST_VERSION`, or the
  Dashboard, whose per-level breakdown already covers all four levels.
