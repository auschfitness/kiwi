/// <reference types="vite/client" />

/**
 * The app version, substituted at build time from package.json by the `define`
 * in vite.config.ts (and mirrored in vitest.config.ts so tests see it too).
 */
declare const __APP_VERSION__: string
