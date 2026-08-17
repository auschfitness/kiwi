/**
 * fetch-photos.mjs — one photograph per concrete card, from Pexels.
 *
 *   node scripts/fetch-photos.mjs                    English, fetch anything missing
 *   node scripts/fetch-photos.mjs --course=es         Spanish, fetch anything missing
 *   node scripts/fetch-photos.mjs --verify            only check what is already on disk
 *   node scripts/fetch-photos.mjs --force             re-fetch even if the file exists
 *
 * `--course` picks which SELECTION table, which corpus to validate ids
 * against, and which authored/photos*.ts pair to write — see COURSES below.
 * The two courses' ids never collide (Spanish ids all start `es_`), so both
 * write into the same public/photos/ directory.
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
const AUTHORED_DIR = path.join(ROOT, 'src', 'content', 'authored')
const ES_DIR = path.join(ROOT, 'src', 'content', 'es')

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
const SELECTION_EN = {
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
  food_2: 'drip coffee carafe pot',
  food_3: 'cup of tea with teapot',
  food_4: 'loaf of bread bakery',
  food_5: 'breakfast plate eggs toast',
  food_6: 'lunch plate sandwich salad table',
  food_7: 'dinner table plate evening meal',
  food_8: 'person holding a restaurant menu',
  food_12: 'disposable takeaway coffee cup and paper bag',
  // "Cheers" is skipped on purpose: casually it means "thanks", and the only
  // photo you get is clinking glasses — which would teach the drinking sense
  // she is less likely to need.

  // ── shopping · Shopping & supermarket (L2) ─────────────────────────────
  shopping_6: 'paper shopping receipt',
  // Bare "cart" unqualified returns hospital and golf carts too.
  shopping_7: 'supermarket shopping trolley cart aisle',
  shopping_8: 'supermarket checkout counter cashier',
  // "Tap to pay" alone returns app UI mockups, not the physical reader.
  shopping_9: 'card payment terminal machine',
  shopping_10: 'cash banknotes money in hand',
  // Bare "card" is playing cards, birthday cards, memory cards.
  shopping_11: 'credit card debit card in hand',
  // Bare "bag" is a handbag.
  shopping_12: 'reusable shopping bag with groceries',
  // Walmart / Kroger / Safeway / a generic convenience store don't have
  // reliable branded stock photography on Pexels — these three go without.

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

  // ── housing · Housing & renting (L3) ────────────────────────────────────
  housing_0: 'apartment building exterior flats',
  housing_8: 'electricity power lines',
  housing_9: 'heat pump air conditioning unit on wall',
  housing_10: 'trash can garbage waste container',
  housing_11: 'recycling bin bottles sorting',
  housing_12: 'row of suburban family houses',
  // "Damp" defeated four queries. British "mould" collides with
  // architectural moulding; American "mold" and "mildew" return abandoned
  // buildings and decorative decay. None of them is the cold wet corner of a
  // rental unit, so the card goes without.
  housing_14: 'house keys door key',
  // "Security deposit" is skipped: it's money, not a thing a camera can show
  // without just repeating money_11's ATM shot.

  // ── health · Health, doctor & pharmacy (L3) ─────────────────────────────
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
  // "Urgent care" is a place, but every result is indistinguishable from
  // health_0's clinic shot — skipped rather than repeated.

  // ── transport · Getting around (L3) ────────────────────────────────────
  transport_0: 'city bus on the street',
  transport_1: 'bus stop shelter sign',
  transport_3: 'passenger train at railway station',
  transport_4: 'passenger ferry boat harbour',
  transport_5: 'car on the road',
  // "Gas" is fine as a word, but the pump makes it unmistakable and keeps it
  // apart from town_9 (the whole station).
  transport_6: 'petrol pump nozzle filling car with fuel',
  transport_7: 'plastic id card driving licence in hand',
  transport_14: 'traffic lights red and green signal',
  // "Sidewalk" unqualified came back as a bike lane, a road crossing and a
  // dim street — every time the road won the frame, and the road is
  // transport_5's neighbour, not this card. Dropped.
  // "Transit card" would just return a generic contactless card and repeat
  // shopping_11.

  // ── work · Work & job (L3) ─────────────────────────────────────────────
  work_1: 'cv resume document on desk',
  work_2: 'job interview handshake candidate recruiter office',
  work_11: 'business meeting people around a table',
  // "Job", "Shift", "Experience", "Available" are abstractions. "Break" and
  // "Boss" would both just be office people.

  // ── kiwi · American slang & customs (L3) ───────────────────────────────
  // Every one of these is a custom or scene, not a tone-word: search the
  // thing, never the word. "Y'all" is dropped — a photo can't show a pronoun.
  kiwi_8: 'backyard barbecue cookout friends', // cookout
  kiwi_9: 'potluck dinner table shared dishes', // potluck
  kiwi_10: 'car driving on open highway', // road trip
  kiwi_11: 'tailgate party parking lot before game', // tailgate
  kiwi_15: 'american flag waving', // the States
  // "What's up", "Awesome", "My bad", "For sure", "No biggie", "Down",
  // "Buddy", "Split the bill", "Chill" and "Way to go" are all tone or
  // phrases, not things.

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
  // Bare "pants" is unreliable on Pexels, so the query stays specific.
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
// The Spanish selection. Same rule, applied to a corpus that is mostly not
// concrete: the course exists to drill production of phrases, connectors,
// verb conjugations and grammar (ser/estar, por/para, subjunctive, discourse
// markers) — none of which a camera can show. What is left after that filter
// is small on purpose, not under-effort: a wrong photo on "por otro lado" or
// "tengo" would be exactly the lie fetch-photos.mjs exists to avoid.
//
// False friends (es_false) get priority even where the noun is ordinary,
// because the photo is not just dual coding there — it is the thing that
// makes the wrong, Portuguese-shaped guess visibly wrong at a glance.
// ───────────────────────────────────────────────────────────────────────────
const SELECTION_ES = {
  // ── es_things · Coisas e gente (L1) ────────────────────────────────────
  es_things_0: 'glass of water',
  es_things_1: 'plate of food meal',
  es_things_2: 'loaf of bread',
  es_things_3: 'raw meat cut on board',
  es_things_4: 'assorted fresh fruit',
  es_things_5: 'cup of coffee',
  es_things_6: 'house exterior',
  es_things_7: 'city street',
  es_things_9: 'cash banknotes money',
  es_things_11: 'crowd of people walking',
  es_things_12: 'two friends laughing together',
  es_things_13: 'family sitting together at table',
  es_things_16: 'portrait of a woman',
  es_things_17: 'portrait of a man',
  // Adjectives (grande, pequeño, bueno, malo, caro, barato, cerca, lejos) are
  // comparisons, same call as English's basics colours/sizes: none get one.
  // "el trabajo" and "la familia" as bare nouns, "el hijo"/"el hermano" as
  // relations — dropped for the same reason English drops husband/wife: any
  // honest photo is also a photo of something else and would teach the
  // wrong word. "el amigo" survives because two people laughing together
  // reads as "friend" more reliably than family or sibling photos do.

  // ── es_home · Casa e rotina (L2) ───────────────────────────────────────
  es_home_0: 'modern kitchen interior',
  es_home_1: 'bedroom interior room',
  es_home_2: 'bathroom interior',
  es_home_3: 'living room with sofa',
  es_home_4: 'apartment building exterior',
  es_home_7: 'trash can garbage bin',
  es_home_11: 'kitchen sink with tap',
  es_home_12: 'light bulb glowing',
  // "el vecino" (neighbour) is the same trap English hit: every result is
  // just two people talking, nothing in frame says "lives next door".

  // ── es_work · Trabalho (L3) ────────────────────────────────────────────
  es_work_0: 'business meeting people around table',
  es_work_3: 'report document on desk',
  es_work_23: 'file folder document',
  es_work_24: 'printed invoice document',
  es_work_25: 'cardboard package box delivery',
  // "el plazo", "el presupuesto", "la meta", "la marca" and the rest of the
  // deck are abstractions a photo can only gesture at, not show.

  // ── es_travel · Viagem e serviços (L2) ─────────────────────────────────
  es_travel_0: 'restaurant bill receipt on table',
  es_travel_1: 'tip money on restaurant table',
  es_travel_3: 'hotel room with two beds',
  es_travel_4: 'hotel reception counter',
  es_travel_5: 'bus ticket stub paper',
  es_travel_6: 'airplane flying in the sky',
  es_travel_9: 'bus stop shelter sign',
  es_travel_10: 'train station platform',
  es_travel_12: 'doctor prescription pad',
  es_travel_13: 'pharmacy shelves chemist shop',
  es_travel_17: 'clothing fitting room',
  es_travel_18: 'clothing size tag',
  es_travel_19: 'sale discount sign store',
  es_travel_21: 'paper receipt',
  es_travel_22: 'cash banknotes in hand',
  es_travel_23: 'credit card payment',
  es_travel_24: 'house keys',
  es_travel_25: 'suitcases luggage',
  es_travel_26: 'airport customs sign',
  es_travel_34: 'sandy beach and sea',

  // ── es_false · Falsos amigos (L3) ──────────────────────────────────────
  // The deck this course most needs pictures in: seeing "embarazada" next to
  // a pregnant woman does more to kill the "envergonhado" guess than any
  // amount of explaining "false friend" ever will.
  es_false_0: 'pregnant woman',
  es_false_5: 'bald man',
  es_false_7: 'office workspace desk',
  es_false_8: 'car repair workshop garage',
  // "vaso" (glass) kept empty on purpose, so its photo never collides with
  // es_things_0's glass of water.
  es_false_9: 'empty drinking glass',
  es_false_15: 'bowl of tomato sauce',
  es_false_16: 'fresh parsley herb',
  es_false_17: 'red paint background texture',
  es_false_18: 'purple paint background texture',
  es_false_19: 'dinner table evening meal',
  es_false_23: 'sliced ham',
  es_false_24: 'school classroom',
  // "desnudo" is dropped outright — not a stock-photo query worth running.
  // "exquisito", "largo", "ancho", "ratos", "apellido", "apodo", "escena" and
  // "presunto" all defeat the camera test the same way English's abstractions
  // do: taste, comparison, and naming have no single honest picture.

  // ── es_topics · Assuntos do mundo (L4) ─────────────────────────────────
  // Almost the whole deck is inflación/desigualdad/tendencia-shaped — the
  // exact abstractions English's SELECTION comment lists as "however, if".
  // Only the handful of literal objects survive.
  es_topics_10: 'office building exterior',
  es_topics_14: 'hand tools workshop',
  es_topics_15: 'smartphone tablet devices',
  es_topics_22: 'recycling bins bottles sorting',
}

// ───────────────────────────────────────────────────────────────────────────

const COURSES = {
  en: {
    selection: SELECTION_EN,
    photosTs: path.join(AUTHORED_DIR, 'photos.ts'),
    creditsTs: path.join(AUTHORED_DIR, 'photoCredits.ts'),
    photosExport: 'PHOTOS',
    creditsExport: 'PHOTO_CREDITS',
  },
  es: {
    selection: SELECTION_ES,
    photosTs: path.join(AUTHORED_DIR, 'photosEs.ts'),
    creditsTs: path.join(AUTHORED_DIR, 'photoCreditsEs.ts'),
    photosExport: 'PHOTOS_ES',
    creditsExport: 'PHOTO_CREDITS_ES',
  },
}

const args = new Set(process.argv.slice(2))
const VERIFY_ONLY = args.has('--verify')
const FORCE = args.has('--force')
const COURSE_ARG = [...args].find(a => a.startsWith('--course='))
const COURSE = COURSE_ARG ? COURSE_ARG.slice('--course='.length) : 'en'
if (!COURSES[COURSE]) {
  console.error(`unknown --course=${COURSE} (expected "en" or "es")`)
  process.exit(1)
}
const { selection: SELECTION, photosTs: PHOTOS_TS, creditsTs: CREDITS_TS, photosExport: PHOTOS_EXPORT, creditsExport: CREDITS_EXPORT } = COURSES[COURSE]

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

/**
 * Card ids that really exist. English's deck file is one big JSON-shaped
 * array, parsed directly; Spanish's decks are hand-authored TypeScript
 * spread across several files, so those are scanned for `id: '...'` instead.
 * `\bid:` never matches inside `deckId:` — the two letters before the colon
 * differ in case, so there is no word boundary there — which is what keeps
 * this from also collecting every deck's own id.
 */
