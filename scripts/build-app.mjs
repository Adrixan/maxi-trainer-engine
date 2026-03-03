#!/usr/bin/env node

/**
 * Build a single app.
 * 
 * Usage:
 *   node scripts/build-app.mjs --app daz
 *   node scripts/build-app.mjs --app mathematik --pwa
 *   node scripts/build-app.mjs --app daz --skip-data
 * 
 * Options:
 *   --app, -a      App ID to build (required)
 *   --pwa          Build as PWA with service worker
 *   --skip-data    Skip exercise data generation
 *   --help, -h     Show help message
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, readdirSync, mkdirSync, cpSync, rmSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

/**
 * Get the output directory for an app build
 * @param appId - App ID
 * @param isPwa - Whether this is a PWA build
 * @returns The output directory path
 */
function getDistDir(appId, isPwa = false) {
    return isPwa ? join(rootDir, 'dist', `${appId}-pwa`) : join(rootDir, 'dist', appId);
}

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
};

/**
 * Log with color support
 */
const log = {
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`),
};

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = {
        app: null,
        pwa: false,
        skipData: false,
        help: false,
    };

    const argv = process.argv.slice(2);

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        switch (arg) {
            case '--app':
            case '-a':
                args.app = argv[++i];
                break;
            case '--pwa':
                args.pwa = true;
                break;
            case '--skip-data':
                args.skipData = true;
                break;
            case '--help':
            case '-h':
                args.help = true;
                break;
            default:
                if (arg.startsWith('--')) {
                    log.warn(`Unknown option: ${arg}`);
                }
        }
    }

    return args;
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
${colors.bright}build-app.mjs${colors.reset}

Build a single Mini Trainer app.

${colors.bright}Usage:${colors.reset}
  node scripts/build-app.mjs --app <app-id> [options]

${colors.bright}Options:${colors.reset}
  --app, -a <id>    App ID to build (required)
  --pwa             Build as PWA with service worker
  --skip-data       Skip exercise data generation
  --help, -h        Show this help message

${colors.bright}Examples:${colors.reset}
  node scripts/build-app.mjs --app daz
  node scripts/build-app.mjs --app mathematik --pwa
  node scripts/build-app.mjs --app daz --skip-data

${colors.bright}Available Apps:${colors.reset}
  daz          - Deutsch als Zweitsprache Trainer
  mathematik   - Mathematik Lerntrainer
`);
}

/**
 * Validate app exists
 */
function validateApp(appId) {
    const appDir = join(rootDir, 'src', 'apps', appId);
    const appJson = join(appDir, 'app.json');

    if (!existsSync(appDir)) {
        log.error(`App directory not found: ${appDir}`);
        return null;
    }

    if (!existsSync(appJson)) {
        log.warn(`App config not found: ${appJson}, using defaults`);
        return {
            id: appId,
            name: appId.charAt(0).toUpperCase() + appId.slice(1),
            version: '0.0.0',
            buildConfig: {
                baseHref: `/${appId}/`,
                pwaEnabled: false,
                usbDistribution: true,
            },
        };
    }

    try {
        const config = JSON.parse(readFileSync(appJson, 'utf-8'));
        return config;
    } catch (error) {
        log.error(`Failed to parse app.json: ${error.message}`);
        return null;
    }
}

/**
 * Get subject name from subject.json (or app.json as fallback)
 */
function getSubjectName(appId, appConfig) {
    // First try subject.json
    const subjectJsonPath = join(rootDir, 'src', 'apps', appId, 'subject.json');

    if (existsSync(subjectJsonPath)) {
        try {
            const subjectConfig = JSON.parse(readFileSync(subjectJsonPath, 'utf-8'));
            // Use subject name if it's meaningful (not "Generic Trainer")
            if (subjectConfig.name && subjectConfig.name !== 'Generic Trainer') {
                return subjectConfig.name;
            }
        } catch (error) {
            log.warn(`Failed to parse subject.json: ${error.message}`);
        }
    }

    // Fallback to app.json name
    if (appConfig && appConfig.name) {
        return appConfig.name;
    }

    return null;
}

