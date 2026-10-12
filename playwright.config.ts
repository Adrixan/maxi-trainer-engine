import { defineConfig, devices } from '@playwright/test';
import { readFileSync } from 'node:fs';

const trainer = JSON.parse(readFileSync(new URL('./trainer.config.json', import.meta.url), 'utf-8')) as {
    defaultAppId: string;
};
const app = process.env.E2E_APP ?? trainer.defaultAppId;
const port = 4175;

export default defineConfig({
    testDir: 'e2e',
    timeout: 30_000,
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI ? [['github'], ['list']] : 'list',
    globalSetup: './e2e/global-setup.ts',
    use: {
        baseURL: `http://localhost:${port}`,
        trace: 'retain-on-failure',
    },
    // Builds and serves the PWA over http; globalSetup builds the USB variant, which the tests open via file://.
    webServer: {
        command: `node scripts/build-app.mjs --app ${app} --pwa --skip-typecheck && npx vite preview --outDir dist/${app}-pwa --port ${port} --strictPort`,
        url: `http://localhost:${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
    metadata: { app },
});
