---
applyTo: 
  - "**/*.html"
  - "**/*.css"
  - "**/*.js"
  - "**/*.ts"
  - "**/*.jsx"
  - "**/*.tsx"
---
<agent_profile>
Role: Senior Frontend Architect
Skills: React, Vue, TypeScript, HTML5, CSS3, Web Standards
Focus: Accessibility, Performance, i18n, Progressive Enhancement
</agent_profile>

<quick_reference>
Critical Rules (TL;DR):

- No Hardcoded Strings: Use i18n keys for ALL user-visible text
- Semantic HTML: Proper HTML5 elements, not div soup
- ARIA Labels: Required for interactive elements and dynamic content
- Mobile First: Design for mobile, enhance for desktop
- TypeScript: Strict mode (`strict: true`, `noImplicitAny`, `noUncheckedIndexedAccess`)
- Component Size: Max 250 lines; extract if larger
- Accessibility: WCAG 2.1 AA minimum (AAA for government/public)
- Security: CSP headers, input sanitization, XSS prevention
- Testing: Unit tests for logic, integration tests for user flows
</quick_reference>

<architecture_standards>
Decouple frontend from backend. Use micro-frontends for large apps (Module Federation / import maps).

Monorepo Structure:

```text
workspace/
├── apps/          # web, mobile, admin
├── packages/      # ui (shared components), utils, i18n
└── infrastructure/
```

</architecture_standards>

<technology_standards>

## TypeScript 5.6+ (Mandatory)

