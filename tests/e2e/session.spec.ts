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

test('first run: name, home, a session, and progress that survives reload', async ({ page }) => {
  await stubSpeech(page)
  await page.goto('/')

  // Name. Onboarding has a second question — her sync code, now a required
  // account key rather than an optional extra — but it only appears when the
  // build has a Supabase project to check codes against, and this build has
  // none (Playwright runs `npm run build` against the repo's own empty
  // environment; see src/sync/client.test.ts for why no .env is deliberate).
  //
  // So the real assertion here is the degradation one, and it is now load
  // bearing in a way it was not before: a *mandatory* step that cannot
  // function would be a locked door with no key behind it. With nothing to
  // sync to, first run stays exactly one question long, the whole step is
  // skipped, and the app builds and runs with no .env at all.
  await page.getByRole('textbox').fill('Ana')
  await page.getByRole('button', { name: /continue/i }).click()

  // Home
  await expect(page.getByText(/kia ora, ana/i)).toBeVisible()
  await expect(page.getByTestId('study-now')).toBeVisible()
  await expect(page.getByRole('button', { name: /^typing$/i })).toHaveCount(0)
  // Skipped, not merely passed through: no sync step, none of its furniture,
  // and no status line nagging her about a feature this build cannot perform.
  await expect(page.getByRole('heading', { name: /keep your progress safe/i })).toHaveCount(0)
  await expect(page.getByLabel('Sync code')).toHaveCount(0)
  await expect(page.getByRole('button', { name: /carry on for now/i })).toHaveCount(0)
  await expect(page.getByTestId('sync-line')).toHaveCount(0)

  // Locked level
  await expect(page.getByTestId('deck-money')).toBeDisabled()

  // Session. The teaching items keep their single "Got it"; every graded item
  // ends in the four ratings, so the loop taps whichever control is on screen.
  await page.getByTestId('study-now').click()
  let sawRatings = false
  for (let i = 0; i < 40; i++) {
    const gotIt = page.getByRole('button', { name: /got it/i })
    if (await gotIt.count()) { await gotIt.click(); continue }

    const reveal = page.getByRole('button', { name: /show meaning/i })
    if (await reveal.count()) { await reveal.click(); continue }

    const ratings = page.getByRole('group', { name: /how well did you know it/i })
    if (await ratings.count()) {
      if (!sawRatings) {
        sawRatings = true
        // All four are really there on a phone-sized screen, and each one
        // carries the interval it would produce.
        await expect(ratings.getByRole('button', { name: /^Again/ })).toBeVisible()
        await expect(ratings.getByRole('button', { name: /^Hard/ })).toBeVisible()
        await expect(ratings.getByRole('button', { name: /^Good \d/ })).toBeVisible()
        await expect(ratings.getByRole('button', { name: /^Easy \d/ })).toBeVisible()
      }
      await ratings.getByRole('button', { name: /^Good/ }).click()
      continue
    }
    break
  }
  expect(sawRatings).toBe(true)

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
        profileName: 'Ana', syncCode: null, unlockedLevel: 1,
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
  // "reps", not "reviews": drills and role-play feed these same skill
  // counters, and neither of them is a card review.
  await expect(page.getByText(/30% · 10 reps/)).toBeVisible()
  await expect(page.getByText(/listening could use some love/i)).toBeVisible()

  // The brief's original assertion here was getByText(/speaking — not
  // practised yet/i). The Dashboard's Meter renders the skill label and its
  // value text as two sibling <span> elements with no separator between
  // them (see src/components/ui/Meter.tsx), so the combined text of their
  // parent is "Speakingnot practised yet" — never "Speaking — not
  // practised yet" with a dash. No em dash is rendered anywhere in that
  // row. The literal brief selector can never match the shipped markup, so
  // the selector (not the component) is fixed here: assert the "Speaking"
  // label and its "not practised yet" value text are both present in the
  // same row, without requiring a dash that was never there.
  const speakingLabel = page.getByText('Speaking', { exact: true })
  await expect(speakingLabel).toBeVisible()
  await expect(speakingLabel.locator('xpath=..')).toContainText('not practised yet')
})

/**
 * The hidden switch, in a real browser. Everything here is covered by unit
 * tests except the two things only a browser can prove: that the flag survives
 * a reload out of real localStorage, and that the padlock genuinely lifts on
 * the rendered Home rather than in a jsdom tree.
 */
