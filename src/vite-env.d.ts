/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** App this bundle is built for (src/apps/<id>); set by the build scripts */
    readonly VITE_APP_ID?: string;
    /** Fallback app id from trainer.config.json */
    readonly VITE_DEFAULT_APP_ID?: string;
    /** Persisted store prefix from trainer.config.json */
    readonly VITE_STORE_PREFIX?: string;
    /** "1" in PWA builds: the service worker is registered */
    readonly VITE_PWA?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
