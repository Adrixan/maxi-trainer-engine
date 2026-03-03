/**
 * German conjugation data and validation utilities.
 *
 * This module provides regex patterns and validation functions for checking
 * subject-verb agreement in German sentences. Used primarily by sentence
 * builder exercises to validate grammatical correctness.
 *
 * @module germanConjugations
 */

import type { SentenceBuilderContent } from '@/types/exercise';

// ============================================================================
// German Subject-Verb Agreement Patterns
// ============================================================================

/**
 * Valid verb forms for each German subject pronoun.
 *
 * This is an explicit mapping of correct conjugations using regex patterns.
 * Each pattern matches a valid verb form for the corresponding subject.
 *
 * @example
 * // Check if "gehe" is valid for "Ich"
 * const patterns = VALID_SUBJECT_VERB_COMBINATIONS['Ich'];
 * patterns.some(p => p.test('gehe')); // true
 */
export const VALID_SUBJECT_VERB_COMBINATIONS: Record<string, RegExp[]> = {
    // Ich (1st person singular): verbs end with -e
    // Examples: gehe, habe, mache, bin, kann, will, muss, darf, soll, mag
    'Ich': [
        /e$/i,           // Regular verbs: gehe, mache, habe
        /^bin$/i,        // sein
        /^kann$/i,       // können
        /^will$/i,       // wollen
        /^muss$/i,       // müssen
        /^darf$/i,       // dürfen
        /^soll$/i,       // sollen
        /^mag$/i,        // mögen
    ],

    // Du (2nd person singular): verbs end with -st
    // Examples: gehst, hast, machst, bist, kannst, willst, musst, darfst, sollst, magst
    'Du': [
        /st$/i,          // Regular verbs: gehst, machst, hast
        /^bist$/i,       // sein
        /^kannst$/i,     // können
        /^willst$/i,     // wollen
        /^musst$/i,      // müssen
        /^darfst$/i,     // dürfen
        /^sollst$/i,     // sollen
        /^magst$/i,      // mögen
    ],

    // Er/Sie/Es (3rd person singular): verbs end with -t
    // Examples: geht, hat, macht, ist, kann, will, muss, darf, soll, mag
    'Er': [
        /t$/i,           // Regular verbs: geht, macht, hat (but NOT -st which is Du)
        /^ist$/i,        // sein
        /^kann$/i,       // können
        /^will$/i,       // wollen
        /^muss$/i,       // müssen
        /^darf$/i,       // dürfen
        /^soll$/i,       // sollen
        /^mag$/i,        // mögen
    ],
    'Sie': [  // (formal or 3rd person singular feminine)
        /t$/i,           // Regular verbs: geht, macht, hat (but NOT -st)
        /^ist$/i,        // sein
        /^kann$/i,       // können
        /^will$/i,       // wollen
        /^muss$/i,       // müssen
        /^darf$/i,       // dürfen
        /^soll$/i,       // sollen
        /^mag$/i,        // mögen
    ],
    'Es': [
        /t$/i,           // Regular verbs: geht, macht, hat (but NOT -st)
        /^ist$/i,        // sein
        /^kann$/i,       // können
        /^will$/i,       // wollen
        /^muss$/i,       // müssen
        /^darf$/i,       // dürfen
        /^soll$/i,       // sollen
        /^mag$/i,        // mögen
    ],

    // Wir (1st person plural): verbs end with -en
    // Examples: gehen, haben, machen, sind, können, wollen, müssen, dürfen, sollen, mögen
    'Wir': [
        /en$/i,          // Most verbs: gehen, machen, haben, können, wollen, müssen, dürfen, sollen, mögen
        /^sind$/i,       // sein
    ],

    // Ihr (2nd person plural): verbs end with -t
    // Examples: geht, habt, macht, seid, könnt, wollt, müsst, dürft, sollt, mögt
    'Ihr': [
        /t$/i,           // Regular verbs: geht, macht, habt (but NOT -st)
        /^seid$/i,       // sein
        /^könnt$/i,      // können
        /^wollt$/i,      // wollen
        /^müsst$/i,      // müssen
        /^dürft$/i,      // dürfen
        /^sollt$/i,      // sollen
        /^mögt$/i,       // mögen
    ],
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Check if a verb form matches the subject according to German conjugation rules.
 *
 * This function validates subject-verb agreement by checking if the conjugated
 * verb form matches any valid pattern for the given subject pronoun.
 *
 * @param subject - The subject pronoun (e.g., "Ich", "Du", "Er")
 * @param verb - The conjugated verb form (e.g., "gehe", "gehst", "geht")
 * @returns True if the verb form is grammatically correct for the subject
 *
 * @example
 * isValidSubjectVerbAgreement('Ich', 'gehe');  // true
 * isValidSubjectVerbAgreement('Du', 'gehe');   // false
 * isValidSubjectVerbAgreement('Er', 'geht');   // true
 * isValidSubjectVerbAgreement('Er', 'gehst');  // false (Du form)
 */
export function isValidSubjectVerbAgreement(subject: string, verb: string): boolean {
    // Normalize inputs
    const normalizedSubject = subject.trim();
    const normalizedVerb = verb.trim();

    // Get valid patterns for this subject
    const validPatterns = VALID_SUBJECT_VERB_COMBINATIONS[normalizedSubject];

    if (!validPatterns) {
        // Unknown subject - can't validate
        return false;
    }

    // Check if the verb matches any valid pattern for this subject
    for (const pattern of validPatterns) {
        if (pattern.test(normalizedVerb)) {
            // Special case: For Er/Sie/Es/Ihr, reject verbs ending with -st
            // because that's the Du form (e.g., "gehst" is Du, not Er)
            if (['Er', 'Sie', 'Es', 'Ihr'].includes(normalizedSubject)) {
                if (/st$/i.test(normalizedVerb)) {
                    continue; // This is a Du form, skip it
                }
            }
            return true;
        }
    }

    return false;
}

/**
 * Find subject and verb column indices based on column labels.
 *
 * This function scans the exercise columns to identify which columns contain
 * subject pronouns and verbs, based on label keywords in German and English.
 *
 * @param columns - The exercise columns to search
 * @returns Object with subject and verb column indices, or null if not found
 *
 * @example
 * const columns = [
 *   { label: 'Subjekt', words: ['Ich', 'Du'] },
 *   { label: 'Verb', words: ['gehe', 'gehst'] }
 * ];
 * findSubjectVerbColumns(columns); // { subjectIdx: 0, verbIdx: 1 }
 */
export function findSubjectVerbColumns(
    columns: SentenceBuilderContent['columns']
): { subjectIdx: number; verbIdx: number } | null {
    let subjectIdx = -1;
    let verbIdx = -1;

    for (let i = 0; i < columns.length; i++) {
        const column = columns[i];
        if (!column) continue;
        const label = column.label.toLowerCase();
        if (label.includes('subjekt') || label.includes('subject')) {
            subjectIdx = i;
        } else if (label.includes('verb') || label.includes('prädikat')) {
            verbIdx = i;
        }
    }

    if (subjectIdx >= 0 && verbIdx >= 0) {
        return { subjectIdx, verbIdx };
    }

    return null;
}
