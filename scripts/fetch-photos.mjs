/**
 * fetch-photos.mjs — one photograph per concrete card, from Pexels.
 *
 *   node scripts/fetch-photos.mjs            fetch anything still missing
 *   node scripts/fetch-photos.mjs --verify   only check what is already on disk
 *   node scripts/fetch-photos.mjs --force    re-fetch even if the file exists
 *
 * Needs a Pexels API key. Put it in `.env.local` (gitignored) as
 *   PEXELS_API_KEY=...
 * or export PEXELS_API_KEY in your shell. The key must never reach a
 * committed file.
 *
 * ── Why photographs at all ────────────────────────────────────────────────
 * Dual coding: a word paired with a picture is remembered better than a word
 * paired with a translation alone. That only holds when the picture shows the
 * thing. A vague or wrong picture teaches a wrong association, which is worse
 * than no picture, so the selection below is deliberately small and the query
 * for each card is hand-written.
 *
 * ── The selection rule ────────────────────────────────────────────────────
 * A card gets a photo when you could point a camera at what it names and a
 * Brazilian who had never seen the English word would still say "ah, that".
 * Everything else is left alone:
 *   - abstract words, grammar, connectors, tenses, opinions      (however, if)
 *   - phrases and social moves                       (Nice to meet you, Cheers)
 *   - phrasal verbs and idioms                        (sort out, notice period)
 *   - numbers and days                    (a photo of "three" is a photo of 3 x)
 *   - verbs      (a photo of "to eat" is also a photo of food, of a plate, of
 *                a woman — the action never wins the ambiguity, so the whole
 *                verb decks are skipped rather than half-guessed)
 *   - near-duplicate pairs, where the second photo would just teach the first
 *                (worried / nervous, cold+flu / cough, jacket / coat kept
 *                 only because they really are different garments)
 *
 * Outputs, all regenerated from this file:
 *   public/photos/<cardId>.webp             480px wide, webp q72, no metadata
 *   src/content/authored/photos.ts          cardId -> /photos/<cardId>.webp
 *   src/content/authored/photoCredits.ts    cardId -> photographer + page url
 *
 * Pexels does not require attribution but asks for it. photoCredits.ts is how
 * we give it.
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PHOTO_DIR = path.join(ROOT, 'public', 'photos')
const PHOTOS_TS = path.join(ROOT, 'src', 'content', 'authored', 'photos.ts')
const CREDITS_TS = path.join(ROOT, 'src', 'content', 'authored', 'photoCredits.ts')
const DECKS_TS = path.join(ROOT, 'src', 'content', 'decks.generated.ts')

const WIDTH = 480
const QUALITY = 72
const MIN_QUALITY = 40
const MAX_BYTES = 40 * 1024

// ───────────────────────────────────────────────────────────────────────────
// The selection. cardId -> Pexels search query.
//
// The query is never the raw `en` value. English is full of words that mean
// something else to a stock photo library, and a card is only as good as the
// picture it ends up with. The awkward ones are commented.
// ───────────────────────────────────────────────────────────────────────────
const SELECTION = {
  // ── people · People & family (L1) ──────────────────────────────────────
  // "Husband" and "Wife" are deliberately absent: any honest photo of a
  // husband is also a photo of a man, and the two cards would end up with
  // interchangeable wedding shots that teach neither. Mother and Father
  // survive because "adult holding a baby" and "man playing with his child"
  // really are distinct, iconic images.
  people_2: 'young child portrait smiling',
  people_3: 'group of children playing together',
  people_4: 'mother holding her baby',
  people_5: 'father playing with his child',
  people_6: 'two friends laughing together',
  // "Neighbour" was tried three ways — over a fence, over a garden, two
  // people outside their houses — and every result was two mates having a
  // drink or two colleagues talking. Nothing in the frame says "the person
  // who lives next door", so the card keeps its words and loses the picture.
  people_8: 'portrait of a man',
  people_9: 'portrait of a woman',
  people_10: 'young boy portrait',
  people_11: 'young girl portrait',

  // ── food · Café & restaurant (L2) ──────────────────────────────────────
  food_0: 'pouring water into a clear drinking glass',
  food_1: 'cup of coffee',
  // "Flat white" alone is fine on Pexels — it is a coffee term everywhere —
  // but "flat" on its own would return flat-lay compositions, so the noun
  // is always kept with "coffee".
  food_2: 'flat white coffee cup latte art',
  food_3: 'cup of tea with teapot',
  food_4: 'loaf of bread bakery',
  food_5: 'breakfast plate eggs toast',
  food_6: 'lunch plate sandwich salad table',
  food_7: 'dinner table plate evening meal',
  food_8: 'person holding a restaurant menu',
  food_12: 'disposable takeaway coffee cup and paper bag',
  // "Cheers" is skipped on purpose: in NZ it usually means "thanks", and the
  // only photo you get is clinking glasses — which would teach the drinking
  // sense she is less likely to need.

  // ── shopping · Shopping & supermarket (L2) ─────────────────────────────
  shopping_6: 'paper shopping receipt',
  // NZ "trolley" is a supermarket cart; unqualified it returns hospital and
  // hotel trolleys.
  shopping_7: 'supermarket shopping trolley cart aisle',
  shopping_8: 'supermarket checkout counter cashier',
  // EFTPOS is a New Zealand word with no stock photography behind it. Query
  // the object instead of the word.
  shopping_9: 'card payment terminal machine',
  shopping_10: 'cash banknotes money in hand',
  // Bare "card" is playing cards, birthday cards, memory cards.
  shopping_11: 'credit card debit card in hand',
  // Bare "bag" is a handbag.
  shopping_12: 'reusable shopping bag with groceries',
  // The Warehouse / Countdown / New World / Dairy are NZ shopfronts that
  // Pexels does not have. "Dairy" would return milk and cows — exactly the
  // wrong association for a corner shop.

  // ── money · Money & banking (L3) ───────────────────────────────────────
  // "Bill" is a duck's beak, a banknote, and a man's name before it is an
  // invoice.
  // "Bill" is dropped after three tries: every honest result was a desk of
  // paper, which is indistinguishable from shopping_6 (Receipt). Two cards
  // sharing one image teach neither.
  money_6: 'coins in a glass savings jar',
  money_8: 'dollar banknotes cash',
  money_9: 'pile of coins small change',
  money_11: 'atm cash machine bank',

  // ── housing · Housing & renting (L3) ───────────────────────────────────
  // "Flat" is the single most dangerous query in the corpus: flat lay,
  // flat design, flat tyre, flat surface. Only "apartment building" gets a
  // NZ flat.
  housing_0: 'apartment building exterior flats',
  housing_8: 'electricity power lines',
  housing_9: 'heat pump air conditioning unit on wall',
  housing_10: 'trash can garbage waste container',
  housing_11: 'recycling bin bottles sorting',
  housing_12: 'row of suburban family houses',
  // "Damp" alone returns dew and wet grass, which reads as pleasant. The
  // card means the thing that ruins NZ rentals.
  // "Damp" defeated four queries. British "mould" collides with
  // architectural moulding; American "mold" and "mildew" return abandoned
  // buildings and decorative decay. None of them is the cold wet corner of a
  // NZ rental, so the card goes without.
  housing_14: 'house keys door key',
  // "Bond" is skipped: it is money held by a government agency. James Bond
  // and chemical bonds are what a photo library has, and neither is a bond.

  // ── health · Health, GP & pharmacy (L3) ────────────────────────────────
  // "GP" as an abbreviation is meaningless to a photo search.
  health_0: 'doctor consulting patient in clinic',
  health_2: 'pharmacy shelves chemist shop',
  health_3: 'doctor writing a prescription',
  health_4: 'medicine pills tablets bottle',
  health_7: 'woman with headache holding her head',
  health_8: 'thermometer fever high temperature',
  health_9: 'man coughing sick',
  health_10: 'sick woman with tissues blowing nose',
  health_11: 'nurse in scrubs hospital',
  health_12: 'hospital building exterior',
  health_13: 'dentist treating patient dental chair',
  // "Healthline" is a NZ phone service — nothing to photograph.

  // ── transport · Getting around (L3) ────────────────────────────────────
  transport_0: 'city bus on the street',
  transport_1: 'bus stop shelter sign',
  transport_3: 'passenger train at railway station',
  transport_4: 'passenger ferry boat harbour',
  transport_5: 'car on the road',
  // NZ "petrol" is fine as a word, but the pump makes it unmistakable and
  // keeps it apart from town_9 (the whole station).
  transport_6: 'petrol pump nozzle filling car with fuel',
  transport_7: 'plastic id card driving licence in hand',
  transport_14: 'traffic lights red and green signal',
  // NZ "footpath" is the pavement; unqualified it returns forest trails.
  // "Footpath" (the NZ word for the pavement) came back as a bike lane, a
  // road crossing and a dim street — every time the road won the frame, and
  // the road is transport_5's neighbour, not this card. Dropped.
  // AT HOP / Bee Card are NZ travel cards with no stock imagery, and a
  // generic contactless card would just repeat shopping_11.

  // ── work · Work & job (L3) ─────────────────────────────────────────────
  work_1: 'cv resume document on desk',
  work_2: 'job interview handshake candidate recruiter office',
  work_11: 'business meeting people around a table',
  // "Job", "Shift", "Experience", "Available" are abstractions. "Break" and
  // "Boss" would both just be office people.

  // ── kiwi · Kiwi slang & NZ words (L3) ──────────────────────────────────
  // Every one of these is a NZ-only word: search the thing, never the word.
  kiwi_7: 'flip flops sandals on the beach', // jandals
  kiwi_8: 'swimsuit swimwear poolside',      // togs
  kiwi_9: 'small beach house holiday cottage', // bach — the word alone is the composer
  // "Chilly bin" (the NZ esky/cooler) was tried as cooler, ice chest, esky
  // and cooler-on-the-beach. Every result was the picnic around it — crates
  // of soft drinks, friends on the sand, a man ice fishing — and never the
  // box itself. Dropped.
  kiwi_11: 'hiking trail backpack mountains', // tramping — the word alone is trampling
  kiwi_15: 'new zealand landscape mountains', // Aotearoa
  // "Sweet as", "Chur", "Heaps", "Keen", "Ta", "Wee", "Good on ya" are all
  // tone, not things.

  // ── emergency · Emergencies & help (L1) ────────────────────────────────
  emergency_3: 'ambulance emergency vehicle',
  emergency_4: 'police car officer',
  emergency_5: 'fire flames burning',
  emergency_10: 'octagonal red stop sign traffic',
  emergency_11: 'danger warning sign hazard',

  // ── feelings · Feelings & states (L1) ──────────────────────────────────
  // Only the faces a stranger could name. "Worried", "Nervous", "Confused"
  // and "Proud" all photograph as roughly the same furrowed brow, so they
  // are left without a picture rather than given a misleading one.
  feelings_0: 'happy woman smiling laughing',
  feelings_1: 'sad woman looking down upset',
  feelings_2: 'tired woman yawning exhausted',
  feelings_5: 'woman freezing cold winter scarf shivering',
  // "Hot" (com calor) has no face of its own. Sweating photographs as
  // exhausted, which is feelings_2; fanning photographs as posing; and
  // "heat" returns goosebumps, which is the opposite feeling. Dropped —
  // "Cold" keeps its picture because shivering in a coat in the snow reads
  // instantly, and one of a pair earning a photo is fine.
  feelings_7: 'scared frightened woman covering face',
  feelings_8: 'angry woman shouting frustrated',
  feelings_10: 'excited woman celebrating arms raised',
  feelings_12: 'bored woman unimpressed sitting',

  // ── house · Around the house (L2) ──────────────────────────────────────
  house_0: 'close up of the front door of a house',
  house_1: 'window with curtains and daylight',
  house_2: 'empty wooden table top surface background',
  house_3: 'wooden chair furniture',
  // Kept apart from house_7 on purpose: this one is a close-up of the bed,
  // that one is the whole room.
  house_4: 'made bed with white sheets and pillows',
  house_5: 'modern kitchen interior',
  house_6: 'bathroom interior bathtub',
  house_7: 'bedroom interior room',
  house_8: 'living room with sofa',
  house_9: 'refrigerator fridge in kitchen',
  house_10: 'open oven with baking tray',
  // "Sink" is also a verb about boats.
  house_11: 'kitchen sink with tap',
  house_12: 'shower head running water bathroom',
  house_13: 'folded towels bathroom',
  house_14: 'folded woollen blanket',
  // "Light" is the most abstract word here; the bulb is the object she needs.
  house_15: 'light bulb lamp glowing',
  house_16: 'electric heater radiator in room',

  // ── clothes · Clothes & weather (L2) ───────────────────────────────────
  clothes_0: 'clothes on hangers rack wardrobe',
  clothes_1: 'folded button up shirt clothing',
  clothes_2: 'denim jacket clothing',
  clothes_3: 'winter wool coat hanging',
  clothes_4: 'pair of shoes',
  clothes_5: 'pair of socks',
  // NZ "pants" are trousers. The US sense would return underwear.
  clothes_6: 'trousers jeans folded clothing',
  // "Dress" is also a verb, and "dress up" is a costume party.
  clothes_7: 'summer dress on a hanger',
  clothes_8: 'hat cap headwear',
  clothes_9: 'umbrella in the rain',
  clothes_10: 'yellow raincoat waterproof jacket',
  clothes_12: 'rain falling raindrops',
  // "Wind" is also to wind a clock, and the noun has no shape — the trees do.
  clothes_13: 'windy day hair blowing in the wind',
  clothes_14: 'sunny blue sky sunshine',
  clothes_15: 'overcast grey cloudy sky',
  // "Weather", "Wet" and "Warm" would all be repeats of the four above.

  // ── body · The body (L2) ───────────────────────────────────────────────
  body_0: 'side profile of a persons head',
  body_1: 'human hand palm',
  body_2: 'flexing bicep arm muscle',
  body_3: 'human legs',
  body_4: 'bare feet',
  body_5: 'human eye close up',
  body_6: 'human ear close up',
  body_7: 'human lips mouth close up',
  // "Nose" is either a dog's nose or a whole face with eyes in it, which
  // would fight body_5. Left without.
  body_9: 'teeth smile close up dental',
  body_10: 'human belly stomach abdomen',
  body_11: 'human back shoulders',
  body_13: 'long hair close up',
  // "Throat" only photographs as a hand held to a sore neck, which teaches
  // "sore throat", not "throat".

  // ── arrival · Airport & immigration (L3) ───────────────────────────────
  arrival_0: 'passport travel document',
  arrival_2: 'airplane flying in the sky',
  arrival_3: 'boarding pass airline ticket',
  arrival_4: 'suitcases luggage travel',
  arrival_5: 'baggage claim carousel airport',
  arrival_6: 'airport arrivals board sign',
  // "Customs", "Immigration", "Biosecurity" and "Residence" are procedures
  // and statuses, not sights. "Visa" would just be another passport page.

  // ── town · Around town (L2) ────────────────────────────────────────────
  town_0: 'city street with buildings',
  // Deliberately the open-road sense, to hold it apart from town_0 the way
  // "rua" is held apart from "estrada".
  town_1: 'open country road highway',
  town_2: 'street corner intersection building',
  town_3: 'shop storefront on street',
  // Bare "bank" is a river bank.
  town_4: 'bank building entrance',
  town_5: 'post office building',
  town_6: 'library books shelves',
  // Bare "park" is a car park.
  town_7: 'people relaxing in a city park with trees',
  town_8: 'school building classroom',
  town_9: 'petrol station forecourt fuel',
  town_10: 'public toilet restroom sign',
  town_11: 'cafe coffee shop interior',
  town_12: 'sandy beach and sea',
  town_13: 'city centre downtown buildings',

  // ── basics · Colours & describing (L1) ─────────────────────────────────
  // Colours are photographed as surfaces, not as objects. "Red apple" would
  // teach "apple"; a wall of red paint can only be teaching red.
  basics_0: 'paint colour swatch samples palette',
  basics_1: 'red paint background texture',
  basics_2: 'blue paint background texture',
  basics_3: 'emerald green background',
  basics_4: 'yellow paint background texture',
  basics_5: 'black background texture',
  basics_6: 'white wall with soft shadow',
  // "Big", "Small", "New", "Old", "Good", "Bad", "Easy", "Difficult" are all
  // comparisons — they need two photos or none, so they get none.
}

// ───────────────────────────────────────────────────────────────────────────

const args = new Set(process.argv.slice(2))
const VERIFY_ONLY = args.has('--verify')
const FORCE = args.has('--force')

function readApiKey() {
  if (process.env.PEXELS_API_KEY) return process.env.PEXELS_API_KEY.trim()
  const envFile = path.join(ROOT, '.env.local')
  if (fs.existsSync(envFile)) {
    for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
      const m = /^\s*PEXELS_API_KEY\s*=\s*(.+?)\s*$/.exec(line)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  }
  return null
}

/** Card ids that really exist, read straight out of the generated deck file. */
function corpusIds() {
  let s = fs.readFileSync(DECKS_TS, 'utf8')
  s = s.slice(s.indexOf('GENERATED_DECKS'))
  s = s.slice(s.indexOf('= [') + 2)
  s = s.slice(0, s.lastIndexOf(']') + 1)
  const decks = JSON.parse(s)
  return new Map(decks.flatMap(d => d.cards.map(c => [c.id, c])))
}

