#!/usr/bin/env node

/**
 * Generate the files the dev server needs for one app, then optionally start it.
 *
 *   npm run dev                      default app (trainer.config.json)
 *   npm run dev -- --app mathematik
 *   node scripts/prepare-dev.mjs --app mathematik --no-serve   (only generate)
 *
 * Writes public/config/*, public/data/exercises.js and public/icon.svg.
 * These files are generated and not tracked by git.
 */

import { spawn } from 'child_process';
import { rmSync } from 'fs';
import { join } from 'path';
import { log, parseArgs, rootDir } from './lib/cli.mjs';
import {
    assertAppExists, copyIfExists, findAppIcon, readTrainerConfig, writeConfigFiles, writeExerciseData,
} from './lib/app-build.mjs';

export function prepareDev(app) {
    assertAppExists(rootDir, app);
    const publicDir = join(rootDir, 'public');
    rmSync(join(publicDir, 'config'), { recursive: true, force: true });
    rmSync(join(publicDir, 'data'), { recursive: true, force: true });
    writeConfigFiles(rootDir, app, join(publicDir, 'config'), { json: true });
    const count = writeExerciseData(rootDir, app, join(publicDir, 'data'), { json: true });
    const icon = findAppIcon(rootDir, app);
    if (icon) copyIfExists(icon, join(publicDir, 'icon.svg'));
    log.success(`Prepared '${app}' (${count} exercises)`);
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    try {
        const args = parseArgs(process.argv.slice(2), {
            flags: ['no-serve'],
            options: ['app', 'port'],
            aliases: { '-a': '--app' },
        });
        const app = args.app ?? readTrainerConfig(rootDir).defaultAppId;
        prepareDev(app);
        if (!args['no-serve']) {
            const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
            const extra = args.port ? ['--port', args.port] : [];
            const child = spawn(npx, ['vite', ...extra], {
                cwd: rootDir,
                stdio: 'inherit',
                env: { ...process.env, VITE_APP_ID: app },
            });
            child.on('exit', (code) => process.exit(code ?? 0));
        }
    } catch (error) {
        log.error(error.message);
        process.exit(1);
    }
}