/**
 * Build exercise data for the app
 */
function buildExerciseData(appId) {
    log.info('Building exercise data...');

    const inputPath = join(rootDir, 'src', 'apps', appId, 'exercises.json');
    const outputDir = join(rootDir, 'public', 'data', appId);
    const outputPath = join(outputDir, 'exercises.js');

    // Check if exercises.json exists
    if (!existsSync(inputPath)) {
        log.warn(`No exercises.json found for app: ${appId}`);
        // Create empty exercises file
        mkdirSync(outputDir, { recursive: true });
        const emptyContent = `/**
 * Exercise data for ${appId} app.
 * No exercises configured.
 */

window.__TRAINER_EXERCISES__ = {
  exercises: [],
  metadata: {
    generatedAt: new Date().toISOString(),
    appId: '${appId}',
    version: '1.0.0',
    count: 0,
  }
};
`;
        writeFileSync(outputPath, emptyContent, 'utf-8');
        log.success(`Created empty exercise data: ${outputPath}`);
        return;
    }

    // Run the build-exercise-data script with app parameter
    try {
        execSync(`node "${join(rootDir, 'scripts', 'build-exercise-data.mjs')}" --app ${appId}`, {
            stdio: 'inherit',
            cwd: rootDir,
        });
        log.success('Exercise data built successfully');
    } catch (error) {
        log.error(`Failed to build exercise data: ${error.message}`);
        throw error;
    }
}

/**
 * Copy app-specific assets
 */
function copyAppAssets(appId, isPwa = false) {
    const appAssetsDir = join(rootDir, 'src', 'apps', appId, 'assets');
    const distDir = getDistDir(appId, isPwa);

    if (existsSync(appAssetsDir)) {
        log.info('Copying app assets...');
        cpSync(appAssetsDir, join(distDir, 'assets'), { recursive: true });
        log.success('App assets copied');
    }
}

/**
 * Generate manifest.json for PWA
 */
function generateManifest(appConfig, isPwa = false) {
    const distDir = getDistDir(appConfig.id, isPwa);
    const manifestPath = join(distDir, 'manifest.json');

    const manifest = {
        name: appConfig.fullName || appConfig.name,
        short_name: appConfig.name,
        description: appConfig.description,
        start_url: './index.html',
        display: 'standalone',
        background_color: appConfig.display?.splashBackground || '#1E40AF',
        theme_color: appConfig.display?.primaryColor || '#3B82F6',
        icons: [
            {
                src: 'icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
            },
            {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
            },
        ],
    };

    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');
    log.success(`Generated manifest.json for ${appConfig.id}`);
}

/**
 * Copy service worker for PWA
 */
function copyServiceWorker(appId, isPwa = false) {
    const swSource = join(rootDir, 'public', 'sw.js');
    const distDir = getDistDir(appId, isPwa);
    const swDest = join(distDir, 'sw.js');

    if (existsSync(swSource)) {
        // Read and modify service worker for app-specific caching
        let swContent = readFileSync(swSource, 'utf-8');

        // Update cache name with app ID
        swContent = swContent.replace(
            /const CACHE_NAME = ['"][^'"]+['"];/,
            `const CACHE_NAME = 'mini-trainer-${appId}-v${Date.now()}';`
        );

        writeFileSync(swDest, swContent, 'utf-8');
        log.success('Service worker copied and configured');
    }
}

/**
 * Copy public assets (excluding data folder).
 * Since we disabled publicDir in Vite config to prevent copying all app exercises,
 * we need to manually copy the necessary public files.
 */
