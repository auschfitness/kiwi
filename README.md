# English → USA

English → USA (app name: Kiwi) is an offline-first app that teaches the
English a Brazilian Portuguese speaker needs to move to the United States —
greetings, money, housing, the doctor, the airport, American slang, and more —
through short daily practice sessions. It's built for one learner getting
ready for a move in a couple of months, but it works for anyone learning
English with Portuguese as their first language.

It installs like an app on a phone, keeps working with no internet
connection, and (optionally) can sync one person's progress across two or
more devices.

## Quick start

You'll need [Node.js](https://nodejs.org) installed (any recent version).
Then, in this folder:

```bash
npm install
npm run dev
```

This starts a local server and prints a URL (usually
`http://localhost:5173`). Open it in a browser to see the app running on
your own computer. Changes you make to the code appear immediately — this
is for development, not for the version you'd actually give to the learner.

## Build and host

When you're ready to put the app somewhere real:

```bash
npm run build
```

This creates a folder called `dist/`. It contains the whole app as plain
files: an `index.html`, some JavaScript and CSS files with random-looking
names, a `manifest.webmanifest`, a `sw.js`, and a handful of icons.

**Upload the *contents* of `dist/` — not the folder itself — to your web
host.** Any static host works: the file manager in your hosting control
panel, an FTP upload, Netlify, Vercel, GitHub Pages, whatever you already
use for the rest of the site. There's no server-side code to run; it's just
files.

### If it lives in a subfolder

If the app will be served from the root of a domain (e.g.
`https://learnenglish.com/`), you don't need to change anything. But if it
will live in a subfolder of an existing site (e.g.
`https://mysite.com/english/`), two things need to know that in advance,
or the app will load a blank white screen or fail to install:

1. In `vite.config.ts`, add a `base` option matching the subfolder:
   ```ts
   export default defineConfig({
     base: '/english/',
     // ...the rest stays the same
   })
   ```
2. In the same file, inside the `VitePWA` manifest, change `start_url` and
   `scope` from `'/'` to `'/english/'` as well.

Then run `npm run build` again and re-upload.

### HTTPS is required

The app will only fully work when served over **HTTPS** (a web address
starting `https://`, with the padlock icon), not plain `http://`. Two
features specifically require it:

- The **offline mode** (the service worker that caches the app for use
  without internet) refuses to run on plain HTTP.
- The **microphone**, used for pronunciation practice, cannot be accessed
  by a browser on plain HTTP.

Almost every modern host provides HTTPS automatically these days (Netlify,
Vercel, GitHub Pages, and most hosting control panels all do this for
free) — just make sure it's actually turned on for wherever you upload
this.

## Cloud sync setup (optional)

By default, the app saves everything on the one device it's used on — no
account, no setup, works completely offline. If that's all you need, skip
this whole section.

If you want progress to follow the learner between, say, a phone and a
laptop, you can turn on cloud sync. It takes about ten minutes and doesn't
cost anything at this scale. Here's exactly what to click.

1. **Create a Supabase project.** Go to
   [supabase.com](https://supabase.com), sign up or log in, and click
   **New project**. Give it any name, pick a password (you won't need it
   again for this), choose a region close to the United States, and click
   **Create new project**. Wait a minute or two while it sets itself up.

2. **Open the SQL editor.** In the left sidebar of your new project, click
   **SQL Editor**. Click **New query**.

3. **Paste and run the schema.** Open the file `supabase/schema.sql` from
   this project in a text editor, copy everything in it, and paste it into
   the Supabase SQL editor. Click **Run** (or press Ctrl/Cmd+Enter). You
   should see a "Success" message. That's the entire cloud setup. (The file
   also creates a second table used by the optional phone reminders further
   down — it sits idle until you set those up, and the file is safe to
   re-run at any time.)

4. **Copy your project's keys.** In the left sidebar, click **Project
   Settings** (the gear icon), then **API**. You'll see a **Project URL**
   (looks like `https://xxxxxxxx.supabase.co`) and under **Project API
   keys**, one labelled **anon** or **public**. Copy both.

