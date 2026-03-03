#!/usr/bin/env node

/**
 * Build all configured apps.
 * 
 * Usage:
 *   node scripts/build-all-apps.mjs
 *   node scripts/build-all-apps.mjs --pwa
 *   node scripts/build-all-apps.mjs --both
 *   node scripts/build-all-apps.mjs --app daz --both
 * 
 * Options:
 *   --app, -a        Build specific app only
 *   --pwa            Build as PWA with service worker
 *   --both           Build both USB and PWA versions
 *   --skip-data      Skip exercise data generation
 *   --parallel       Build apps in parallel (experimental)
 *   --help, -h       Show help message
 */

import { readdirSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// ANSI color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    magenta: '\x1b[35m',
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
    divider: () => console.log(colors.magenta + '═'.repeat(50) + colors.reset),
};

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = {
        app: null,
        pwa: false,
        both: false,
        skipData: false,
        parallel: false,
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
            case '--both':
                args.both = true;
                break;
            case '--skip-data':
                args.skipData = true;
                break;
            case '--parallel':
                args.parallel = true;
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
${colors.bright}build-all-apps.mjs${colors.reset}

Build all configured Mini Trainer apps.

${colors.bright}Usage:${colors.reset}
  node scripts/build-all-apps.mjs [options]

${colors.bright}Options:${colors.reset}
  --app, -a        Build specific app only
  --pwa            Build as PWA with service worker
  --both           Build both USB and PWA versions
  --skip-data      Skip exercise data generation
  --parallel       Build apps in parallel (experimental)
  --help, -h       Show this help message

${colors.bright}Examples:${colors.reset}
  node scripts/build-all-apps.mjs
  node scripts/build-all-apps.mjs --pwa
  node scripts/build-all-apps.mjs --both
  node scripts/build-all-apps.mjs --app daz --both
`);
}

/**
 * Discover all apps from src/apps directory
 * @param filterAppId - Optional app ID to filter by
 */
function discoverApps(filterAppId = null) {
    const appsDir = join(rootDir, 'src', 'apps');

    if (!existsSync(appsDir)) {
        log.error(`Apps directory not found: ${appsDir}`);
        return [];
    }

    const apps = [];
    const entries = readdirSync(appsDir, { withFileTypes: true });

    for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const appId = entry.name;

        // Filter by specific app if requested
        if (filterAppId && appId !== filterAppId) continue;

        const appJsonPath = join(appsDir, appId, 'app.json');

        let appInfo = {
            id: appId,
            name: appId.charAt(0).toUpperCase() + appId.slice(1),
            version: '0.0.0',
        };

        if (existsSync(appJsonPath)) {
            try {
                const config = JSON.parse(readFileSync(appJsonPath, 'utf-8'));
                appInfo.name = config.name || appInfo.name;
                appInfo.version = config.version || appInfo.version;
            } catch (error) {
                log.warn(`Failed to parse app.json for ${appId}: ${error.message}`);
            }
        }

        apps.push(appInfo);
    }

    return apps;
}

/**
 * Build a single app
 */
function buildApp(appId, options) {
    const buildArgs = ['--app', appId];

    if (options.pwa) {
        buildArgs.push('--pwa');
    }

    if (options.skipData) {
        buildArgs.push('--skip-data');
    }

    const buildCmd = `node "${join(rootDir, 'scripts', 'build-app.mjs')}" ${buildArgs.join(' ')}`;

    execSync(buildCmd, {
        stdio: 'inherit',
        cwd: rootDir,
    });
}

/**
 * Main build function
 */
function buildAllApps(args) {
    log.header('Building All Apps');

    // Discover apps (filter by specific app if provided)
    const apps = discoverApps(args.app);

    if (apps.length === 0) {
        if (args.app) {
            log.error(`App '${args.app}' not found`);
        } else {
            log.error('No apps found to build');
        }
        process.exit(1);
    }

    // Determine build variants
    const buildVariants = [];
    if (args.both) {
        buildVariants.push({ type: 'USB', pwa: false, suffix: '' });
        buildVariants.push({ type: 'PWA', pwa: true, suffix: '-pwa' });
    } else {
        buildVariants.push({ type: args.pwa ? 'PWA' : 'USB', pwa: args.pwa, suffix: args.pwa ? '-pwa' : '' });
    }

    log.info(`Found ${apps.length} app(s): ${apps.map(a => a.id).join(', ')}`);
    log.info(`Build variant(s): ${buildVariants.map(v => v.type).join(', ')}`);

    const results = {
        success: [],
        failed: [],
    };

    const startTime = Date.now();

    // Build each app
    for (const app of apps) {
        for (const variant of buildVariants) {
            const variantLabel = buildVariants.length > 1
                ? `${app.id}${variant.suffix}`
                : app.id;

            log.divider();
            console.log(`${colors.bright}Building: ${app.name} v${app.version} (${variantLabel})${colors.reset}`);
            console.log(`${colors.gray}Variant: ${variant.type}${colors.reset}`);
            log.divider();

            try {
                // Create build options for this variant
                const buildOptions = {
                    ...args,
                    pwa: variant.pwa,
                };

                buildApp(app.id, buildOptions);
                results.success.push({ app, variant: variant.type });
                log.success(`Completed: ${variantLabel}`);
            } catch (error) {
                log.error(`Failed: ${variantLabel} - ${error.message}`);
                results.failed.push({ app, variant: variant.type, error });
            }
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Summary
    log.header('Build Summary');
    const totalBuilds = apps.length * buildVariants.length;
    console.log(`  Total apps: ${apps.length}`);
    console.log(`  Variants per app: ${buildVariants.length} (${buildVariants.map(v => v.type).join(', ')})`);
    console.log(`  Total builds: ${totalBuilds}`);
    console.log(`  ${colors.green}Successful: ${results.success.length}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${results.failed.length}${colors.reset}`);
    console.log(`  Duration: ${duration}s`);

    if (results.failed.length > 0) {
        console.log(`\n${colors.red}Failed builds:${colors.reset}`);
        results.failed.forEach(({ app, variant, error }) => {
            console.log(`  - ${app.id} (${variant}): ${error.message}`);
        });
        process.exit(1);
    }

    log.success('All apps built successfully!');
}

// Main entry point
const args = parseArgs();

if (args.help) {
    showHelp();
    process.exit(0);
}

try {
    buildAllApps(args);
} catch (error) {
    log.error(`Build failed: ${error.message}`);
    console.error(error);
    process.exit(1);
}
