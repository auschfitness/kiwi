import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { version } from './package.json' with { type: 'json' }

export default defineConfig({
  // Read here rather than imported by the app, so package.json never reaches
  // the bundle. Settings prints it, and it is also the target of the tap
  // gesture that turns free access on.
  define: { __APP_VERSION__: JSON.stringify(version) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'English → USA',
        short_name: 'English USA',
        description: 'Learn the English you need for the United States',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // The one hook `generateSW` gives us for our own service-worker code.
        // Workbox emits `importScripts('push-sw.js')` at the top of the
        // generated dist/sw.js and leaves everything else it generates —
        // precache manifest, navigation fallback, the photos runtime cache —
        // exactly as it was. See the long note at the top of
        // public/push-sw.js for why this rather than `injectManifest`.
        importScripts: ['push-sw.js'],
        // Note what is *not* here: webp. The 148 card photographs in
        // public/photos are deliberately left out of the precache.
        //
        // The promise of this app is that she can study on a plane. Precaching
        // the photos would take the install from ~626 kB to well over 2 MB and
        // make the first load a download she has to wait through — the exact
        // thing offline-first is supposed to spare her. She is essentially
        // always connected, so the photo fetches from the network the first
        // time a card comes up, and the runtime rule below keeps it from then
        // on. Seen once, it works offline forever after; never seen, the card
        // just renders without it. The plane still works either way.
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // push-sw.js is imported by the service worker itself, so precaching
        // it would be circular: it is already fetched (and revalidated on
        // every update check) as part of the worker, never through a fetch
        // handler. Keeping the default node_modules ignore, which specifying
        // this option would otherwise replace.
        globIgnores: ['**/node_modules/**/*', 'push-sw.js'],
        navigateFallback: 'index.html',
        // navigateFallback would otherwise answer a missing photo with
        // index.html, which the browser then tries to decode as an image.
        // Both patterns match anywhere in the path, not just at the root, so
        // they keep working if the app is ever moved into a subfolder.
        navigateFallbackDenylist: [/\/photos\//],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/photos/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'card-photos',
              // A photo never changes under its card id — a re-fetch would
              // change the id too — so CacheFirst is safe, and the cap stops
              // the cache growing without bound if the corpus ever does.
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    outDir: 'dist',
    // The 581-card corpus (src/content) bundled alongside the app shell
    // pushed the single JS chunk to ~567 kB minified, past the default
    // 500 kB warning — expected for an offline-first app that precaches its
    // whole course, but a warning nobody ever silences trains people to
    // ignore the next one that actually matters. Splitting content into its
    // own chunk (still precached — offline behaviour is unchanged) resolves
    // the warning honestly instead of just raising the limit: the app shell
    // drops to ~458 kB, content is its own ~110 kB chunk, and content — the
    // part that changes rarely — now caches independently of app code,
    // which changes far more often.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/src/content/')) return 'content'
        },
      },
    },
  },
})
