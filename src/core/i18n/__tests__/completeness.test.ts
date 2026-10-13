/**
 * Every translation key used in the source must exist in all locales.
 * Keys with an inline English fallback (t('key', 'Fallback')) used to hide
 * missing German strings, so German users saw English UI text.
 */

import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import de from '../de.json';
import en from '../en.json';

const has = (tree: unknown, key: string): boolean => {
    let node: unknown = tree;
    for (const part of key.split('.')) {
        if (node && typeof node === 'object' && part in node) node = (node as Record<string, unknown>)[part];
        else return false;
    }
    return typeof node === 'string';
};

const flatten = (tree: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(tree).flatMap(([key, value]) =>
        value && typeof value === 'object' ? flatten(value as Record<string, unknown>, `${prefix}${key}.`) : [`${prefix}${key}`],
    );

function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const full = join(dir, name);
        if (statSync(full).isDirectory()) return name === '__tests__' || name === 'apps' ? [] : sourceFiles(full);
        return /\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts') ? [full] : [];
    });
}

/** Keys passed as plain string literals to t(...). Dynamic keys (template strings) are skipped. */
const usedKeys = [...new Set(
    sourceFiles(join(process.cwd(), 'src')).flatMap((file) =>
        [...readFileSync(file, 'utf-8').matchAll(/\bt\(\s*'([A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)+)'/g)].map((m) => m[1] as string),
    ),
)].sort();

describe('translations', () => {
    it('finds the keys used by the source', () => {
        expect(usedKeys.length).toBeGreaterThan(100);
    });

    it.each([['de', de], ['en', en]] as const)('%s contains every key used in the source', (_locale, tree) => {
        const missing = usedKeys.filter((key) => !has(tree, key));
        expect(missing).toEqual([]);
    });

    it('de and en define the same keys', () => {
        const deKeys = flatten(de);
        const enKeys = flatten(en);
        expect(deKeys.filter((k) => !has(en, k))).toEqual([]);
        expect(enKeys.filter((k) => !has(de, k))).toEqual([]);
    });
});
