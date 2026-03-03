#!/usr/bin/env node
/**
 * Script to translate English strings in exercises.json to German
 * Translates: instruction, hints, feedbackCorrect, feedbackIncorrect fields
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exercisesPath = path.join(__dirname, '..', 'src', 'data', 'exercises.json');

// Translation mappings for common patterns
const translations = {
    // Feedback prefixes
    'Great job!': 'Toll gemacht!',
    'Great job': 'Toll gemacht',
    'Perfect!': 'Perfekt!',
    'Perfect': 'Perfekt',
    'Excellent!': 'Ausgezeichnet!',
    'Excellent': 'Ausgezeichnet',
    'Correct!': 'Richtig!',
    'Correct': 'Richtig',
    'Well done!': 'Gut gemacht!',
    'Well done': 'Gut gemacht',
    "That's right!": 'Das ist richtig!',
    "That's right": 'Das ist richtig',
    'Super!': 'Super!',
    'Super': 'Super',
    'Toll!': 'Toll!',
    'Toll': 'Toll',

    // Feedback suffixes
    'Not quite.': 'Nicht ganz.',
    'Not quite': 'Nicht ganz',
    'Try again.': 'Versuche es noch einmal.',
    'Try again': 'Versuche es noch einmal',
    'Keep practicing!': 'Übe weiter!',
    'Keep practicing': 'Übe weiter',
    'Good effort!': 'Gute Anstrengung!',
    'Good effort': 'Gute Anstrengung',

    // Common phrases
    'means': 'bedeutet',
    'in German': 'auf Deutsch',
    'The correct answer is': 'Die richtige Antwort ist',
    'The correct form is': 'Die richtige Form ist',
    'The correct order is': 'Die richtige Reihenfolge ist',
    'Remember:': 'Erinnerung:',
    'Remember': 'Erinnerung',

    // Instruction templates
    'Complete the sentence with the correct article.': 'Ergänze den Satz mit dem richtigen Artikel.',
    'Complete the sentence with the right connector.': 'Ergänze den Satz mit dem richtigen Bindewort.',
    'Complete the sentence.': 'Ergänze den Satz.',
    'Fill in the missing number word.': 'Füge das fehlende Zahlwort ein.',
    'Choose the correct translation.': 'Wähle die richtige Übersetzung.',
    'Select the correct verb form.': 'Wähle die richtige Verbform.',
    'Select the best connector for this sentence.': 'Wähle das beste Bindewort für diesen Satz.',
    'Choose the correct connector to complete the sentence.': 'Wähle das richtige Bindewort, um den Satz zu ergänzen.',
    'Read and answer the question.': 'Lies und beantworte die Frage.',
    'Match the German words with their English translations.': 'Ordne die deutschen Wörter ihren englischen Übersetzungen zu.',
    'Match the foods to their categories.': 'Ordne die Lebensmittel ihren Kategorien zu.',
    'Match the articles to the correct nouns.': 'Ordne die Artikel den richtigen Nomen zu.',
    'Build a correct German sentence from the words.': 'Bilde einen korrekten deutschen Satz aus den Wörtern.',
    'Build sentences about food preferences.': 'Bilde Sätze über Essensvorlieben.',
    'Sort the words into the correct categories.': 'Sortiere die Wörter in die richtigen Kategorien.',
    'Sort the nouns by their gender.': 'Sortiere die Nomen nach ihrem Geschlecht.',
    'Sort the animals by where they live.': 'Sortiere die Tiere nach ihrem Lebensraum.',
    'Write about your daily routine.': 'Schreibe über deine Tagesroutine.',
    'Write about your favorite subject in school.': 'Schreibe über dein Lieblingsfach in der Schule.',
    'Conjugate the verb': 'Konjugiere das Verb',
    'in present tense.': 'im Präsens.',
    'in the present tense.': 'im Präsens.',
    'Put the words in the correct order to form a sentence.': 'Bringe die Wörter in die richtige Reihenfolge, um einen Satz zu bilden.',
    'Put the words in order to make a sentence with': 'Bringe die Wörter in die richtige Reihenfolge, um einen Satz mit',
    'Arrange the words to form a correct question.': 'Ordne die Wörter an, um eine richtige Frage zu bilden.',

    // Grammar terms
    'third person singular': 'dritte Person Singular',
    'first person singular': 'erste Person Singular',
    'second person singular': 'zweite Person Singular',
    'accusative case': 'Akkusativ',
    'nominative case': 'Nominativ',
    'dative case': 'Dativ',
    'genitive case': 'Genitiv',
    'masculine': 'maskulin',
    'feminine': 'feminin',
    'neuter': 'sächlich',
    'plural': 'Plural',
    'singular': 'Singular',
    'present tense': 'Präsens',
    'past tense': 'Vergangenheit',
    'future tense': 'Zukunft',
    'subject': 'Subjekt',
    'verb': 'Verb',
    'object': 'Objekt',
    'article': 'Artikel',
    'noun': 'Nomen',
    'adjective': 'Adjektiv',

    // Common feedback patterns
    'is correct because': 'ist richtig, weil',
    'is the third person singular form of': 'ist die dritte Person Singular Form von',
    'You know the genders of these nouns.': 'Du kennst die Geschlechter dieser Nomen.',
    'You know your noun genders well.': 'Du kennst die Geschlechter der Nomen gut.',
    'You know your food categories well.': 'Du kennst deine Essenskategorien gut.',
    "You've correctly paired all the words.": 'Du hast alle Wörter richtig zugeordnet.',
    'You built grammatically correct sentences.': 'Du hast grammatikalisch richtige Sätze gebildet.',
    'You correctly categorized all the foods.': 'Du hast alle Lebensmittel richtig kategorisiert.',
    'Your sentences are clear and grammatically correct.': 'Deine Sätze sind klar und grammatikalisch richtig.',
    'Your writing shows good German skills.': 'Dein Schreiben zeigt gute Deutschkenntnisse.',
    'You understand regular verb conjugation.': 'Du verstehst die Konjugation regelmäßiger Verben.',
    "You've correctly conjugated": 'Du hast richtig konjugiert',
    'You know the verb': 'Du kennst das Verb',
    'well.': 'gut.',

    // Hint patterns
    'Think about what you do when you move to school.': 'Denke daran, was du machst, wenn du zur Schule gehst.',
    'The verb starts with': 'Das Verb beginnt mit',
    'Remember: Apfel is masculine (der Apfel).': 'Erinnerung: Apfel ist maskulin (der Apfel).',
    'What form does': 'Welche Form nimmt',
    'take in the accusative case?': 'im Akkusativ an?',
    "It's a two-digit number.": 'Es ist eine zweistellige Zahl.',
    'The number starts with': 'Die Zahl beginnt mit',
    'Think about when you greet someone early in the day.': 'Denke daran, wann du jemanden früh am Tag begrüßt.',
    'The subject is': 'Das Subjekt ist',
    'Read the sentence carefully.': 'Lies den Satz sorgfältig.',
    'What food item is mentioned?': 'Welches Lebensmittel wird erwähnt?',
    'Haus sounds like': 'Haus klingt wie',
    'Auto is related to': 'Auto ist verwandt mit',
    'Some pairs were incorrect. Check the correct matches and try again.': 'Einige Paare waren falsch. Überprüfe die richtigen Paare und versuche es erneut.',
    'der Tisch, die Tafel, das Buch, die Stifte.': 'der Tisch, die Tafel, das Buch, die Stifte.',
    'subject + verb + object. The verb must match the subject.': 'Subjekt + Verb + Objekt. Das Verb muss zum Subjekt passen.',
    'Check your verb conjugations. Each subject needs a matching verb form.': 'Überprüfe deine Verbkonjugationen. Jedes Subjekt braucht eine passende Verbform.',
    'Apfel, Banane, Orange are fruits. Tomate, Gurke, Karotte are vegetables.': 'Apfel, Banane, Orange sind Obst. Tomate, Gurke, Karotte sind Gemüse.',
    'Study the genders: der Tisch, der Stuhl, der Lehrer, die Tafel, die Tür, die Lehrerin, das Buch, das Fenster, das Heft.': 'Lerne die Geschlechter: der Tisch, der Stuhl, der Lehrer, die Tafel, die Tür, die Lehrerin, das Buch, das Fenster, das Heft.',
    'Fisch, Wal, Delfin live in water; Hund, Katze, Pferd on land; Vogel, Schmetterling, Biene in the air.': 'Fisch, Wal, Delfin leben im Wasser; Hund, Katze, Pferd auf dem Land; Vogel, Schmetterling, Biene in der Luft.',
    'Try to use complete sentences with subject and verb.': 'Versuche, vollständige Sätze mit Subjekt und Verb zu verwenden.',
    'Try to write longer sentences with connecting words.': 'Versuche, längere Sätze mit Bindewörtern zu schreiben.',
    'ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.': 'ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.',
    'ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.': 'ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.',
    'Regular verbs: ich lerne, du lernst, er/sie/es lernt, wir lernen, ihr lernt, sie/Sie lernen.': 'Regelmäßige Verben: ich lerne, du lernst, er/sie/es lernt, wir lernen, ihr lernt, sie/Sie lernen.',
    "connects the sentence with a reason.": 'verbindet den Satz mit einem Grund.',
    'shows the contrast between your and your brother\'s preferences.': 'zeigt den Kontrast zwischen deinen und den Vorlieben deines Bruders.',
    'connects two similar activities.': 'verbindet zwei ähnliche Aktivitäten.',
    'connects two activities that you both do.': 'verbindet zwei Aktivitäten, die ihr beide macht.',
    'In German, the verb typically comes second in main clauses.': 'Im Deutschen steht das Verb normalerweise an zweiter Stelle in Hauptsätzen.',
    'Subject + Verb + Time + Place.': 'Subjekt + Verb + Zeit + Ort.',
    'In subordinate clauses with': 'In Nebensätzen mit',
    'the verb moves to the end.': 'geht das Verb ans Ende.',
    'goes to the end after': 'geht ans Ende nach',

    // Specific translations
    "'Gehe' means 'I go' in German.": "'Gehe' bedeutet 'ich gehe' auf Deutsch.",
    "'Guten Morgen' means 'Good morning'.": "'Guten Morgen' bedeutet 'Guten Morgen'.",
    "'Morgen' translates to 'morning'.": "'Morgen' bedeutet 'Morgen'.",
    "'Zwanzig' means 'twenty' in German.": "'Zwanzig' bedeutet 'zwanzig' auf Deutsch.",
    "'Einen' is correct because Apfel is masculine and in the accusative case.": "'Einen' ist richtig, weil Apfel maskulin ist und im Akkusativ steht.",
    "'Liest' is the third person singular form of 'lesen'.": "'Liest' ist die dritte Person Singular Form von 'lesen'.",
    "For 'er/sie/es', the verb 'lesen' becomes 'liest'.": "Bei 'er/sie/es' wird das Verb 'lesen' zu 'liest'.",
    'Maria wants a sandwich with cheese and tomatoes.': 'Maria möchte ein Sandwich mit Käse und Tomaten.',
    "Maria wants 'ein Sandwich' (a sandwich). The sentence clearly states this.": "Maria möchte 'ein Sandwich'. Der Satz sagt das klar aus.",
    'The answer is': 'Die Antwort ist',
    'Obst = fruit, Gemüse = vegetable, Fleisch = meat, Getränk = drink.': 'Obst = Gemüse = Fleisch = Getränk.',

    // More patterns
    'Perfect sentence construction!': 'Perfekter Satzbau!',
    'Excellent matching!': 'Ausgezeichnetes Zuordnen!',
    'Excellent categorization of animal habitats!': 'Ausgezeichnete Kategorisierung der Tierlebensräume!',
    'Great sorting!': 'Tolle Sortierung!',
    'Great writing!': 'Tolles Schreiben!',
    'Excellent composition!': 'Ausgezeichnete Zusammenstellung!',
    'Perfect conjugation!': 'Perfekte Konjugation!',
    'Perfect! You understand regular verb conjugation.': 'Perfekt! Du verstehst die Konjugation regelmäßiger Verben.',
    'Perfect! In German, the verb typically comes second in main clauses.': 'Perfekt! Im Deutschen steht das Verb normalerweise an zweiter Stelle in Hauptsätzen.',
    'Perfect! In subordinate clauses with': 'Perfekt! In Nebensätzen mit',
    'Excellent! You formed the question correctly.': 'Ausgezeichnet! Du hast die Frage richtig gebildet.',
    'Excellent! You built grammatically correct sentences.': 'Ausgezeichnet! Du hast grammatikalisch richtige Sätze gebildet.',
    'Excellent! You\'ve correctly conjugated': 'Ausgezeichnet! Du hast richtig konjugiert',
};

// Function to translate a single string
function translateString(text) {
    if (!text || typeof text !== 'string') return text;

    // Check if it starts with t: (i18n key) - don't translate
    if (text.startsWith('t:')) return text;

    let result = text;

    // Sort by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    for (const english of sortedKeys) {
        const german = translations[english];
        // Case-insensitive replacement for whole phrases
        const regex = new RegExp(escapeRegex(english), 'gi');
        result = result.replace(regex, german);
    }

    return result;
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to translate hints array
function translateHints(hints) {
    if (!Array.isArray(hints)) return hints;
    return hints.map(hint => translateString(hint));
}

// Main function
function main() {
    console.log('Reading exercises.json...');
    const content = fs.readFileSync(exercisesPath, 'utf-8');
    const data = JSON.parse(content);

    let translationCount = 0;

    console.log(`Processing ${data.exercises.length} exercises...`);

    for (const exercise of data.exercises) {
        // Translate instruction
        if (exercise.instruction && !exercise.instruction.startsWith('t:')) {
            const original = exercise.instruction;
            exercise.instruction = translateString(exercise.instruction);
            if (original !== exercise.instruction) {
                translationCount++;
            }
        }

        // Translate hints
        if (Array.isArray(exercise.hints)) {
            for (let i = 0; i < exercise.hints.length; i++) {
                const original = exercise.hints[i];
                exercise.hints[i] = translateString(exercise.hints[i]);
                if (original !== exercise.hints[i]) {
                    translationCount++;
                }
            }
        }

        // Translate feedbackCorrect
        if (exercise.feedbackCorrect) {
            const original = exercise.feedbackCorrect;
            exercise.feedbackCorrect = translateString(exercise.feedbackCorrect);
            if (original !== exercise.feedbackCorrect) {
                translationCount++;
            }
        }

        // Translate feedbackIncorrect
        if (exercise.feedbackIncorrect) {
            const original = exercise.feedbackIncorrect;
            exercise.feedbackIncorrect = translateString(exercise.feedbackIncorrect);
            if (original !== exercise.feedbackIncorrect) {
                translationCount++;
            }
        }
    }

    console.log(`Translated ${translationCount} strings.`);

    // Write back to file
    console.log('Writing updated exercises.json...');
    fs.writeFileSync(exercisesPath, JSON.stringify(data, null, 4), 'utf-8');

    console.log('Done!');
}

main();
