import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const trainer = JSON.parse(readFileSync('trainer.config.json', 'utf-8')) as { defaultAppId: string };
const app = process.env.E2E_APP ?? trainer.defaultAppId;
const usbUrl = `file://${resolve('dist', app, 'index.html')}`;

/** Fail the test on uncaught errors and console errors. */
function collectErrors(page: Page): string[] {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    page.on('console', (message) => {
        if (message.type() === 'error') errors.push(`console: ${message.text()}`);
    });
    return errors;
}

async function createProfile(page: Page, name = 'Anna') {
    await page.locator('#nickname-input').fill(name);
    await page.getByRole('radio').first().click();
    await page.getByRole('button', { name: 'Profil erstellen' }).click();
    await expect(page.getByText(`Willkommen zurück, ${name}!`)).toBeVisible();
}

test.describe('USB build (file://)', () => {
    test('loads, creates a profile and starts an exercise', async ({ page }) => {
        const errors = collectErrors(page);
        await page.goto(usbUrl);
        await expect(page.getByText('Profil erstellen').first()).toBeVisible();
        await createProfile(page);

        await page.getByRole('button', { name: /Übungen starten|Aufgaben starten/ }).click();
        await expect(page).toHaveURL(/#\/themes$/);

        // First unlocked theme, then its first unlocked level
        await page.locator('main button:not([disabled])').filter({ hasNotText: 'Zurück' }).first().click();
        await expect(page).toHaveURL(/\/levels$/);
        await page.locator('main button:not([disabled])').filter({ hasNotText: 'Zurück' }).first().click();
        await expect(page).toHaveURL(/#\/exercise\//);

        await expect(page.getByText('Etwas ist schiefgelaufen')).toHaveCount(0);
        await expect(page.getByRole('button', { name: /Lösung anzeigen/ })).toBeVisible();
        expect(errors).toEqual([]);
    });

    test('applies and remembers accessibility settings', async ({ page }) => {
        await page.goto(usbUrl);
        await createProfile(page);
        await page.goto(`${usbUrl}#/settings`);

        await page.getByRole('radio', { name: 'Sehr groß' }).click();
        await page.getByRole('switch', { name: 'Hoher Kontrast' }).click();
        const html = page.locator('html');
        await expect(html).toHaveAttribute('data-font-size', 'extra-large');
        await expect(html).toHaveAttribute('data-high-contrast', '');

        await page.reload();
        await expect(html).toHaveAttribute('data-font-size', 'extra-large');
        await expect(html).toHaveAttribute('data-high-contrast', '');
    });

    test('has a skip link that is reachable by keyboard', async ({ page }) => {
        await page.goto(usbUrl);
        await createProfile(page);
        // A fresh page load, so keyboard focus starts at the top of the document
        await page.reload();
        await expect(page.getByText('Willkommen zurück, Anna!')).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: 'Zum Hauptinhalt springen' })).toBeFocused();
    });

    test('keeps the teacher area behind the PIN', async ({ page }) => {
        await page.goto(`${usbUrl}#/teacher/dashboard`);
        await expect(page).toHaveURL(/#\/teacher\/pin$/);
        await expect(page.getByRole('heading', { name: 'PIN festlegen' })).toBeVisible();

        const group = (name: string) => page.getByRole('group', { name });
        for (const [i, digit] of [...'2468'].entries()) await group('Neuer PIN').locator('input').nth(i).fill(digit);
        for (const [i, digit] of [...'2468'].entries()) await group('PIN bestätigen').locator('input').nth(i).fill(digit);
        await expect(page).toHaveURL(/#\/teacher\/dashboard$/);

        // Leaving locks the area again
        await page.getByRole('button', { name: /Zurück|Abmelden/ }).first().click();
        await page.goto(`${usbUrl}#/teacher/dashboard`);
        await expect(page).toHaveURL(/#\/teacher\/pin$/);
        await expect(page.getByRole('heading', { name: 'Lehrer-Login' })).toBeVisible();
    });
});

test.describe('PWA build (http)', () => {
    test('installs the service worker and starts offline', async ({ page, context }) => {
        const errors = collectErrors(page);
        await page.goto('/');
        await expect(page.getByText('Profil erstellen').first()).toBeVisible();
        await page.evaluate(() => navigator.serviceWorker.ready);
        // clients.claim() makes the worker control this page without a reload
        await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

        // The worker pre-caches the whole build during install
        const cached = await page.evaluate(async () => {
            const names = await caches.keys();
            const cache = await caches.open(names[0] as string);
            return (await cache.keys()).map((request) => new URL(request.url).pathname);
        });
        expect(cached).toEqual(expect.arrayContaining([expect.stringMatching(/\/assets\/index-.*\.js$/), '/config/subject.js', '/data/exercises.js']));

        await context.setOffline(true);
        await page.reload();
        await expect(page.getByText('Profil erstellen').first()).toBeVisible();
        expect(errors.filter((e) => !e.includes('Failed to load resource'))).toEqual([]);
    });

    test('serves a manifest with relative urls', async ({ request }) => {
        const manifest = await (await request.get('/manifest.json')).json();
        expect(manifest.start_url).toBe('./');
        expect(manifest.icons.length).toBeGreaterThan(0);
        expect((await request.get('/icon.svg')).ok()).toBe(true);
    });
});
