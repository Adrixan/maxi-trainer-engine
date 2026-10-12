export interface ValidationIssue {
    file: string;
    path: string;
    message: string;
}
export interface ValidationOutcome {
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
}
export const MIN_EXERCISES_PER_BUCKET: number;
export function validateContent(input: {
    label: string;
    areas: unknown;
    themes: unknown;
    subject: unknown;
    exercises: unknown;
}): ValidationOutcome;
export function validateAppDir(rootDir: string, appId: string, defaultConfigDir: string): ValidationOutcome;
export function contentCoverage(
    rootDir: string,
    appId: string,
): { themeId: string; level: number; count: number }[];
