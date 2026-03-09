#!/usr/bin/env node

/**
 * Generate development config files for a specific app.
 * Creates the necessary config and data files in public/ for development.
 * 
 * Usage:
 *   node scripts/generate-dev-config.mjs --app ahs-mathematik
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function parseArgs() {
    const args = { app: null };
    const argv = process.argv.slice(2);
    
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--app' || arg === '-a') {
            args.app = argv[++i];
        }
    }
    
    if (!args.app) {
        console.log('Usage: node scripts/generate-dev-config.mjs --app <app-id>');
        console.log('Example: node scripts/generate-dev-config.mjs --app ahs-mathematik');
        process.exit(1);
    }
    
    return args;
}

function generateConfig(appId) {
    const configDir = join(rootDir, 'public', 'config');
    const dataDir = join(rootDir, 'public', 'data', appId);
    
    // Ensure directories exist
    mkdirSync(configDir, { recursive: true });
    mkdirSync(dataDir, { recursive: true });
    
    const configFiles = [
        { json: 'app.json', global: '__TRAINER_APP__' },
        { json: 'subject.json', global: '__TRAINER_SUBJECT__' },
        { json: 'areas.json', global: '__TRAINER_AREAS__' },
        { json: 'themes.json', global: '__TRAINER_THEMES__' },
        { json: 'badges.json', global: '__TRAINER_BADGES__' }
    ];
    
    console.log(`Generating config files for app: ${appId}`);
    
    // Generate config JS files (and JSON copies for fetch-based loading)
    for (const config of configFiles) {
        const sourcePath = join(rootDir, 'src', 'apps', appId, config.json);
        
        if (!existsSync(sourcePath)) {
            console.log(`  ⚠️  Skipping ${config.json} (not found)`);
            continue;
        }
        
        try {
            const jsonContent = readFileSync(sourcePath, 'utf-8');
            const data = JSON.parse(jsonContent);
            
            // Generate JS file (for script tag loading → window globals)
            const jsContent = `// ${config.json} - Auto-generated for dev\nwindow.${config.global} = ${JSON.stringify(data, null, 2)};\n`;
            const jsPath = join(configDir, config.json.replace('.json', '.js'));
            writeFileSync(jsPath, jsContent);
            
            // Also copy JSON for fetch-based loading
            const jsonPath = join(configDir, config.json);
            writeFileSync(jsonPath, jsonContent);
            
            console.log(`  ✓ Generated: ${config.json.replace('.json', '.js')} + ${config.json}`);
        } catch (e) {
            console.log(`  ✗ Error generating ${config.json}: ${e.message}`);
        }
    }
    
    // Generate exercises JS file
    const exercisesSource = join(rootDir, 'src', 'apps', appId, 'exercises.json');
    const exercisesDest = join(dataDir, 'exercises.js');
    
    if (!existsSync(exercisesSource)) {
        console.log(`  ⚠️  Skipping exercises.json (not found)`);
    } else {
        try {
            const jsonContent = readFileSync(exercisesSource, 'utf-8');
            const data = JSON.parse(jsonContent);
            
            // Add appId to metadata if not present
            if (!data.metadata) {
                data.metadata = {};
            }
            data.metadata.appId = appId;
            
            const jsContent = `// exercises.json - Auto-generated for dev
window.__TRAINER_EXERCISES__ = ${JSON.stringify(data, null, 2)};
`;
            
            writeFileSync(exercisesDest, jsContent);
            console.log(`  ✓ Generated: exercises.js (${data.exercises?.length || 0} exercises)`);
        } catch (e) {
            console.log(`  ✗ Error generating exercises.js: ${e.message}`);
        }
    }
    
    // Also copy to default exercises.js for fallback
    const defaultExercises = join(rootDir, 'public', 'data', 'exercises.js');
    if (existsSync(exercisesDest)) {
        try {
            const content = readFileSync(exercisesDest, 'utf-8');
            writeFileSync(defaultExercises, content);
            console.log(`  ✓ Generated: exercises.js (default)`);
        } catch (e) {
            console.log(`  ✗ Error copying to default: ${e.message}`);
        }
    }
    
    console.log('\nDone! Run `npm run dev' + `:${appId}` + '` to start the dev server.');
}

const args = parseArgs();
generateConfig(args.app);
