# Creating New Apps

This guide provides a comprehensive walkthrough for creating new trainer applications using Mini Trainer Engine. Each app is a self-contained learning application with its own configuration, content, and isolated user data.

## Prerequisites

Before creating a new app, ensure you have:

- **Node.js** 18.0.0 or higher (20.x LTS recommended)
- **npm** 9.0.0 or higher
- A cloned and set up Mini Trainer Engine repository
- Basic understanding of JSON configuration
- Content prepared for your subject area

## Overview

Creating a new app involves:

1. Creating the app directory structure
2. Defining app identity (`app.json`)
3. Configuring the subject (`subject.json`)
4. Defining learning areas (`areas.json`)
5. Creating content themes (`themes.json`)
6. Setting up achievements (`badges.json`)
7. Adding exercise content (`exercises.json`)
8. Adding build scripts to `package.json`
9. Validating and building

## Step 1: Create App Directory

Create a new directory under `src/apps/` using your app's ID:

```bash
# Create app directory
mkdir -p src/apps/my-app
```

### App ID Requirements

- Use lowercase letters and hyphens only
- Must be unique across all apps
- Recommended: 2-15 characters
- Examples: `daz`, `mathematik`, `englisch`, `science-basic`

### Directory Structure

Create the following structure:

```
src/apps/
my-app/
  app.json         # App identity and build config
  subject.json     # Subject definition
  areas.json       # Learning areas
  themes.json      # Content themes
  badges.json      # Achievement badges
  exercises.json   # Exercise content
```

## Step 2: Create app.json

The `app.json` file defines your app's identity and build settings.

### File: `src/apps/my-app/app.json`

