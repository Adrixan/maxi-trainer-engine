# Configuration Guide

Mini Trainer Engine is designed to be customized through JSON configuration files. This guide explains each configuration file and its options.

## Configuration File Locations

| File | Location | Purpose |
|------|----------|---------|
| Subject Configuration | [`src/config/subject.json`](../src/config/subject.json) | Defines the subject and enabled features |
| Areas Configuration | [`src/config/areas.json`](../src/config/areas.json) | Observation/diagnostic areas for progress tracking |
| Themes Configuration | [`src/config/themes.json`](../src/config/themes.json) | Content themes that group exercises |
| Badges Configuration | [`src/config/badges.json`](../src/config/badges.json) | Achievement badges and gamification settings |
| Exercise Data | [`src/data/exercises.json`](../src/data/exercises.json) | Exercise content |

## Subject Configuration

The subject configuration defines what subject this trainer teaches and which exercise types are enabled.

### File: `src/config/subject.json`

```json
{
  "id": "generic-trainer",
  "name": "Generic Trainer",
  "description": "A configurable trainer for any subject with adaptive learning capabilities",
  "targetAudience": "Learners of all ages and skill levels",
  "primarySkillArea": "comprehension",
  "enabledExerciseTypes": [
    "fill-blank",
    "multiple-choice",
    "matching",
    "sentence-builder",
    "sorting",
    "writing",
    "conjugation-table",
    "connector-insert",
    "word-order",
    "picture-vocabulary"
  ],
  "exerciseTypeConfig": {
    "fill-blank": {
      "hintsEnabled": true,
      "maxAttempts": 3
    }
  }
}
```

### Subject Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for this trainer |
| `name` | string | Yes | Human-readable name displayed in the UI |
| `description` | string | Yes | Brief description of the trainer |
| `targetAudience` | string | Yes | Description of who this trainer is for |
| `primarySkillArea` | string | Yes | ID of the main observation area for level progression |
| `enabledExerciseTypes` | string[] | Yes | List of exercise types to enable |
| `exerciseTypeConfig` | object | No | Per-exercise-type configuration overrides |

### Exercise Type Configuration

Each exercise type can have custom settings:

