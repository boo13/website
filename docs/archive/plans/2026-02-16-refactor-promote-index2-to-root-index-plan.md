---
title: "refactor: Promote index2.html to root index.html"
type: refactor
status: completed
date: 2026-02-16
---

# refactor: Promote index2.html to root index.html

## Overview

Promote the current portfolio experience in `index2.html` to the canonical root page (`/`), archive the legacy slider page, and align routing, build inputs, navigation links, and documentation so the repository and deployment reflect a single clear primary homepage.

## Problem Statement

The repo is in a transitional state where the "new primary" page is still named `index2.html`, while `index.html` remains wired as the main Vite input:

- Vite still maps `main` to `index.html` in `vite.config.js:31`.
- `index2.html` is treated as secondary input in `vite.config.js:32`.
- Multiple pages still hard-link to `/index2.html`:
  - `projects/wyatt-earp/index.html:35`
  - `case_study_wyatt.html:26`
- Project docs and contributor guidance still describe `index2.html` as primary and `index.html` as legacy (`README.md:9-10`, `AGENTS.md:25`, `ROADMAP.md:5-7`).

This creates ambiguity for contributors and increases risk of broken links or wrong-page edits.

## Proposed Solution

Execute a controlled migration with explicit phases:

1. Archive legacy root page (`index.html`) as `index-legacy.html`.
2. Promote `index2.html` to `index.html`.
3. Update Vite multi-page input mapping so canonical root remains `main: index.html`, and legacy remains optionally buildable.
4. Replace all runtime references to `index2.html` with `/` or `/index.html`.
5. Update project documentation and agent guidance to reflect the new source of truth.
6. Verify with lint/build/dev + browser checks before merge/deploy.

## Technical Approach

### Architecture

Current state:

- Canonical root page: `index.html` (legacy UI, `src/main-index.js`) at `index.html:253`
- New portfolio page: `index2.html` (`src/main.js`) at `index2.html:905`
- Build inputs defined in `vite.config.js:30-37`

Target state:

- Canonical root page: `index.html` (formerly `index2.html`, still using `src/main.js`)
- Archived legacy page: `index-legacy.html` (formerly `index.html`, still using `src/main-index.js`)
- Optional alias behavior for `/index2.html`:
  - Preferred: keep a short deprecation shim (`index2.html`) redirecting to `/` for one release cycle.
  - Alternate: remove `index2.html` entirely and accept 404 risk for stale bookmarks.

### Implementation Phases

#### Phase 1: Pre-migration alignment (Foundation)

Tasks:

- Confirm desired legacy strategy:
  - Keep legacy at `/index-legacy.html`, or remove it entirely.
- Confirm alias strategy for stale `/index2.html` links:
  - Keep temporary redirect shim, or remove.
- Create migration branch from `dev` (if doing risky changes).

Deliverables:

- Written decision on legacy retention and alias behavior.
- Clean working tree baseline before edits.

Success criteria:

- Migration behavior is defined before file renames.

Estimated effort:

- 10-20 minutes.

#### Phase 2: File and build migration (Core implementation)

Tasks:

- Rename root files:
  - `index.html` -> `index-legacy.html`
  - `index2.html` -> `index.html`
- Update Vite inputs in `vite.config.js`:
  - Keep `main: resolve(..., 'index.html')`
  - Remove or repurpose `index2` input
  - Add `legacy: resolve(..., 'index-legacy.html')` if legacy page retained
- If using temporary alias, add `index2.html` redirect shim to `/`.

Deliverables:

- New canonical root page in filename `index.html`.
- Correct Vite input mapping for build output.

Success criteria:

- `vite build` produces expected multipage output without duplicate/incorrect home entry.

Estimated effort:

- 20-40 minutes.

#### Phase 3: Link and navigation correction (Core implementation)

Tasks:

- Update runtime links still targeting `index2.html`:
  - `projects/wyatt-earp/index.html:35` -> `/` (or `/index.html`)
  - `case_study_wyatt.html:26` -> `/` (or `/index.html`)
- Search and fix remaining runtime references:
  - `rg -n "index2\\.html|/index2\\.html" *.html projects src`
- Keep doc references separate from runtime references so docs can still mention migration history where useful.

Deliverables:

- No user-facing navigation points to deprecated `index2.html`.

Success criteria:

- Link audit confirms all runtime links resolve correctly.

Estimated effort:

- 10-20 minutes.

#### Phase 4: Docs and contributor policy update (Polish and consistency)

Tasks:

- Update docs to remove ambiguity:
  - `README.md` pages list and architecture notes (`README.md:9-10`, `README.md:21-22`, `README.md:54`)
  - `ROADMAP.md` transition checklist (`ROADMAP.md:5-7`, `ROADMAP.md:95-103`)
  - `AGENTS.md` boundaries + structure map (`AGENTS.md:22`, `AGENTS.md:25`, `AGENTS.md:33-34`, `AGENTS.md:62-64`)
  - `docs/linear.md:26` (legacy edit guidance)
- Replace "do not edit index.html (legacy)" guidance with updated rules:
  - `index.html` is now primary
  - `index-legacy.html` + `src/main-index.js` are archived/legacy

Deliverables:

- Consistent source-of-truth documentation and agent instructions.

Success criteria:

- New contributors can infer correct primary page from docs with no contradictions.

Estimated effort:

- 20-30 minutes.

#### Phase 5: Verification and release readiness (Quality gate)

