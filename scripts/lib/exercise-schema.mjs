/**
 * Exercise content schema.
 *
 * Single source of truth for the shape of `exercises.json` entries. It mirrors
 * the TypeScript types in `src/types/exercise.ts` and adds the semantic rules
 * the engine relies on at runtime (solvability, unique options, ...).
 *
 * Used by `validate-config.mjs` (CLI / CI) and by the content test-suite.
 */

import { z } from 'zod';

export const EXERCISE_TYPES = [
    'fill-blank',
    'multiple-choice',
    'matching',
    'sentence-builder',
    'sorting',
    'writing',
    'conjugation-table',
    'connector-insert',
    'word-order',
    'picture-vocabulary',
];

const text = z.string().trim().min(1, 'must not be empty');
const textList = (min = 0) => z.array(text).min(min);
// Exact comparison (after trimming): items that differ only in case or punctuation
// are legitimate distinct choices (e.g. "Der Hund" vs "der Hund").
const hasDuplicates = (values) => new Set(values.map((v) => String(v).trim())).size !== values.length;

const fillBlank = z.object({
    type: z.literal('fill-blank'),
    sentence: text.refine((s) => s.split('{{blank}}').length === 2, {
        message: 'sentence must contain exactly one {{blank}} placeholder',
    }),
    correctAnswer: text,
    acceptableAnswers: textList().default([]),
    numericWordForm: text.optional(),
}).passthrough().superRefine((c, ctx) => {
    if (c.acceptableAnswers.includes(c.correctAnswer)) {
        ctx.addIssue({ code: 'custom', path: ['acceptableAnswers'], message: 'repeats correctAnswer' });
    }
});

const multipleChoice = z.object({
    type: z.literal('multiple-choice'),
    /** May be empty when the exercise instruction already carries the question. */
    question: z.string(),
    options: textList(2),
    correctIndex: z.number().int().min(0),
}).passthrough().superRefine((c, ctx) => {
    if (c.correctIndex >= c.options.length) {
        ctx.addIssue({ code: 'custom', path: ['correctIndex'], message: 'out of range of options' });
    }
    if (hasDuplicates(c.options)) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'options must be unique' });
    }
});

const matching = z.object({
    type: z.literal('matching'),
    pairs: z.array(z.object({ left: text, right: text })).min(2),
}).passthrough().superRefine((c, ctx) => {
    // Left items identify the pair; equal right items are fine (several items may share an answer).
    if (hasDuplicates(c.pairs.map((p) => p.left))) {
        ctx.addIssue({ code: 'custom', path: ['pairs'], message: 'left items must be unique' });
    }
});

const sentenceBuilder = z.object({
    type: z.literal('sentence-builder'),
    columns: z.array(z.object({ label: text, words: textList(1) })).min(2),
    targetSentences: textList(1),
}).passthrough();

const sorting = z.object({
    type: z.literal('sorting'),
    categories: z.array(z.object({ label: text, items: textList(1) })).min(2),
}).passthrough().superRefine((c, ctx) => {
    const all = c.categories.flatMap((cat) => cat.items);
    if (hasDuplicates(all)) {
        ctx.addIssue({ code: 'custom', path: ['categories'], message: 'an item appears more than once' });
    }
});

const writing = z.object({
    type: z.literal('writing'),
    prompt: text,
    scaffoldLevel: text,
    scaffoldHints: textList(),
    starterWords: textList(),
    minLength: z.number().int().min(0),
    correctSentence: text.optional(),
}).passthrough();

const conjugationTable = z.object({
    type: z.literal('conjugation-table'),
    verb: text,
    tense: text,
    cells: z.array(z.object({ person: text, correctForm: text, prefilled: z.boolean() })).min(1),
}).passthrough();

const connectorInsert = z.object({
    type: z.literal('connector-insert'),
    /** May be empty when the sentence starts with the connector. */
    sentencePart1: z.string(),
    sentencePart2: text,
    correctConnector: text,
    options: textList(2),
}).passthrough().superRefine((c, ctx) => {
    if (!c.options.includes(c.correctConnector)) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'must contain correctConnector' });
    }
});

const wordOrder = z.object({
    type: z.literal('word-order'),
    correctOrder: textList(2),
    alternateOrders: z.array(textList(2)).optional(),
    scrambled: textList(2),
}).passthrough().superRefine((c, ctx) => {
    const key = (words) => [...words].sort().join('\u0000');
    if (key(c.correctOrder) !== key(c.scrambled)) {
        ctx.addIssue({ code: 'custom', path: ['scrambled'], message: 'must contain exactly the words of correctOrder' });
    }
    (c.alternateOrders ?? []).forEach((alt, i) => {
        if (key(alt) !== key(c.correctOrder)) {
            ctx.addIssue({ code: 'custom', path: ['alternateOrders', i], message: 'must use the same words as correctOrder' });
        }
    });
});

const pictureVocabulary = z.object({
    type: z.literal('picture-vocabulary'),
    picture: text,
    pictureAlt: text,
    correctAnswer: text,
    acceptableAnswers: textList().default([]),
    options: textList(),
}).passthrough().superRefine((c, ctx) => {
    if (c.options.length > 0 && !c.options.includes(c.correctAnswer)) {
        ctx.addIssue({ code: 'custom', path: ['options'], message: 'must contain correctAnswer' });
    }
});

const CONTENT_SCHEMAS = {
    'fill-blank': fillBlank,
    'multiple-choice': multipleChoice,
    'matching': matching,
    'sentence-builder': sentenceBuilder,
    'sorting': sorting,
    'writing': writing,
    'conjugation-table': conjugationTable,
    'connector-insert': connectorInsert,
    'word-order': wordOrder,
    'picture-vocabulary': pictureVocabulary,
};

const exerciseEnvelope = z.object({
    id: text,
    type: z.enum(EXERCISE_TYPES),
    areaId: text,
    themeId: text,
    level: z.number().int().min(1),
    difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    instruction: text,
    content: z.object({ type: z.string() }).passthrough(),
    hints: z.array(z.string()).default([]),
    feedbackCorrect: text,
    feedbackIncorrect: text,
}).passthrough();

const formatPath = (path) => path.map((p) => (typeof p === 'number' ? `[${p}]` : `.${p}`)).join('').replace(/^\./, '');

/**
 * Validate a single exercise.
 *
 * @param {unknown} exercise
 * @returns {string[]} human-readable problems (empty when the exercise is valid)
 */
export function validateExercise(exercise) {
    const problems = [];
    const envelope = exerciseEnvelope.safeParse(exercise);
    if (!envelope.success) {
        for (const issue of envelope.error.issues) {
            problems.push(`${formatPath(issue.path) || '(exercise)'}: ${issue.message}`);
        }
        return problems;
    }
    const { type, content } = envelope.data;
    if (content.type !== type) {
        problems.push(`content.type '${content.type}' does not match type '${type}'`);
        return problems;
    }
    const parsed = CONTENT_SCHEMAS[type].safeParse(content);
    if (!parsed.success) {
        for (const issue of parsed.error.issues) {
            problems.push(`content.${formatPath(issue.path)}: ${issue.message}`.replace(/\.$/, ''));
        }
    }
    return problems;
}
