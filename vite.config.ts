import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { alias, htmlVariables, trainerConfig, trainerEnv } from './vite.shared';

/**
 * Fill the `{{placeholders}}` of index.html (title, language, description,
 * theme color, manifest link) from the configuration of the app.
 */
function appHtmlPlugin(appId: string, pwa: boolean): Plugin {
    return {
        name: 'app-html',
        transformIndexHtml(html) {
            const variables = htmlVariables(appId, pwa);
            return html.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => variables[key] ?? '');
        },
    };
}

/**
 * file:// compatibility for the built HTML.
 *
 * Browsers refuse to load ES modules from file:// URLs, so the bundle is built
 * as an IIFE and its script tag is turned into a plain deferred script.
 */
function fileProtocolPlugin(): Plugin {
    return {
        name: 'file-protocol-compat',
        enforce: 'post',
        transformIndexHtml(html, { bundle }) {
            if (!bundle) return html; // dev server
            return html
                .replace(/\stype="module"/g, '')
                .replace(/\scrossorigin(?:="[^"]*")?/g, '')
                .replace(/<script(?![^>]*\sdefer)([^>]*\ssrc=)/g, '<script defer$1')
                .replace(/(href|src)="\/([^"]*)"/g, '$1="./$2"');
        },
    };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
    const appId = process.env.VITE_APP_ID || trainerConfig.defaultAppId;
    const pwa = process.env.VITE_PWA === '1';

    if (command === 'build' && !process.env.VITE_APP_ID) {
        throw new Error('VITE_APP_ID is not set. Build with `npm run build -- --app <id>` (scripts/build-app.mjs).');
    }

    return {
        plugins: [react(), appHtmlPlugin(appId, pwa), fileProtocolPlugin()],
        define: {
            'import.meta.env.VITE_APP_ID': JSON.stringify(process.env.VITE_APP_ID || ''),
            'import.meta.env.VITE_PWA': JSON.stringify(pwa ? '1' : ''),
            'import.meta.env.VITE_DEFAULT_APP_ID': JSON.stringify(trainerEnv.VITE_DEFAULT_APP_ID),
            'import.meta.env.VITE_STORE_PREFIX': JSON.stringify(trainerEnv.VITE_STORE_PREFIX),
        },
        resolve: { alias },
        // The build scripts copy exactly the files a build needs (config, data,
        // icon); only the dev server serves public/ directly.
        publicDir: command === 'build' ? false : 'public',
        build: {
            // IIFE output so the app also runs from file:// (USB distribution).
            // Dynamic imports are inlined, so route-level lazy() cannot split the bundle.
            target: 'esnext',
            chunkSizeWarningLimit: 1000,
            rollupOptions: {
                output: { format: 'iife' as const, inlineDynamicImports: true },
            },
        },
        server: { fs: { allow: ['..'] } },
        preview: { port: 4173 },
    };
});