function copyPublicAssets(appId, isPwa = false) {
    const publicDir = join(rootDir, 'public');
    const distDir = getDistDir(appId, isPwa);

    log.info('Copying public assets...');

    // Files to copy from public root (excluding data/)
    const publicFiles = ['manifest.json', 'sw.js', 'vite.svg', 'icon-192.svg', 'icon-512.svg'];

    for (const file of publicFiles) {
        const sourcePath = join(publicDir, file);
        if (existsSync(sourcePath)) {
            cpSync(sourcePath, join(distDir, file));
        }
    }

    // Copy fonts directory
    const fontsSource = join(publicDir, 'fonts');
    if (existsSync(fontsSource)) {
        cpSync(fontsSource, join(distDir, 'fonts'), { recursive: true });
    }

    log.success('Public assets copied');
}

/**
 * Copy app config files to dist.
 * 
 * For USB/offline mode: Generates JS files with window.__TRAINER_*__ globals
 * For PWA mode: Optionally copies JSON files for fetch loading
 * 
 * @param appId - App ID
 * @param pwa - Whether this is a PWA build (includes JSON files for fetch)
 */
function copyConfigFiles(appId, pwa = false) {
    const appConfigDir = join(rootDir, 'src', 'apps', appId);
    const defaultConfigDir = join(rootDir, 'src', 'config');
    const distDir = getDistDir(appId, pwa);

    log.info('Generating config files...');

    // Config files to process: map JSON name to window global name
    const configFiles = [
        { json: 'subject.json', js: 'subject.js', global: '__TRAINER_SUBJECT__' },
        { json: 'areas.json', js: 'areas.js', global: '__TRAINER_AREAS__' },
        { json: 'themes.json', js: 'themes.js', global: '__TRAINER_THEMES__' },
        { json: 'badges.json', js: 'badges.js', global: '__TRAINER_BADGES__' },
    ];

    // Create config directory in dist
    const configDistDir = join(distDir, 'config');
    mkdirSync(configDistDir, { recursive: true });

    for (const config of configFiles) {
        // Try app-specific config first, then fall back to default
        const appConfigPath = join(appConfigDir, config.json);
        const defaultConfigPath = join(defaultConfigDir, config.json);
        const sourcePath = existsSync(appConfigPath) ? appConfigPath :
            existsSync(defaultConfigPath) ? defaultConfigPath : null;

        if (!sourcePath) {
            log.warn(`Config file not found: ${config.json}`);
            continue;
        }

        try {
            // Read and parse the JSON
            const jsonContent = readFileSync(sourcePath, 'utf-8');
            const data = JSON.parse(jsonContent);

            // Generate JS file with window global (USB/offline mode)
            const jsContent = `// ${config.json} - Auto-generated for USB/offline mode\nwindow.${config.global} = ${JSON.stringify(data)};\n`;
            const jsPath = join(configDistDir, config.js);
            writeFileSync(jsPath, jsContent, 'utf-8');
            log.info(`Generated: ${config.js}`);

            // For PWA mode: also copy JSON files for fetch loading
            if (pwa) {
                const jsonPath = join(configDistDir, config.json);
                cpSync(sourcePath, jsonPath);
                log.info(`Copied: ${config.json}`);
            }
        } catch (error) {
            log.error(`Failed to process ${config.json}: ${error.message}`);
        }
    }

    log.success('Config files generated');
}

/**
 * Copy fonts to dist
 */
function copyFonts(appId, isPwa = false) {
    // This function is now deprecated - use copyPublicAssets instead
    // Kept for backwards compatibility with existing calls
    const fontsSource = join(rootDir, 'public', 'fonts');
    const distDir = getDistDir(appId, isPwa);

    if (existsSync(fontsSource)) {
        log.info('Copying fonts...');
        cpSync(fontsSource, join(distDir, 'fonts'), { recursive: true });
        log.success('Fonts copied');
    }
}

/**
 * Copy exercise data to dist.
 * Copies to data/exercises.js (not data/{appId}/exercises.js) because
 * the HTML loads ./data/exercises.js regardless of app ID.
 */
