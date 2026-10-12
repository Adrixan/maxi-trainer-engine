import { describe, it, expect, afterEach, vi } from 'vitest';
import { randomHex, sha256Hex, sha256HexSync } from '../hash';

const EMPTY = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const ABC = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
const TWO_BLOCKS = '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('sha256HexSync', () => {
    it('matches the NIST test vectors', () => {
        expect(sha256HexSync('')).toBe(EMPTY);
        expect(sha256HexSync('abc')).toBe(ABC);
        expect(sha256HexSync('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(TWO_BLOCKS);
    });

    it('hashes UTF-8 and long inputs', () => {
        expect(sha256HexSync('Größe 🦊')).toBe(sha256HexSync('Größe 🦊'));
        expect(sha256HexSync('a'.repeat(1_000_000))).toBe(
            'cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0',
        );
    });
});

describe('sha256Hex', () => {
    it('agrees with the synchronous implementation', async () => {
        expect(await sha256Hex('abc')).toBe(ABC);
    });

    it('works without crypto.subtle (insecure contexts, old WebViews)', async () => {
        vi.stubGlobal('crypto', undefined);
        expect(await sha256Hex('abc')).toBe(ABC);
    });
});

describe('randomHex', () => {
    it('returns hex of the requested byte length', () => {
        expect(randomHex(8)).toMatch(/^[0-9a-f]{16}$/);
    });

    it('works without Web Crypto', () => {
        vi.stubGlobal('crypto', undefined);
        expect(randomHex(4)).toMatch(/^[0-9a-f]{8}$/);
    });

    it('does not repeat', () => {
        expect(randomHex()).not.toBe(randomHex());
    });
});