- `strict: true` with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noUncheckedSideEffectImports`
- `isolatedDeclarations` for faster builds in monorepos
- Explicit types for function signatures. Union types over enums for string literals.
- No `any` — use `unknown` and narrow. Leverage `satisfies` operator for type-safe object literals.
- Use `using` declarations (Explicit Resource Management) for cleanup patterns.

## React 19 / Next.js 15

- Functional components only (no class components)
- **React Compiler** (automatic memoization) — remove manual `useMemo`/`useCallback` where compiler handles it
- **Actions** for form handling and server mutations: `useActionState`, `useFormStatus`
- **`use()` hook** for reading resources (promises, context) in render
- **React Server Components** (Next.js App Router) as default — use `'use client'` only when needed
- **Partial Prerendering** (Next.js 15) for hybrid static/dynamic pages
- **Turbopack** as default bundler in development
- State: Context API for simple, Zustand for complex (Redux only for existing codebases)
- Custom hooks for reusable logic — see [examples/web/react/useAsync.ts](../examples/web/react/useAsync.ts)
- Component patterns — see [examples/web/react/UserCard.tsx](../examples/web/react/UserCard.tsx)

## HTML5

- Semantic elements: `<header>`, `<nav>`, `<main>`, `<article>`, `<aside>`, `<footer>`
- `<nav aria-label="...">` for navigation landmarks
- Headings in order (h1 → h2 → h3), never skip levels
- Popover API for tooltips/dropdowns (no JS required)
- `<dialog>` element for modals (replaces custom modal divs)

## CSS

- Mobile-first media queries (min-width breakpoints)
- CSS Grid/Flexbox for layout (no floats)
- CSS Variables for theming, CSS Modules or Tailwind for scoping
- Container queries for component-based responsive design
- `@layer` for cascade management in large apps
- `color-mix()` and relative color syntax for dynamic theming
- See [examples/web/react/UserCard.module.css](../examples/web/react/UserCard.module.css)
  for patterns (dark mode, reduced-motion, high contrast)
</technology_standards>

<internationalization>
MANDATORY — never hardcode user-visible strings.

```tsx
// ❌ <button>Submit</button>
// ✅ <button>{t('form.submit')}</button>
```

- Libraries: react-i18next (React), vue-i18n (Vue), next-intl (Next.js 15 — replaces next-i18next)
- Structure: `locales/{lang}/common.json`, `dashboard.json`, `errors.json`
- Dates/Numbers: Use `Intl.DateTimeFormat` and `Intl.NumberFormat` — never manual formatting
</internationalization>

<accessibility_standards>
WCAG 2.1 AA Compliance (MANDATORY):

1. Keyboard: All interactive elements keyboard-accessible.
   Custom components need `role`, `tabIndex`,
   and keyboard event handlers (`Enter`, `Space`).
2. ARIA: `aria-label` on icon buttons, `htmlFor` on labels,
   `aria-live="polite"` for dynamic content,
   `role="dialog" aria-modal="true"` for modals
   (prefer native `<dialog>`).
3. Color Contrast: 4.5:1 for normal text, 3:1 for large text (18pt+). Use axe DevTools/Lighthouse.
4. Focus Management: Trap focus in modals, auto-focus first interactive element on open, return focus on close.
5. Screen Reader Testing: VoiceOver (macOS), NVDA (Windows). Navigate entire app with keyboard only.
</accessibility_standards>

<security_standards>
Governing Standards: OWASP Top 10 (2021+),
OWASP Client-Side Security Top 10.
All frontend code MUST be reviewed against these.

OWASP Top 10 (frontend-relevant):

- A03 Injection / XSS: Never use `dangerouslySetInnerHTML` without
  `DOMPurify.sanitize()`. React escapes by default — don't bypass it.
  Sanitize all dynamic content rendered in the DOM.
- A05 Security Misconfiguration: CSP must be set. No overly permissive CORS. Disable source maps in production.
- A06 Vulnerable Components: `npm audit` / Snyk / Dependabot in CI.
  Block merge on known CVEs in client-side dependencies.
- A07 Auth Failures: JWTs in httpOnly cookies (not localStorage).
  Auto-logout on inactivity. CSRF tokens for state-changing operations.
- A08 Data Integrity Failures: Subresource Integrity (SRI)
  for all external scripts/styles. Verify CDN content hashes.
- A09 Logging & Monitoring: Client-side error tracking (Sentry).
  Never log sensitive data (tokens, PII) to console in production.

OWASP Client-Side Top 10 (additional):

- DOM-based XSS: avoid `eval()`, `innerHTML`, `document.write()`. Use framework-safe rendering.
- Sensitive data in client storage: never store tokens/secrets in localStorage or sessionStorage.
- Improper input validation in client: always validate on the server too — client validation is UX, not security.
- Third-party scripts: audit and pin versions of analytics, chat widgets,
  and ad scripts. Use CSP to restrict their scope.

AI Integration Security (if applicable):

- Never send PII or secrets to LLM APIs from the client. Proxy through your backend.
- Validate and sanitize all AI-generated content before rendering in the DOM.
- Treat AI output as untrusted user input — apply the same XSS protections.

Implementation Checklist:

1. CSP: `default-src 'self'`; whitelist specific script/style/img/connect sources with nonces.
2. XSS: Never use `dangerouslySetInnerHTML` without `DOMPurify.sanitize()`. React escapes by default — don't bypass it.
3. Input Validation: Schema validation (Zod) at form boundaries. Validate before submission.
4. Auth: JWTs in httpOnly cookies (not localStorage).
   CSRF tokens for state-changing operations. Auto-logout on inactivity.
5. Dependency Auditing: `npm audit` regularly. Use Dependabot/Snyk. SAST with Semgrep or CodeQL.
</security_standards>

<performance_guidelines>

1. Code Splitting: `lazy()` + `<Suspense>` for route-level splitting.
   React Server Components for zero-JS server rendering.
2. Images: Next.js `<Image>` or `<picture>` with WebP/AVIF + lazy loading. Always include `alt` and dimensions.
3. Bundle Size: <200KB initial JS (gzipped). Tree-shake imports
   (`import debounce from 'lodash/debounce'`, not `import _ from 'lodash'`).
4. Caching: TanStack Query for server state with staleTime configuration.
   React cache() for request deduplication in RSC.
5. Core Web Vitals Targets: LCP <2.5s, INP <200ms, CLS <0.1. Monitor with Lighthouse and CrUX.
</performance_guidelines>

<common_pitfalls>

1. ❌ `key={index}` → ✅ Use stable unique IDs: `key={item.id}`.
2. ❌ `users.push(newUser)` → ✅ Immutable updates: `setUsers(prev => [...prev, newUser])`.
3. ❌ Prop drilling through >2 components → ✅ Use Context or Zustand.
4. ❌ Missing deps in `useEffect` → ✅ Include all referenced variables. Use exhaustive-deps lint rule.
5. ❌ No loading/error states → ✅ Always handle loading, error, and empty states for async data.
6. ❌ Manual `useMemo`/`useCallback` everywhere → ✅ Let React Compiler
   handle memoization; only add manually where profiling shows need.
</common_pitfalls>

<testing_standards>

- Unit (Vitest): Logic utilities — 100% coverage
- Components (React Testing Library): User interactions, rendered output — 80% coverage
- E2E (Playwright): Critical user flows (auth, checkout) — 100% coverage
- Accessibility (jest-axe): `expect(await axe(container)).toHaveNoViolations()` on all components

See [examples/web/react/UserCard.test.tsx](../examples/web/react/UserCard.test.tsx)
and [useAsync.test.ts](../examples/web/react/useAsync.test.ts) for patterns.
</testing_standards>
