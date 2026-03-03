/**
 * Service Worker for Mini Trainer Engine
 * Provides offline support and caching for PWA functionality.
 * 
 * Version: 1.0.0
 */

const CACHE_NAME = 'mini-trainer-v1';
const STATIC_CACHE_NAME = 'mini-trainer-static-v1';
const DATA_CACHE_NAME = 'mini-trainer-data-v1';

// Static assets to cache immediately on install
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-192.svg',
    '/icon-512.svg',
    '/manifest.json',
    '/sw.js',
];

// Data files to pre-cache for offline use
const DATA_ASSETS = [
    '/data/exercises.js',
];

// Directories to cache for offline use
const DATA_DIRECTORIES = [
    '/config/',
];

// File extensions to consider as static assets
const STATIC_EXTENSIONS = [
    '.js',
    '.css',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.ico',
    '.webp',
];

/**
 * Check if a URL is a static asset
 */
function isStaticAsset(url) {
    const path = new URL(url).pathname;
    return STATIC_EXTENSIONS.some(ext => path.endsWith(ext));
}

/**
 * Check if a URL is a data asset
 */
function isDataAsset(url) {
    const path = new URL(url).pathname;
    return DATA_ASSETS.some(asset => path === asset || path.startsWith(asset)) ||
        DATA_DIRECTORIES.some(dir => path.startsWith(dir));
}

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                // Also pre-cache data assets for offline use
                console.log('[SW] Pre-caching data assets');
                return caches.open(DATA_CACHE_NAME)
                    .then((dataCache) => dataCache.addAll(DATA_ASSETS));
            })
            .then(() => {
                console.log('[SW] All assets cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache assets:', error);
            })
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => {
                            // Delete old versions of our caches
                            return name.startsWith('mini-trainer-') &&
                                name !== STATIC_CACHE_NAME &&
                                name !== DATA_CACHE_NAME;
                        })
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                return self.clients.claim();
            })
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Handle data assets with network-first strategy
    if (isDataAsset(request.url)) {
        event.respondWith(networkFirst(request, DATA_CACHE_NAME));
        return;
    }

    // Handle static assets with cache-first strategy
    if (isStaticAsset(request.url)) {
        event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
        return;
    }

    // Handle navigation requests with network-first
    if (request.mode === 'navigate') {
        event.respondWith(networkFirst(request, STATIC_CACHE_NAME));
        return;
    }

    // Default: stale-while-revalidate
    event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

/**
 * Cache-first strategy
 * Try cache first, fall back to network
 */
async function cacheFirst(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
        return cached;
    }

    try {
        const response = await fetch(request);

        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.error('[SW] Network request failed:', error);

        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        throw error;
    }
}

/**
 * Network-first strategy
 * Try network first, fall back to cache
 */
async function networkFirst(request, cacheName) {
    const cache = await caches.open(cacheName);

    try {
        const response = await fetch(request);

        if (response.ok) {
            cache.put(request, response.clone());
        }

        return response;
    } catch (error) {
        console.log('[SW] Network failed, trying cache:', request.url);

        const cached = await cache.match(request);

        if (cached) {
            return cached;
        }

        // Return offline fallback for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/index.html');
        }

        throw error;
    }
}

/**
 * Stale-while-revalidate strategy
 * Return cache immediately, update in background
 */
async function staleWhileRevalidate(request, cacheName) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    // Start network request in background
    const networkPromise = fetch(request)
        .then((response) => {
            if (response.ok) {
                cache.put(request, response.clone());
            }
            return response;
        })
        .catch((error) => {
            console.log('[SW] Background update failed:', request.url);
        });

    // Return cached version immediately, or wait for network
    return cached || networkPromise;
}

/**
 * Handle messages from the main thread
 */
self.addEventListener('message', (event) => {
    const { type, payload } = event.data || {};

    switch (type) {
        case 'SKIP_WAITING':
            self.skipWaiting();
            break;

        case 'CLEAR_CACHE':
            clearAllCaches()
                .then(() => {
                    event.ports[0]?.postMessage({ success: true });
                })
                .catch((error) => {
                    event.ports[0]?.postMessage({ success: false, error: error.message });
                });
            break;

        case 'CACHE_URLS':
            if (Array.isArray(payload?.urls)) {
                cacheUrls(payload.urls)
                    .then(() => {
                        event.ports[0]?.postMessage({ success: true });
                    })
                    .catch((error) => {
                        event.ports[0]?.postMessage({ success: false, error: error.message });
                    });
            }
            break;

        default:
            console.log('[SW] Unknown message type:', type);
    }
});

/**
 * Clear all caches
 */
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('[SW] All caches cleared');
}

/**
 * Cache specific URLs
 */
async function cacheUrls(urls) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.addAll(urls);
    console.log('[SW] URLs cached:', urls);
}

// Log service worker lifecycle
console.log('[SW] Service worker loaded');
