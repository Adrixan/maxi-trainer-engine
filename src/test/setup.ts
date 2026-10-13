import '@testing-library/jest-dom';

// Node 25+ ships its own `localStorage` global, which is undefined unless Node is started with
// --localstorage-file. It shadows the jsdom implementation, so persisted stores would crash.
// Provide an in-memory Storage in that case; on Node 20/22 jsdom's own storage stays in place.
if (typeof window !== 'undefined' && typeof window.localStorage === 'undefined') {
    const data = new Map<string, string>();
    const memoryStorage: Storage = {
        get length() {
            return data.size;
        },
        key: (index) => Array.from(data.keys())[index] ?? null,
        getItem: (key) => data.get(key) ?? null,
        setItem: (key, value) => void data.set(key, String(value)),
        removeItem: (key) => void data.delete(key),
        clear: () => data.clear(),
    };
    Object.defineProperty(window, 'localStorage', {
        configurable: true,
        writable: true,
        value: memoryStorage,
    });
}

// jsdom has no matchMedia; hooks that follow system preferences (reduced motion, contrast) need it.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string): MediaQueryList => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => undefined,
            removeListener: () => undefined,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            dispatchEvent: () => false,
        }),
    });
}
