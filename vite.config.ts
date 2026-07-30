import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'English → NZ',
        short_name: 'English NZ',
        description: 'Learn the English you need for New Zealand',
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
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        navigateFallback: 'index.html',
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
