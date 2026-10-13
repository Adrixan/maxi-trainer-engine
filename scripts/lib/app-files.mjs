/**
 * Helpers for reading the JSON files of an app (or of the default config).
 * Files may be a bare array or wrapped in an object (`{ areas: [...] }`).
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export function readJson(filePath) {
    if (!existsSync(filePath)) return null;
    try {
        return JSON.parse(readFileSync(filePath, 'utf-8'));
    } catch (error) {
        throw new Error(`Failed to parse ${filePath}: ${error.message}`);
    }
}

/** Return the array stored under `key`, or the value itself when it already is an array. */
export function unwrap(value, key) {
    if (Array.isArray(value)) return value;
    if (value && Array.isArray(value[key])) return value[key];
    return null;
}

export function listAppIds(rootDir) {
    const appsDir = join(rootDir, 'src', 'apps');
    if (!existsSync(appsDir)) return [];
    return readdirSync(appsDir)
        .filter((name) => statSync(join(appsDir, name)).isDirectory())
        .sort();
}