function corpusIds() {
  if (COURSE === 'en') {
    const DECKS_TS = path.join(ROOT, 'src', 'content', 'decks.generated.ts')
    let s = fs.readFileSync(DECKS_TS, 'utf8')
    s = s.slice(s.indexOf('GENERATED_DECKS'))
    s = s.slice(s.indexOf('= [') + 2)
    s = s.slice(0, s.lastIndexOf(']') + 1)
    const decks = JSON.parse(s)
    return new Set(decks.flatMap(d => d.cards.map(c => c.id)))
  }
  const ids = new Set()
  for (const f of fs.readdirSync(ES_DIR)) {
    if (!f.endsWith('.ts') || f.endsWith('.test.ts')) continue
    const s = fs.readFileSync(path.join(ES_DIR, f), 'utf8')
    for (const m of s.matchAll(/\bid:\s*'([^']+)'/g)) ids.add(m[1])
  }
  return ids
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
      `// Card id -> public path of its photograph. Merged onto the ${COURSE === 'en' ? 'English' : 'Spanish'} decks,\n` +
      `// the same way PHONETICS is for English. A card with no entry here\n` +
      `// simply renders without a picture.\n` +
      `export const ${PHOTOS_EXPORT}: Record<string, string> = ${JSON.stringify(map, null, 2)}\n`,
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
      `export const ${CREDITS_EXPORT}: Record<string, PhotoCredit> = ${JSON.stringify(sorted, null, 2)}\n`,
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
  const credits = readGenerated(CREDITS_TS, CREDITS_EXPORT)
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
