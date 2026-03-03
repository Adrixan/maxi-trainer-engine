# Accessibility Guide

Mini Trainer Engine is designed with accessibility as a core principle, targeting **WCAG 2.1 AA** compliance. This guide explains the accessibility features and how to customize them.

## WCAG 2.1 AA Compliance

The application follows the Web Content Accessibility Guidelines (WCAG) 2.1 at the AA level, which includes:

- **Perceivable**: Information and UI components must be presentable to users in ways they can perceive
- **Operable**: UI components and navigation must be operable by all users
- **Understandable**: Information and UI operation must be understandable
- **Robust**: Content must be robust enough for diverse assistive technologies

## Accessibility Features

### Keyboard Navigation

All interactive elements are accessible via keyboard:

| Key | Action |
|-----|--------|
| `Tab` | Move to next interactive element |
| `Shift + Tab` | Move to previous element |
| `Enter` | Activate buttons, links |
| `Space` | Toggle checkboxes, activate buttons |
| `Escape` | Close modals, cancel actions |
| `Arrow Keys` | Navigate within components |

#### Focus Management

- **Visible Focus**: All focusable elements have a visible focus indicator
- **Focus Trap**: Modals trap focus within the dialog
- **Focus Return**: Focus returns to the trigger element when modals close
- **Skip Links**: "Skip to main content" link at the top of each page

### Screen Reader Support

The application is tested with major screen readers:

- **NVDA** (Windows, free)
- **JAWS** (Windows)
- **VoiceOver** (macOS, iOS)
- **TalkBack** (Android)

#### ARIA Implementation

| Element | ARIA Attributes |
|---------|-----------------|
| Buttons | `aria-label`, `aria-pressed` |
| Forms | `aria-required`, `aria-invalid`, `aria-describedby` |
| Live Regions | `aria-live="polite"` for announcements |
| Modals | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| Progress | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax` |
| Navigation | `aria-current="page"` for current page |

#### Live Regions

Dynamic content changes are announced via live regions:

```tsx
<LiveRegion aria-live="polite">
  {message}
</LiveRegion>
```

### Visual Accessibility

#### High Contrast Mode

A high contrast color scheme for users with low vision:

- Increased color contrast ratios (minimum 4.5:1 for text)
- Distinct focus indicators
- Clear visual hierarchy

Enable in Settings or via keyboard shortcut.

#### Font Size Options

Three font size options:

| Option | Description |
|--------|-------------|
| Normal | Default size (16px base) |
| Large | 125% of normal (20px base) |
| Extra Large | 150% of normal (24px base) |

#### Color Independence

Information is never conveyed by color alone:

- Icons accompany status colors
- Text labels supplement color indicators
- Patterns differentiate chart elements

### Motion and Animation

#### Reduced Motion

Respects the `prefers-reduced-motion` system preference:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

#### Animation Toggle

Users can disable animations in Settings:

- No animations for transitions
- Instant state changes
- Reduced visual complexity

### Audio Accessibility

#### Sound Toggle

All sounds can be disabled:

- Success/error sound effects
- Background audio
- Notification sounds

#### Visual Alternatives

All audio cues have visual equivalents:

- Success sounds accompanied by visual feedback
- Error sounds paired with error messages
- Notifications displayed as toasts

## Accessibility Settings

Users can customize accessibility in the Settings page:

### Available Settings

| Setting | Options | Default |
|---------|---------|---------|
| Font Size | Normal, Large, Extra Large | Normal |
| High Contrast | On/Off | Off |
| Animations | On/Off | On |
| Sound | On/Off | On |

### Accessing Settings

1. Navigate to Settings via the bottom navigation
2. Use Tab to navigate through options
3. Press Enter or Space to toggle settings

## Semantic Structure

### HTML Landmarks

Every page uses semantic HTML landmarks:

```html
<header>
  <!-- Site header -->
</header>
<nav aria-label="Main navigation">
  <!-- Navigation -->
</nav>
<main id="main-content">
  <!-- Main content -->
