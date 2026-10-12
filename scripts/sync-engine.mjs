#!/usr/bin/env node

/**
 * Keep the engine identical across trainer repositories (mini / maxi).
 *
 *   node scripts/sync-engine.mjs --from ../mini-trainer-engine --check   report drift, exit 1 if any
 *   node scripts/sync-engine.mjs --from ../mini-trainer-engine           copy the engine files over
 *
 * What counts as engine is listed in scripts/engine-files.json. Variant
 * differences belong in trainer.config.json and src/apps, not in engine files.
 * After syncing, run `npm install` if package.json dependencies changed.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { log, parseArgs, rootDir } from './lib/cli.mjs';

const SKIP = new Set(['node_modules', 'dist', '.git', '__pycache__']);

function filesOf(base, relative) {
    const full = join(base, relative);
    if (!existsSync(full)) return [];
    if (!statSync(full).isDirectory()) return [relative];
    return readdirSync(full).filter((name) => !SKIP.has(name)).flatMap((name) => filesOf(base, join(relative, name)));
}

const read = (file) => (existsSync(file) ? readFileSync(file) : null);
const same = (a, b) => a !== null && b !== null && a.equals(b);

try {
    const args = parseArgs(process.argv.slice(2), { flags: ['check'], options: ['from'] });
    if (!args.from) throw new Error('--from <path of the other repository> is required');
    const source = resolve(args.from);
    if (!existsSync(source)) throw new Error(`Not found: ${source}`);

    const manifest = JSON.parse(readFileSync(join(rootDir, 'scripts', 'engine-files.json'), 'utf-8'));
    const paths = manifest.shared;

    // Files present on either side (a file deleted upstream must disappear here)
    const names = new Set(paths.flatMap((p) => [...filesOf(source, p), ...filesOf(rootDir, p)]));
    const drift = { changed: [], missingHere: [], onlyHere: [] };
    for (const name of [...names].sort()) {
        const theirs = read(join(source, name));
        const ours = read(join(rootDir, name));
        if (theirs === null) drift.onlyHere.push(name);
        else if (ours === null) drift.missingHere.push(name);
        else if (!same(ours, theirs)) drift.changed.push(name);
    }

    // package.json: only the shared sections
    const pkgOurs = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
    const pkgTheirs = JSON.parse(readFileSync(join(source, 'package.json'), 'utf-8'));
    const pkgDrift = manifest.packageJsonSections.filter(
        (key) => JSON.stringify(pkgOurs[key]) !== JSON.stringify(pkgTheirs[key]),
    );

    const total = drift.changed.length + drift.missingHere.length + drift.onlyHere.length + pkgDrift.length;
    if (args.check) {
        for (const [label, list] of Object.entries(drift)) list.forEach((f) => console.log(`${label.padEnd(12)} ${f}`));
        pkgDrift.forEach((key) => console.log(`package.json  section "${key}" differs`));
        if (total === 0) log.success('Engine files are identical');
        else log.error(`${total} difference(s) to ${source}`);
        process.exit(total === 0 ? 0 : 1);
    }

    for (const name of [...drift.changed, ...drift.missingHere]) {
        mkdirSync(dirname(join(rootDir, name)), { recursive: true });
        cpSync(join(source, name), join(rootDir, name));
    }
    for (const name of drift.onlyHere) rmSync(join(rootDir, name), { force: true });
    for (const key of pkgDrift) {
        if (pkgTheirs[key] === undefined) delete pkgOurs[key];
        else pkgOurs[key] = pkgTheirs[key];
    }
    if (pkgDrift.length > 0) {
        const raw = readFileSync(join(rootDir, 'package.json'), 'utf-8');
        const indent = raw.match(/\n( +)"/)?.[1].length ?? 2;
        writeFileSync(join(rootDir, 'package.json'), JSON.stringify(pkgOurs, null, indent) + '\n');
    }
    log.success(`Synced ${total} difference(s) from ${source}`);
    if (pkgDrift.length > 0) log.info('package.json changed: run `npm install`');
} catch (error) {
    log.error(error.message);
    process.exit(1);
}
