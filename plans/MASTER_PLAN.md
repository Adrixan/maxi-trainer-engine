# Mini Trainer Engine - Master Plan

> **Consolidated from:** ARCHITECTURE.md, HOOK_ARCHITECTURE_ANALYSIS.md, LARGE_FILE_DECOMPOSITION_ANALYSIS.md, MULTI_APP_IMPLEMENTATION_PLAN.md, ORIGINAL_APP_ANALYSIS.md, REFACTORING_ANALYSIS.md, REFACTORING_IMPLEMENTATION_PLAN.md

---

## 1. Executive Summary

Mini Trainer Engine is a reusable, configurable trainer application shell that can be customized for any subject. It provides a complete learning platform with exercise types, gamification, diagnostic frameworks, and accessibility features.

The architecture separates **core engine code** (unchanged between trainers) from **configuration files** (customizable per trainer), enabling rapid development of new subject-specific trainers without modifying the core codebase.

### Key Achievements (Verified Complete)

- ✅ Phase 1 refactoring (T1.1-T1.4) - shuffle, star calculation, exerciseStyles, ExerciseFeedback
- ✅ Phase 2 refactoring (T2.1-T2.4) - keyboard navigation, exercise component consolidation
- ✅ Phase 3 refactoring (T3.1-T3.3) - hook responsibilities clarified, ExercisePage refactored
- ✅ Phase 4 refactoring (T4.1-T4.4) - gamification split, profileStore decomposed, ExercisePage decomposed
- ✅ useGamificationNotifications extracted
- ✅ profileConstants extracted
- ✅ Multi-app architecture substantially complete (daz and mathematik apps)
- ✅ Storage isolation (IndexedDB + localStorage)
- ✅ Build scripts working

---

## 2. Architecture Overview

### 2.1 Project Structure

```
mini-trainer-engine/
├── src/
│   ├── core/                          # CORE ENGINE (unchanged between trainers)
│   │   ├── components/
│   │   │   ├── exercises/             # Exercise type components
│   │   │   ├── gamification/          # Gamification components
│   │   │   ├── level/                 # Level display components
│   │   │   ├── theme/                 # Theme display components
│   │   │   ├── profile/               # Profile components
│   │   │   ├── accessibility/         # Accessibility components
│   │   │   ├── layout/                # Layout components
│   │   │   └── ui/                   # Reusable UI components
│   │   ├── hooks/                     # Custom React hooks
│   │   ├── stores/                    # Zustand state management
│   │   ├── storage/                   # IndexedDB + localStorage
│   │   ├── utils/                     # Utility functions
│   │   ├── pages/                     # Page components
│   │   ├── i18n/                      # Internationalization
│   │   ├── config/                    # Configuration loader
│   │   └── router/                    # Routing
│   ├── apps/                          # App-specific configurations
│   │   ├── daz/
│   │   └── mathematik/
│   ├── config/                        # Default configuration files
│   ├── types/                         # TYPE DEFINITIONS (extensible)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── public/
│   └── data/
│       └── exercises.js                # Generated exercise data (IIFE format)
├── scripts/                           # Build and validation tools
├── docs/                              # Documentation
└── plans/                            # Architecture and planning documents
```

### 2.2 Directory Responsibilities

| Directory | Responsibility | Customization Level |
|-----------|---------------|---------------------|
| `src/core/` | Engine logic, components, hooks, stores | Never modified |
| `src/config/` | Trainer-specific configuration | Fully customizable |
| `src/types/` | TypeScript type definitions | Extensible |
| `public/data/` | Generated exercise data | Generated from config |
| `scripts/` | Build and validation tools | Rarely modified |

### 2.3 Configuration Schema

**Main Configuration Types:**

- `TrainerConfig` - Root configuration defining the entire trainer
- `SubjectConfig` - Subject/domain definition
- `ExerciseTypeConfig` - Exercise type-specific configuration
- `GamificationConfig` - Star calculation, level progression, streaks
- `AccessibilityDefaults` - Default accessibility settings

**Exercise Types Supported:**

- fill-blank, multiple-choice, matching, sentence-builder, sorting
- writing, conjugation-table, connector-insert, word-order, picture-vocabulary

---

## 3. Analysis Findings

### 3.1 Hook Architecture Analysis

#### Current Hook Responsibilities