</main>
<footer>
  <!-- Site footer -->
</footer>
```

### Heading Hierarchy

Headings follow a logical hierarchy:

- Single `<h1>` per page
- No skipped levels (h1 -> h2 -> h3)
- Descriptive heading text

### Form Accessibility

All forms follow accessible patterns:

```html
<label for="email">Email Address</label>
<input 
  type="email" 
  id="email" 
  name="email"
  required
  aria-describedby="email-error"
>
<span id="email-error" role="alert">
  <!-- Error message -->
</span>
```

## Exercise Accessibility

Each exercise type is designed with accessibility in mind:

### Multiple Choice

- Options are radio buttons (native HTML)
- Clear visual selection state
- Keyboard navigation with arrow keys

### Fill-in-the-Blank

- Text input with associated label
- Clear indication of blank location
- Error messages announced

### Matching

- Drag-and-drop with keyboard alternative
- Clear visual pairing indicators
- Announces match status

### Sentence Builder

- Word selection via keyboard
- Clear column structure
- Announces sentence construction

### Sorting

- Drag-and-drop with keyboard alternative
- Category labels announced
- Clear visual grouping

### Word Order

- Keyboard-accessible word arrangement
- Announces current position
- Clear visual order

### Writing

- Text area with label
- Character count announced
- Scaffold hints accessible

### Picture Vocabulary

- `alt` text for all pictures
- Multiple-choice fallback
- Clear visual prompt

## Testing Accessibility

### Automated Testing

Run accessibility tests with:

```bash
npm run test:coverage
```

The test suite includes accessibility checks using jest-axe.

### Manual Testing Checklist

- [ ] Navigate entire application with keyboard only
- [ ] Test with screen reader (NVDA, VoiceOver)
- [ ] Verify color contrast with contrast checker
- [ ] Test at 200% zoom
- [ ] Test with high contrast mode enabled
- [ ] Test with animations disabled
- [ ] Test with sound disabled

### Screen Reader Testing

#### NVDA (Windows)

1. Download and install NVDA (free)
2. Start NVDA
3. Navigate the application
4. Verify all content is announced correctly

#### VoiceOver (macOS)

1. Enable VoiceOver: `Cmd + F5`
2. Navigate with `Ctrl + Option + Arrow keys`
3. Activate with `Ctrl + Option + Space`

## Customizing Accessibility

### Default Settings

Set default accessibility options in configuration:

```json
{
  "accessibility": {
    "defaultFontSize": "normal",
    "defaultHighContrast": false,
    "defaultAnimationsEnabled": true,
    "defaultSoundEnabled": true
  }
}
```

### Adding Custom Accessibility Features

1. **New Settings**: Add to `AccessibilitySettings.tsx`
2. **Store Updates**: Add to `appStore.ts`
3. **CSS Support**: Add corresponding CSS variables

### Accessibility Utilities

The application provides accessibility utility functions:

```typescript
// Announce message to screen readers
announceToScreenReader(message: string, priority?: 'polite' | 'assertive');

// Check if reduced motion is preferred
prefersReducedMotion(): boolean;

// Get accessible color contrast ratio
getContrastRatio(foreground: string, background: string): number;
```

## Best Practices

### For Content Creators

1. **Alt Text**: Always provide descriptive alt text for images
2. **Instructions**: Write clear, concise instructions
3. **Feedback**: Provide meaningful error and success messages
4. **Hints**: Ensure hints are accessible via keyboard

### For Developers

1. **Native Elements**: Use native HTML elements when possible
2. **ARIA Sparingly**: Only use ARIA when native HTML is insufficient
3. **Focus Management**: Always manage focus in dynamic content
4. **Testing**: Test with actual assistive technologies

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [NVDA Screen Reader](https://www.nvaccess.org/)

## Next Steps

- [Configure your trainer](CONFIGURATION.md)
- [Create accessible exercises](EXERCISES.md)
- [Deploy your trainer](DEPLOYMENT.md)