function copyExerciseData(appId, isPwa = false) {
    const dataSource = join(rootDir, 'public', 'data', appId, 'exercises.js');
    const distDir = getDistDir(appId, isPwa);
    const dataDir = join(distDir, 'data');

    // Clean up entire data directory to ensure only selected app's exercises.js remains
    if (existsSync(dataDir)) {
        rmSync(dataDir, { recursive: true, force: true });
    }

    mkdirSync(dataDir, { recursive: true });

    if (existsSync(dataSource)) {
        log.info('Copying exercise data...');
        // Copy to data/exercises.js - the HTML loads this path
        cpSync(dataSource, join(dataDir, 'exercises.js'));
        log.success('Exercise data copied');
    }
}

/**
 * Main build function
 */
function buildApp(args) {
    const { app: appId, pwa, skipData } = args;

    log.header(`Building App: ${appId}`);

    // Validate app
    const appConfig = validateApp(appId);
    if (!appConfig) {
        process.exit(1);
    }

    // Get subject name for title
    const subjectName = getSubjectName(appId, appConfig);
    if (subjectName) {
        log.info(`Subject: ${subjectName}`);
    }

    log.info(`App: ${appConfig.name} v${appConfig.version}`);

    // Step 1: Build exercise data
    if (!skipData) {
        buildExerciseData(appId);
    } else {
        log.info('Skipping exercise data generation');
    }

    // Step 2: Clean dist directory
    const distDir = getDistDir(appId, args.pwa);
    if (existsSync(distDir)) {
        log.info('Cleaning dist directory...');
        rmSync(distDir, { recursive: true, force: true });
    }

    // Step 3: TypeScript compilation check
    log.info('Running TypeScript check...');
    try {
        execSync('npx tsc --noEmit', {
            stdio: 'inherit',
            cwd: rootDir,
        });
        log.success('TypeScript check passed');
    } catch (error) {
        log.warn('TypeScript check failed, continuing with build...');
    }

    // Step 4: Vite build
    log.info('Building with Vite...');
    // Build with Vite - output to app-specific directory
    // Use --base "./" for relative paths (works with file:// protocol for USB distribution)
    const outDir = args.pwa ? `dist/${appId}-pwa` : `dist/${appId}`;
    const buildCmd = `npx vite build --base "./" --outDir "${outDir}"`;

    // Build environment variables
    const buildEnv = {
        ...process.env,
        VITE_APP_ID: appId,
        VITE_SUBJECT_NAME: subjectName || '',
    };

    try {
        execSync(buildCmd, {
            stdio: 'inherit',
            cwd: rootDir,
            env: buildEnv,
        });
        log.success('Vite build complete');
    } catch (error) {
        log.error(`Vite build failed: ${error.message}`);
        process.exit(1);
    }

    // Step 5: Copy additional assets
    copyPublicAssets(appId, pwa);
    copyConfigFiles(appId, pwa);
    copyExerciseData(appId, pwa);
    copyAppAssets(appId, pwa);

    // Step 6: PWA-specific steps
    if (pwa) {
        log.info('Configuring PWA...');
        generateManifest(appConfig, pwa);
        copyServiceWorker(appId, pwa);
        log.success('PWA configuration complete');
    }

    // Summary
    log.header('Build Complete');
    console.log(`  App ID: ${colors.bright}${appId}${colors.reset}`);
    console.log(`  Version: ${appConfig.version}`);
    console.log(`  Output: ${colors.cyan}${distDir}${colors.reset}`);
    console.log(`  PWA: ${pwa ? colors.green + 'Yes' : colors.gray + 'No'}${colors.reset}`);
    console.log('');
}

// Main entry point
const args = parseArgs();

if (args.help) {
    showHelp();
    process.exit(0);
}

if (!args.app) {
    log.error('Error: --app option is required');
    showHelp();
    process.exit(1);
}

try {
    buildApp(args);
} catch (error) {
    log.error(`Build failed: ${error.message}`);
    console.error(error);
    process.exit(1);
}
