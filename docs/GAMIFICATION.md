# Gamification System

Mini Trainer Engine includes a comprehensive gamification system designed to motivate learners through stars, levels, badges, and streaks.

## Overview

The gamification system provides:

- **Stars**: Earned for completing exercises correctly
- **Levels**: Progress through levels by earning stars
- **Badges**: Achievements for reaching milestones
- **Streaks**: Rewards for consistent daily practice

## Star System

Stars are the primary reward currency. Learners earn 0-3 stars per exercise based on their performance.

### Star Calculation

By default, stars are calculated based on the number of attempts:

| Attempts | Stars Earned |
|----------|--------------|
| 1 (first try) | 3 stars |
| 2 | 2 stars |
| 3 | 1 star |
| 4+ | 0 stars |

### Configuration

Configure the star strategy in [`src/config/badges.json`](../src/config/badges.json):

```json
{
  "gamification": {
    "starStrategy": "attempts",
    "maxStarsPerExercise": 3
  }
}
```

### Star Strategies

| Strategy | Description |
|----------|-------------|
| `attempts` | Stars based on number of attempts (default) |
| `time` | Stars based on time to complete |
| `custom` | Custom calculation via code |

#### Time-Based Strategy

With time-based scoring, faster completion earns more stars:

```json
{
  "gamification": {
    "starStrategy": "time",
    "maxStarsPerExercise": 3
  }
}
```

Time thresholds are configurable per exercise type.

### Star Display

Stars are displayed throughout the UI:

- After each exercise completion
- In the progress bar
- On the profile page
- In results summaries

## Level Progression

Levels represent overall progress and unlock new content.

### Level Calculation

Levels are calculated based on total stars earned:

```json
{
  "gamification": {
    "starsPerLevel": 10,
    "levelThresholds": [
      { "level": 1, "starsRequired": 0 },
      { "level": 2, "starsRequired": 10 },
      { "level": 3, "starsRequired": 20 },
      { "level": 4, "starsRequired": 30 },
      { "level": 5, "starsRequired": 40 }
    ]
  }
}
```

### Level Thresholds

| Level | Stars Required |
|-------|----------------|
| 1 | 0 (starting level) |
| 2 | 10 |
| 3 | 20 |
| 4 | 30 |
| 5 | 40 |
| ... | ... |
| 10 | 90 |

### Level Unlocks

Levels unlock content:

1. **Themes**: Higher-level themes require minimum levels
2. **Exercises**: Some exercises may be level-gated
3. **Badges**: Level milestone badges

### Level Up Celebration

When a learner levels up:

- A celebration animation plays
- A notification shows the new level
- The profile is updated

## Badge System

Badges are achievements that recognize specific accomplishments.

### Badge Types

| Type | Description | Example |
|------|-------------|---------|
| `star_milestone` | Earned by collecting stars | "Star Collector" (10 stars) |
| `streak_milestone` | Earned by practicing consecutively | "Week Warrior" (7 days) |
| `level_milestone` | Earned by reaching levels | "Expert Learner" (level 10) |

### Defining Badges

