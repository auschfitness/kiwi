import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { version } from './package.json' with { type: 'json' }

export default defineConfig({
  plugins: [react()],
  // Mirrors vite.config.ts. This config is standalone — it does not extend the
  // build one — so a define added there and not here is simply undefined under
  // test, and Settings would render "Kiwi · undefined".
  define: { __APP_VERSION__: JSON.stringify(version) },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    passWithNoTests: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
  },
})
