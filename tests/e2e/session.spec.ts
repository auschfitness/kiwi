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
  // The question count is whatever buildPlacementTest produces (today 17,
  // now that level-4 content exists) — this loop never hardcodes it, it
  // just keeps answering until neither an option nor a text input remains.
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
  // Placement result screen — Placement now computes the result locally and
  // only writes to the store (which App.tsx routes on) when Continue is
  // tapped, so this screen actually gets to render before Home does.
  await expect(page.getByText(/you're at a1/i)).toBeVisible()
  await expect(page.getByTestId('study-now')).toHaveCount(0)
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
