# Exercises Guide

This guide covers all exercise types available in Mini Trainer Engine, their content schemas, and how to create exercises.

## Exercise Types Overview

Mini Trainer Engine supports 10 exercise types, each designed for different learning objectives:

| Type | Description | Best For |
|------|-------------|----------|
| `multiple-choice` | Select one correct answer from options | Quick assessments, vocabulary |
| `fill-blank` | Fill in a blank in a sentence | Grammar, spelling, vocabulary |
| `matching` | Match items from two columns | Vocabulary, associations |
| `sentence-builder` | Build sentences from word columns | Grammar, sentence structure |
| `sorting` | Sort items into categories | Classification, categorization |
| `word-order` | Arrange words in correct order | Syntax, sentence structure |
| `connector-insert` | Select connector for sentence parts | Conjunctions, logic |
| `conjugation-table` | Fill in verb conjugation forms | Verb forms, grammar |
| `writing` | Free writing with scaffolding | Production, composition |
| `picture-vocabulary` | Identify vocabulary from pictures | Vocabulary, visual learning |

## Exercise Structure

All exercises share a common base structure:

```json
{
  "id": "ex-001",
  "type": "multiple-choice",
  "areaId": "comprehension",
  "themeId": "everyday-life",
  "level": 1,
  "difficulty": 1,
  "instruction": "Choose the correct answer",
  "content": { ... },
  "hints": ["Hint 1", "Hint 2"],
  "feedbackCorrect": "Well done!",
  "feedbackIncorrect": "Try again!"
}
```

### Common Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (e.g., `"ex-001"`) |
| `type` | string | Yes | Exercise type (see types above) |
| `areaId` | string | Yes | References an area from `areas.json` |
| `themeId` | string | Yes | References a theme from `themes.json` |
| `level` | number | Yes | Level within the area (1-based) |
| `difficulty` | number | Yes | Difficulty: `1` (easy), `2` (medium), `3` (hard) |
| `instruction` | string | Yes | Instruction text for the learner |
| `content` | object | Yes | Type-specific content (see below) |
| `hints` | string[] | Yes | Array of hints (can be empty) |
| `feedbackCorrect` | string | Yes | Feedback for correct answers |
| `feedbackIncorrect` | string | Yes | Feedback for incorrect answers |

## Exercise Content Schemas

### Multiple Choice

User selects one correct answer from multiple options.