5. **Create your `.env` file.** In this project's folder, make a copy of
   the file `.env.example` and rename the copy to `.env`. Open `.env` in a
   text editor and paste in the two values you copied, so it looks like:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJI...
   ```

6. **Rebuild.** Run `npm run build` again (or restart `npm run dev` if
   you're testing locally) and re-upload `dist/` if it's already live.
   Cloud sync now shows up under the app's Settings screen.

### Is it safe to put that key in the app that everyone downloads?

Yes, and here's why in plain terms: the **anon key isn't a secret in the
usual sense** — it's baked into the app that ships to every device, so
anyone technical enough could find it anyway. What actually protects the
data is that the database table has "row-level security" turned on with
**no rules that let anyone read or write it directly** — so the anon key
alone gets you nowhere. The only way in is through two narrow functions
that require already knowing a specific sync code (the word-plus-numbers
code described below). No sync code, no access. This is a standard,
supported way to use Supabase from a public app — the key is meant to be
public.

## Phone reminders (optional, and not set up yet)

The app has a daily reminder with three layers. Only the first one is
switched on today, and **the app is complete without the other two** — this
whole section is optional extra credit.

| Layer | What it is | Needs |
|---|---|---|
| 1. In-app nudge | A friendly note when she opens the app at or after her chosen time. | Nothing. Works now, everywhere, offline. |
| 2. Phone push | A real notification at her chosen time, even with the app closed. | The setup below. |
| 3. Local backstop | The same notification, scheduled by her own phone the last time she opened the app. Chrome/Edge/Android only. | Nothing. Turns itself on automatically wherever the browser supports it, and stands down as soon as layer 2 works. |

The app always uses the best layer available and only ever one of them, so
she is never reminded twice for the same day. If you never do any of the
below, layer 3 quietly covers Android and Chrome, and layer 1 covers
everyone else — including every iPhone.

### What layer 2 costs you

About twenty minutes, once. It needs the cloud sync above already working,
plus a Supabase Edge Function (free at this scale) and one pair of keys.

**1. Make the keys.** In a terminal, anywhere:

```
npx web-push generate-vapid-keys
```

It prints a **Public Key** and a **Private Key**. Keep the window open.

**2. Add the push tables.** Open your project's SQL editor again, paste in
the whole of `supabase/schema.sql` and run it. The file is safe to re-run —
it will not touch the progress already saved in it.

**3. Give the function its secrets.** You need the Supabase CLI
(`npm i -g supabase`, then `supabase login`, then `supabase link
--project-ref <your-project-ref>`). Then:

```
supabase secrets set VAPID_PUBLIC_KEY=<the public key from step 1>
supabase secrets set VAPID_PRIVATE_KEY=<the private key from step 1>
supabase secrets set VAPID_SUBJECT=mailto:you@example.com
```

The **private key never leaves this step.** It does not go in `.env`, it
does not go in git.

**4. Deploy the sender.**

```
supabase functions deploy send-reminders
```

**5. Put it on a schedule.** In the Supabase dashboard, open **Edge
Functions → send-reminders → Schedules**, and add one for `*/15 * * * *`
(every fifteen minutes). The function works out, per device, whether it is
that person's reminder time where they are, and sends at most one reminder
per day.

**6. Tell the app the public key.** Add it to your `.env`:

```
VITE_VAPID_PUBLIC_KEY=<the public key from step 1>
```

If the app is on Vercel or Netlify, add the same name and value in the
host's **Environment Variables** screen too — a `.env` file on your laptop
does not reach a deployed site.

**7. Rebuild and re-upload** (`npm run build`, then deploy). Settings now
says *"Your phone can buzz at this time too"* instead of *"aren't set up
yet"*.

### Checking it worked

Open Settings, switch the daily reminder on, and allow notifications when
the browser asks. Then, in the Supabase dashboard, look at the
`push_subscriptions` table — there should be one row, with the reminder time
and the phone's timezone in it. You can also run the function by hand from
**Edge Functions → send-reminders → Invoke** and read the reply: it says how
many it sent, skipped and pruned.

### On iPhone

Web push on iPhone only works if the app is installed to the Home Screen
(Share → **Add to Home Screen**) and the phone is on iOS 16.4 or newer.
Safari in an ordinary tab cannot do it at all, and layer 3 does not exist in
Safari either. The app says this on the Settings screen rather than letting
her wait for a buzz that cannot come.

## Using a sync code

Once cloud sync is set up (see above), open the app and go to **Settings
→ Sync**. Type in a code made of a word and some numbers — anything you
like, e.g. `kiwi2026` — and save it. On a second device, open Settings →
Sync there too, and type in the *exact same* code. Both devices now share
one set of progress: finishing a lesson on the phone shows up on the
laptop, and vice versa.

If you never set this up, none of this matters — the app works exactly
the same, just with progress kept on whichever one device it's used on.

## Scripts

Run these from a terminal, inside this project's folder.

| Command | What it does |
|---|---|
| `npm run dev` | Starts the app locally for development, with live reload. |
| `npm run build` | Builds the production version into `dist/`. |
| `npm run preview` | Serves the already-built `dist/` locally, so you can check a build before uploading it. |
| `npm test` | Runs the automated test suite (fast, no browser). |
| `npm run test:e2e` | Runs the end-to-end tests in a real (headless) browser — see below. |
| `npm run extract` | Regenerates the word/phrase content from `english-nz.html` (see next section). |
| `npm run photos` | Re-downloads the card photographs from Pexels. Needs an API key — see below. |
| `npm run photos:verify` | Checks every file in `public/photos/` is a real WebP at 480px wide. No key needed. |

`npm run test:e2e` needs a browser downloaded once, the first time:
`npx playwright install chromium`.

## Regenerating content

All of the app's vocabulary, phrases, and dialogues are generated from a
single source file, `english-nz.html`, by running:

```bash
npm run extract
```

This overwrites the files ending in `.generated.ts` inside `src/content/`.
**Never hand-edit a `*.generated.ts` file** — anything typed into it will
be silently thrown away next time `extract` runs. If the wording needs to
change, change it in `english-nz.html` and run `extract` again.

To add genuinely new decks (not just edit existing words), write them by
hand in `src/content/authored/` instead — that folder is never touched by
`extract` and is safe to edit directly.

## The card photographs

150 of the 581 cards carry a photograph — the concrete ones, where a picture
shows the thing: food, the body, clothes, the house, around town, transport,
the colours. A word learned next to a picture sticks better than a word
learned next to a translation alone. Abstract cards (`however`, `notice
period`, the grammar and the phrases) deliberately have none: a vague picture
teaches a wrong association, which is worse than no picture.

The photo appears on **Learn**, where the word is being taught, and on
**Recognize** *after* she taps "Show meaning". It never appears before the
answer on Recognize, Listen or Type — a photo of a cat beside a hidden word
would give the answer away.

The files live in `public/photos/<cardId>.webp` (150 files, about 2.1 MB, ~14 kB
each) and are **committed to the repo**, so nothing below is needed to run,
build or deploy the app. They are served as ordinary static files and are
**not** in the offline precache: precaching them would take the install from
~650 kB to several megabytes and break the "study on a plane" promise. Instead
each photo is fetched from the network the first time its card comes up and
then kept by a runtime cache (`card-photos`, 300 entries / 60 days), so once
she has seen a card it works offline too. A card whose photo hasn't downloaded
just renders without it.

### Re-downloading them

```bash
npm run photos          # fetch anything missing
npm run photos:verify   # check what is on disk, no key needed
```

`npm run photos` needs a free [Pexels](https://www.pexels.com/api/) API key in
the environment variable `PEXELS_API_KEY`. Put it in `.env.local` (which is
gitignored) — **never in a file that gets committed**:

```
PEXELS_API_KEY=your-key-here
```

The script is safe to re-run: it skips any card that already has a valid file,
so a run interrupted halfway just resumes. Which cards get a photo, and the
hand-written search query for each one, are both in
`scripts/fetch-photos.mjs` — that file is the whole decision, with the
reasoning for the awkward ones written next to them (`flat` must not return a
flat lay, `bond` must not return James Bond, `jandals` has to be searched as
`flip flops`). It writes `src/content/authored/photos.ts` and
`src/content/authored/photoCredits.ts`; neither should be hand-edited.

Pexels does not require attribution but asks for it, so every photographer and
photo URL is recorded in `src/content/authored/photoCredits.ts`.

## Known limits

- **No pronunciation checking on iPhone/iPad (Safari).** Apple's Safari
  browser doesn't support the speech-recognition feature the app uses to
  listen to spoken answers. On those devices the app simply hides the
  speaking and shadowing (repeat-after-me) exercises rather than showing a
  broken feature or an error — everything else works normally.
- **The American accent voice isn't on every device.** The app asks for
  an `en-US` text-to-speech voice first. If a device doesn't have one
  installed, it automatically falls back to New Zealand English, then
  Australian English, then British English — whichever the device actually
  has. Speech still works everywhere; the accent just may not be the exact
  American one on devices Apple, Google, or the manufacturer didn't ship it on.
