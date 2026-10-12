import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { alias, trainerEnv } from './vite.shared';

// The apps target Austrian schools. Date logic is tested in a zone with DST and a
// positive UTC offset, where UTC-based day calculations are visibly wrong.
process.env.TZ = 'Europe/Vienna';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        env: trainerEnv,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'src/test/',
                '**/*.d.ts',
                '**/*.config.*',
                '**/index.ts',
            ],
        },
    },
    resolve: { alias },
});