Badges are defined in [`src/config/badges.json`](../src/config/badges.json):

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
  ]
}
```

### Badge Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique badge identifier |
| `name` | string | Display name |
| `description` | string | How to earn the badge |
| `icon` | string | Emoji or icon identifier |

### Badge Icons

Use emoji or Material Icons for badge icons:

- Emoji: `"star"`, `"local_fire_department"`, `"emoji_events"`
- The UI renders these as visual icons

### Badge Notifications

When a badge is earned:

- A toast notification appears
- The badge is added to the profile
- A celebration animation may play

### Custom Badge Types

You can create custom badge types by extending the badge checking logic. See [EXTENDING.md](EXTENDING.md) for details.

## Streak Tracking

Streaks encourage daily practice by tracking consecutive days of activity.

### How Streaks Work

1. **Activity Check**: The system checks if the user has completed at least one exercise today
2. **Streak Increment**: If active today and yesterday, streak increases
3. **Streak Reset**: If a day is missed, streak resets to 0
4. **Longest Streak**: The system tracks the all-time longest streak

### Streak Configuration

```json
{
  "gamification": {
    "streakConfig": {
      "milestones": [3, 7, 14, 30]
    }
  }
}
```

### Streak Milestones

| Days | Badge |
|------|-------|
| 3 | "Getting Started" |
| 7 | "Week Warrior" |
| 14 | "Fortnight Fighter" |
| 30 | "Monthly Master" |

### Streak Display

The streak counter shows:

- Current streak (flame icon with number)
- Visual indication if streak is at risk
- Longest streak on profile page

### Streak At Risk

If the user hasn't practiced today but practiced yesterday:

- The streak shows as "at risk"
- A visual indicator prompts the user to practice
- Practicing any exercise saves the streak

## Customizing Gamification

### Adjusting Star Thresholds

Modify star thresholds for different difficulty levels:

```typescript
// In custom gamification calculator
const starThresholds = {
  attempts: {
    three: 1,  // First try = 3 stars
    two: 2,    // Second try = 2 stars
    one: 3     // Third try = 1 star
  }
};
```

### Custom Level Progression

Create non-linear level progression:

```json
{
  "levelThresholds": [
    { "level": 1, "starsRequired": 0 },
    { "level": 2, "starsRequired": 5 },
    { "level": 3, "starsRequired": 15 },
    { "level": 4, "starsRequired": 30 },
    { "level": 5, "starsRequired": 50 },
    { "level": 6, "starsRequired": 75 },
    { "level": 7, "starsRequired": 100 },
    { "level": 8, "starsRequired": 150 },
    { "level": 9, "starsRequired": 200 },
    { "level": 10, "starsRequired": 300 }
  ]
}
```

### Adding New Badge Types

1. Define the badge in `badges.json`:

```json
{
  "badge": {
    "id": "theme_master_everyday",
    "name": "Everyday Life Master",
    "description": "Complete all exercises in Everyday Life theme",
    "icon": "home"
  },
  "type": "theme_completion",
  "threshold": 1
}
```

1. Implement the badge check (requires code modification):

```typescript
// In badge checking logic
case 'theme_completion':
  return Object.values(profile.themeProgress)
    .filter(tp => tp.exercisesTotal > 0)
    .some(tp => tp.exercisesCompleted >= tp.exercisesTotal);
```

### Disabling Gamification Elements

To disable specific gamification features:

1. **No Badges**: Remove all badges from `badges.json`
2. **No Streaks**: Set empty streak milestones
3. **Simplified Stars**: Set `maxStarsPerExercise: 1`

## Gamification Components

### StarDisplay

Shows star rating with visual representation:

```tsx
<StarDisplay stars={3} maxStars={3} />
```

### ProgressBar

Shows progress toward next level:

```tsx
<ProgressBar 
  current={45} 
  target={50} 
  label="Stars to Level 5" 
/>
```

### StreakCounter

Displays current streak:

```tsx
<StreakCounter 
  current={7} 
  atRisk={false} 
/>
```

### AchievementGrid

Displays earned badges:

```tsx
<AchievementGrid 
  badges={profile.badges} 
  allBadges={badgeDefinitions} 
/>
```

## Best Practices

### 1. Balanced Difficulty

- Don't make stars too easy or too hard to earn
- Consider exercise difficulty in scoring
- Provide multiple paths to earn badges

### 2. Meaningful Milestones

- Set achievable early milestones (3-day streak, 10 stars)
- Create aspirational long-term goals (30-day streak, 500 stars)
- Balance between effort and reward

### 3. Clear Feedback

- Always show why a badge was earned
- Display progress toward upcoming badges
- Celebrate achievements visibly

### 4. Intrinsic Motivation

- Use gamification to enhance, not replace, learning
- Don't over-rely on extrinsic rewards
- Connect badges to real learning achievements

## Data Storage

Gamification data is stored in:

| Data | Storage | Location |
|------|---------|----------|
| Total Stars | IndexedDB | `ChildProfile.totalStars` |
| Current Level | IndexedDB | `ChildProfile.currentLevels` |
| Badges | IndexedDB | `ChildProfile.badges` |
| Streak | IndexedDB | `ChildProfile.currentStreak` |
| Results | IndexedDB | `ExerciseResult` collection |

## Next Steps

- [Configure badges](CONFIGURATION.md#badges-configuration) for your trainer
- [Create exercises](EXERCISES.md) that earn stars
- [Understand accessibility](ACCESSIBILITY.md) for all learners
