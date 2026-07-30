# English → NZ

English → NZ is an offline-first app that teaches the English a Brazilian
Portuguese speaker needs to move to New Zealand — greetings, money, housing,
the GP, the airport, Kiwi slang, and more — through short daily practice
sessions. It's built for one learner getting ready for a move in a couple of
months, but it works for anyone learning English with Portuguese as their
first language.

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
   again for this), choose a region close to New Zealand, and click
   **Create new project**. Wait a minute or two while it sets itself up.

2. **Open the SQL editor.** In the left sidebar of your new project, click
   **SQL Editor**. Click **New query**.

3. **Paste and run the schema.** Open the file `supabase/schema.sql` from
   this project in a text editor, copy everything in it, and paste it into
   the Supabase SQL editor. Click **Run** (or press Ctrl/Cmd+Enter). You
   should see a "Success" message. This creates one table and two
   functions — that's the entire cloud setup.

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

## Known limits

- **No pronunciation checking on iPhone/iPad (Safari).** Apple's Safari
  browser doesn't support the speech-recognition feature the app uses to
  listen to spoken answers. On those devices the app simply hides the
  speaking and shadowing (repeat-after-me) exercises rather than showing a
  broken feature or an error — everything else works normally.
- **The New Zealand accent voice isn't on every device.** The app asks for
  an `en-NZ` text-to-speech voice first. If a device doesn't have one
  installed, it automatically falls back to Australian English, then
  British English, then American English — whichever the device actually
  has. Speech still works everywhere; the accent just may not be the exact
  Kiwi one on devices Apple, Google, or the manufacturer didn't ship it on.
