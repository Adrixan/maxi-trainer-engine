#!/usr/bin/env node

/**
 * Build every app (or one) as USB and/or PWA distribution.
 *
 *   npm run build:all              all apps, USB builds
 *   npm run build:all:pwa          all apps, PWA builds
 *   npm run build:all -- --both    USB and PWA
 *   npm run build:all -- --app mathematik --both
 *
 * The type check runs once for all builds. The script exits with an error if
 * any build failed, after attempting all of them.
 */

import { execFileSync } from 'child_process';
import { log, paint, parseArgs, rootDir } from './lib/cli.mjs';
import { listAppIds } from './lib/app-files.mjs';
import { buildApp } from './build-app.mjs';

try {
    const args = parseArgs(process.argv.slice(2), {
        flags: ['pwa', 'both'],
        options: ['app'],
        aliases: { '-a': '--app' },
    });

    const apps = args.app ? [args.app] : listAppIds(rootDir);
    if (apps.length === 0) throw new Error('No apps found in src/apps');
    const variants = args.both ? [false, true] : [Boolean(args.pwa)];

    log.header(`Building ${apps.length} app(s): ${apps.join(', ')}`);
    log.info('Type check (once for all builds)...');
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsc', '--noEmit'], { cwd: rootDir, stdio: 'inherit' });

    const failed = [];
    const started = Date.now();
    for (const app of apps) {
        for (const pwa of variants) {
            try {
                buildApp({ app, pwa, skipTypecheck: true });
            } catch (error) {
                failed.push(`${app}${pwa ? ' (pwa)' : ''}: ${error.message}`);
                log.error(`Failed: ${app}${pwa ? ' (pwa)' : ''}`);
            }
        }
    }

    const total = apps.length * variants.length;
    log.header('Summary');
    console.log(`  ${total - failed.length}/${total} builds succeeded in ${((Date.now() - started) / 1000).toFixed(0)}s`);
    if (failed.length > 0) {
        failed.forEach((f) => console.log(`  ${paint.red('✗')} ${f}`));
        process.exit(1);
    }
} catch (error) {
    log.error(error.message);
    process.exit(1);
}