test('the version footer unlocks every level after seven taps, and it sticks', async ({ page }) => {
  await stubSpeech(page)
  await page.goto('/')

  await page.getByRole('textbox').fill('Ana')
  await page.getByRole('button', { name: /continue/i }).click()

  await expect(page.getByTestId('deck-money')).toBeDisabled()

  await page.getByRole('button', { name: /settings/i }).click()
  const footer = page.getByRole('button', { name: /kiwi ·/i })

  // Six is not enough, and the counter shows from the third so someone who was
  // told the gesture can see it working.
  for (let i = 0; i < 6; i++) await footer.click()
  await expect(page.getByText(/1 more/i)).toBeVisible()
  await expect(page.getByLabel(/free access to all levels/i)).toHaveCount(0)

  await footer.click()
  await expect(page.getByLabel(/free access to all levels/i)).toBeChecked()

  // The gate is lifted on Home...
  await page.getByRole('button', { name: /go back/i }).click()
  await expect(page.getByTestId('deck-money')).toBeEnabled()
  await expect(page.getByText(/to unlock/i)).toHaveCount(0)

  // ...and survives a reload, which is the whole reason it is persisted.
  await page.reload()
  await expect(page.getByTestId('deck-money')).toBeEnabled()

  // Turning it off puts the padlock back exactly where it was. `click`, not
  // `uncheck`: the toggle only exists while free access is on, so switching it
  // off takes the control out of the DOM with it, and `uncheck` would sit
  // waiting for an element that has gone to report itself unchecked.
  await page.getByRole('button', { name: /settings/i }).click()
  await page.getByLabel(/free access to all levels/i).click()
  await expect(page.getByLabel(/free access to all levels/i)).toHaveCount(0)
  await page.getByRole('button', { name: /go back/i }).click()
  await expect(page.getByTestId('deck-money')).toBeDisabled()
})

/**
 * Two courses, two profiles, one app.
 *
 * The parts only a real browser can prove: that the switch survives the reload
 * it depends on, that each course keeps its progress under its own key, and
 * that coming back finds the first course exactly as it was left.
 */
test('switching to Spanish keeps the two courses entirely separate', async ({ page }) => {
  await stubSpeech(page)
  await page.goto('/')

  await page.getByRole('textbox').fill('Ana')
  await page.getByRole('button', { name: /continue/i }).click()
  await expect(page.getByText(/kia ora, ana/i)).toBeVisible()

  // Switch. The confirmation exists because two courses mean two sync codes.
  await page.getByRole('button', { name: /settings/i }).click()
  await page.getByRole('button', { name: /mudar para espanhol/i }).click()
  await page.getByRole('button', { name: /ir para espanhol/i }).click()

  // A fresh profile in the new course: the name did not come across, because
  // the name belongs to the English profile and nothing was copied.
  //
  // By its aria-label, not by role: switching reloads, and for a moment either
  // the old Settings DOM (which has two textboxes) or an empty document is
  // what a bare `getByRole('textbox')` sees. The generous timeout covers the
  // reload itself.
  const nameField = page.getByLabel('What should I call you?')
  await expect(nameField).toBeVisible({ timeout: 15_000 })
  await expect(nameField).toHaveValue('')
  await nameField.fill('Lucas')
  await page.getByRole('button', { name: /continue/i }).click()

  // Spanish decks, and none of the English ones.
  await expect(page.getByTestId('deck-es_react')).toBeVisible()
  await expect(page.getByTestId('deck-survival')).toHaveCount(0)

  // Ungated: a level-3 deck is reachable on a brand-new profile, with no
  // padlock anywhere and no gesture needed.
  await expect(page.getByTestId('deck-es_subj')).toBeEnabled()
  await expect(page.getByText(/to unlock/i)).toHaveCount(0)

  // Practice is offered, but only the three features with Spanish material:
  // no Drills (they speak English numbers) and no Ear training (Kiwi vowels).
  await page.getByRole('button', { name: /practice/i }).click()
  await expect(page.getByRole('button', { name: /role-play/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /dialogues/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /shadowing/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /drills/i })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /ear training/i })).toHaveCount(0)

  // The scenes really are Spanish.
  await page.getByRole('button', { name: /role-play/i }).click()
  await expect(page.getByText(/no café/i)).toBeVisible()
  await page.getByRole('button', { name: /go back/i }).click()
  await page.getByRole('button', { name: /go back/i }).click()

  // Back to English, and her profile is untouched.
  await page.getByRole('button', { name: /settings/i }).click()
  await page.getByRole('button', { name: /mudar para inglês/i }).click()
  await page.getByRole('button', { name: /ir para inglês/i }).click()
  await expect(page.getByText(/kia ora, ana/i)).toBeVisible({ timeout: 15_000 })
  await expect(page.getByTestId('deck-survival')).toBeVisible()
})
