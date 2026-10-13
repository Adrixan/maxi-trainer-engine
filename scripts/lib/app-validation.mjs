/**
 * Validation of one app directory (`src/apps/<id>`), or of the default
 * config + data pair. Returns plain `{ errors, warnings }` arrays so it can be
 * used from the CLI as well as from tests.
 */

import { join } from 'path';
import { EXERCISE_TYPES, validateExercise } from './exercise-schema.mjs';
import { readJson, unwrap } from './app-files.mjs';

/** Minimum number of exercises per theme and level before a warning is raised. */
export const MIN_EXERCISES_PER_BUCKET = 3;

/** Every item needs a non-empty string id, unique within the file. */
function checkIds(file, list, getId, error) {
    if (!list) return;
    if (list.length === 0) error(file, 'must not be empty');
    const seen = new Set();
    list.forEach((item, index) => {
        const id = getId(item);
        if (typeof id !== 'string' || id.trim() === '') error(`${file}[${index}]`, "missing required field 'id'");
        else if (seen.has(id)) error(`${file}[${index}]`, `duplicate id '${id}'`);
        else seen.add(id);
    });
}

const idsOf = (list) => new Set((list ?? []).map((item) => item?.id).filter(Boolean));

/**
 * @param {object} input
 * @param {string} input.label        Name used in messages (app id).
 * @param {unknown} input.areas       Parsed areas.json
 * @param {unknown} input.themes      Parsed themes.json
 * @param {unknown} input.subject     Parsed subject.json (may be null)
 * @param {unknown} [input.badges]    Parsed badges.json (checked when given)
 * @param {unknown} input.exercises   Parsed exercises.json
 */
export function validateContent({ label, areas, themes, subject, badges, exercises }) {
    const errors = [];
    const warnings = [];
    const error = (path, message) => errors.push({ file: label, path, message });
    const warn = (path, message) => warnings.push({ file: label, path, message });

    const areaList = unwrap(areas, 'areas');
    const themeList = unwrap(themes, 'themes');
    const exerciseList = unwrap(exercises, 'exercises');

    if (!areaList) error('areas.json', 'missing or not an array');
    if (!themeList) error('themes.json', 'missing or not an array');

    checkIds('areas.json', areaList, (item) => item?.id, error);
    checkIds('themes.json', themeList, (item) => item?.id, error);
    if (badges !== undefined) {
        const badgeList = unwrap(badges, 'badges');
        if (!badgeList) error('badges.json', 'missing or not an array');
        // Nested ({ badge: { id } }) and flat ({ id }) badge formats are both in use
        else checkIds('badges.json', badgeList, (item) => item?.badge?.id ?? item?.id, error);
    }
    if (subject !== undefined && subject !== null) {
        if (typeof subject !== 'object' || Array.isArray(subject)) error('subject.json', 'must be an object');
        else {
            for (const field of ['id', 'name']) {
                if (typeof subject[field] !== 'string' || subject[field].trim() === '') {
                    error('subject.json', `missing required field '${field}'`);
                }
            }
            if (subject.enabledExerciseTypes !== undefined && !Array.isArray(subject.enabledExerciseTypes)) {
                error('subject.json', 'enabledExerciseTypes must be an array');
            }
        }
    }
    if (!exerciseList) {
        error('exercises.json', 'missing or not an array');
        return { errors, warnings };
    }

    const areaIds = idsOf(areaList);
    const themeIds = idsOf(themeList);
    const seen = new Set();
    const buckets = new Map();
    const usedTypes = new Set();
    const questions = new Map();

    exerciseList.forEach((exercise, index) => {
        const where = `exercises[${index}]${exercise?.id ? ` (${exercise.id})` : ''}`;

        for (const problem of validateExercise(exercise)) error(where, problem);
        if (!exercise || typeof exercise !== 'object') return;

        if (exercise.id) {
            if (seen.has(exercise.id)) error(where, `duplicate id '${exercise.id}'`);
            seen.add(exercise.id);
        }
        if (areaIds.size > 0 && exercise.areaId && !areaIds.has(exercise.areaId)) {
            error(where, `unknown areaId '${exercise.areaId}'`);
        }
        if (themeIds.size > 0 && exercise.themeId && !themeIds.has(exercise.themeId)) {
            error(where, `unknown themeId '${exercise.themeId}'`);
        }

        usedTypes.add(exercise.type);
        const bucket = `${exercise.themeId} / level ${exercise.level}`;
        buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1);

        const c = exercise.content ?? {};
        const prompt = c.question ?? c.sentence ?? c.prompt ?? c.verb ?? c.picture;
        if (typeof prompt === 'string') {
            const key = `${exercise.type}|${prompt.trim().toLowerCase()}`;
            (questions.get(key) ?? questions.set(key, []).get(key)).push(exercise.id);
        }
    });

    // A theme's areaId is optional, but must point to an existing area when given
    for (const theme of themeList ?? []) {
        if (theme?.areaId !== undefined && areaIds.size > 0 && !areaIds.has(theme.areaId)) {
            error(`themes (${theme.id})`, `unknown areaId '${theme.areaId}'`);
        }
    }

    for (const [, ids] of questions) {
        if (ids.length > 1) warn('exercises', `identical prompt in ${ids.join(', ')}`);
    }

    for (const theme of themeList ?? []) {
        if (!exerciseList.some((e) => e.themeId === theme.id)) {
            warn(`themes (${theme.id})`, 'theme has no exercises');
        }
    }
    const sparse = [...buckets].filter(([, n]) => n < MIN_EXERCISES_PER_BUCKET);
    if (sparse.length > 0) {
        warn('exercises', `${sparse.length} theme/level bucket(s) have fewer than ${MIN_EXERCISES_PER_BUCKET} exercises`);
    }

    if (subject && Array.isArray(subject.enabledExerciseTypes)) {
        const enabled = new Set(subject.enabledExerciseTypes);
        for (const type of subject.enabledExerciseTypes) {
            if (!EXERCISE_TYPES.includes(type)) error('subject.json', `invalid exercise type '${type}'`);
        }
        const missing = [...usedTypes].filter((t) => !enabled.has(t));
        if (missing.length > 0) {
            error('subject.json', `enabledExerciseTypes lacks types used by exercises: ${missing.join(', ')}`);
        }
    }

    return { errors, warnings };
}

/** Load the files of an app directory and validate them. */
export function validateAppDir(rootDir, appId, defaultConfigDir) {
    const dir = join(rootDir, 'src', 'apps', appId);
    const read = (name) => readJson(join(dir, name)) ?? readJson(join(defaultConfigDir, name));
    return validateContent({
        label: appId,
        areas: read('areas.json'),
        themes: read('themes.json'),
        subject: read('subject.json'),
        badges: read('badges.json'),
        exercises: readJson(join(dir, 'exercises.json')),
    });
}

/**
 * Exercise counts per theme and level, to see where an app needs more content.
 * @returns {{ themeId: string, level: number, count: number }[]} sorted by theme and level
 */
export function contentCoverage(rootDir, appId) {
    const exercises = unwrap(readJson(join(rootDir, 'src', 'apps', appId, 'exercises.json')), 'exercises') ?? [];
    const counts = new Map();
    for (const e of exercises) {
        const key = `${e.themeId}\u0000${e.level}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts]
        .map(([key, count]) => {
            const [themeId, level] = key.split('\u0000');
            return { themeId, level: Number(level), count };
        })
        .sort((a, b) => a.themeId.localeCompare(b.themeId) || a.level - b.level);
}
