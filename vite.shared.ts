/**
 * Settings shared by vite.config.ts and vitest.config.ts.
 *
 * Everything that differs between engine variants (mini / maxi) lives in
 * trainer.config.json, so the source code itself can stay identical.
 */

import { fileURLToPath, URL } from 'node:url';
import { readAppConfig, readSubjectName, readTrainerConfig } from './scripts/lib/app-build.mjs';

export const rootDir = fileURLToPath(new URL('.', import.meta.url));

export const trainerConfig = readTrainerConfig(rootDir);

const path = (relative: string) => fileURLToPath(new URL(relative, import.meta.url));

export const alias = {
    '@': path('./src'),
    '@core': path('./src/core'),
    '@config': path('./src/config'),
    '@types': path('./src/types'),
};

/** `import.meta.env` values derived from trainer.config.json. */
export const trainerEnv = {
    VITE_DEFAULT_APP_ID: trainerConfig.defaultAppId,
    VITE_STORE_PREFIX: trainerConfig.storePrefix,
};

const escapeHtml = (value: string) =>
    value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Values for the `{{placeholders}}` in index.html: page title, language,
 * description and theme color of the app being served or built.
 */
export function htmlVariables(appId: string, pwa: boolean): Record<string, string> {
    const app = readAppConfig(rootDir, appId);
    const subject = readSubjectName(rootDir, appId, app);
    const title = `${trainerConfig.engineName} ${subject}`.trim();
    return {
        lang: escapeHtml(trainerConfig.language),
        title: escapeHtml(title),
        description: escapeHtml(app.description || title),
        themeColor: escapeHtml(app.display.primaryColor),
        manifest: pwa ? '<link rel="manifest" href="./manifest.json" />' : '',
    };
}
