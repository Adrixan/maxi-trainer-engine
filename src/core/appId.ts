/**
 * Identity of the app (trainer) this bundle was built for.
 *
 * The id is injected at build time as `VITE_APP_ID`. It scopes every piece of
 * browser storage (localStorage keys, persisted Zustand stores, IndexedDB), so
 * that several trainers served from the same origin never share data.
 */

/** App used by the dev server and by tests when no VITE_APP_ID is provided (trainer.config.json). */
export const DEFAULT_APP_ID: string = __TRAINER__.defaultAppId;

/** Prefix of persisted store names (trainer.config.json), e.g. "mini-trainer". */
export const STORE_PREFIX: string = __TRAINER__.storePrefix;

/** The id of the current app. */
export function getAppId(): string {
    return import.meta.env?.VITE_APP_ID || DEFAULT_APP_ID;
}

/** Persisted Zustand stores. */
export type StoreKind = 'profile' | 'settings';

/**
 * Name under which a persisted store keeps its data for the current app,
 * e.g. `mini-trainer-profile:daz`.
 */
export function scopedStoreName(kind: StoreKind): string {
    return `${STORE_PREFIX}-${kind}:${getAppId()}`;
}

/** Unscoped names earlier versions used, newest first. */
function legacyStoreNames(kind: StoreKind): string[] {
    return [...new Set([`${STORE_PREFIX}-${kind}`, `mini-trainer-${kind}`])];
}

/**
 * Persisted stores used to share one unscoped key between all apps on an
 * origin. Copy that legacy value into this app's scoped key the first time the
 * app runs, so existing users keep their data. The legacy key is left in place
 * because other apps on the same origin still need to adopt it.
 *
 * Must run before the store is created.
 */
export function adoptLegacyStore(kind: StoreKind): void {
    try {
        const scoped = scopedStoreName(kind);
        if (localStorage.getItem(scoped) !== null) return;
        for (const name of legacyStoreNames(kind)) {
            const legacy = localStorage.getItem(name);
            if (legacy !== null) {
                localStorage.setItem(scoped, legacy);
                return;
            }
        }
    } catch {
        // localStorage unavailable (private mode, blocked): the store starts empty.
    }
}
