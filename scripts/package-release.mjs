#!/usr/bin/env node

/**
 * Package a built app for distribution.
 * Creates ZIP archives for USB distribution and PWA deployment.
 * 
 * Usage:
 *   node scripts/package-release.mjs --app daz
 *   node scripts/package-release.mjs --app daz --format zip
 *   node scripts/package-release.mjs --app daz --format pwa
 *   node scripts/package-release.mjs --all
 * 
 * Options:
 *   --app, -a <id>    App ID to package (required unless --all)
 *   --format <type>   Package format: 'zip', 'pwa', or 'both' (default: 'both')
 *   --all             Package all built apps
 *   --help, -h        Show help message
 */

import { existsSync, readdirSync, readFileSync, mkdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
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
};

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = {
        app: null,
        format: 'both',
        all: false,
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
            case '--format':
                args.format = argv[++i];
                break;
            case '--all':
                args.all = true;
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
${colors.bright}package-release.mjs${colors.reset}

Package a built Mini Trainer app for distribution.

${colors.bright}Usage:${colors.reset}
  node scripts/package-release.mjs --app <app-id> [options]
  node scripts/package-release.mjs --all [options]

${colors.bright}Options:${colors.reset}
  --app, -a <id>    App ID to package (required unless --all)
  --format <type>   Package format: 'zip', 'pwa', or 'both' (default: 'both')
  --all             Package all built apps
  --help, -h        Show this help message

${colors.bright}Formats:${colors.reset}
  zip    - USB distribution package (relative paths, no service worker)
  pwa    - PWA package (with service worker and manifest)
  both   - Create both packages

${colors.bright}Examples:${colors.reset}
  node scripts/package-release.mjs --app daz
  node scripts/package-release.mjs --app daz --format zip
  node scripts/package-release.mjs --app mathematik --format pwa
  node scripts/package-release.mjs --all
`);
}

/**
 * Get app configuration
 */
function getAppConfig(appId) {
    const appJsonPath = join(rootDir, 'src', 'apps', appId, 'app.json');

    if (!existsSync(appJsonPath)) {
        return {
            id: appId,
            name: appId.charAt(0).toUpperCase() + appId.slice(1),
            version: '0.0.0',
            buildConfig: {
                usbDistribution: true,
                pwaEnabled: true,
            },
        };
    }

    try {
        return JSON.parse(readFileSync(appJsonPath, 'utf-8'));
    } catch (error) {
        log.warn(`Failed to parse app.json: ${error.message}`);
        return null;
    }
}

/**
 * Create a ZIP archive using system zip command
 */
function createZip(sourceDir, outputPath) {
    // Ensure parent directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    // Use system zip command for cross-platform compatibility
    try {
        // Create zip with all files from source directory
        execSync(`cd "${sourceDir}" && zip -r "${outputPath}" . -x "*.DS_Store" -x "__MACOSX/*"`, {
            stdio: 'pipe',
        });
        return true;
    } catch (error) {
        // Fallback: try PowerShell on Windows
        try {
            execSync(`powershell -command "Compress-Archive -Path '${sourceDir}/*' -DestinationPath '${outputPath}' -Force"`, {
                stdio: 'pipe',
            });
            return true;
        } catch (psError) {
            log.error(`Failed to create ZIP: ${error.message}`);
            return false;
        }
    }
}

/**
 * Get directory size recursively
 */
function getDirectorySize(dir) {
    let size = 0;

    function walkDir(currentPath) {
        const entries = readdirSync(currentPath, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(currentPath, entry.name);
            if (entry.isDirectory()) {
                walkDir(fullPath);
            } else {
                size += statSync(fullPath).size;
            }
        }
    }

    if (existsSync(dir)) {
        walkDir(dir);
    }

    return size;
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * Package a single app
 */
function packageApp(appId, format) {
    log.header(`Packaging App: ${appId}`);

    // Validate build exists
    const distDir = join(rootDir, 'dist', appId);
    if (!existsSync(distDir)) {
        log.error(`Build not found: ${distDir}`);
        log.info('Run build-app.mjs first to create the build.');
        return { success: false, reason: 'Build not found' };
    }

    // Get app config
    const appConfig = getAppConfig(appId);
    if (!appConfig) {
        return { success: false, reason: 'Invalid app config' };
    }

    const version = appConfig.version || '0.0.0';
    const releasesDir = join(rootDir, 'releases', appId);

    // Create releases directory
    mkdirSync(releasesDir, { recursive: true });

    const results = {
        success: true,
        packages: [],
    };

    // Package USB distribution (ZIP)
    if ((format === 'zip' || format === 'both') && appConfig.buildConfig?.usbDistribution !== false) {
        const zipPath = join(releasesDir, `mini-trainer-${appId}-${version}.zip`);
        log.info(`Creating USB package: ${basename(zipPath)}`);

        if (createZip(distDir, zipPath)) {
            const size = statSync(zipPath).size;
            log.success(`USB package created: ${formatBytes(size)}`);
            results.packages.push({ type: 'usb', path: zipPath, size });
        } else {
            log.error('Failed to create USB package');
            results.success = false;
        }
    }

    // Package PWA
    if ((format === 'pwa' || format === 'both') && appConfig.buildConfig?.pwaEnabled !== false) {
        const pwaPath = join(releasesDir, `mini-trainer-${appId}-${version}-pwa.zip`);
        log.info(`Creating PWA package: ${basename(pwaPath)}`);

        // Check for PWA files
        const manifestPath = join(distDir, 'manifest.json');
        const swPath = join(distDir, 'sw.js');

        if (!existsSync(manifestPath)) {
            log.warn('manifest.json not found - PWA may not work correctly');
        }
        if (!existsSync(swPath)) {
            log.warn('sw.js not found - PWA may not work correctly');
        }

        if (createZip(distDir, pwaPath)) {
            const size = statSync(pwaPath).size;
            log.success(`PWA package created: ${formatBytes(size)}`);
            results.packages.push({ type: 'pwa', path: pwaPath, size });
        } else {
            log.error('Failed to create PWA package');
            results.success = false;
        }
    }

    return results;
}

/**
 * Discover all built apps
 */
function discoverBuiltApps() {
    const distDir = join(rootDir, 'dist');

    if (!existsSync(distDir)) {
        return [];
    }

    return readdirSync(distDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);
}

/**
 * Main function
 */
function main(args) {
    if (args.help) {
        showHelp();
        process.exit(0);
    }

    let appsToPackage = [];

    if (args.all) {
        appsToPackage = discoverBuiltApps();
        if (appsToPackage.length === 0) {
            log.error('No built apps found in dist/');
            log.info('Run build-app.mjs or build-all-apps.mjs first.');
            process.exit(1);
        }
        log.info(`Found ${appsToPackage.length} built app(s): ${appsToPackage.join(', ')}`);
    } else if (args.app) {
        appsToPackage = [args.app];
    } else {
        log.error('Error: --app option or --all flag is required');
        showHelp();
        process.exit(1);
    }

    // Validate format
    if (!['zip', 'pwa', 'both'].includes(args.format)) {
        log.error(`Invalid format: ${args.format}. Must be 'zip', 'pwa', or 'both'.`);
        process.exit(1);
    }

    const results = {
        success: [],
        failed: [],
    };

    // Package each app
    for (const appId of appsToPackage) {
        const result = packageApp(appId, args.format);

        if (result.success) {
            results.success.push({ appId, packages: result.packages });
        } else {
            results.failed.push({ appId, reason: result.reason });
        }
    }

    // Summary
    log.header('Packaging Summary');
    console.log(`  Apps processed: ${appsToPackage.length}`);
    console.log(`  ${colors.green}Successful: ${results.success.length}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${results.failed.length}${colors.reset}`);

    if (results.success.length > 0) {
        console.log(`\n${colors.green}Packages created:${colors.reset}`);
        results.success.forEach(({ appId, packages }) => {
            console.log(`\n  ${colors.bright}${appId}:${colors.reset}`);
            packages.forEach(({ type, path: pkgPath, size }) => {
                console.log(`    ${type}: ${basename(pkgPath)} (${formatBytes(size)})`);
            });
        });
    }

    if (results.failed.length > 0) {
        console.log(`\n${colors.red}Failed:${colors.reset}`);
        results.failed.forEach(({ appId, reason }) => {
            console.log(`  - ${appId}: ${reason}`);
        });
        process.exit(1);
    }

    log.success('Packaging complete!');
}

// Main entry point
const args = parseArgs();

try {
    main(args);
} catch (error) {
    log.error(`Packaging failed: ${error.message}`);
    console.error(error);
    process.exit(1);
}
