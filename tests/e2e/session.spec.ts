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
