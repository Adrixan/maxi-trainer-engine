/**
 * Service worker of a PWA build (template).
 *
 * `scripts/build-app.mjs` replaces the three placeholders below with the app id,
 * a version derived from the build time and the list of files of this build.
 * Every build therefore gets its own cache, and old caches of the same app are
 * removed on activation. Caches of other apps on the same origin are left alone.
 */

const APP_ID = __APP_ID__;
const BUILD_VERSION = __BUILD_VERSION__;
const PRECACHE = __PRECACHE__;

const CACHE_PREFIX = `trainer-${APP_ID}-`;
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_VERSION}`;

// Paths are relative to the worker, so the app works below any base path.
const url = (path) => new URL(path, self.registration.scope).href;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => cache.addAll(PRECACHE.map(url)))
            .then(() => self.skipWaiting()),
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((names) =>
                Promise.all(
                    names
                        .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
                        .map((name) => caches.delete(name)),
                ),
            )
            .then(() => self.clients.claim()),
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) return;

    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, url('index.html')));
    } else if (requestUrl.pathname.includes('/assets/')) {
        // Hashed build output never changes under the same name.
        event.respondWith(cacheFirst(request));
    } else {
        // Config, exercise data, icons: unhashed, so prefer fresh content.
        event.respondWith(networkFirst(request, request));
    }
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
}

/** Network first; when offline use the cached copy of `fallbackKey`. */
async function networkFirst(request, fallbackKey) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const response = await fetch(request);
        if (response.ok) cache.put(fallbackKey, response.clone());
        return response;
    } catch (error) {
        const cached = (await cache.match(fallbackKey)) || (await cache.match(request));
        if (cached) return cached;
        throw error;
    }
}
