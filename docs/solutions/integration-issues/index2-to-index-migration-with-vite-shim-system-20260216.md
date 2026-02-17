---
module: System
date: 2026-02-16
problem_type: integration_issue
component: tooling
symptoms:
  - "Homepage ownership was ambiguous (`index2.html` treated as primary in docs while root `index.html` still existed)."
  - "Project return links still targeted `/index2.html`, risking stale navigation after promotion."
  - "`npm run build` failed with `[vite:build-html] EISDIR: illegal operation on a directory, read` when the redirect shim used `<link rel=\"canonical\" href=\"/\">`."
root_cause: missing_workflow_step
resolution_type: workflow_improvement
severity: medium
tags: [vite, homepage-migration, redirect-shim, docs-sync, gh-pages]
---

# Troubleshooting: Promote `index2.html` to root `index.html` without breaking build or links

## Problem
The site had a split-brain homepage: the modern portfolio lived in `index2.html`, while root `index.html` was legacy. Build inputs, runtime links, and contributor docs were not aligned, so promoting the new page to `/` risked broken navigation and build regressions.

## Environment
- Module: System-wide website routing/build setup
- Stack: Vite 7.3.1, vanilla JS, GSAP
- Affected Component: Vite multipage input map and root HTML routing
- Date: 2026-02-16

## Symptoms
- Docs and agent guidance described conflicting homepage ownership.
- Runtime links from project pages pointed to `/index2.html` instead of `/`.
- Initial redirect shim implementation caused this build error:

```text
[vite:build-html] EISDIR: illegal operation on a directory, read
file: /Users/randy/Git/website/index2.html
```

## What Didn't Work

**Attempted Solution 1:** Add a canonical tag to the redirect shim:

```html
<link rel="canonical" href="/" />
```

- **Why it failed:** During Vite HTML processing, the root-relative canonical value was treated as an asset-like URL path and triggered a file read against `/`, producing the `EISDIR` failure.

## Solution
Apply a coordinated migration with explicit legacy + alias handling:

1. Promote and archive root files:
- `index.html` (legacy) -> `index-legacy.html`
- `index2.html` (modern page) -> `index.html`

2. Keep temporary alias for stale bookmarks:
- New `index2.html` is a minimal redirect shim using `meta refresh` + `window.location.replace('/')`.
- Do not include `<link rel="canonical" href="/">` in this shim.

3. Keep Vite multipage inputs explicit:

```js
input: {
  main: resolve(import.meta.dirname, 'index.html'),
  legacy: resolve(import.meta.dirname, 'index-legacy.html'),
  index2: resolve(import.meta.dirname, 'index2.html'),
  contact: resolve(import.meta.dirname, 'contact.html'),
  resume: resolve(import.meta.dirname, 'resume.html'),
  sandbox: resolve(import.meta.dirname, 'sandbox.html'),
  wyatt: resolve(import.meta.dirname, 'case_study_wyatt.html'),
  ...discoverProjects(),
}
```

4. Update runtime links to `/`:
- `projects/wyatt-earp/index.html` close link -> `/`
- `case_study_wyatt.html` back link -> `/`

5. Sync contributor docs in the same change set:
- `README.md`, `AGENTS.md`, `ROADMAP.md`, `docs/linear.md`

6. Verify immediately:

```bash
npm run lint
npm run build
rg -n "index2\\.html|/index2\\.html" *.html projects src
# browser smoke (playwright-cli): /, /index2.html redirect, project close/back flows
```

## Why This Works
- Root canonical route (`/`) now maps to one clear homepage source (`index.html` + `src/main.js`).
- Legacy experience is preserved intentionally at `index-legacy.html`, instead of being accidentally live at root.
- Temporary alias (`index2.html`) protects stale bookmarks while migration settles.
- Runtime navigation and docs are updated in the same pass, removing contributor ambiguity and preventing future stale-link regressions.
- Avoiding canonical `href="/"` in the shim removes Vite's `EISDIR` build failure.

## Prevention
- Treat page promotions as a 4-part migration every time: file rename, build input map, runtime link audit, docs sync.
- For Vite redirect shims, keep HTML minimal; avoid canonical root tags in shim files.
- Add a standard migration check:

```bash
rg -n "index2\\.html|/index2\\.html" *.html projects src
npm run build
```

- Keep temporary aliases time-boxed (remove after one or two stable releases).

## Related Issues
No related issues documented yet.