/** Read back a generated `export const X = {json}` file, or {} if absent. */
function readGenerated(file, name) {
  if (!fs.existsSync(file)) return {}
  const s = fs.readFileSync(file, 'utf8')
  const start = s.indexOf('= {', s.indexOf(name))
  if (start < 0) return {}
  const end = s.lastIndexOf('}')
  try {
    return JSON.parse(s.slice(start + 2, end + 1))
  } catch {
    return {}
  }
}

const HEADER = `// GENERATED by scripts/fetch-photos.mjs — DO NOT EDIT BY HAND.\n`

function writePhotos(ids) {
  const map = Object.fromEntries([...ids].sort().map(id => [id, `/photos/${id}.webp`]))
  fs.writeFileSync(
    PHOTOS_TS,
    HEADER +
      `//\n` +
      `// Card id -> public path of its photograph. Merged onto the decks in\n` +
      `// src/content/index.ts, the same way PHONETICS is. A card with no entry\n` +
      `// here simply renders without a picture.\n` +
      `export const PHOTOS: Record<string, string> = ${JSON.stringify(map, null, 2)}\n`,
  )
}

function writeCredits(credits) {
  const sorted = Object.fromEntries(Object.keys(credits).sort().map(k => [k, credits[k]]))
  fs.writeFileSync(
    CREDITS_TS,
    HEADER +
      `//\n` +
      `// Pexels does not require attribution but asks for it, and the\n` +
      `// photographers gave these away for free. One entry per photo.\n` +
      `import type { PhotoCredit } from '../../types'\n\n` +
      `export const PHOTO_CREDITS: Record<string, PhotoCredit> = ${JSON.stringify(sorted, null, 2)}\n`,
  )
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

/**
 * 480px wide, webp, no metadata (sharp drops EXIF and ICC unless asked to
 * keep them; .rotate() applies the orientation tag first so nothing arrives
 * sideways).
 *
 * q72 puts the typical photo around 14 kB, but a busy frame — foliage, a
 * crowd, fine texture — can triple that, and these are fetched over her
 * mobile connection one card at a time. So the budget is a hard cap rather
 * than a hope: anything over 40 kB is re-encoded a notch lower until it fits.
 */
async function encode(buf) {
  const base = sharp(buf).rotate().resize({ width: WIDTH, withoutEnlargement: false })
  let out = await base.clone().webp({ quality: QUALITY }).toBuffer()
  for (let q = QUALITY - 8; out.length > MAX_BYTES && q >= MIN_QUALITY; q -= 8) {
    out = await base.clone().webp({ quality: q }).toBuffer()
  }
  return out
}

/**
 * Is this a real webp of the right width? A search that errors, a rate limit
 * page, or a half-finished download all produce a file that the build happily
 * copies and that only fails on her screen, so nothing is trusted until sharp
 * has actually decoded it.
 *
 * Takes a Buffer, not a path: on Windows sharp keeps a handle on a file it
 * read, which then blocks the rename into place.
 */
async function inspect(buf) {
  try {
    if (buf.length === 0) return { ok: false, why: 'zero bytes' }
    const meta = await sharp(buf).metadata()
    if (meta.format !== 'webp') return { ok: false, why: `format ${meta.format}` }
    if (meta.width !== WIDTH) return { ok: false, why: `width ${meta.width}` }
    return { ok: true, bytes: buf.length, height: meta.height }
  } catch (e) {
    return { ok: false, why: e.message.split('\n')[0] }
  }
}

const inspectFile = file => inspect(fs.readFileSync(file))

/** GET with backoff on 429 / 5xx. Never returns a body we would not trust. */
async function get(url, headers, tries = 5) {
  let wait = 2000
  for (let attempt = 1; attempt <= tries; attempt++) {
    let res
    try {
      res = await fetch(url, { headers })
    } catch (e) {
      if (attempt === tries) throw e
      await sleep(wait)
      wait *= 2
      continue
    }
    if (res.status === 429 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after'))
      const pause = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : wait
      if (attempt === tries) throw new Error(`HTTP ${res.status} after ${tries} tries`)
      console.log(`      … HTTP ${res.status}, backing off ${Math.round(pause / 1000)}s`)
      await sleep(pause)
      wait *= 2
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return res
  }
  throw new Error('unreachable')
}

async function verifyAll() {
  if (!fs.existsSync(PHOTO_DIR)) {
    console.log('no public/photos yet')
    return { bad: [], total: 0, bytes: 0 }
  }
  const files = fs.readdirSync(PHOTO_DIR).filter(f => f.endsWith('.webp'))
  const bad = []
  let bytes = 0
  for (const f of files) {
    const r = await inspectFile(path.join(PHOTO_DIR, f))
    if (!r.ok) bad.push(`${f}: ${r.why}`)
    else bytes += r.bytes
  }
  console.log(
    `verify: ${files.length - bad.length}/${files.length} valid webp @ ${WIDTH}px, ` +
      `${(bytes / 1024).toFixed(0)} KB total, ` +
      `${files.length ? (bytes / files.length / 1024).toFixed(1) : 0} KB average`,
  )
  for (const b of bad) console.log(`  BAD ${b}`)
  return { bad, total: files.length, bytes }
}

async function main() {
  const ids = Object.keys(SELECTION)
  console.log(`selection: ${ids.length} cards`)

  // A typo in a card id fails silently at runtime (the photo just never
  // shows), so it has to fail loudly here instead.
  const corpus = corpusIds()
  const unknown = ids.filter(id => !corpus.has(id))
  if (unknown.length) {
    console.error(`unknown card ids in SELECTION: ${unknown.join(', ')}`)
    process.exit(1)
  }

  if (VERIFY_ONLY) {
    const { bad } = await verifyAll()
    process.exit(bad.length ? 1 : 0)
  }

  const key = readApiKey()
  if (!key) {
    console.error('PEXELS_API_KEY is not set (shell env or .env.local). Nothing fetched.')
    process.exit(1)
  }

  fs.mkdirSync(PHOTO_DIR, { recursive: true })
  // Anything left over from a run that died mid-write.
  for (const f of fs.readdirSync(PHOTO_DIR)) {
    if (f.endsWith('.tmp')) fs.rmSync(path.join(PHOTO_DIR, f), { force: true })
  }
  const credits = readGenerated(CREDITS_TS, 'PHOTO_CREDITS')
  const have = new Set()
  const failed = []

  for (const [i, id] of ids.entries()) {
    const file = path.join(PHOTO_DIR, `${id}.webp`)
    const query = SELECTION[id]

    if (!FORCE && fs.existsSync(file)) {
      const r = await inspectFile(file)
      if (r.ok && credits[id]) {
        have.add(id)
        continue
      }
      // Half-written or credit-less: throw it away and fetch again.
      fs.rmSync(file, { force: true })
    }

    process.stdout.write(`[${i + 1}/${ids.length}] ${id} — "${query}" … `)
    try {
      const url =
        'https://api.pexels.com/v1/search?per_page=5&orientation=landscape&query=' +
        encodeURIComponent(query)
      const res = await get(url, { Authorization: key })
      const json = await res.json()
      const photo = (json.photos ?? []).find(p => p.width > p.height)
      if (!photo) throw new Error('no landscape result')

      const img = await get(photo.src.large, {})
      const buf = Buffer.from(await img.arrayBuffer())
      const out = await encode(buf)
      const check = await inspect(out)
      if (!check.ok) throw new Error(`bad output: ${check.why}`)

      // Write to a temp name and rename, so an interrupted run can never
      // leave a truncated .webp that looks finished to the next run.
      const tmp = `${file}.tmp`
      fs.writeFileSync(tmp, out)
      fs.renameSync(tmp, file)

      credits[id] = { photographer: photo.photographer, url: photo.url }
      have.add(id)
      console.log(
        `${(check.bytes / 1024).toFixed(1)} KB ${WIDTH}x${check.height} — ` +
          `${photo.photographer} — alt: ${(photo.alt || '').slice(0, 70)}`,
      )
    } catch (e) {
      console.log(`FAILED: ${e.message}`)
      failed.push({ id, query, why: e.message })
    }

    await sleep(150) // polite, and well inside the 200 req/hour-per-key ceiling
  }

  // Only credit what actually exists on disk.
  for (const id of Object.keys(credits)) if (!have.has(id)) delete credits[id]

  writePhotos(have)
  writeCredits(credits)

  console.log(`\nwrote ${have.size} photos, ${Object.keys(credits).length} credits`)
  if (failed.length) {
    console.log(`\n${failed.length} card(s) left without a photo:`)
    for (const f of failed) console.log(`  ${f.id}  "${f.query}"  — ${f.why}`)
  }
  await verifyAll()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})
