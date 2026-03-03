import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite plugin for file:// protocol compatibility.
 * 
 * When the app is opened directly via file:// protocol (e.g., from a local file),
 * ES modules don't work properly. This plugin transforms the built HTML to:
 * - Strip type="module" from script tags
 * - Remove crossorigin attributes (with or without quotes)
 * - Convert scripts to defer instead of async
 * - Convert absolute paths to relative paths for file:// protocol
 * 
 * This enables the app to work when opened as a local file.
 */
function fileProtocolPlugin(): Plugin {
    return {
        name: 'file-protocol-compat',
        enforce: 'post',
        transformIndexHtml(html, { bundle }) {
            // Only apply in build mode
            if (!bundle) return html;

            // Transform script tags for file:// protocol compatibility
            return html
                .replace(/type="module"\s*/g, '')
                // Remove crossorigin with quotes: crossorigin="anonymous"
                .replace(/crossorigin\s*=\s*"[^"]*"\s*/g, ' ')
                // Remove crossorigin without quotes: crossorigin
                .replace(/\s+crossorigin(?=\s|>)/g, '')
                .replace(/<script\s+src=/g, '<script defer src=')
                // Convert absolute paths to relative paths for file:// protocol
                .replace(/href="\/([^"]*)"/g, 'href="./$1"')
                .replace(/src="\/([^"]*)"/g, 'src="./$1"')
                // Fix service worker path in inline script
                .replace(/register\('\/sw\.js'\)/g, "register('./sw.js')");
        },
    };
}

/**
 * Vite plugin to inject dynamic page title based on subject.
 * Replaces the title in HTML with the subject name from environment variable.
 */
function titleInjectionPlugin(): Plugin {
    return {
        name: 'title-injection',
        enforce: 'post',
        transformIndexHtml(html) {
            // Get subject name from environment variable (set during build)
            const subjectName = process.env.VITE_SUBJECT_NAME || '';
            const defaultTitle = 'Mini Trainer';

            // Set the full title
            const fullTitle = subjectName.trim()
                ? `${defaultTitle} ${subjectName}`
                : defaultTitle;

            // Replace the title in HTML
            return html.replace(
                /<title>[^<]*<\/title>/,
                `<title>${fullTitle}</title>`
            );
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), titleInjectionPlugin(), fileProtocolPlugin()],
    // Define compile-time constants for VITE_APP_ID
    // This allows the app to know its ID at build time without runtime config
    define: {
        'import.meta.env.VITE_APP_ID': JSON.stringify(process.env.VITE_APP_ID || ''),
    },
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
            '@core': fileURLToPath(new URL('./src/core', import.meta.url)),
            '@config': fileURLToPath(new URL('./src/config', import.meta.url)),
            '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
        },
    },
    build: {
        // Ensure compatibility with file:// protocol for local file usage
        target: 'esnext',
        // Increase chunk size warning limit
        chunkSizeWarningLimit: 1000,
        // Use IIFE format for file:// protocol compatibility
        // This wraps the code in immediately invoked function expressions
        // which work better with file:// protocol than ES modules
        rollupOptions: {
            // External scripts that should not be bundled
            external: [
                './config/subject.js',
                './config/areas.js',
                './config/themes.js',
                './config/badges.js',
                '/data/exercises.js',
            ],
            output: {
                format: 'iife' as const,
                // Inline dynamic imports to avoid module loading issues
                inlineDynamicImports: true,
            },
        },
    },
    server: {
        // Allow serving from file:// protocol in development
        fs: {
            allow: ['..'],
        },
    },
    preview: {
        // Preview server configuration
        // Serves via HTTP for proper functionality
        port: 4173,
    },
});
