/**
 * Building blocks shared by the dev and build scripts: reading an app's
 * configuration, generating the data files the browser loads, and producing
 * the PWA manifest and service worker.
 *
 * The browser loads config and exercises either as classic scripts that set
 * `window.__TRAINER_*__` globals (USB / file:// builds, where fetch() is not
 * available) or as JSON through fetch (PWA builds).
 */

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, join, relative } from 'path';
import { readJson, unwrap } from './app-files.mjs';
import { validateExercise } from './exercise-schema.mjs';

/** Config files an app provides. `app.json` is optional, the others fall back to src/config. */
export const CONFIG_FILES = [
    { json: 'app.json', js: 'app.js', global: '__TRAINER_APP__', optional: true },
    { json: 'subject.json', js: 'subject.js', global: '__TRAINER_SUBJECT__' },
    { json: 'areas.json', js: 'areas.js', global: '__TRAINER_AREAS__' },
    { json: 'themes.json', js: 'themes.js', global: '__TRAINER_THEMES__' },
    { json: 'badges.json', js: 'badges.js', global: '__TRAINER_BADGES__' },
];

export function readTrainerConfig(rootDir) {
    return readJson(join(rootDir, 'trainer.config.json'));
}

export function appDir(rootDir, appId) {
    return join(rootDir, 'src', 'apps', appId);
}

/** Path of an app config file: the app's own, else the engine default in src/config. */
export function resolveAppFile(rootDir, appId, name) {
    const own = join(appDir(rootDir, appId), name);
    if (existsSync(own)) return own;
    const fallback = join(rootDir, 'src', 'config', name);
    return existsSync(fallback) ? fallback : null;
}

export function assertAppExists(rootDir, appId) {
    if (!appId || !existsSync(appDir(rootDir, appId))) {
        throw new Error(`Unknown app '${appId}' (no folder src/apps/${appId})`);
    }
}

/** app.json of an app (defaults when the app has none). */
export function readAppConfig(rootDir, appId) {
    const config = readJson(join(appDir(rootDir, appId), 'app.json')) ?? {};
    return {
        id: appId,
        name: config.name ?? appId,
        version: config.version ?? '0.0.0',
        description: config.description ?? '',
        display: { primaryColor: '#3b82f6', ...config.display },
        ...config,
    };
}

/** Readable name of what an app trains, for page titles. */
export function readSubjectName(rootDir, appId, appConfig = readAppConfig(rootDir, appId)) {
    const file = resolveAppFile(rootDir, appId, 'subject.json');
    const subject = file ? readJson(file) : null;
    if (subject?.name && subject.name !== 'Generic Trainer') return subject.name;
    return appConfig.name;
}

/**
 * Load and validate the exercises of an app.
 * @returns {{ exercises: unknown[], errors: string[] }}
 */
export function loadExercises(rootDir, appId) {
    const file = join(appDir(rootDir, appId), 'exercises.json');
    const exercises = unwrap(readJson(file), 'exercises') ?? [];
    const errors = [];
    const seen = new Set();
    exercises.forEach((exercise, index) => {
        const where = `exercises[${index}]${exercise?.id ? ` (${exercise.id})` : ''}`;
        for (const problem of validateExercise(exercise)) errors.push(`${where}: ${problem}`);
        if (exercise?.id) {
            if (seen.has(exercise.id)) errors.push(`${where}: duplicate id`);
            seen.add(exercise.id);
        }
    });
    return { exercises, errors };
}

const scriptFile = (global, data) => `window.${global} = ${JSON.stringify(data)};\n`;

/**
 * Write the config files of an app into `outDir`.
 * Always writes the classic-script variant; `json` adds plain JSON copies for fetch().
 */
export function writeConfigFiles(rootDir, appId, outDir, { json }) {
    mkdirSync(outDir, { recursive: true });
    const written = [];
    for (const file of CONFIG_FILES) {
        const source = resolveAppFile(rootDir, appId, file.json);
        if (!source) {
            if (!file.optional) throw new Error(`Missing ${file.json} for app '${appId}'`);
            continue;
        }
        const data = readJson(source);
        writeFileSync(join(outDir, file.js), `// ${file.json} (generated)\n${scriptFile(file.global, data)}`);
        written.push(file.js);
        if (json) {
            writeFileSync(join(outDir, file.json), JSON.stringify(data));
            written.push(file.json);
        }
    }
    return written;
}

/** Write the validated exercises of an app into `outDir`; throws when any exercise is invalid. */
export function writeExerciseData(rootDir, appId, outDir, { json }) {
    const { exercises, errors } = loadExercises(rootDir, appId);
    if (errors.length > 0) {
        const shown = errors.slice(0, 10).map((e) => `  - ${e}`).join('\n');
        const more = errors.length > 10 ? `\n  ... and ${errors.length - 10} more` : '';
        throw new Error(`${errors.length} invalid exercise(s) in '${appId}':\n${shown}${more}`);
    }
    const data = {
        exercises,
        metadata: { appId, count: exercises.length, generatedAt: new Date().toISOString() },
    };
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, 'exercises.js'), `// exercises.json (generated)\n${scriptFile('__TRAINER_EXERCISES__', data)}`);
    if (json) writeFileSync(join(outDir, 'exercises.json'), JSON.stringify(data));
    return exercises.length;
}

/** Icon of an app: public/<id>-icon.svg, else the engine icon. */
export function findAppIcon(rootDir, appId) {
    for (const name of [`${appId}-icon.svg`, 'icon-512.svg', 'icon-192.svg']) {
        const file = join(rootDir, 'public', name);
        if (existsSync(file)) return file;
    }
    return null;
}

export function buildManifest(appConfig, { language, hasIcon }) {
    const color = appConfig.display.primaryColor;
    return {
        name: appConfig.fullName || appConfig.name,
        short_name: appConfig.shortName ?? (appConfig.name.length <= 12 ? appConfig.name : appConfig.name.split(/\s+/)[0]),
        description: appConfig.description || undefined,
        lang: language,
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: color,
        icons: hasIcon
            ? [
                { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
                { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
            ]
            : [],
    };
}

/** All files below `dir` as POSIX paths relative to it, sorted. */
export function listFiles(dir) {
    const files = [];
    const walk = (current) => {
        for (const entry of readdirSync(current)) {
            const full = join(current, entry);
            if (statSync(full).isDirectory()) walk(full);
            else files.push(relative(dir, full).split('\\').join('/'));
        }
    };
    walk(dir);
    return files.sort();
}

/**
 * Fill the service worker template.
 * @param template  Source of scripts/templates/sw.js
 * @param options.files  Files of the build (relative to the worker), pre-cached on install
 */
export function renderServiceWorker(template, { appId, version, files }) {
    const precache = files.filter((f) => f !== 'sw.js' && !f.endsWith('.map'));
    return template
        .replace('__APP_ID__', JSON.stringify(appId))
        .replace('__BUILD_VERSION__', JSON.stringify(version))
        .replace('__PRECACHE__', JSON.stringify(precache, null, 4));
}

export function copyIfExists(from, to) {
    if (!existsSync(from)) return false;
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to, { recursive: true });
    return true;
}
