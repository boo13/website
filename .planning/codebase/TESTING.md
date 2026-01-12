# Testing Patterns

**Analysis Date:** 2026-01-12

## Test Framework

**Runner:**
- None currently configured
- `package.json` line 7: `"test": "echo \"Error: no test specified\" && exit 1"`

**Assertion Library:**
- Not applicable

**Run Commands:**
```bash
npm test                     # Currently: exits with error
```

## Test File Organization

**Location:**
- No test files exist in codebase
- No `__tests__/` directory
- No `*.test.js` or `*.spec.js` files

**Naming:**
- Not applicable (no tests)

## Current Testing Approach

**From CLAUDE.md (Manual Testing):**
```markdown
### Testing
- No automated test framework
- Manual cross-browser validation required: Chrome, Firefox, Safari
- Check responsive behavior at mobile/tablet/desktop breakpoints
- Verify video autoplay/loading, slider navigation, form interactions
- Ensure console is error-free
```

**Manual Test Areas:**

1. **Video Component** (`js/Video.js`):
   - Video loading and overlay display timeout (5s)
   - Responsive source switching on resize
   - Playback state preservation during source changes
   - Autoplay behavior across browsers

2. **Slider Component** (`js/Slider.js`):
   - Click-based navigation (left/right half clicks)
   - Preview thumbnail selection
   - Animation smoothness and direction
   - Counter and title synchronization
   - Boundary conditions (first/last slide)

3. **Responsive Behavior**:
   - Mobile vs desktop layouts
   - Aspect ratio detection and video source switching
   - Touch vs mouse interactions

4. **Browser Compatibility**:
   - Chrome, Firefox, Safari
   - Video format support (WebM)
   - GSAP animation consistency

5. **Accessibility**:
   - Reduced motion preference respected (v4)
   - Keyboard navigation (not implemented)

## Development Tooling

**Linting:**
- ESLint 9.39.2 installed (`package.json` line 22)
- Not configured (no `.eslintrc*` or `eslint.config.js`)
- No scripts defined for running linter

**Formatting:**
- Prettier 3.7.4 installed (`package.json` line 24)
- Not configured (no `.prettierrc`)
- No scripts defined for formatting

**Type Checking:**
- Not applicable (vanilla JavaScript, no TypeScript)

## Coverage

**Requirements:**
- No coverage targets
- No coverage tooling

**Current State:**
- 0% automated test coverage
- Relies entirely on manual testing

## Recommended Test Strategy

If implementing automated testing:

**Unit Tests (Vitest recommended):**
- Slider navigation logic (boundary conditions)
- Video source selection based on aspect ratio
- Counter/title position calculations

**Integration Tests:**
- Component initialization with real DOM
- GSAP animation timing verification
- Event listener behavior

**E2E Tests (Playwright recommended):**
- Full slider navigation flow
- Video playback and source switching
- Form submission (Formspree integration)
- Cross-browser visual testing

**Example Test Structure:**
```javascript
// js/Slider.test.js (hypothetical)
describe('Slider', () => {
  describe('navigation', () => {
    it('should advance to next slide on right click', () => {
      // ...
    });

    it('should wrap from last to first slide', () => {
      // ...
    });
  });
});
```

## Pre-Commit Validation

**Current:**
- No pre-commit hooks configured
- Manual review before commit

**Recommended:**
- Add husky for pre-commit hooks
- Run ESLint on staged files
- Format with Prettier

## Quality Assurance Process

**Current Workflow:**
1. Make changes locally
2. Test manually in browser
3. Check console for errors
4. Verify responsive behavior
5. Commit to `gh-pages` branch
6. Verify on production site

**Git Workflow:**
- Commit style: Imperative mood, concise
- Examples: `fix slider autoplay pause`, `update hero typography`
- No PR review process (solo developer)

---

*Testing analysis: 2026-01-12*
*Update when test patterns change*