```json
{
  "exerciseTypeConfig": {
    "fill-blank": {
      "hintsEnabled": true,
      "maxAttempts": 3
    },
    "multiple-choice": {
      "hintsEnabled": false,
      "maxAttempts": 1
    }
  }
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `hintsEnabled` | boolean | `true` | Whether hints are available for this exercise type |
| `maxAttempts` | number | `3` | Maximum number of attempts before showing the solution |

## Areas Configuration

Areas define the observation or diagnostic framework used for progress tracking. These can be based on educational standards like USB-DaZ or custom frameworks.

### File: `src/config/areas.json`

```json
[
  {
    "id": "comprehension",
    "name": "Comprehension",
    "category": "Core Skills",
    "stages": [
      {
        "level": 1,
        "label": "Pre-emergent",
        "description": "Can understand simple, concrete vocabulary with visual support",
        "examples": [
          "Matches pictures to words",
          "Responds to gestures and facial expressions"
        ]
      },
      {
        "level": 2,
        "label": "Beginning",
        "description": "Can understand basic phrases and short sentences",
        "examples": ["Follows simple two-step instructions"]
      }
    ]
  }
]
```

### Area Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (referenced by exercises) |
| `name` | string | Yes | Human-readable name |
| `category` | string | Yes | Category for grouping areas in the UI |
| `stages` | array | Yes | Developmental stages/levels |

### Stage Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | number | Yes | Numeric level (1 = lowest) |
| `label` | string | Yes | Human-readable stage label |
| `description` | string | Yes | Description of skills at this stage |
| `examples` | string[] | Yes | Example behaviors or skills |

### Creating Custom Areas

Design areas based on your diagnostic framework:

```json
[
  {
    "id": "reading",
    "name": "Reading Skills",
    "category": "Literacy",
    "stages": [
      {
        "level": 1,
        "label": "Emergent",
        "description": "Beginning to understand print concepts",
        "examples": ["Recognizes letters", "Understands left-to-right direction"]
      },
      {
        "level": 2,
        "label": "Early",
        "description": "Can read simple texts with support",
        "examples": ["Reads sight words", "Uses picture clues"]
      }
    ]
  }
]
```

## Themes Configuration

Themes group related exercises and provide a way to organize content by topic.

### File: `src/config/themes.json`

```json
[
  {
    "id": "everyday-life",
    "name": "Everyday Life",
    "icon": " homes",
    "color": "#4CAF50",
    "description": "Daily routines, household activities, and common situations",
    "minLevel": 1
  },
  {
    "id": "travel",
    "name": "Travel & Transport",
    "icon": "airplane",
    "color": "#00BCD4",
    "description": "Transportation, directions, and travel experiences",
    "minLevel": 2
  }
]
```

### Theme Configuration Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (referenced by exercises) |
| `name` | string | Yes | Human-readable name displayed in the UI |
| `icon` | string | Yes | Emoji or icon identifier |
| `color` | string | Yes | Theme color (hex format) |
| `description` | string | Yes | Brief description of the theme content |
| `minLevel` | number | Yes | Minimum level required to unlock this theme |

### Theme Progression

Themes are unlocked based on the learner's level:

- `minLevel: 1` - Available from the start
- `minLevel: 2` - Unlocked when reaching level 2
- `minLevel: 3` - Unlocked when reaching level 3

This creates a sense of progression and encourages learners to advance.

## Badges Configuration

Badges define achievements and the gamification settings.

### File: `src/config/badges.json`

```json
{
  "badges": [
    {
      "badge": {
        "id": "stars_10",
        "name": "Star Collector",
        "description": "Earn 10 stars",
        "icon": "star"
      },
      "type": "star_milestone",
      "threshold": 10
    },
    {
      "badge": {
        "id": "streak_7",
        "name": "Week Warrior",
        "description": "Practice 7 days in a row",
        "icon": "local_fire_department"
      },
      "type": "streak_milestone",
      "threshold": 7
    }
  ],
  "gamification": {
    "starStrategy": "attempts",
    "maxStarsPerExercise": 3,
    "starsPerLevel": 10,
    "levelThresholds": [
      { "level": 1, "starsRequired": 0 },
      { "level": 2, "starsRequired": 10 }
    ],
    "streakConfig": {
      "milestones": [3, 7, 14, 30]
    }
  }
}
```

### Badge Definition Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `badge.id` | string | Yes | Unique badge identifier |
| `badge.name` | string | Yes | Human-readable badge name |
| `badge.description` | string | Yes | Description of how to earn the badge |
| `badge.icon` | string | Yes | Emoji or icon identifier |
| `type` | string | Yes | Badge type (see below) |
| `threshold` | number | Yes | Value needed to earn the badge |

### Badge Types

| Type | Description | Threshold Meaning |
|------|-------------|-------------------|
| `star_milestone` | Earned by collecting stars | Number of stars |
| `streak_milestone` | Earned by practicing consecutive days | Number of days |
| `level_milestone` | Earned by reaching a level | Level number |

### Gamification Settings

| Field | Type | Description |
|-------|------|-------------|
| `starStrategy` | string | How stars are calculated: `"attempts"` or `"time"` |
| `maxStarsPerExercise` | number | Maximum stars per exercise (typically 3) |
| `starsPerLevel` | number | Stars needed to advance one level |
| `levelThresholds` | array | Explicit level-to-stars mapping |
| `streakConfig.milestones` | number[] | Days for each streak badge |

## Exercise Data

Exercise content is stored in a separate JSON file.

### File: `src/data/exercises.json`

```json
[
  {
    "id": "ex-001",
    "type": "multiple-choice",
    "areaId": "comprehension",
    "themeId": "everyday-life",
    "level": 1,
    "difficulty": 1,
    "instruction": "Choose the correct word",
    "content": {
      "type": "multiple-choice",
      "question": "What is this?",
      "options": ["Apple", "Banana", "Orange", "Grape"],
      "correctIndex": 0
    },
    "hints": ["Look at the picture carefully"],
    "feedbackCorrect": "Well done!",
    "feedbackIncorrect": "Try again!"
  }
]
```

See [EXERCISES.md](EXERCISES.md) for detailed exercise content schemas.

## Configuration Validation

Validate your configuration before building:

```bash
npm run validate
```

The validator checks:

### Subject Validation

- Required fields present
- Valid exercise type references
- Primary skill area exists in areas

### Areas Validation

- Unique IDs
- Valid stage levels (positive integers)
- Required fields present

### Themes Validation

- Unique IDs
- Valid color formats
- Valid minLevel values

### Badges Validation

- Unique badge IDs
- Valid badge types
- Valid threshold values

### Exercises Validation

- Valid area references
- Valid theme references
- Valid exercise types (enabled in subject)
- Content matches declared type

## Configuration Best Practices

### 1. Start Simple

Begin with a minimal configuration and expand:

```json
{
  "id": "my-trainer",
  "name": "My First Trainer",
  "description": "A simple trainer to get started",
  "targetAudience": "Beginners",
  "primarySkillArea": "basics",
  "enabledExerciseTypes": ["multiple-choice"]
}
```

### 2. Use Consistent IDs

Use lowercase with hyphens for IDs:

- Good: `"everyday-life"`, `"comprehension"`, `"star-collector"`
- Avoid: `"EverydayLife"`, `"comprehension_area"`, `"StarCollector"`

### 3. Plan Your Areas

Design observation areas based on:

- Educational standards (e.g., Common Core, CEFR)
- Diagnostic frameworks (e.g., USB-DaZ)
- Your specific learning objectives

### 4. Theme Progression

Create a sense of progression:

- Start with 2-3 themes at `minLevel: 1`
- Add more challenging themes at higher levels
- Use theme colors to create visual distinction

### 5. Test Incrementally

After each configuration change:

```bash
npm run validate
npm run build:data
npm run dev
```

## Next Steps

- [Create exercises](EXERCISES.md) for your content
- [Customize gamification](GAMIFICATION.md) settings
- [Deploy your trainer](DEPLOYMENT.md)