| Hook | Primary Responsibility | Key Features |
|------|----------------------|--------------|
| `useExerciseLogic.ts` | Per-exercise interaction logic | Answer state, attempts, hints, solution display |
| `useGamification.ts` | Profile-level gamification | Stars, levels, badges, streaks, notifications |
| `useExerciseSession.ts` | Session lifecycle/navigation | Session start/end, exercise progression |
| `useExercisePageState.ts` | Page-level orchestration | Route params, daily challenge, access control |
| `useExerciseScoring.ts` | Statistics calculation | Overall stats, star stats, grouped stats |

#### Issues Identified

1. **Duplicate Answer Submission Logic** - Both useExerciseSession and useExercisePageState implement handleSubmit
2. **Gamification Processing Scattered** - Logic distributed across hooks
3. **Session State Duplication** - Similar concerns managed in multiple hooks
4. **Unclear Sound Effects Ownership** - Scattered across multiple hooks
5. **useExerciseLogic Appears Unused** - Not imported by exercise components
6. **Time Tracking Duplication** - Both useExerciseLogic and exerciseStore track time

#### Recommended Architecture

```
ExercisePage → useExercisePageState (Orchestrator)
                    ↓
              useExerciseSession (Session flow)
                    ↓
              useGamification (Profile mutations)
                    ↓
              IndexedDB (Result persistence)
```

### 3.2 Large File Decomposition Analysis

#### Files Analyzed

| File | Size | Key Responsibilities |
|------|------|---------------------ification.ts | ~14KB|
| useGam | Star tracking, level progression, badges, streaks, notifications |
| profileStore.ts | ~12KB | Profile CRUD, level/stars/streak management, persistence |

#### Decomposition Completed

| Extraction | Status |
|-----------|--------|
| useGamificationNotifications.ts | ✅ Extracted |
| profileConstants.ts | ✅ Extracted |
| profilePersistence.ts | ✅ Already separated |
| profileSelectors.ts | ✅ Already separated |

### 3.3 Refactoring Analysis

#### Code Duplication Issues (HIGH PRIORITY)

1. **Duplicate Shuffle Functions** - In MatchingExercise and CategorySortExercise → **FIXED (T1.1)**
2. **Duplicate Star Calculation** - Multiple re-exports → **FIXED (T1.2)**
3. **Similar Exercise Component Patterns** - Solution styling, hints, keyboard nav

#### Large Files Requiring Decomposition (HIGH PRIORITY)

| File | Issue | Status |
|------|-------|--------|
| ExercisePage.tsx | Mixes session, gamification, UI | Partially refactored |
| CategorySortExercise.tsx | Drag-drop + touch handling | Using sub-components |
| gamification.ts | Multiple concerns | Split to utilities |
| profileStore.ts | Profile + persistence | Already decomposed |

#### Missing Abstractions (MEDIUM PRIORITY)

- Exercise styling system → **FIXED (T1.3 - exerciseStyles.ts)**
- Keyboard navigation hook → Created
- Common feedback component → **FIXED (T1.4 - ExerciseFeedback.tsx)**

---

## 4. Implementation Status

### 4.1 Completed Work (Verified in Codebase)

| Task | Status | Verification |
|------|--------|--------------|
| T1.1 Consolidate Shuffle Functions | ✅ Complete | MatchingExercise, CategorySortExercise import from @core/utils/shuffle |
| T1.2 Remove Star Calculation Re-exports | ✅ Complete | Single source in gamification.ts |
| T1.3 Create Exercise Style Utility | ✅ Complete | src/core/utils/exerciseStyles.ts created |
| T1.4 Create ExerciseFeedback Component | ✅ Complete | src/core/components/exercises/ExerciseFeedback.tsx created |
| useGamificationNotifications extraction | ✅ Complete | New hook in src/core/hooks/ |
| profileConstants extraction | ✅ Complete | New file in src/core/stores/ |

### 4.2 Multi-App Implementation Status

#### ✅ Fully Implemented

| Component | File(s) | Status |
|-----------|---------|--------|
| App directory structure | `src/apps/{app}/` | ✅ Complete |
| App identity config | `src/apps/*/app.json` | ✅ Complete |
| Subject/Areas/Themes/Badges | `src/apps/*/*.json` | ✅ Complete |
| Exercise data | `src/apps/*/exercises.json` | ✅ Complete |
| Config loader | `src/core/config/loader.ts` | ✅ Complete |
| Config context | `src/core/config/ConfigContext.tsx` | ✅ Complete |
| Storage isolation (IndexedDB) | `src/core/storage/db.ts` | ✅ Complete |
| Storage isolation (localStorage) | `src/core/storage/localStorage.ts` | ✅ Complete |
| Build script | `scripts/build-app.mjs` | ✅ Complete |
| Package scripts | `package.json` | ✅ Complete |

