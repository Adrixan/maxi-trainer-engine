/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** App this bundle is built for (src/apps/<id>); set by the build scripts */
    readonly VITE_APP_ID?: string;
    /** "1" in PWA builds: the service worker is registered */
    readonly VITE_PWA?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

/** Variant settings from trainer.config.json, injected at build time (vite.shared.ts). */
declare const __TRAINER__: {
    engineName: string;
    defaultAppId: string;
    storePrefix: string;
    language: string;
    /** Theme applied to new installs */
    defaultTheme: string;
    /** Themes the user can choose from; the selector is hidden when there is only one */
    themes: readonly string[];
    avatars: readonly string[];
    /** Per-locale translation overrides, merged over src/core/i18n/<locale>.json */
    i18n: Record<string, Record<string, unknown>>;
};
