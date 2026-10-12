/** Small helpers shared by the command line scripts. */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

/** Project root, independent of the working directory. */
export const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const color = (code) => (text) => `\x1b[${code}m${text}\x1b[0m`;
export const paint = { bold: color(1), green: color(32), yellow: color(33), red: color(31), cyan: color(36), gray: color(90) };

export const log = {
    info: (msg) => console.log(`${paint.cyan('ℹ')} ${msg}`),
    success: (msg) => console.log(`${paint.green('✓')} ${msg}`),
    warn: (msg) => console.log(`${paint.yellow('⚠')} ${msg}`),
    error: (msg) => console.error(`${paint.red('✗')} ${msg}`),
    header: (msg) => console.log(`\n${paint.bold(msg)}\n`),
};

/**
 * Parse `--flag` and `--option value` arguments.
 * @param {string[]} argv
 * @param {{ flags?: string[], options?: string[], aliases?: Record<string,string> }} spec
 */
export function parseArgs(argv, { flags = [], options = [], aliases = {} }) {
    const result = {};
    for (let i = 0; i < argv.length; i++) {
        const raw = argv[i];
        const name = (aliases[raw] ?? raw).replace(/^--/, '');
        if (flags.includes(name)) result[name] = true;
        else if (options.includes(name)) result[name] = argv[++i];
        else throw new Error(`Unknown argument: ${raw}`);
    }
    return result;
}