#### ⚠️ Partially Implemented

| Component | Issue | Priority |
|-----------|-------|----------|
| Vite define injection | VITE_APP_ID not injected via define plugin | Medium |
| App-specific assets | Icons referenced in app.json don't exist | Low |
| HomePage branding | Not using app-specific primary color | Low |

### 4.3 Refactoring Implementation Status

#### Phase 1: Quick Wins ✅ COMPLETE

| Task | Status |
|------|--------|
| T1.1 Consolidate Shuffle Functions | ✅ Complete |
| T1.2 Remove Star Calculation Re-exports | ✅ Complete |
| T1.3 Create Exercise Style Utility | ✅ Complete |
| T1.4 Create ExerciseFeedback Component | ✅ Complete |

#### Phase 2: Component Consolidation

| Task | Status |
|------|--------|
| T2.1 Create useKeyboardNavigation Hook | ✅ Created |
| T2.2 Refactor MatchingExercise | ✅ Complete |
| T2.3 Refactor CategorySortExercise | ✅ Complete |
| T2.4 Update Other Exercise Components | ✅ Complete |

#### Phase 3: Hook Architecture Refinement

| Task | Status |
|------|--------|
| T3.1 Clarify Hook Responsibilities | ✅ Complete |
| T3.2 Enhance useExerciseLogic Usage | ✅ Complete |
| T3.3 Refactor ExercisePage to Use Hooks | ✅ Complete |

#### Phase 4: Large File Decomposition

| Task | Status |
|------|--------|
| T4.1 Split gamification.ts | ✅ Split to utilities |
| T4.2 Split profileStore.ts | ✅ Already decomposed |
| T4.3 Decompose ExercisePage.tsx | ✅ Complete |
| T4.4 Final Cleanup and Documentation | ✅ Complete |

---

## 5. Remaining Work / Future Improvements

### High Priority

| Task | Description |
|------|-------------|
| Vite define plugin | Add proper build-time injection of app ID |
| App assets | Create icons for daz and mathematik apps |

### Medium Priority

| Task | Description |
|------|-------------|
| HomePage branding | Use app-specific primary color and terminology |

### Low Priority

| Task | Description |
|------|-------------|
| Integration tests | Add tests for storage isolation |
| PWA builds | Test PWA functionality for each app |

---

## 6. Reference Materials

### Original App Analysis Summary

The original mini-daz-trainer-kids application provides the following reference patterns:

#### Application Flow

```
/ → HomePage (profile creation OR dashboard)
/themes → ThemeSelectPage
/levels/:themeId → LevelSelectPage
/exercise/:themeId → ExercisePage
/progress → ProgressPage
/settings → SettingsPage
/badges → BadgeGalleryPage
/daily-challenge → DailyChallengePage
/teacher/pin → TeacherPinPage
/teacher/dashboard → TeacherDashboardPage
```

#### Profile System

- Dual storage: localStorage (Zustand persist) + IndexedDB (sync)
- Avatar options: 12 emoji choices
- Nickname: max 20 characters

#### Gamification

- **Stars**: 3 stars (1st try), 2 stars (2nd try), 1 star (3rd try), 0 (solution shown)
- **Levels**: Derived from total stars (4 >= 20, 3 >= 12, 2 >= 4, 1 default)
- **Streaks**: Daily streaks with milestone badges
- **Badges**: Various achievements (first star, streak, level, theme completion)

#### Exercise Types (Reference)

- MultipleChoiceExercise
- MatchingExercise
- FillBlankExercise
- CategorySortExercise
- SentenceBuilderExercise
- And more...

---

## Appendix: Key Files Reference

| Purpose | File Path |
|---------|-----------|
| Configuration | `src/core/config/ConfigContext.tsx` |
| Config Loader | `src/core/config/loader.ts` |
| Storage (IndexedDB) | `src/core/storage/db.ts` |
| Storage (localStorage) | `src/core/storage/localStorage.ts` |
| Build Script | `scripts/build-app.mjs` |
| Exercise Styles | `src/core/utils/exerciseStyles.ts` |
| Exercise Feedback | `src/core/components/exercises/ExerciseFeedback.tsx` |
| Gamification Hook | `src/core/hooks/useGamification.ts` |
| Gamification Notifications | `src/core/hooks/useGamificationNotifications.ts` |
| Profile Store | `src/core/stores/profileStore.ts` |
| Profile Constants | `src/core/stores/profileConstants.ts` |

---

*Last Updated: 2026-03-01*
*This is a consolidated master plan combining all planning documents in the plans/ directory.*
