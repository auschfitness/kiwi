/*
 * Hand-written service-worker additions: the two handlers Workbox cannot
 * generate for us.
 *
 * WHY THIS FILE EXISTS AS A SEPARATE SCRIPT
 * -----------------------------------------
 * The app builds its service worker with vite-plugin-pwa in `generateSW`
 * mode. That mode writes `dist/sw.js` from the Workbox config in
 * vite.config.ts and gives us no place to add our own `push` listener.
 *
 * The two ways out are:
 *
 *   1. Switch to `injectManifest` and hand-write the whole service worker.
 *      That means owning the precache logic, the navigation fallback, the
 *      photos runtime cache and `cleanupOutdatedCaches()` by hand, forever —
 *      a rewrite of the one file whose failure mode is "the app no longer
 *      works on the plane".
 *   2. Keep `generateSW` and hand Workbox this file via
 *      `workbox.importScripts`. Workbox then emits `importScripts('push-sw.js')`
 *      at the very top of the generated `sw.js`, before any of its own code.
 *      Everything Workbox generates stays byte-for-byte what it was.
 *
 * Option 2 is what we do. The offline guarantee is not something to gamble
 * on a refactor for a nice-to-have reminder.
 *
 * CONSEQUENCES OF BEING A SEPARATE, UNHASHED FILE
 * -----------------------------------------------
 * `push-sw.js` is served from the site root with no content hash in its
 * name, so it is deliberately kept out of the precache manifest
 * (`workbox.globIgnores` in vite.config.ts) — precaching the script that the
 * service worker itself imports is circular and buys nothing. Browsers
 * revalidate imported scripts whenever they check the service worker for an
 * update (Chrome 78+, Firefox, Safari), so an edit here still reaches
 * devices; it does not need cache-busting of its own.
 *
 * Plain ES5-flavoured JS on purpose: this file is shipped verbatim, never
 * transpiled and never bundled.
 */

/* eslint-env serviceworker */
/* global self, clients */

var NOTIFICATION_TITLE = 'English → USA'

var NOTIFICATION_OPTIONS = {
  body: 'Time for your daily English 🥝',
  icon: '/icon-192.png',
  badge: '/icon-192.png',
  // One tag, so a second push that somehow arrives on the same day replaces
  // the first notification rather than stacking a second buzz on top of it.
  // The local fallback (Layer 3) uses this same tag for the same reason.
  tag: 'english-nz-daily-reminder',
  data: { url: '/' },
}

self.addEventListener('push', function (event) {
  // `showNotification` must be awaited inside `waitUntil`, otherwise the
  // browser may kill the worker first — and a push that was granted
  // `userVisibleOnly` and then showed nothing gets the site penalised.
  event.waitUntil(self.registration.showNotification(NOTIFICATION_TITLE, NOTIFICATION_OPTIONS))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  var target = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (windowClients) {
        // Focus a tab she already has open rather than opening a second copy
        // of the app next to it.
        for (var i = 0; i < windowClients.length; i += 1) {
          var client = windowClients[i]
          if ('focus' in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow(target)
        return undefined
      }),
  )
})
