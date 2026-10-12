/**
 * Registers the service worker of PWA builds.
 *
 * USB builds (file://) and development do not use one. The worker is generated
 * per build by scripts/build-app.mjs and sits next to index.html.
 */

export function registerServiceWorker(): void {
    if (import.meta.env.VITE_PWA !== '1') return;
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;

    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(() => {
            // The app works without the worker; only offline start is unavailable.
        });
    });
}
