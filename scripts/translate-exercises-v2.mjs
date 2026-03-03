#!/usr/bin/env node
/**
 * Script to translate ALL remaining English strings in exercises.json to German
 * This is a comprehensive translation pass
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exercisesPath = path.join(__dirname, '..', 'src', 'data', 'exercises.json');

// Comprehensive translation mappings
const translations = {
    // Labels
    '"label": "Subject"': '"label": "Subjekt"',
    '"label": "Verb"': '"label": "Verb"',
    '"label": "Object"': '"label": "Objekt"',
    '"label": "Obst (Fruit)"': '"label": "Obst"',
    '"label": "Gemüse (Vegetable)"': '"label": "Gemüse"',
    '"label": "Maskulin (der)"': '"label": "Maskulin (der)"',
    '"label": "Feminin (die)"': '"label": "Feminin (die)"',
    '"label": "Neutrum (das)"': '"label": "Neutrum (das)"',

    // Feedback strings - full replacements
    "'I go' auf Deutsch": "'ich gehe' auf Deutsch",
    "Apfel is maskulin, and in the Akkusativ, 'ein' becomes 'einen'.": "Apfel ist maskulin, und im Akkusativ wird 'ein' zu 'einen'.",
    "(twenty). Übe weiter your number words!": "(zwanzig). Übe weiter deine Zahlwörter!",
    "Obst bedeutet fruit.": "Obst ist eine Lebensmittelkategorie.",
    "Gemüse bedeutet vegetable.": "Gemüse ist eine Lebensmittelkategorie.",
    "Tisch (table) is maskulin.": "Tisch ist maskulin.",
    "Buch (book) is sächlich.": "Buch ist sächlich.",
    "Apfel is a fruit.": "Apfel ist ein Obst.",
    "Karotte is a vegetable.": "Karotte ist ein Gemüse.",

    // Instructions
    "What fruit is this? Write the German word.": "Welches Obst ist das? Schreibe das deutsche Wort.",
    "What vegetable is this? Write the German word.": "Welches Gemüse ist das? Schreibe das deutsche Wort.",
    "What animal is this? Write the German word.": "Welches Tier ist das? Schreibe das deutsche Wort.",
    "What object is this? Write the German word.": "Welcher Gegenstand ist das? Schreibe das deutsche Wort.",

    // Common patterns
    "means": "bedeutet",
    "in German": "auf Deutsch",
    "is a": "ist ein",
    "is an": "ist ein",
    "is the": "ist der/die/das",
    "is maskulin": "ist maskulin",
    "is feminin": "ist feminin",
    "is sächlich": "ist sächlich",
    "is neutrum": "ist sächlich",
    "becomes": "wird",
    "and in the": "und im",
    "your number words": "deine Zahlwörter",
    "fruit": "Obst",
    "vegetable": "Gemüse",
    "meat": "Fleisch",
    "drink": "Getränk",
    "table": "Tisch",
    "book": "Buch",
    "twenty": "zwanzig",

    // Hint patterns
    "Think about": "Denke an",
    "Remember:": "Erinnerung:",
    "Remember": "Erinnerung",
    "The verb starts with": "Das Verb beginnt mit",
    "The number starts with": "Die Zahl beginnt mit",
    "Read the sentence carefully": "Lies den Satz sorgfältig",
    "What food item is mentioned": "Welches Lebensmittel wird erwähnt",
    "sounds like": "klingt wie",
    "is related to": "ist verwandt mit",
    "Some pairs were incorrect": "Einige Paare waren falsch",
    "Check the correct matches": "Überprüfe die richtigen Paare",
    "try again": "versuche es erneut",
    "subject + verb + object": "Subjekt + Verb + Objekt",
    "The verb must match the subject": "Das Verb muss zum Subjekt passen",
    "Check your verb conjugations": "Überprüfe deine Verbkonjugationen",
    "Each subject needs a matching verb form": "Jedes Subjekt braucht eine passende Verbform",
    "are fruits": "sind Obst",
    "are vegetables": "sind Gemüse",
    "Study the genders": "Lerne die Geschlechter",
    "live in water": "leben im Wasser",
    "on land": "auf dem Land",
    "in the air": "in der Luft",
    "Try to use complete sentences": "Versuche, vollständige Sätze zu verwenden",
    "Try to write longer sentences": "Versuche, längere Sätze zu schreiben",
    "with connecting words": "mit Bindewörtern",
    "with subject and verb": "mit Subjekt und Verb",

    // Feedback patterns
    "Great job!": "Toll gemacht!",
    "Great job": "Toll gemacht",
    "Perfect!": "Perfekt!",
    "Perfect": "Perfekt",
    "Excellent!": "Ausgezeichnet!",
    "Excellent": "Ausgezeichnet",
    "Correct!": "Richtig!",
    "Correct": "Richtig",
    "Well done!": "Gut gemacht!",
    "Well done": "Gut gemacht",
    "That's right!": "Das ist richtig!",
    "That's right": "Das ist richtig",
    "Not quite.": "Nicht ganz.",
    "Not quite": "Nicht ganz",
    "Try again.": "Versuche es noch einmal.",
    "Try again": "Versuche es noch einmal",
    "Keep practicing!": "Übe weiter!",
    "Keep practicing": "Übe weiter",
    "Good effort!": "Gute Anstrengung!",
    "Good effort": "Gute Anstrengung",
    "The correct answer is": "Die richtige Antwort ist",
    "The correct form is": "Die richtige Form ist",
    "The correct order is": "Die richtige Reihenfolge ist",

    // Grammar terms in context
    "third person singular": "dritte Person Singular",
    "first person singular": "erste Person Singular",
    "second person singular": "zweite Person Singular",
    "accusative case": "Akkusativ",
    "nominative case": "Nominativ",
    "dative case": "Dativ",
    "genitive case": "Genitiv",

    // More specific translations
    "is correct because": "ist richtig, weil",
    "is the third person singular form of": "ist die dritte Person Singular Form von",
    "You know the genders of these nouns": "Du kennst die Geschlechter dieser Nomen",
    "You know your noun genders well": "Du kennst die Geschlechter der Nomen gut",
    "You know your food categories well": "Du kennst deine Essenskategorien gut",
    "You've correctly paired all the words": "Du hast alle Wörter richtig zugeordnet",
    "You built grammatically correct sentences": "Du hast grammatikalisch richtige Sätze gebildet",
    "You correctly categorized all the foods": "Du hast alle Lebensmittel richtig kategorisiert",
    "Your sentences are clear and grammatically correct": "Deine Sätze sind klar und grammatikalisch richtig",
    "Your writing shows good German skills": "Dein Schreiben zeigt gute Deutschkenntnisse",
    "You understand regular verb conjugation": "Du verstehst die Konjugation regelmäßiger Verben",
    "You've correctly conjugated": "Du hast richtig konjugiert",
    "You know the verb": "Du kennst das Verb",

    // Instruction translations
    "Complete the sentence with the correct article": "Ergänze den Satz mit dem richtigen Artikel",
    "Complete the sentence with the right connector": "Ergänze den Satz mit dem richtigen Bindewort",
    "Complete the sentence": "Ergänze den Satz",
    "Fill in the missing number word": "Füge das fehlende Zahlwort ein",
    "Choose the correct translation": "Wähle die richtige Übersetzung",
    "Select the correct verb form": "Wähle die richtige Verbform",
    "Select the best connector for this sentence": "Wähle das beste Bindewort für diesen Satz",
    "Choose the correct connector to complete the sentence": "Wähle das richtige Bindewort, um den Satz zu ergänzen",
    "Read and answer the question": "Lies und beantworte die Frage",
    "Match the German words with their English translations": "Ordne die deutschen Wörter ihren englischen Übersetzungen zu",
    "Match the foods to their categories": "Ordne die Lebensmittel ihren Kategorien zu",
    "Match the articles to the correct nouns": "Ordne die Artikel den richtigen Nomen zu",
    "Build a correct German sentence from the words": "Bilde einen korrekten deutschen Satz aus den Wörtern",
    "Build sentences about food preferences": "Bilde Sätze über Essensvorlieben",
    "Sort the words into the correct categories": "Sortiere die Wörter in die richtigen Kategorien",
    "Sort the nouns by their gender": "Sortiere die Nomen nach ihrem Geschlecht",
    "Sort the animals by where they live": "Sortiere die Tiere nach ihrem Lebensraum",
    "Write about your daily routine": "Schreibe über deine Tagesroutine",
    "Write about your favorite subject in school": "Schreibe über dein Lieblingsfach in der Schule",
    "Conjugate the verb": "Konjugiere das Verb",
    "in present tense": "im Präsens",
    "in the present tense": "im Präsens",
    "Put the words in the correct order to form a sentence": "Bringe die Wörter in die richtige Reihenfolge, um einen Satz zu bilden",
    "Put the words in order to make a sentence with": "Bringe die Wörter in die richtige Reihenfolge, um einen Satz mit",
    "Arrange the words to form a correct question": "Ordne die Wörter an, um eine richtige Frage zu bilden",

    // More hints
    "The subject is": "Das Subjekt ist",
    "What is the third person singular form of": "Was ist die dritte Person Singular Form von",
    "It's a two-digit number": "Es ist eine zweistellige Zahl",
    "Think about when you greet someone early in the day": "Denke daran, wann du jemanden früh am Tag begrüßt",
    "Haus sounds like 'house'": "Haus klingt wie 'house'",
    "Auto is related to 'automobile'": "Auto ist verwandt mit 'Automobil'",
    "der Tisch, die Tafel, das Buch, die Stifte": "der Tisch, die Tafel, das Buch, die Stifte",
    "Apfel, Banane, Orange are fruits. Tomate, Gurke, Karotte are vegetables": "Apfel, Banane, Orange sind Obst. Tomate, Gurke, Karotte sind Gemüse",
    "Fisch, Wal, Delfin live in water; Hund, Katze, Pferd on land; Vogel, Schmetterling, Biene in the air": "Fisch, Wal, Delfin leben im Wasser; Hund, Katze, Pferd auf dem Land; Vogel, Schmetterling, Biene in der Luft",
    "ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind": "ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind",
    "ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben": "ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben",
    "Regular verbs: ich lerne, du lernst, er/sie/es lernt, wir lernen, ihr lernt, sie/Sie lernen": "Regelmäßige Verben: ich lerne, du lernst, er/sie/es lernt, wir lernen, ihr lernt, sie/Sie lernen",
    "connects the sentence with a reason": "verbindet den Satz mit einem Grund",
    "shows the contrast between your and your brother's preferences": "zeigt den Kontrast zwischen deinen und den Vorlieben deines Bruders",
    "connects two similar activities": "verbindet zwei ähnliche Aktivitäten",
    "connects two activities that you both do": "verbindet zwei Aktivitäten, die ihr beide macht",
    "In German, the verb typically comes second in main clauses": "Im Deutschen steht das Verb normalerweise an zweiter Stelle in Hauptsätzen",
    "Subject + Verb + Time + Place": "Subjekt + Verb + Zeit + Ort",
    "In subordinate clauses with": "In Nebensätzen mit",
    "the verb moves to the end": "geht das Verb ans Ende",
    "goes to the end after": "geht ans Ende nach",

    // More feedback
    "Perfect sentence construction!": "Perfekter Satzbau!",
    "Excellent matching!": "Ausgezeichnetes Zuordnen!",
    "Excellent categorization of animal habitats!": "Ausgezeichnete Kategorisierung der Tierlebensräume!",
    "Great sorting!": "Tolle Sortierung!",
    "Great writing!": "Tolles Schreiben!",
    "Excellent composition!": "Ausgezeichnete Zusammenstellung!",
    "Perfect conjugation!": "Perfekte Konjugation!",
    "Perfect! You understand regular verb conjugation": "Perfekt! Du verstehst die Konjugation regelmäßiger Verben",
    "Perfect! In German, the verb typically comes second in main clauses": "Perfekt! Im Deutschen steht das Verb normalerweise an zweiter Stelle in Hauptsätzen",
    "Perfect! In subordinate clauses with": "Perfekt! In Nebensätzen mit",
    "Excellent! You formed the question correctly": "Ausgezeichnet! Du hast die Frage richtig gebildet",
    "Excellent! You built grammatically correct sentences": "Ausgezeichnet! Du hast grammatikalisch richtige Sätze gebildet",
    "Excellent! You've correctly conjugated": "Ausgezeichnet! Du hast richtig konjugiert",

    // More common words
    "because": "weil",
    "but": "aber",
    "and": "und",
    "or": "oder",
    "the": "der/die/das",
    "a": "ein",
    "an": "ein",
    "is": "ist",
    "are": "sind",
    "was": "war",
    "were": "waren",
    "have": "haben",
    "has": "hat",
    "had": "hatte",
    "will": "werden",
    "would": "würde",
    "could": "könnte",
    "should": "sollte",
    "can": "können",
    "must": "müssen",
    "to": "zu",
    "for": "für",
    "with": "mit",
    "in": "in",
    "on": "auf",
    "at": "bei",
    "by": "von",
    "of": "von",
    "from": "aus",
    "about": "über",
    "into": "in",
    "onto": "auf",
};

// Function to translate text using direct string replacement
function translateText(text) {
    if (!text || typeof text !== 'string') return text;

    // Check if it starts with t: (i18n key) - don't translate
    if (text.startsWith('t:')) return text;

    let result = text;

    // Sort by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    for (const english of sortedKeys) {
        const german = translations[english];
        // Case-sensitive replacement for exact matches
        result = result.split(english).join(german);
    }

    return result;
}

// Main function
function main() {
    console.log('Reading exercises.json...');
    let content = fs.readFileSync(exercisesPath, 'utf-8');
    const originalLength = content.length;

    console.log('Applying translations...');

    // Sort by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    for (const english of sortedKeys) {
        const german = translations[english];
        if (content.includes(english)) {
            const count = (content.match(new RegExp(escapeRegex(english), 'g')) || []).length;
            content = content.split(english).join(german);
            if (count > 0) {
                console.log(`  "${english.substring(0, 50)}..." -> ${count} occurrence(s)`);
            }
        }
    }

    const translationCount = Math.abs(content.length - originalLength);
    console.log(`\nTranslation changed ${translationCount} characters.`);

    // Parse to verify JSON is valid
    console.log('Validating JSON...');
    try {
        const data = JSON.parse(content);
        console.log(`Valid JSON with ${data.exercises.length} exercises.`);
    } catch (e) {
        console.error('ERROR: Invalid JSON after translation!');
        console.error(e.message);
        process.exit(1);
    }

    // Write back to file
    console.log('Writing updated exercises.json...');
    fs.writeFileSync(exercisesPath, content, 'utf-8');

    console.log('Done!');
}

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

main();
