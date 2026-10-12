/**
 * Identity of the app (trainer) this bundle was built for.
 *
 * The id is injected at build time as `VITE_APP_ID`. It scopes every piece of
 * browser storage (localStorage keys, persisted Zustand stores, IndexedDB), so
 * that several trainers served from the same origin never share data.
 */

/** App used by `vite` dev server / tests when no VITE_APP_ID is provided. */
export const DEFAULT_APP_ID = 'ahs-deutsch';

/** The id of the current app. */
export function getAppId(): string {
    return import.meta.env?.VITE_APP_ID || DEFAULT_APP_ID;
}

/**
 * Name under which a persisted store keeps its data for the current app,
 * e.g. `maxi-trainer-profile:ahs-deutsch`.
 */
export function scopedStoreName(base: string): string {
    return `${base}:${getAppId()}`;
}

/**
 * Persisted stores used to share one unscoped key between all apps on an
 * origin. Copy that legacy value into this app's scoped key the first time the
 * app runs, so existing users keep their data. The legacy key is left in place
 * because other apps on the same origin still need to adopt it.
 *
 * Must run before the store is created.
 */
export function adoptLegacyStore(base: string): void {
    try {
        const scoped = scopedStoreName(base);
        if (localStorage.getItem(scoped) !== null) return;
        const legacy = localStorage.getItem(base);
        if (legacy !== null) localStorage.setItem(scoped, legacy);
    } catch {
        // localStorage unavailable (private mode, blocked): the store starts empty.
    }
}
