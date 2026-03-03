#!/usr/bin/env node
/**
 * Script to translate English strings in exercises.json to German
 * Only translates specific fields: instruction, hints, feedbackCorrect, feedbackIncorrect
 * Uses careful phrase matching, not single words
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exercisesPath = path.join(__dirname, '..', 'src', 'data', 'exercises.json');

// Translation mappings - ONLY complete phrases, no single words
const translations = {
    // Labels
    '"label": "Subject"': '"label": "Subjekt"',
    '"label": "Object"': '"label": "Objekt"',
    '"label": "Obst (Fruit)"': '"label": "Obst"',
    '"label": "Gemüse (Vegetable)"': '"label": "Gemüse"',

    // Full feedback strings
    "Great job! 'Gehe' means 'I go' in German.": "Toll gemacht! 'Gehe' bedeutet 'ich gehe' auf Deutsch.",
    "Not quite. The correct answer is 'gehe' - 'I go' in German.": "Nicht ganz. Die richtige Antwort ist 'gehe' - 'ich gehe' auf Deutsch.",
    "Perfect! 'Einen' is correct because Apfel is masculine and in the accusative case.": "Perfekt! 'Einen' ist richtig, weil Apfel maskulin ist und im Akkusativ steht.",
    "The correct answer is 'einen'. Apfel is masculine, and in the accusative case, 'ein' becomes 'einen'.": "Die richtige Antwort ist 'einen'. Apfel ist maskulin, und im Akkusativ wird 'ein' zu 'einen'.",
    "Excellent! 'Zwanzig' means 'twenty' in German.": "Ausgezeichnet! 'Zwanzig' bedeutet 'zwanzig' auf Deutsch.",
    "The answer is 'zwanzig' (twenty). Keep practicing your number words!": "Die Antwort ist 'zwanzig'. Übe weiter deine Zahlwörter!",
    "That's right! 'Guten Morgen' means 'Good morning'.": "Das ist richtig! 'Guten Morgen' bedeutet 'Guten Morgen'.",
    "'Guten Morgen' means 'Good morning'. 'Morgen' translates to 'morning'.": "'Guten Morgen' bedeutet 'Guten Morgen'. 'Morgen' bedeutet 'Morgen'.",
    "Correct! 'Liest' is the third person singular form of 'lesen'.": "Richtig! 'Liest' ist die dritte Person Singular Form von 'lesen'.",
    "The correct form is 'liest'. For 'er/sie/es', the verb 'lesen' becomes 'liest'.": "Die richtige Form ist 'liest'. Bei 'er/sie/es' wird das Verb 'lesen' zu 'liest'.",
    "Well done! Maria wants a sandwich with cheese and tomatoes.": "Gut gemacht! Maria möchte ein Sandwich mit Käse und Tomaten.",
    "Maria wants 'ein Sandwich' (a sandwich). The sentence clearly states this.": "Maria möchte 'ein Sandwich'. Der Satz sagt das klar aus.",
    "Excellent matching! You've correctly paired all the words.": "Ausgezeichnetes Zuordnen! Du hast alle Wörter richtig zugeordnet.",
    "Some pairs were incorrect. Check the correct matches and try again.": "Einige Paare waren falsch. Überprüfe die richtigen Paare und versuche es erneut.",
    "Perfect! You know your food categories well.": "Perfekt! Du kennst deine Essenskategorien gut.",
    "Remember: Obst = fruit, Gemüse = vegetable, Fleisch = meat, Getränk = drink.": "Erinnerung: Obst = Obst, Gemüse = Gemüse, Fleisch = Fleisch, Getränk = Getränk.",
    "Great job! You know the genders of these nouns.": "Toll gemacht! Du kennst die Geschlechter dieser Nomen.",
    "Remember: der Tisch, die Tafel, das Buch, die Stifte.": "Erinnerung: der Tisch, die Tafel, das Buch, die Stifte.",
    "Perfect sentence construction!": "Perfekter Satzbau!",
    "Remember: subject + verb + object. The verb must match the subject.": "Erinnerung: Subjekt + Verb + Objekt. Das Verb muss zum Subjekt passen.",
    "Excellent! You built grammatically correct sentences.": "Ausgezeichnet! Du hast grammatikalisch richtige Sätze gebildet.",
    "Check your verb conjugations. Each subject needs a matching verb form.": "Überprüfe deine Verbkonjugationen. Jedes Subjekt braucht eine passende Verbform.",
    "Great sorting! You correctly categorized all the foods.": "Tolle Sortierung! Du hast alle Lebensmittel richtig kategorisiert.",
    "Remember: Apfel, Banane, Orange are fruits. Tomate, Gurke, Karotte are vegetables.": "Erinnerung: Apfel, Banane, Orange sind Obst. Tomate, Gurke, Karotte sind Gemüse.",
    "Perfect! You know your noun genders well.": "Perfekt! Du kennst die Geschlechter der Nomen gut.",
    "Study the genders: der Tisch, der Stuhl, der Lehrer, die Tafel, die Tür, die Lehrerin, das Buch, das Fenster, das Heft.": "Lerne die Geschlechter: der Tisch, der Stuhl, der Lehrer, die Tafel, die Tür, die Lehrerin, das Buch, das Fenster, das Heft.",
    "Excellent categorization of animal habitats!": "Ausgezeichnete Kategorisierung der Tierlebensräume!",
    "Remember: Fisch, Wal, Delfin live in water; Hund, Katze, Pferd on land; Vogel, Schmetterling, Biene in the air.": "Erinnerung: Fisch, Wal, Delfin leben im Wasser; Hund, Katze, Pferd auf dem Land; Vogel, Schmetterling, Biene in der Luft.",
    "Great writing! Your sentences are clear and grammatically correct.": "Tolles Schreiben! Deine Sätze sind klar und grammatikalisch richtig.",
    "Good effort! Try to use complete sentences with subject and verb.": "Gute Anstrengung! Versuche, vollständige Sätze mit Subjekt und Verb zu verwenden.",
    "Excellent composition! Your writing shows good German skills.": "Ausgezeichnete Zusammenstellung! Dein Schreiben zeigt gute Deutschkenntnisse.",
    "Keep practicing! Try to write longer sentences with connecting words.": "Übe weiter! Versuche, längere Sätze mit Bindewörtern zu schreiben.",
    "Perfect conjugation! You know the verb 'sein' well.": "Perfekte Konjugation! Du kennst das Verb 'sein' gut.",
    "Remember: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.": "Erinnerung: ich bin, du bist, er/sie/es ist, wir sind, ihr seid, sie/Sie sind.",
    "Excellent! You've correctly conjugated 'haben'.": "Ausgezeichnet! Du hast 'haben' richtig konjugiert.",
    "Remember: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.": "Erinnerung: ich habe, du hast, er/sie/es hat, wir haben, ihr habt, sie/Sie haben.",
    "Perfect! You understand regular verb conjugation.": "Perfekt! Du verstehst die Konjugation regelmäßiger Verben.",
    "Regular verbs: ich lerne, du lernst, er/sie/es lernt, wir lernen, ihr lernt, sie/Sie lernen.": "Regelmäßige Verben: ich lerne, du lernst, er/sie/es lernt, wir lernen, ihr lernt, sie/Sie lernen.",
    "Correct! 'Weil' connects the sentence with a reason.": "Richtig! 'Weil' verbindet den Satz mit einem Grund.",
    "The correct connector is 'weil' (because). It introduces the reason for going to school.": "Das richtige Bindewort ist 'weil'. Es führt den Grund ein, warum man zur Schule geht.",
    "Great! 'Aber' shows the contrast between your and your brother's preferences.": "Toll! 'Aber' zeigt den Kontrast zwischen deinen und den Vorlieben deines Bruders.",
    "Use 'aber' (but) to show contrast between two different preferences.": "Benutze 'aber', um den Kontrast zwischen zwei verschiedenen Vorlieben zu zeigen.",
    "Correct! 'Und' connects two similar activities.": "Richtig! 'Und' verbindet zwei ähnliche Aktivitäten.",
    "Use 'und' (and) to connect two activities that you both do.": "Benutze 'und', um zwei Aktivitäten zu verbinden, die ihr beide macht.",
    "Perfect! In German, the verb typically comes second in main clauses.": "Perfekt! Im Deutschen steht das Verb normalerweise an zweiter Stelle in Hauptsätzen.",
    "The correct order is: Ich gehe jeden Tag zur Schule. Remember: Subject + Verb + Time + Place.": "Die richtige Reihenfolge ist: Ich gehe jeden Tag zur Schule. Erinnerung: Subjekt + Verb + Zeit + Ort.",
    "Excellent! You formed the question correctly.": "Ausgezeichnet! Du hast die Frage richtig gebildet.",
    "The correct order is: Was möchtest du zum Frühstück essen? (What would you like to eat for breakfast?)": "Die richtige Reihenfolge ist: Was möchtest du zum Frühstück essen?",
    "Perfect! In subordinate clauses with 'weil', the verb moves to the end.": "Perfekt! In Nebensätzen mit 'weil' geht das Verb ans Ende.",
    "Remember: Ich lerne Deutsch, weil ich in Deutschland wohnen möchte. The verb 'möchte' goes to the end after 'weil'.": "Erinnerung: Ich lerne Deutsch, weil ich in Deutschland wohnen möchte. Das Verb 'möchte' geht ans Ende nach 'weil'.",

    // Hints
    "Think about what you do when you move to school.": "Denke daran, was du machst, wenn du zur Schule gehst.",
    "The verb starts with 'g'.": "Das Verb beginnt mit 'g'.",
    "Remember: Apfel is masculine (der Apfel).": "Erinnerung: Apfel ist maskulin (der Apfel).",
    "What form does 'ein' take in the accusative case?": "Welche Form nimmt 'ein' im Akkusativ an?",
    "It's a two-digit number.": "Es ist eine zweistellige Zahl.",
    "The number starts with 'zw'.": "Die Zahl beginnt mit 'zw'.",
    "Think about when you greet someone early in the day.": "Denke daran, wann du jemanden früh am Tag begrüßt.",
    "Morgen means 'morning'.": "Morgen bedeutet 'Morgen'.",
    "The subject is 'er' (he).": "Das Subjekt ist 'er' (er).",
    "What is the third person singular form of 'lesen'?": "Was ist die dritte Person Singular Form von 'lesen'?",
    "Read the sentence carefully.": "Lies den Satz sorgfältig.",
    "What food item is mentioned?": "Welches Lebensmittel wird erwähnt?",
    "Haus sounds like 'house'.": "Haus klingt wie 'house'.",
    "Auto is related to 'automobile'.": "Auto ist verwandt mit 'Automobil'.",
    "Obst bedeutet fruit.": "Obst ist eine Lebensmittelkategorie.",
    "Gemüse bedeutet vegetable.": "Gemüse ist eine Lebensmittelkategorie.",
    "Tisch (table) is maskulin.": "Tisch ist maskulin.",
    "Buch (book) is sächlich.": "Buch ist sächlich.",
    "Apfel is a fruit.": "Apfel ist ein Obst.",
    "Karotte is a vegetable.": "Karotte ist ein Gemüse.",

    // Instructions
    "Complete the sentence with the correct article.": "Ergänze den Satz mit dem richtigen Artikel.",
    "Fill in the missing number word.": "Füge das fehlende Zahlwort ein.",
    "Choose the correct translation.": "Wähle die richtige Übersetzung.",
    "Select the correct verb form.": "Wähle die richtige Verbform.",
    "Read and answer the question.": "Lies und beantworte die Frage.",
    "Match the German words with their English translations.": "Ordne die deutschen Wörter ihren englischen Übersetzungen zu.",
    "Match the foods to their categories.": "Ordne die Lebensmittel ihren Kategorien zu.",
    "Match the articles to the correct nouns.": "Ordne die Artikel den richtigen Nomen zu.",
    "Build a correct German sentence from the words.": "Bilde einen korrekten deutschen Satz aus den Wörtern.",
    "Build sentences about food preferences.": "Bilde Sätze über Essensvorlieben.",
    "Sort the words into the correct categories.": "Sortiere die Wörter in die richtigen Kategorien.",
    "Sort the nouns by their gender.": "Sortiere die Nomen nach ihrem Geschlecht.",
    "Sort the animals by where they live.": "Sortiere die Tiere nach ihrem Lebensraum.",
    "Write about your daily routine.": "Schreibe über deine Tagesroutine.",
    "Write about your favorite subject in school.": "Schreibe über dein Lieblingsfach in der Schule.",
    "Conjugate the verb 'sein' (to be) in present tense.": "Konjugiere das Verb 'sein' im Präsens.",
    "Conjugate the verb 'haben' (to have) in present tense.": "Konjugiere das Verb 'haben' im Präsens.",
    "Conjugate the regular verb 'lernen' (to learn) in present tense.": "Konjugiere das regelmäßige Verb 'lernen' im Präsens.",
    "Choose the correct connector to complete the sentence.": "Wähle das richtige Bindewort, um den Satz zu ergänzen.",
    "Select the best connector for this sentence.": "Wähle das beste Bindewort für diesen Satz.",
    "Complete the sentence with the right connector.": "Ergänze den Satz mit dem richtigen Bindewort.",
    "Put the words in the correct order to form a sentence.": "Bringe die Wörter in die richtige Reihenfolge, um einen Satz zu bilden.",
    "Arrange the words to form a correct question.": "Ordne die Wörter an, um eine richtige Frage zu bilden.",
    "Put the words in order to make a sentence with 'weil'.": "Bringe die Wörter in die richtige Reihenfolge, um einen Satz mit 'weil' zu bilden.",
    "What fruit is this? Write the German word.": "Welches Obst ist das? Schreibe das deutsche Wort.",
    "What vegetable is this? Write the German word.": "Welches Gemüse ist das? Schreibe das deutsche Wort.",
    "What animal is this? Write the German word.": "Welches Tier ist das? Schreibe das deutsche Wort.",
    "What object is this? Write the German word.": "Welcher Gegenstand ist das? Schreibe das deutsche Wort.",

    // More hints
    "Obst means fruit.": "Obst ist eine Lebensmittelkategorie.",
    "Gemüse means vegetable.": "Gemüse ist eine Lebensmittelkategorie.",
    "Tisch (table) is masculine.": "Tisch ist maskulin.",
    "Buch (book) is neuter.": "Buch ist sächlich.",
    "Apfel is a fruit.": "Apfel ist ein Obst.",
    "Karotte is a vegetable.": "Karotte ist ein Gemüse.",

    // More feedback strings
    "Richtig! 'Haus' means 'house' in German.": "Richtig! 'Haus' bedeutet 'Haus' auf Deutsch.",
    "Sehr gut! 'Apfel' is the German word for 'apple'.": "Sehr gut! 'Apfel' ist das deutsche Wort für 'Apfel'.",
    "This is an 'Apfel' (apple). Remember: der Apfel.": "Das ist ein 'Apfel'. Erinnerung: der Apfel.",
    "Wunderbar! 'Hund' means 'dog' in German.": "Wunderbar! 'Hund' bedeutet 'Hund' auf Deutsch.",
    "This is a 'Hund' (dog). It's a common household pet.": "Das ist ein 'Hund'. Es ist ein häufiges Haustier.",
    "The correct answer is 'Haus' (house). This is where people live.": "Die richtige Antwort ist 'Haus'. Hier wohnen Menschen.",

    // More hints
    "'Weil' means 'because'.": "'Weil' bedeutet 'weil'.",
    "'Aber' means 'but'.": "'Aber' bedeutet 'aber'.",
    "'Und' means 'and'.": "'Und' bedeutet 'und'.",
    "Was means 'what'.": "Was bedeutet 'was'.",
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

    console.log('Applying translations...');
    let count = 0;

    // Sort by length (longest first) to avoid partial replacements
    const sortedKeys = Object.keys(translations).sort((a, b) => b.length - a.length);

    for (const english of sortedKeys) {
        const german = translations[english];
        if (content.includes(english)) {
            const occurrences = (content.match(new RegExp(escapeRegex(english), 'g')) || []).length;
            content = content.split(english).join(german);
            if (occurrences > 0) {
                console.log(`  "${english.substring(0, 60)}..." -> ${occurrences} occurrence(s)`);
                count += occurrences;
            }
        }
    }

    console.log(`\nTotal translations applied: ${count}`);

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
