#!/usr/bin/env node

/**
 * Build one app into dist/<id> (USB, works from file://) or dist/<id>-pwa.
 *
 *   npm run build                       default app (trainer.config.json)
 *   npm run build -- --app mathematik
 *   npm run build -- --app mathematik --pwa
 *
 * Options:
 *   --app, -a <id>      App under src/apps (default: defaultAppId of trainer.config.json)
 *   --pwa               Add manifest, service worker and JSON data for fetch()
 *   --skip-typecheck    Skip `tsc --noEmit` (build-all runs it once)
 *   --help, -h
 *
 * The build fails on type errors, invalid content and any other error.
 */

import { execFileSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { log, parseArgs, paint, rootDir } from './lib/cli.mjs';
import { validateAppDir } from './lib/app-validation.mjs';
import {
    assertAppExists, buildManifest, copyIfExists, findAppIcon, listFiles, readAppConfig,
    readSubjectName, readTrainerConfig, renderServiceWorker, writeConfigFiles, writeExerciseData,
} from './lib/app-build.mjs';

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function printHelp() {
    console.log(readFileSync(new URL(import.meta.url), 'utf-8').split('*/')[0].replace(/^#!.*\n\/\*\*\n/, '').replace(/^ \* ?/gm, ''));
}

/** Build one app. Throws on any problem. */
export function buildApp({ app, pwa = false, skipTypecheck = false }) {
    const trainer = readTrainerConfig(rootDir);
    assertAppExists(rootDir, app);

    const appConfig = readAppConfig(rootDir, app);
    const outName = pwa ? `${app}-pwa` : app;
    const outDir = join(rootDir, 'dist', outName);
    log.header(`Building ${appConfig.name} (${outName})`);

    // 1. Content must be valid before anything is built
    const { errors } = validateAppDir(rootDir, app, join(rootDir, 'src', 'config'));
    if (errors.length > 0) {
        const shown = errors.slice(0, 10).map((e) => `  - ${e.path}: ${e.message}`).join('\n');
        throw new Error(`${errors.length} content error(s) in '${app}':\n${shown}\nRun \`npm run validate\` for the full list.`);
    }
    log.success('Content is valid');

    // 2. Types
    if (!skipTypecheck) {
        log.info('Type check...');
        execFileSync(npx, ['tsc', '--noEmit'], { cwd: rootDir, stdio: 'inherit' });
        log.success('Types are valid');
    }

    // 3. Bundle
    rmSync(outDir, { recursive: true, force: true });
    log.info('Bundling with Vite...');
    execFileSync(npx, ['vite', 'build', '--base', './', '--outDir', outDir, '--emptyOutDir'], {
        cwd: rootDir,
        stdio: 'inherit',
        env: { ...process.env, VITE_APP_ID: app, VITE_PWA: pwa ? '1' : '' },
    });

    // 4. Config, exercises and assets (Vite's publicDir is off for builds)
    writeConfigFiles(rootDir, app, join(outDir, 'config'), { json: pwa });
    const count = writeExerciseData(rootDir, app, join(outDir, 'data'), { json: pwa });
    log.success(`Config and ${count} exercises written`);

    const icon = findAppIcon(rootDir, app);
    if (icon) copyIfExists(icon, join(outDir, 'icon.svg'));
    copyIfExists(join(rootDir, 'public', 'fonts'), join(outDir, 'fonts'));
    copyIfExists(join(rootDir, 'src', 'apps', app, 'assets'), join(outDir, 'assets'));

    // 5. PWA files
    if (pwa) {
        const manifest = buildManifest(appConfig, { language: trainer.language, hasIcon: Boolean(icon) });
        writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

        const template = readFileSync(join(rootDir, 'scripts', 'templates', 'sw.js'), 'utf-8');
        const worker = renderServiceWorker(template, {
            appId: app,
            version: new Date().toISOString().replace(/\D/g, '').slice(0, 14),
            files: listFiles(outDir),
        });
        writeFileSync(join(outDir, 'sw.js'), worker);
        log.success('Manifest and service worker written');
    }

    const subject = readSubjectName(rootDir, app, appConfig);
    log.header('Build complete');
    console.log(`  ${paint.bold(subject)} v${appConfig.version}`);
    console.log(`  Output: ${paint.cyan(outDir)}`);
    console.log(`  Type:   ${pwa ? 'PWA (needs https or localhost)' : 'USB (open index.html directly)'}`);
    return outDir;
}

// Run as CLI (not when imported)
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    try {
        const args = parseArgs(process.argv.slice(2), {
            flags: ['pwa', 'skip-typecheck', 'help'],
            options: ['app'],
            aliases: { '-a': '--app', '-h': '--help' },
        });
        if (args.help) {
            printHelp();
        } else {
            const app = args.app ?? readTrainerConfig(rootDir).defaultAppId;
            buildApp({ app, pwa: Boolean(args.pwa), skipTypecheck: Boolean(args['skip-typecheck']) });
        }
    } catch (error) {
        log.error(error.message);
        process.exit(1);
    }
}
