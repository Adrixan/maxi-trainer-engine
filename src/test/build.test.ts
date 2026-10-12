// @vitest-environment node
/**
 * Tests for the build helpers (manifest, service worker, data files) and for
 * the generated service worker's behaviour.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import vm from 'node:vm';
import {
    buildManifest, listFiles, readAppConfig, readSubjectName, renderServiceWorker,
    writeConfigFiles, writeExerciseData,
} from '../../scripts/lib/app-build.mjs';
import { listAppIds } from '../../scripts/lib/app-files.mjs';

const rootDir = process.cwd();
const template = readFileSync(join(rootDir, 'scripts', 'templates', 'sw.js'), 'utf-8');
const anApp = listAppIds(rootDir)[0] as string;

let tmp: string;
beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'trainer-test-'));
});
afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
});

describe('manifest', () => {
    const app = { id: 'x', name: 'Mathematik Grundstufe', version: '1', description: 'Rechnen', display: { primaryColor: '#10b981' } };

    it('uses relative urls so the app works below any base path', () => {
        const manifest = buildManifest(app, { language: 'de', hasIcon: true });
        expect(manifest.start_url).toBe('./');
        expect(manifest.scope).toBe('./');
        expect(manifest.theme_color).toBe('#10b981');
        expect(manifest.lang).toBe('de');
    });

    it('only references an icon that exists', () => {
        expect(buildManifest(app, { language: 'de', hasIcon: false }).icons).toEqual([]);
        const icons = buildManifest(app, { language: 'de', hasIcon: true }).icons as { src: string }[];
        expect(icons.every((icon) => icon.src === 'icon.svg')).toBe(true);
    });

    it('shortens long names to the first word', () => {
        expect(buildManifest(app, { language: 'de', hasIcon: false }).short_name).toBe('Mathematik');
    });
});

describe('app metadata', () => {
    it('reads name and subject of a real app', () => {
        const app = readAppConfig(rootDir, anApp);
        expect(app.id).toBe(anApp);
        expect(readSubjectName(rootDir, anApp, app)).not.toBe('');
    });
});

describe('generated data files', () => {
    it('writes config as classic scripts, plus JSON for PWA builds', () => {
        const written = writeConfigFiles(rootDir, anApp, tmp, { json: true });
        expect(written).toEqual(expect.arrayContaining(['subject.js', 'subject.json', 'areas.js', 'themes.js', 'badges.js']));
        const script = readFileSync(join(tmp, 'subject.js'), 'utf-8');
        expect(script).toContain('window.__TRAINER_SUBJECT__ = ');
        expect(JSON.parse(readFileSync(join(tmp, 'subject.json'), 'utf-8'))).toBeTypeOf('object');
    });

    it('omits JSON copies for USB builds', () => {
        expect(writeConfigFiles(rootDir, anApp, tmp, { json: false }).some((f) => f.endsWith('.json'))).toBe(false);
    });

    it('writes the exercises of an app', () => {
        const count = writeExerciseData(rootDir, anApp, tmp, { json: false });
        expect(count).toBeGreaterThan(0);
        expect(readFileSync(join(tmp, 'exercises.js'), 'utf-8')).toContain('window.__TRAINER_EXERCISES__ = ');
    });

    it('refuses to write exercises that fail validation', () => {
        const root = join(tmp, 'project');
        mkdirSync(join(root, 'src', 'apps', 'broken'), { recursive: true });
        writeFileSync(
            join(root, 'src', 'apps', 'broken', 'exercises.json'),
            JSON.stringify({ exercises: [{ id: 'a', type: 'fill-blank', content: { type: 'fill-blank', question: '?' } }] }),
        );
        expect(() => writeExerciseData(root, 'broken', join(tmp, 'out'), { json: false })).toThrow(/invalid exercise/);
    });
});

describe('listFiles', () => {
    it('lists nested files with forward slashes', () => {
        mkdirSync(join(tmp, 'a', 'b'), { recursive: true });
        writeFileSync(join(tmp, 'a', 'b', 'c.js'), '');
        writeFileSync(join(tmp, 'index.html'), '');
        expect(listFiles(tmp)).toEqual(['a/b/c.js', 'index.html']);
    });
});

// ---------------------------------------------------------------------------
// Service worker behaviour, run in a vm with a fake CacheStorage
// ---------------------------------------------------------------------------

type Listener = (event: unknown) => void;

function startWorker(options: { files?: string[]; online?: () => boolean; appId?: string } = {}) {
    const files = options.files ?? ['index.html', 'assets/app-abc.js', 'config/subject.js', 'sw.js', 'assets/app-abc.js.map'];
    const source = renderServiceWorker(template, { appId: options.appId ?? 'demo', version: 'v1', files });

    const stores = new Map<string, Map<string, Response>>();
    const keyOf = (request: Request | string) => (typeof request === 'string' ? request : request.url);
    const cacheStorage = {
        open: async (name: string) => {
            if (!stores.has(name)) stores.set(name, new Map());
            const store = stores.get(name) as Map<string, Response>;
            return {
                match: async (request: Request | string) => store.get(keyOf(request))?.clone(),
                put: async (request: Request | string, response: Response) => void store.set(keyOf(request), response),
                addAll: async (urls: string[]) => {
                    const responses = await Promise.all(urls.map(async (u) => ({ u, r: await fetchImpl(new Request(u)) })));
                    if (responses.some(({ r }) => !r.ok)) throw new TypeError('addAll failed');
                    responses.forEach(({ u, r }) => store.set(u, r));
                },
            };
        },
        keys: async () => [...stores.keys()],
        delete: async (name: string) => stores.delete(name),
    };

    const fetched: string[] = [];
    const fetchImpl = async (request: Request) => {
        fetched.push(request.url);
        if (options.online && !options.online()) throw new TypeError('offline');
        return new Response(`body of ${request.url}`, { status: 200 });
    };

    const listeners: Record<string, Listener> = {};
    const self = {
        registration: { scope: 'https://school.example/app/' },
        location: new URL('https://school.example/app/sw.js'),
        addEventListener: (type: string, listener: Listener) => void (listeners[type] = listener),
        skipWaiting: async () => undefined,
        clients: { claim: async () => undefined },
    };
    vm.runInNewContext(source, { self, caches: cacheStorage, fetch: fetchImpl, URL, Request, Response, Promise });

    const dispatch = async (type: string, extra: Record<string, unknown> = {}) => {
        let pending: Promise<unknown> | undefined;
        listeners[type]?.({ ...extra, waitUntil: (p: Promise<unknown>) => (pending = p), respondWith: (p: Promise<unknown>) => (pending = p) });
        return pending;
    };
    return { dispatch, stores, fetched };
}

describe('generated service worker', () => {
    it('pre-caches every build file relative to its scope, except itself and source maps', async () => {
        const worker = startWorker();
        await worker.dispatch('install');
        const cached = [...(worker.stores.get('trainer-demo-v1')?.keys() ?? [])].sort();
        expect(cached).toEqual([
            'https://school.example/app/assets/app-abc.js',
            'https://school.example/app/config/subject.js',
            'https://school.example/app/index.html',
        ]);
    });

    it('fails installation when a file cannot be fetched (no silent half-cached state)', async () => {
        const worker = startWorker({ online: () => false });
        await expect(worker.dispatch('install')).rejects.toThrow();
    });

    it('removes old caches of the same app on activation and keeps other apps', async () => {
        const worker = startWorker();
        for (const name of ['trainer-demo-old', 'trainer-other-v1', 'unrelated']) await worker.stores.set(name, new Map());
        await worker.dispatch('install');
        await worker.dispatch('activate');
        expect([...worker.stores.keys()].sort()).toEqual(['trainer-demo-v1', 'trainer-other-v1', 'unrelated']);
    });

    it('serves the app shell for navigations while offline', async () => {
        let online = true;
        const worker = startWorker({ online: () => online });
        await worker.dispatch('install');
        online = false;
        // Request cannot be constructed with mode "navigate" outside a browser.
        const request = { method: 'GET', url: 'https://school.example/app/', mode: 'navigate' };
        const response = (await worker.dispatch('fetch', { request })) as Response;
        expect(await response.text()).toContain('index.html');
    });

    it('serves hashed assets from the cache without touching the network', async () => {
        const worker = startWorker();
        await worker.dispatch('install');
        const before = worker.fetched.length;
        const response = (await worker.dispatch('fetch', { request: new Request('https://school.example/app/assets/app-abc.js') })) as Response;
        expect(await response.text()).toContain('assets/app-abc.js');
        expect(worker.fetched.length).toBe(before);
    });

    it('prefers fresh config and data, falling back to the cache offline', async () => {
        let online = true;
        const worker = startWorker({ online: () => online });
        await worker.dispatch('install');
        online = false;
        const response = (await worker.dispatch('fetch', { request: new Request('https://school.example/app/config/subject.js') })) as Response;
        expect(await response.text()).toContain('config/subject.js');
    });

    it('ignores cross-origin and non-GET requests', async () => {
        const worker = startWorker();
        await worker.dispatch('install');
        expect(await worker.dispatch('fetch', { request: new Request('https://other.example/x.js') })).toBeUndefined();
        expect(await worker.dispatch('fetch', { request: new Request('https://school.example/app/api', { method: 'POST' }) })).toBeUndefined();
    });
});
