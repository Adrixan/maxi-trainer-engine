/**
 * Every app must load through the real config loader, the way the browser does
 * it: the generated scripts (config/*.js, data/exercises.js) set window globals.
 * Apps store their files in different shapes (bare arrays or wrapped in an
 * object, nested or flat badges), and the loader has to normalise all of them.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadConfigSafe, loadExercises, resetConfigCache } from '@core/config/loader';
import { CONFIG_FILES, resolveAppFile, appDir } from '../../scripts/lib/app-build.mjs';
import { listAppIds, readJson } from '../../scripts/lib/app-files.mjs';

const rootDir = process.cwd();
const globals = Object.fromEntries(CONFIG_FILES.map((file) => [file.global, file.json]));

function installGlobals(appId: string) {
    const target = window as unknown as Record<string, unknown>;
    for (const file of CONFIG_FILES) {
        const source = resolveAppFile(rootDir, appId, file.json);
        if (source) target[file.global] = readJson(source);
    }
    target.__TRAINER_EXERCISES__ = readJson(`${appDir(rootDir, appId)}/exercises.json`);
}

beforeEach(() => resetConfigCache());

afterEach(() => {
    vi.unstubAllEnvs();
    const target = window as unknown as Record<string, unknown>;
    Object.keys(globals).forEach((key) => delete target[key]);
    delete target.__TRAINER_EXERCISES__;
});

describe.each(listAppIds(rootDir))('app %s', (appId) => {
    it('loads with the real loader and offers content', async () => {
        vi.stubEnv('VITE_APP_ID', appId);
        installGlobals(appId);

        const { config, errors } = await loadConfigSafe();
        const exercises = loadExercises();

        expect(errors).toEqual([]);
        expect(config).not.toBeNull();
        expect(config?.observationAreas.length).toBeGreaterThan(0);
        expect(config?.themes.length).toBeGreaterThan(0);
        expect(config?.badges.length).toBeGreaterThan(0);
        expect(exercises.length).toBeGreaterThan(0);

        // Theme ids are unique and no exercise points at an unknown theme
        const themeIds = new Set(config?.themes.map((theme) => theme.id));
        expect(themeIds.size).toBe(config?.themes.length);
        const used = new Set(exercises.map((exercise) => exercise.themeId));
        expect([...used].filter((id) => !themeIds.has(id))).toEqual([]);

        // At least one theme has content (themes without exercises are hidden from learners)
        expect([...themeIds].filter((id) => used.has(id)).length).toBeGreaterThan(0);
        for (const theme of config?.themes ?? []) {
            expect(typeof theme.minLevel).toBe('number');
        }
    });
});