```json
{
  "type": "multiple-choice",
  "content": {
    "type": "multiple-choice",
    "question": "What is the capital of France?",
    "options": ["London", "Paris", "Berlin", "Madrid"],
    "correctIndex": 1
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `question` | string | The question prompt |
| `options` | string[] | Array of answer options (2-6 options) |
| `correctIndex` | number | Index of the correct option (0-based) |

#### Best Practices

- Use 3-4 options for optimal difficulty
- Make distractors plausible but clearly incorrect
- Randomize option order in your mind; the UI will shuffle

---

### Fill-in-the-Blank

User fills in a blank placeholder in a sentence.

```json
{
  "type": "fill-blank",
  "content": {
    "type": "fill-blank",
    "sentence": "The cat sat on the {{blank}}.",
    "correctAnswer": "mat",
    "acceptableAnswers": ["rug", "floor"],
    "numericWordForm": null
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `sentence` | string | Sentence with `{{blank}}` placeholder |
| `correctAnswer` | string | The primary correct answer |
| `acceptableAnswers` | string[] | Additional acceptable answers |
| `numericWordForm` | string? | If answer is a number, the word form (e.g., "five") |

#### Best Practices

- Use `{{blank}}` as the placeholder (required format)
- Include common misspellings in `acceptableAnswers`
- Consider case sensitivity (answers are typically case-insensitive)

#### Example with Numeric Answer

```json
{
  "sentence": "There are {{blank}} days in a week.",
  "correctAnswer": "7",
  "acceptableAnswers": ["seven"],
  "numericWordForm": "seven"
}
```

---

### Matching

User matches items from a left column to a right column.

```json
{
  "type": "matching",
  "content": {
    "type": "matching",
    "pairs": [
      { "left": "cat", "right": "Katze" },
      { "left": "dog", "right": "Hund" },
      { "left": "bird", "right": "Vogel" }
    ]
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `pairs` | array | Array of left/right pairs to match |

#### Pair Structure

| Field | Type | Description |
|-------|------|-------------|
| `left` | string | Item in the left column |
| `right` | string | Item in the right column |

#### Best Practices

- Use 4-6 pairs for optimal difficulty
- Ensure all items are distinct
- The UI shuffles the right column

---

### Sentence Builder

User constructs sentences by selecting words from columns.

```json
{
  "type": "sentence-builder",
  "content": {
    "type": "sentence-builder",
    "columns": [
      {
        "label": "Subject",
        "words": ["I", "You", "We", "They"]
      },
      {
        "label": "Verb",
        "words": ["like", "love", "hate", "prefer"]
      },
      {
        "label": "Object",
        "words": ["apples", "oranges", "bananas", "grapes"]
      }
    ],
    "targetSentences": [
      "I like apples",
      "You love oranges",
      "We hate bananas"
    ]
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `columns` | array | Word columns with labels |
| `targetSentences` | string[] | Valid sentences that can be constructed |

#### Column Structure

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Column label (e.g., "Subject", "Verb") |
| `words` | string[] | Words available in this column |

#### Best Practices

- Include distractor words that don't form valid sentences
- Ensure multiple valid sentences can be formed
- Use clear column labels

---

### Sorting (Category Sort)

User sorts items into categories.

```json
{
  "type": "sorting",
  "content": {
    "type": "sorting",
    "categories": [
      {
        "label": "Fruits",
        "items": ["apple", "banana", "orange"]
      },
      {
        "label": "Vegetables",
        "items": ["carrot", "broccoli", "spinach"]
      }
    ]
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `categories` | array | Categories with their correct items |

#### Category Structure

| Field | Type | Description |
|-------|------|-------------|
| `label` | string | Category name |
| `items` | string[] | Items belonging to this category |

#### Best Practices

- Use 2-4 categories
- Include 3-5 items per category
- Ensure items are clearly categorizable

---

### Word Order

User arranges scrambled words into the correct order.

```json
{
  "type": "word-order",
  "content": {
    "type": "word-order",
    "correctOrder": ["The", "cat", "sat", "on", "the", "mat"],
    "scrambled": ["mat", "cat", "the", "on", "The", "sat"]
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `correctOrder` | string[] | Words in the correct order |
| `scrambled` | string[] | Same words in scrambled order |

#### Best Practices

- Keep sentences short (5-10 words)
- Preserve capitalization for proper nouns
- The scrambled array must contain the same words as correctOrder

---

### Connector Insert

User selects the correct connector to join sentence parts.

```json
{
  "type": "connector-insert",
  "content": {
    "type": "connector-insert",
    "sentencePart1": "I wanted to go outside,",
    "sentencePart2": "it was raining.",
    "correctConnector": "but",
    "options": ["and", "but", "or", "because"]
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `sentencePart1` | string | First part of the sentence |
| `sentencePart2` | string | Second part of the sentence |
| `correctConnector` | string | The correct connector word |
| `options` | string[] | Available connector options |

#### Best Practices

- Include common connectors as distractors
- Ensure context makes the correct answer clear
- Consider punctuation in sentence parts

---

### Conjugation Table

User fills in verb conjugation forms.

```json
{
  "type": "conjugation-table",
  "content": {
    "type": "conjugation-table",
    "verb": "sein",
    "tense": "present",
    "cells": [
      { "person": "ich", "correctForm": "bin", "prefilled": false },
      { "person": "du", "correctForm": "bist", "prefilled": false },
      { "person": "er/sie/es", "correctForm": "ist", "prefilled": true },
      { "person": "wir", "correctForm": "sind", "prefilled": false },
      { "person": "ihr", "correctForm": "seid", "prefilled": false },
      { "person": "sie/Sie", "correctForm": "sind", "prefilled": false }
    ]
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `verb` | string | The verb to conjugate |
| `tense` | string | The tense (e.g., "present", "past") |
| `cells` | array | Conjugation cells |

#### Cell Structure

| Field | Type | Description |
|-------|------|-------------|
| `person` | string | Person/pronoun |
| `correctForm` | string | The correct conjugated form |
| `prefilled` | boolean | Whether this cell is pre-filled as a hint |

#### Best Practices

- Pre-fill 1-2 cells as hints for difficult verbs
- Include all persons for complete conjugation
- Use consistent person labels

---

### Writing

User writes text based on a prompt with optional scaffolding.

```json
{
  "type": "writing",
  "content": {
    "type": "writing",
    "prompt": "Write about your favorite food.",
    "scaffoldLevel": "medium",
    "scaffoldHints": [
      "What is your favorite food?",
      "Why do you like it?",
      "How does it taste?"
    ],
    "starterWords": ["My", "favorite", "food", "is"],
    "minLength": 20
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `prompt` | string | The writing prompt |
| `scaffoldLevel` | string | Level of support: "none", "light", "medium", "full" |
| `scaffoldHints` | string[] | Guiding questions to help the writer |
| `starterWords` | string[] | Words to start the sentence |
| `minLength` | number | Minimum character or word count |

#### Best Practices

- Provide clear, engaging prompts
- Use scaffold hints to guide structure
- Set reasonable minimum lengths

---

### Picture Vocabulary

User identifies vocabulary from a picture prompt (emoji/symbol).

```json
{
  "type": "picture-vocabulary",
  "content": {
    "type": "picture-vocabulary",
    "picture": "homes",
    "pictureAlt": "A house with a door and windows",
    "correctAnswer": "house",
    "acceptableAnswers": ["home", "building"],
    "options": ["house", "car", "tree", "flower"]
  }
}
```

#### Content Fields

| Field | Type | Description |
|-------|------|-------------|
| `picture` | string | Emoji or unicode symbol |
| `pictureAlt` | string | Accessible description for screen readers |
| `correctAnswer` | string | The correct vocabulary word |
| `acceptableAnswers` | string[] | Additional acceptable answers |
| `options` | string[] | Multiple-choice options (optional) |

#### Best Practices

- Use clear, recognizable emojis
- Always provide `pictureAlt` for accessibility
- Include synonyms in `acceptableAnswers`

---

## Using the Add-Exercise Script

The interactive exercise creator helps you create valid exercises:

```bash
npm run add-exercise
```

### Interactive Workflow

1. **Select Exercise Type**: Choose from the 10 available types
2. **Enter Metadata**: ID, area, theme, level, difficulty
3. **Enter Content**: Type-specific content fields
4. **Add Hints**: Optional hints for learners
5. **Add Feedback**: Correct/incorrect feedback messages
6. **Review & Save**: Preview and confirm the exercise

### Example Session

```
? Select exercise type: multiple-choice
? Exercise ID: ex-mc-001
? Select area: comprehension
? Select theme: everyday-life
? Level (1-10): 1
? Difficulty (1-3): 1
? Instruction: Choose the correct word.
? Question: What is this?
? Enter options (comma-separated): Apple, Banana, Orange, Grape
? Correct option index (0-3): 0
? Add hints? (y/N): y
? Hint 1: Look at the picture
? Add another hint? (y/N): n
? Correct feedback: Well done!
? Incorrect feedback: Try again!
? Save exercise? (Y/n): Y
```

## Best Practices

### Exercise Design

1. **Clear Instructions**: Write concise, unambiguous instructions
2. **Appropriate Difficulty**: Match difficulty to the target level
3. **Helpful Hints**: Provide hints that guide without giving away answers
4. **Constructive Feedback**: Use encouraging, specific feedback

### Content Organization

1. **Consistent IDs**: Use a naming convention (e.g., `ex-mc-001`, `ex-fb-001`)
2. **Balanced Distribution**: Create exercises across all areas and themes
3. **Progressive Difficulty**: Start with easier exercises at lower levels

### Validation

Always validate after creating exercises:

```bash
npm run validate
```

This checks:

- Valid area and theme references
- Correct content structure for the type
- Required fields presence
- Cross-reference integrity

## Exercise Data Storage

Exercises are stored in [`src/data/exercises.json`](../src/data/exercises.json) and built into [`public/data/exercises.js`](../public/data/exercises.js) during the build process.

### Build Process

```bash
npm run build:data
```

This:

1. Reads `src/data/exercises.json`
2. Validates all exercises
3. Generates optimized IIFE format for file:// protocol compatibility
4. Writes to `public/data/exercises.js`

## Next Steps

- [Configure gamification](GAMIFICATION.md) for your exercises
- [Understand accessibility features](ACCESSIBILITY.md)
- [Deploy your trainer](DEPLOYMENT.md)
