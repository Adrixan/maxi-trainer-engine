import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Builds the app under test as USB distribution (the PWA build is made by the
 * webServer command in playwright.config.ts).
 * E2E_APP selects the app (default: defaultAppId of trainer.config.json).
 */
export default function globalSetup() {
    const trainer = JSON.parse(readFileSync('trainer.config.json', 'utf-8')) as { defaultAppId: string };
    const app = process.env.E2E_APP ?? trainer.defaultAppId;
    execFileSync('node', ['scripts/build-app.mjs', '--app', app, '--skip-typecheck'], { stdio: 'inherit' });
}
