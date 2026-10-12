export interface AppConfig {
    id: string;
    name: string;
    version: string;
    description: string;
    fullName?: string;
    display: { primaryColor: string; [key: string]: unknown };
    [key: string]: unknown;
}
export const CONFIG_FILES: { json: string; js: string; global: string; optional?: boolean }[];
export function readTrainerConfig(rootDir: string): {
    engineName: string;
    defaultAppId: string;
    storePrefix: string;
    language: string;
};
export function appDir(rootDir: string, appId: string): string;
export function resolveAppFile(rootDir: string, appId: string, name: string): string | null;
export function assertAppExists(rootDir: string, appId: string): void;
export function readAppConfig(rootDir: string, appId: string): AppConfig;
export function readSubjectName(rootDir: string, appId: string, appConfig?: AppConfig): string;
export function loadExercises(rootDir: string, appId: string): { exercises: unknown[]; errors: string[] };
export function writeConfigFiles(rootDir: string, appId: string, outDir: string, options: { json: boolean }): string[];
export function writeExerciseData(rootDir: string, appId: string, outDir: string, options: { json: boolean }): number;
export function findAppIcon(rootDir: string, appId: string): string | null;
export function buildManifest(
    appConfig: AppConfig,
    options: { language: string; hasIcon: boolean },
): Record<string, unknown>;
export function listFiles(dir: string): string[];
export function renderServiceWorker(
    template: string,
    options: { appId: string; version: string; files: string[] },
): string;
export function copyIfExists(from: string, to: string): boolean;
