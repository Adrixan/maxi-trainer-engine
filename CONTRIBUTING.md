# Contributing to Mini Trainer Engine

Thank you for your interest in contributing to Mini Trainer Engine! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Commit Message Format](#commit-message-format)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)

## Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, education, socio-economic status, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**

- Trolling, insulting comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

## Development Setup

### Prerequisites

- Node.js 18+ (20+ recommended)
- npm 9+
- Git

### Initial Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/mini-trainer-engine.git
cd mini-trainer-engine

# Install dependencies
npm install

# Validate configuration
npm run validate

# Run tests to verify setup
npm run test

# Start development server
npm run dev
```

### IDE Setup

#### VS Code (Recommended)

Install recommended extensions:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

#### Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Development Workflow

### 1. Create a Branch

```bash
# Update main branch
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/your-feature-name
```

Branch naming conventions:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions/changes

### 2. Make Changes

- Write code following the [Code Style Guidelines](#code-style-guidelines)
- Add/update tests as needed
- Update documentation for user-facing changes

### 3. Test Your Changes

```bash
# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Type check
npm run typecheck

# Lint
npm run lint

# Validate configuration
npm run validate
```

### 4. Commit Changes

Follow the [Commit Message Format](#commit-message-format).

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create a pull request on GitHub.

## Code Style Guidelines

### TypeScript

- Use TypeScript 5.6+ features
- Enable strict mode
- Use explicit types for function signatures
- Prefer `interface` over `type` for object shapes
- Use `const` assertions for literal types

```typescript
// Good
interface ExerciseProps {
  content: ExerciseContent;
  onSubmit: (correct: boolean) => void;
}

function Exercise({ content, onSubmit }: ExerciseProps) {
  // ...
}

// Avoid
function Exercise(props: any) {
  // ...
}
```

### React

- Use functional components only
- Use React hooks for state and side effects
- Keep components focused and small (≤50 lines)
- Extract reusable logic to custom hooks

```tsx
// Good
function MultipleChoiceExercise({ content, onSubmit }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  
  const handleSubmit = useCallback(() => {
    if (selected !== null) {
      onSubmit(selected === content.correctIndex);
    }
  }, [selected, content.correctIndex, onSubmit]);
  
  return (
    // JSX
  );
}

// Avoid
class MultipleChoiceExercise extends React.Component {
  // ...
}
```

### CSS/Tailwind

- Use Tailwind utility classes
- Follow mobile-first approach
- Use CSS variables for theming
- Ensure accessibility (contrast, focus states)

```tsx
// Good
<button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500">
  Submit
</button>
```

### File Organization

```
src/
├── core/                    # Core engine (unchanged between trainers)
│   ├── components/
│   │   └── Feature/
│   │       ├── Feature.tsx
│   │       ├── Feature.test.tsx
│   │       └── index.ts
│   ├── hooks/
│   │   └── useFeature.ts
│   └── utils/
│       └── feature.ts
├── config/                  # Configuration (customizable)
└── types/                   # TypeScript types
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `MultipleChoiceExercise` |
| Hooks | camelCase with `use` prefix | `useExerciseScoring` |
| Utilities | camelCase | `calculateStars` |
| Types/Interfaces | PascalCase | `ExerciseContent` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_ATTEMPTS` |
| Files (components) | PascalCase | `MultipleChoiceExercise.tsx` |
| Files (utilities) | camelCase | `gamification.ts` |

## Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Code style (formatting, etc.) |
| `refactor` | Code refactoring |
| `test` | Adding/updating tests |
| `chore` | Maintenance tasks |

### Scopes

| Scope | Description |
|-------|-------------|
| `core` | Core engine changes |
| `exercises` | Exercise components |
| `gamification` | Gamification system |
| `accessibility` | Accessibility features |
| `config` | Configuration changes |
| `build` | Build system |
| `ci` | CI/CD changes |

### Examples

```
feat(exercises): add drag-and-drop exercise type

Add new exercise type for drag-and-drop interactions.
Includes component, type definitions, and tests.

Closes #123
```

```
fix(gamification): correct star calculation for retries

Stars were being calculated incorrectly when users retried
exercises. Now properly resets attempt count.

Fixes #456
```

```
docs: update deployment guide for Netlify

Add specific instructions for Netlify deployment with
proper redirects configuration.
```

## Pull Request Process

### Before Submitting

1. **Update from main**:

   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks**:

   ```bash
   npm run lint
   npm run typecheck
   npm run test
   npm run validate
   ```

3. **Build successfully**:

   ```bash
   npm run build
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added
- [ ] Manual testing performed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests added/updated
```

### Review Process

1. **Automated Checks**: CI must pass
2. **Code Review**: At least one approval required
3. **Address Feedback**: Respond to all comments
4. **Squash and Merge**: Maintainer will squash commits

### After Merge

- Delete your feature branch
- Update your local main branch

## Testing Requirements

### Test Coverage

| Type | Minimum Coverage |
|------|------------------|
| Utilities | 80% |
| Hooks | 80% |
| Components | 70% |
| Critical paths | 100% |

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test -- path/to/test.ts

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### Writing Tests

#### Component Tests

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MultipleChoiceExercise } from '../MultipleChoiceExercise';

describe('MultipleChoiceExercise', () => {
  const mockContent = {
    type: 'multiple-choice' as const,
    question: 'Test question?',
    options: ['A', 'B', 'C'],
    correctIndex: 0
  };

  it('renders question and options', () => {
    render(
      <MultipleChoiceExercise
        content={mockContent}
        hints={[]}
        onSubmit={vi.fn()}
        showSolution={false}
      />
    );

    expect(screen.getByText('Test question?')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('calls onSubmit with correct result', () => {
    const onSubmit = vi.fn();
    render(
      <MultipleChoiceExercise
        content={mockContent}
        hints={[]}
        onSubmit={onSubmit}
        showSolution={false}
      />
    );

    fireEvent.click(screen.getByText('A'));
    fireEvent.click(screen.getByText('Submit'));

    expect(onSubmit).toHaveBeenCalledWith(true);
  });
});
```

#### Hook Tests

```tsx
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useExerciseScoring } from '../useExerciseScoring';

describe('useExerciseScoring', () => {
  it('calculates stars correctly', () => {
    const { result } = renderHook(() => useExerciseScoring());

    act(() => {
      result.current.submitAnswer(true, 1);
    });

    expect(result.current.stars).toBe(3);
  });
});
```

#### Accessibility Tests

```tsx
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, it, expect } from 'vitest';
import { MultipleChoiceExercise } from '../MultipleChoiceExercise';

describe('MultipleChoiceExercise accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <MultipleChoiceExercise
        content={mockContent}
        hints={[]}
        onSubmit={vi.fn()}
        showSolution={false}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Questions?

- Open a [Discussion](https://github.com/your-org/mini-trainer-engine/discussions) for questions
- Check existing [Issues](https://github.com/your-org/mini-trainer-engine/issues) before opening a new one

Thank you for contributing!