Tasks:

- Run repo checks:
  - `npm run lint`
  - `npm run build`
  - `npm run dev`
- Run browser verification (per project rule, use playwright-cli terminal commands, not MCP Playwright).
- Validate critical user paths:
  - `/` loads promoted portfolio page with `src/main.js`
  - Project "Close/Back" actions return to `/`
  - Contact and resume links still resolve from footer/nav
  - No broken references to removed page names

Deliverables:

- Verification notes with pass/fail per critical path.

Success criteria:

- All checks pass and no route/link regressions remain.

Estimated effort:

- 20-40 minutes.

## Alternative Approaches Considered

1. Keep current naming and only adjust Vite inputs.
   - Rejected: preserves contributor confusion and contradictory docs.
2. Delete legacy page immediately.
   - Possible but risky if old references or stakeholders still rely on it.
3. Promote page and retain temporary `/index2.html` redirect alias.
   - Recommended for backward compatibility during cutover.

## SpecFlow Analysis

### Primary User Flows

1. Landing flow:
   - User opens `/` and sees the modern GSAP portfolio (formerly `index2.html`).
2. Project return flow:
   - User opens project detail, clicks "Close/Back", returns to `/`.
3. Secondary page flow:
   - User navigates to `contact.html` and `resume.html`, then back to home.

### Edge Cases

1. Stale external links/bookmarks to `/index2.html`.
   - Mitigation: temporary redirect shim from `/index2.html` to `/`.
2. Outdated internal docs leading contributors to edit the wrong file.
   - Mitigation: synchronized docs update in the same PR.
3. Build mapping drift in `vite.config.js`.
   - Mitigation: explicitly verify `rollupOptions.input` after rename.
4. Legacy references in project pages returning users to removed paths.
   - Mitigation: targeted link audit and runtime smoke test.

## Acceptance Criteria

### Functional Requirements

- [x] Root page `/` is served from promoted `index.html` (former `index2.html`) and executes `src/main.js`.
- [x] Legacy experience is preserved at an explicit archive path (`index-legacy.html`) or intentionally removed with decision documented.
- [x] No runtime link in HTML/project pages points to `/index2.html` unless it is an intentional redirect shim.
- [x] Vite build input map reflects the new canonical root and optional legacy entry.

### Non-Functional Requirements

- [x] Contributor documentation consistently identifies primary vs legacy pages.
- [x] Migration does not alter unrelated routes (`contact.html`, `resume.html`, `sandbox.html`, project pages).
- [x] Deployment behavior on `gh-pages` remains unchanged (static multipage output).

### Quality Gates

- [x] `npm run lint` passes.
- [x] `npm run build` passes.
- [x] Manual browser smoke tests pass on critical paths.
- [x] `rg -n "index2\\.html" *.html projects src` returns only intentional references (docs excluded or explicitly intentional).

## Success Metrics

- 0 broken internal navigation links during smoke test.
- 0 unintended runtime references to deprecated `index2.html`.
- All docs that describe page ownership are consistent with deployed behavior.
- Migration completed in one focused PR without unrelated changes.

## Dependencies and Prerequisites

- Branch workflow: perform on `dev`, then merge to `gh-pages` per project workflow.
- Decision on legacy retention and alias period.
- Availability of local dev/build tooling (`npm`, Vite, ESLint).

## Risk Analysis and Mitigation

1. Risk: Broken links from stale `/index2.html` references.
   - Mitigation: add temporary redirect shim and perform grep audit.
   - Rollback: restore original file naming and Vite inputs from previous commit.
2. Risk: Contributor confusion from stale instructions.
   - Mitigation: update `AGENTS.md`, `README.md`, and `ROADMAP.md` in same PR.
3. Risk: Build misconfiguration after file rename.
   - Mitigation: run full `npm run build` and inspect generated HTML entries.

## Resource Requirements

- One engineer.
- Estimated total effort: 1.5-3 hours including verification and docs.

## Future Considerations

- After one or two releases, remove temporary `/index2.html` redirect shim (if used).
- Consider moving legacy files into an `/archive/` folder if they are no longer actively maintained.
- Add automated link check in CI to catch future hardcoded stale paths.

## Documentation Plan

- Update primary architecture docs and contributor guardrails:
  - `README.md`
  - `AGENTS.md`
  - `ROADMAP.md`
  - `docs/linear.md`
- Add a short migration note in PR description documenting:
  - old path names
  - new canonical path
  - legacy preservation strategy
  - rollback steps

## References and Research

### Internal References

- Build entry map: `vite.config.js:30-37`
- New homepage script entry: `index2.html:905`
- Legacy homepage script entry: `index.html:253`
- Runtime link needing update:
  - `projects/wyatt-earp/index.html:35`
  - `case_study_wyatt.html:26`
- Docs showing transitional state:
  - `README.md:9-10`
  - `README.md:21-22`
  - `README.md:54`
  - `AGENTS.md:22`
  - `AGENTS.md:25`
  - `AGENTS.md:33-34`
  - `AGENTS.md:62-64`
  - `ROADMAP.md:5-7`
  - `ROADMAP.md:95-103`
  - `docs/linear.md:26`

### External References

No external research performed. Local repository context was sufficient for this migration plan.

## Related Work

- `ROADMAP.md` already contains an initial transition checklist at `ROADMAP.md:100-103`; this plan expands it into implementation phases, risk controls, and quality gates.