```json
{
  "id": "my-app",
  "name": "My Learning App",
  "version": "1.0.0",
  "build": {
    "pwaEnabled": true,
    "usbDistribution": true
  },
  "display": {
    "primaryColor": "#3b82f6",
    "icon": "/assets/my-app-icon.svg"
  }
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique app identifier (must match directory name) |
| `name` | string | Yes | Human-readable app name (displayed in UI) |
| `version` | string | Yes | Semantic version (e.g., "1.0.0") |
| `build.pwaEnabled` | boolean | No | Enable PWA build (default: true) |
| `build.usbDistribution` | boolean | No | Enable USB distribution (default: true) |
| `display.primaryColor` | string | No | Primary theme color (hex format) |
| `display.icon` | string | No | Path to app icon |

### Color Selection Tips

Choose a distinctive color for your app:

| App Type | Suggested Colors |
|----------|-----------------|
| Language | Blue (#3b82f6), Purple (#8b5cf6) |
| Mathematics | Green (#10b981), Teal (#14b8a6) |
| Science | Orange (#f97316), Red (#ef4444) |
| Arts | Pink (#ec4899), Indigo (#6366f1) |

## Step 3: Create subject.json

The `subject.json` file defines what subject your app teaches and which exercise types are enabled.

### File: `src/apps/my-app/subject.json`

```json
{
  "id": "my-app",
  "name": "My Learning App",
  "description": "A trainer for learning [subject]",
  "targetAudience": "Students learning [subject]",
  "primarySkillArea": "fundamentals",
  "enabledExerciseTypes": [
    "multiple-choice",
    "fill-blank",
    "matching"
  ],
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

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Must match app ID |
| `name` | string | Yes | Human-readable subject name |
| `description` | string | Yes | Brief description of the trainer |
| `targetAudience` | string | Yes | Who this trainer is for |
| `primarySkillArea` | string | Yes | ID of the main area for level progression |
| `enabledExerciseTypes` | string[] | Yes | List of enabled exercise types |
| `exerciseTypeConfig` | object | No | Per-exercise-type settings |

### Available Exercise Types

| Type | Description | Best For |
|------|-------------|----------|
| `multiple-choice` | Select one answer from options | Vocabulary, concepts |
| `fill-blank` | Fill in missing words | Grammar, spelling |
| `matching` | Match pairs of items | Vocabulary, definitions |
| `sentence-builder` | Arrange words into sentences | Grammar, syntax |
| `word-order` | Reorder words/phrases | Syntax, grammar |
| `sorting` | Sort items into categories | Classification |
| `writing` | Free-form text input | Composition, spelling |
| `conjugation-table` | Fill conjugation tables | Grammar, verbs |
| `connector-insert` | Insert connecting words | Grammar, conjunctions |
| `picture-vocabulary` | Match pictures to words | Vocabulary |

### Choosing Exercise Types

Select exercise types based on your subject:

```json
// Language learning
"enabledExerciseTypes": [
  "multiple-choice",
  "fill-blank",
  "matching",
  "sentence-builder",
  "conjugation-table",
  "picture-vocabulary"
]

// Mathematics
"enabledExerciseTypes": [
  "multiple-choice",
  "fill-blank",
  "matching",
  "sorting"
]

// Science
"enabledExerciseTypes": [
  "multiple-choice",
  "matching",
  "sorting",
  "fill-blank"
]
```

## Step 4: Create areas.json

The `areas.json` file defines learning or diagnostic areas for progress tracking.

### File: `src/apps/my-app/areas.json`

```json
[
  {
    "id": "fundamentals",
    "name": "Fundamentals",
    "category": "Core Skills",
    "stages": [
      {
        "level": 1,
        "label": "Beginner",
        "description": "Can understand basic concepts",
        "examples": [
          "Recognizes basic terms",
          "Follows simple instructions"
        ]
      },
      {
        "level": 2,
        "label": "Developing",
        "description": "Can apply concepts with support",
        "examples": [
          "Solves simple problems",
          "Makes connections between concepts"
        ]
      },
      {
        "level": 3,
        "label": "Proficient",
        "description": "Can apply concepts independently",
        "examples": [
          "Solves complex problems",
          "Explains reasoning"
        ]
      }
    ]
  },
  {
    "id": "application",
    "name": "Application",
    "category": "Core Skills",
    "stages": [
      {
        "level": 1,
        "label": "Guided",
        "description": "Can apply knowledge with guidance",
        "examples": ["Follows worked examples"]
      },
      {
        "level": 2,
        "label": "Independent",
        "description": "Can apply knowledge independently",
        "examples": ["Solves new problems"]
      }
    ]
  }
]
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique area identifier |
| `name` | string | Yes | Human-readable area name |
| `category` | string | Yes | Category for grouping |
| `stages` | array | Yes | Developmental stages |

### Stage Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `level` | number | Yes | Numeric level (1 = lowest) |
| `label` | string | Yes | Human-readable stage label |
| `description` | string | Yes | Description of skills at this stage |
| `examples` | string[] | Yes | Example behaviors or skills |

### Designing Areas

Design areas based on your educational framework:

**Option 1: Skill-Based Areas**

```json
[
  { "id": "reading", "name": "Reading", ... },
  { "id": "writing", "name": "Writing", ... },
  { "id": "speaking", "name": "Speaking", ... }
]
```

**Option 2: Topic-Based Areas**

```json
[
  { "id": "numbers", "name": "Numbers", ... },
  { "id": "geometry", "name": "Geometry", ... },
  { "id": "algebra", "name": "Algebra", ... }
]
```

**Option 3: Competency-Based Areas**

```json
[
  { "id": "knowledge", "name": "Knowledge", ... },
  { "id": "application", "name": "Application", ... },
  { "id": "analysis", "name": "Analysis", ... }
]
```

## Step 5: Create themes.json

The `themes.json` file defines content themes that group related exercises.

### File: `src/apps/my-app/themes.json`

```json
[
  {
    "id": "basics",
    "name": "Basics",
    "icon": "school",
    "color": "#3b82f6",
    "description": "Fundamental concepts and vocabulary",
    "minLevel": 1
  },
  {
    "id": "everyday",
    "name": "Everyday Life",
    "icon": "home",
    "color": "#10b981",
    "description": "Common situations and daily routines",
    "minLevel": 1
  },
  {
    "id": "advanced",
    "name": "Advanced Topics",
    "icon": "star",
    "color": "#8b5cf6",
    "description": "Complex concepts and applications",
    "minLevel": 2
  }
]
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique theme identifier |
| `name` | string | Yes | Human-readable theme name |
| `icon` | string | Yes | Icon identifier (emoji or Material Icons name) |
| `color` | string | Yes | Theme color (hex format) |
| `description` | string | Yes | Description of theme content |
| `minLevel` | number | Yes | Minimum level to unlock theme |

### Theme Progression

Themes unlock as users progress:

- `minLevel: 1` - Available immediately
- `minLevel: 2` - Unlocked at level 2
- `minLevel: 3` - Unlocked at level 3

### Common Icons

| Icon | Use Case |
|------|----------|
| `school` | Education, basics |
| `home` | Everyday life |
| `work` | Professional, business |
| `travel_explore` | Travel, geography |
| `restaurant` | Food, dining |
| `favorite` | Emotions, relationships |
| `sports_soccer` | Sports, activities |
| `science` | Science, nature |
| `calculate` | Mathematics |
| `menu_book` | Reading, literature |

## Step 6: Create badges.json

The `badges.json` file defines achievements and gamification settings.

### File: `src/apps/my-app/badges.json`

```json
{
  "badges": [
    {
      "badge": {
        "id": "first_steps",
        "name": "First Steps",
        "description": "Complete your first exercise",
        "icon": "directions_walk"
      },
      "type": "exercise_count",
      "threshold": 1
    },
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
        "id": "streak_3",
        "name": "Getting Started",
        "description": "Practice 3 days in a row",
        "icon": "local_fire_department"
      },
      "type": "streak_milestone",
      "threshold": 3
    },
    {
      "badge": {
        "id": "level_2",
        "name": "Rising Star",
        "description": "Reach level 2",
        "icon": "trending_up"
      },
      "type": "level_milestone",
      "threshold": 2
    }
  ],
  "gamification": {
    "starStrategy": "attempts",
    "maxStarsPerExercise": 3,
    "starsPerLevel": 10,
    "levelThresholds": [
      { "level": 1, "starsRequired": 0 },
      { "level": 2, "starsRequired": 10 },
      { "level": 3, "starsRequired": 25 },
      { "level": 4, "starsRequired": 50 },
      { "level": 5, "starsRequired": 100 }
    ],
    "streakConfig": {
      "milestones": [3, 7, 14, 30]
    }
  }
}
```

### Badge Types

| Type | Description | Threshold Meaning |
|------|-------------|-------------------|
| `star_milestone` | Earned by collecting stars | Number of stars |
| `streak_milestone` | Earned by consecutive days | Number of days |
| `level_milestone` | Earned by reaching a level | Level number |
| `exercise_count` | Earned by completing exercises | Number of exercises |

### Gamification Settings

| Field | Description | Recommended |
|-------|-------------|-------------|
| `starStrategy` | How stars are calculated | `"attempts"` |
| `maxStarsPerExercise` | Maximum stars per exercise | `3` |
| `starsPerLevel` | Base stars per level | `10` |
| `levelThresholds` | Explicit level thresholds | Varies by content |

## Step 7: Create exercises.json

The `exercises.json` file contains all exercise content.

### File: `src/apps/my-app/exercises.json`

```json
[
  {
    "id": "ex-001",
    "type": "multiple-choice",
    "areaId": "fundamentals",
    "themeId": "basics",
    "level": 1,
    "difficulty": 1,
    "instruction": "Choose the correct answer",
    "content": {
      "type": "multiple-choice",
      "question": "What is 2 + 2?",
      "options": ["3", "4", "5", "6"],
      "correctIndex": 1
    },
    "hints": ["Think about counting"],
    "feedbackCorrect": "Well done!",
    "feedbackIncorrect": "Try again!"
  },
  {
    "id": "ex-002",
    "type": "fill-blank",
    "areaId": "fundamentals",
    "themeId": "basics",
    "level": 1,
    "difficulty": 1,
    "instruction": "Fill in the blank",
    "content": {
      "type": "fill-blank",
      "text": "The sky is _____.",
      "answer": "blue",
      "alternatives": ["Blue"]
    },
    "hints": ["What color do you see when you look up on a clear day?"],
    "feedbackCorrect": "Correct!",
    "feedbackIncorrect": "Not quite right."
  }
]
```

### Exercise Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique exercise identifier |
| `type` | string | Yes | Exercise type (must be enabled in subject) |
| `areaId` | string | Yes | Reference to area in areas.json |
| `themeId` | string | Yes | Reference to theme in themes.json |
| `level` | number | Yes | Exercise level (1-5) |
| `difficulty` | number | Yes | Difficulty within level (1-3) |
| `instruction` | string | Yes | Instruction text for the user |
| `content` | object | Yes | Type-specific content |
| `hints` | string[] | No | List of hints |
| `feedbackCorrect` | string | No | Feedback for correct answer |
| `feedbackIncorrect` | string | No | Feedback for incorrect answer |

### Content Schemas by Type

#### Multiple Choice

```json
{
  "type": "multiple-choice",
  "question": "Question text?",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctIndex": 0
}
```

#### Fill Blank

```json
{
  "type": "fill-blank",
  "text": "Text with _____ to fill.",
  "answer": "word",
  "alternatives": ["Word", "WORD"]
}
```

#### Matching

```json
{
  "type": "matching",
  "pairs": [
    { "left": "Word A", "right": "Definition A" },
    { "left": "Word B", "right": "Definition B" }
  ]
}
```

#### Sentence Builder

```json
{
  "type": "sentence-builder",
  "words": ["The", "cat", "sat", "on", "mat", "the"],
  "correctOrder": ["The", "cat", "sat", "on", "the", "mat"]
}
```

For complete schemas, see [EXERCISES.md](EXERCISES.md).

## Step 8: Add Build Scripts

Add build scripts to `package.json` for your app:

```json
{
  "scripts": {
    "dev:my-app": "VITE_APP_ID=my-app vite",
    "build:my-app": "node scripts/build-app.mjs --app my-app",
    "build:my-app:pwa": "node scripts/build-app.mjs --app my-app --pwa",
    "build:data:my-app": "node scripts/build-exercise-data.mjs --app my-app",
    "validate:my-app": "node scripts/validate-config.mjs --app my-app",
    "package:my-app": "node scripts/package-release.mjs --app my-app --format zip",
    "package:my-app:pwa": "node scripts/package-release.mjs --app my-app --format pwa",
    "release:my-app": "npm run build:my-app && npm run package:my-app && npm run package:my-app:pwa"
  }
}
```

## Step 9: Validate and Build

### Validate Configuration

```bash
# Validate your app configuration
npm run validate:my-app

# Or with explicit app ID
node scripts/validate-config.mjs --app my-app
```

The validator checks:

- JSON syntax validity
- Required fields presence
- Cross-references (areas, themes, exercise types)
- Content schema compliance

### Build Exercise Data

```bash
# Build exercise data for your app
npm run build:data:my-app
```

### Build for Production

```bash
# Build your app
npm run build:my-app

# Build with PWA support
npm run build:my-app:pwa
```

### Create Release Package

```bash
# Full release (build + package)
npm run release:my-app

# Or step by step
npm run build:my-app
npm run package:my-app
npm run package:my-app:pwa
```

## Testing Your App

### Development Server

```bash
# Start development server for your app
npm run dev:my-app
```

Open [http://localhost:5173](http://localhost:5173) to test.

### Preview Production Build

```bash
# Build and preview
npm run build:my-app
npm run preview
```

### Checklist

Before releasing, verify:

- [ ] All configuration files are valid
- [ ] Exercises cover all areas and themes
- [ ] Difficulty progression is appropriate
- [ ] Hints are helpful but not too revealing
- [ ] Feedback messages are encouraging
- [ ] App loads correctly in development
- [ ] Build completes without errors
- [ ] Release package works on target browsers

## Storage Isolation

Each app uses isolated storage:

### IndexedDB

```
mini-trainer-{appId}-db
```

For example: `mini-trainer-my-app-db`

### localStorage

```
mte:{appId}:{key}
```

For example: `mte:my-app:settings`

This ensures user data from different apps never interferes.

## Example: Complete App Creation

Here's a complete example creating a simple "Science Basics" app:

```bash
# 1. Create directory
mkdir -p src/apps/science-basic

# 2. Create app.json
cat > src/apps/science-basic/app.json << 'EOF'
{
  "id": "science-basic",
  "name": "Science Basics",
  "version": "1.0.0",
  "build": {
    "pwaEnabled": true,
    "usbDistribution": true
  },
  "display": {
    "primaryColor": "#f97316",
    "icon": "/assets/science-icon.svg"
  }
}
EOF

# 3. Create subject.json
cat > src/apps/science-basic/subject.json << 'EOF'
{
  "id": "science-basic",
  "name": "Science Basics",
  "description": "Learn fundamental science concepts",
  "targetAudience": "Elementary school students",
  "primarySkillArea": "knowledge",
  "enabledExerciseTypes": [
    "multiple-choice",
    "fill-blank",
    "matching",
    "sorting"
  ]
}
EOF

# 4. Create areas.json
cat > src/apps/science-basic/areas.json << 'EOF'
[
  {
    "id": "knowledge",
    "name": "Scientific Knowledge",
    "category": "Core",
    "stages": [
      {
        "level": 1,
        "label": "Observer",
        "description": "Can identify basic scientific concepts",
        "examples": ["Names parts of a plant", "Identifies states of matter"]
      },
      {
        "level": 2,
        "label": "Explorer",
        "description": "Understands relationships between concepts",
        "examples": ["Explains the water cycle", "Describes plant growth"]
      }
    ]
  }
]
EOF

# 5. Create themes.json
cat > src/apps/science-basic/themes.json << 'EOF'
[
  {
    "id": "living-things",
    "name": "Living Things",
    "icon": "eco",
    "color": "#10b981",
    "description": "Plants, animals, and ecosystems",
    "minLevel": 1
  },
  {
    "id": "matter",
    "name": "Matter & Energy",
    "icon": "science",
    "color": "#3b82f6",
    "description": "States of matter and energy",
    "minLevel": 1
  }
]
EOF

# 6. Create badges.json
cat > src/apps/science-basic/badges.json << 'EOF'
{
  "badges": [
    {
      "badge": {
        "id": "first_experiment",
        "name": "First Experiment",
        "description": "Complete your first exercise",
        "icon": "science"
      },
      "type": "exercise_count",
      "threshold": 1
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
      "milestones": [3, 7, 14]
    }
  }
}
EOF

# 7. Create exercises.json (minimal example)
cat > src/apps/science-basic/exercises.json << 'EOF'
[
  {
    "id": "sci-001",
    "type": "multiple-choice",
    "areaId": "knowledge",
    "themeId": "living-things",
    "level": 1,
    "difficulty": 1,
    "instruction": "What do plants need to grow?",
    "content": {
      "type": "multiple-choice",
      "question": "What do plants need to make their food?",
      "options": ["Water only", "Sunlight only", "Water, sunlight, and air", "Soil only"],
      "correctIndex": 2
    },
    "hints": ["Plants use sunlight to make food", "They also need water and carbon dioxide from air"],
    "feedbackCorrect": "Excellent! Plants need water, sunlight, and air for photosynthesis.",
    "feedbackIncorrect": "Not quite. Think about what plants use for photosynthesis."
  }
]
EOF

# 8. Add build scripts to package.json (manual step)

# 9. Validate
node scripts/validate-config.mjs --app science-basic

# 10. Build
node scripts/build-app.mjs --app science-basic
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| "App not found" | Check directory name matches app ID |
| Validation errors | Check JSON syntax and required fields |
| Missing exercises | Ensure exercises.json has valid content |
| Build fails | Run validation first to identify issues |
| Wrong app loads | Check VITE_APP_ID environment variable |

### Getting Help

1. Check [CONFIGURATION.md](CONFIGURATION.md) for detailed field references
2. Review existing apps (`src/apps/daz/`, `src/apps/mathematik/`) for examples
3. Run validation with verbose output for detailed error messages

## Next Steps

- [Create exercises](EXERCISES.md) - Detailed exercise content guide
- [Configure gamification](GAMIFICATION.md) - Customize stars, levels, badges
- [Deploy your app](DEPLOYMENT.md) - Build and distribute
- [Extend the engine](EXTENDING.md) - Add custom exercise types
