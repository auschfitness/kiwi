import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC_DIR = resolve(ROOT, 'public')

// Same navy the app ships everywhere else (index.css --bg, index.html
// theme-color, the PWA manifest's theme/background colour). Hardcoded here
// on purpose — this script runs standalone with no access to the app's CSS.
const BG = '#0f172a'

/**
 * A hand-drawn kiwifruit cross-section, not a rasterised 🥝 glyph.
 *
 * Rendering the literal emoji character through sharp/librsvg depends on a
 * colour-emoji font being present wherever this script runs (CI, a fresh
 * Windows machine, whatever). It usually isn't: librsvg falls back to a
 * monochrome glyph in a near-black tone, which is functionally invisible on
 * the app's near-black background — a silent failure that only shows up
 * once someone actually looks at the icon on a home screen. Three
 * concentric circles plus a ring of seeds has no such dependency and reads
 * clearly as "kiwifruit" at every size down to 16px.
 *
 * `scale` is the glyph's diameter as a fraction of the canvas. Maskable
 * icons pass a smaller scale so the artwork survives an OS clipping it to a
 * circle (or squircle, or whatever shape that platform uses) without
 * losing the seed ring at the edge.
 */
function kiwiSvg(size, scale) {
  const cx = size / 2
  const cy = size / 2
  const r = (size * scale) / 2

  const seedCount = 14
  const seedOrbit = r * 0.5
  const seedRadius = Math.max(1, r * 0.055)
  const seeds = Array.from({ length: seedCount }, (_, i) => {
    const angle = (i / seedCount) * Math.PI * 2
    const x = cx + seedOrbit * Math.cos(angle)
    const y = cy + seedOrbit * Math.sin(angle)
    return `<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${seedRadius.toFixed(2)}" fill="#1a1410"/>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <circle cx="${cx}" cy="${cy}" r="${r.toFixed(2)}" fill="#7a5233"/>
    <circle cx="${cx}" cy="${cy}" r="${(r * 0.88).toFixed(2)}" fill="#84c341"/>
    <circle cx="${cx}" cy="${cy}" r="${(r * 0.30).toFixed(2)}" fill="#f4f1c9"/>
    ${seeds}
  </svg>`
}

const TARGETS = [
  // Standard icons: no masking to survive, so the glyph can fill most of
  // the canvas.
  { file: 'icon-192.png', size: 192, scale: 0.82 },
  { file: 'icon-512.png', size: 512, scale: 0.82 },
  // Maskable: glyph at ~60% of the canvas per the manifest spec's safe
  // zone, so a circular (or any other) OS mask never crops into the seeds.
  { file: 'icon-maskable-512.png', size: 512, scale: 0.6 },
  // iOS rounds the corners itself; 0.82 leaves enough margin that corner
  // rounding never touches the artwork.
  { file: 'apple-touch-icon.png', size: 180, scale: 0.82 },
]

async function main() {
  for (const { file, size, scale } of TARGETS) {
    const svg = kiwiSvg(size, scale)
    const png = await sharp(Buffer.from(svg)).png().toBuffer()
    const outPath = resolve(PUBLIC_DIR, file)
    writeFileSync(outPath, png)

    // Verify what actually landed on disk, not what we asked sharp to
    // produce — a silently truncated or mis-sized file here only shows up
    // later on someone's home screen.
    const meta = await sharp(outPath).metadata()
    if (meta.width !== size || meta.height !== size) {
      throw new Error(`${file}: expected ${size}x${size}, got ${meta.width}x${meta.height}`)
    }
    console.log(`wrote ${file} (${meta.width}x${meta.height}, ${png.length} bytes)`)
  }
}

main().catch(err => {
  console.error(err)
  process.exitCode = 1
})
