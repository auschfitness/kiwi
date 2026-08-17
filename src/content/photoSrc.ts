/** PHOTOS tables store root-absolute paths (`/photos/x.webp`), which is right
 * when the app is served from the root of a domain. Hosted in a subfolder —
 * the `base` case the README describes — it has to become
 * `/english/photos/x.webp` or every picture 404s. BASE_URL is `/` unless
 * someone sets `base`, so this is a no-op in the normal deploy and in tests.
 *
 * Shared by english.ts and content/es/index.ts, the two places a PHOTOS table
 * gets merged onto a course's cards.
 */
const BASE = import.meta.env.BASE_URL

export function photoSrc(photos: Record<string, string>, id: string): string | undefined {
  const p = photos[id]
  return p === undefined ? undefined : BASE + p.replace(/^\//, '')
}
