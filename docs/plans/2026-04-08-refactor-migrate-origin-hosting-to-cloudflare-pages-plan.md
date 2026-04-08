---
title: "refactor: Migrate production origin hosting to Cloudflare Pages"
type: refactor
status: active
date: 2026-04-08
---

# refactor: Migrate production origin hosting to Cloudflare Pages

## Overview

Move the production site origin from GitHub Pages to Cloudflare Pages so `www.randycounsman.com` is actually hosted by Cloudflare Pages rather than merely proxied by Cloudflare in front of GitHub Pages.

This plan is intentionally scoped to hosting migration first. It does not try to redesign the branch model at the same time.

## Problem Statement

The live site is in a misleading half-migrated state:

- `www.randycounsman.com` resolves to Cloudflare IPs, so Cloudflare is the edge layer.
- The live response still exposes GitHub Pages / Fastly headers:
  - `x-github-request-id`
  - `x-served-by`
  - `x-fastly-request-id`
  - `via: 1.1 varnish`
- The repo still deploys production by merging `dev` into `gh-pages` via [justfile](/Users/randycounsman/Git/website/justfile#L1).
- GitHub Actions still runs a GitHub Pages deployment workflow in [.github/workflows/deploy.yml](/Users/randycounsman/Git/website/.github/workflows/deploy.yml).
- The current custom-domain file still reflects GitHub Pages usage in [CNAME](/Users/randycounsman/Git/website/CNAME) and [public/CNAME](/Users/randycounsman/Git/website/public/CNAME).

That means the site is not actually “on Cloudflare Pages.” Cloudflare is just proxying traffic to a GitHub Pages origin.

## Goals

- Serve `www.randycounsman.com` from Cloudflare Pages as the actual origin host.
- Preserve the current release gate so production changes are still deliberate.
- Remove GitHub Pages as the production dependency.
- Update repo workflows and docs so they match reality.

## Non-Goals

- Redesign the entire branch model.
- Move video hosting off Cloudflare R2.
- Rebuild deployment around Workers or a custom CI upload path unless Git integration proves insufficient.

## Recommended Approach

Use Cloudflare Pages with Git integration and keep `gh-pages` as the initial production branch for the Pages project.

Why this is the right first migration:

1. It changes the hosting provider without also changing the release process.
2. It keeps the current “merge to release branch” gate intact.
3. It reduces rollback complexity because the branch model stays familiar during cutover.
4. It avoids the bad idea of making `dev` auto-publish to production while `dev` is still the everyday working branch.

Follow-up cleanup can simplify the branch model later if desired, but that should be a separate decision and issue.

## Current State Inventory

### Live topology

- Apex `randycounsman.com` redirects to `https://www.randycounsman.com/`
- `www.randycounsman.com` is proxied by Cloudflare
- Origin still appears to be GitHub Pages / Fastly

### Repo deployment mechanics

- Production release command: [justfile](/Users/randycounsman/Git/website/justfile#L1)
- GitHub Pages workflow: [.github/workflows/deploy.yml](/Users/randycounsman/Git/website/.github/workflows/deploy.yml)
- CI on `dev`: [.github/workflows/ci.yml](/Users/randycounsman/Git/website/.github/workflows/ci.yml)
- Vite build output: [vite.config.js](/Users/randycounsman/Git/website/vite.config.js)

### Build settings to carry forward

- Build command: `npm run build`
- Output directory: `dist`
- Root directory: repo root
- Node version target in CI today: Node 20

## Technical Approach

### Phase 1: Pre-cutover audit

Tasks:

- Confirm access to the correct Cloudflare account and zone for `randycounsman.com`.
- Confirm whether a Cloudflare Pages project already exists for this repo.
- Confirm whether GitHub Pages custom domain settings are still active in the GitHub repo settings.
- Confirm whether any other DNS records or page rules are involved in apex-to-www redirect behavior.

Deliverables:

- Written inventory of:
  - existing Cloudflare Pages project or lack of one
  - current domain bindings
  - current redirect behavior
  - current GitHub Pages settings

Success criteria:

- No ambiguity remains about what currently owns DNS, redirects, TLS, and origin hosting.

### Phase 2: Create or configure Cloudflare Pages project

Tasks:

- Create a Cloudflare Pages project connected to the GitHub repo if one does not already exist.
- Configure Pages build settings:
  - Production branch: `gh-pages`
  - Build command: `npm run build`
  - Build output directory: `dist`
  - Root directory: `/`
- Confirm Pages can build the repo as-is using the Vite config and current Node toolchain.
- If Cloudflare Pages requires explicit environment config, add only what is needed for static builds.

Deliverables:

- A working Cloudflare Pages project that can produce the site from the repo.

Success criteria:

- A successful production build exists in Cloudflare Pages for the `gh-pages` branch before domain cutover.

### Phase 3: Attach production domains to Cloudflare Pages

Tasks:

- Add `www.randycounsman.com` as a custom domain on the Pages project.
- Confirm `randycounsman.com` behavior:
  - preferred: keep canonical host at `www`
  - maintain apex redirect to `https://www.randycounsman.com/`
- Verify Cloudflare DNS records now target the Pages project rather than GitHub Pages.
- Verify TLS provisioning completes successfully for custom domains.

Deliverables:

- Pages project owns the production domain mapping.

Success criteria:

- Requests for `www.randycounsman.com` resolve to the Pages project and no longer depend on GitHub Pages origin.

### Phase 4: Cut traffic away from GitHub Pages

Tasks:

- Remove or disable GitHub Pages as the active production host in GitHub repository settings.
- Remove the repo custom-domain dependency if it only exists for GitHub Pages.
- Stop treating `CNAME` as part of the deployment contract unless Cloudflare Pages explicitly needs it for this setup.
- Confirm the site still serves correctly after GitHub Pages is disabled.

Important caution:

- Do not disable GitHub Pages before Cloudflare Pages custom domains are active and verified.
- Do not make DNS and workflow cleanup changes in the same moment without validating the live site in between.

Deliverables:

- GitHub Pages is no longer part of the serving path.

Success criteria:

- Live responses no longer expose GitHub Pages / Fastly headers.

### Phase 5: Repo workflow cleanup

Tasks:

- Remove or replace the GitHub Pages deployment workflow in [.github/workflows/deploy.yml](/Users/randycounsman/Git/website/.github/workflows/deploy.yml).
- Update [justfile](/Users/randycounsman/Git/website/justfile#L1) so `just deploy` reflects the new release mechanism, or remove the command if it no longer makes sense.
- Remove stale `CNAME` files if they are no longer needed:
  - [CNAME](/Users/randycounsman/Git/website/CNAME)
  - [public/CNAME](/Users/randycounsman/Git/website/public/CNAME)
- Update operational docs:
  - [AGENTS.md](/Users/randycounsman/Git/website/AGENTS.md)
  - [README.md](/Users/randycounsman/Git/website/README.md)
- Update any monitoring or automation that assumes GitHub Pages as the production host.

Deliverables:

- Repo deployment instructions reflect Cloudflare Pages as the origin host.

Success criteria:

- There is no repo-level instruction that still tells contributors to deploy via GitHub Pages.

### Phase 6: Optional follow-up branch strategy cleanup

This is explicitly not required for the host migration itself.

Options for a follow-up issue:

1. Keep `gh-pages` as a release branch, but let Cloudflare Pages build it instead of GitHub Pages.
2. Move Cloudflare Pages production to a different protected branch such as `main` or `production`.
3. Move to direct deploys from CI instead of branch-triggered Git integration.

Recommendation:

- Do not decide this inside the host migration unless the current branch model actively blocks Pages.

## Alternative Approaches Considered

### Option A: Make Cloudflare Pages build `dev` directly

Rejected for now.

- `dev` is the active working branch.
- Publishing `dev` directly to production removes the current release gate.
- It couples two changes: hosting migration and release-process redesign.

### Option B: Use Cloudflare Pages Direct Upload from GitHub Actions

Possible, but not the first choice.

- It adds more CI configuration and secret management than Git integration.
- It is useful only if Git integration cannot satisfy the branch/workflow constraints.

### Option C: Leave GitHub Pages in place and keep Cloudflare as proxy

Rejected.

- This is the current state.
- It does not satisfy the goal of moving origin hosting off GitHub Pages.

## SpecFlow Analysis

### Primary user flows

1. User opens `https://www.randycounsman.com/`
   - Request terminates at Cloudflare Pages
   - Site renders as before

2. User opens `https://randycounsman.com/`
   - Request redirects to `https://www.randycounsman.com/`
   - Redirect stays intact after migration

3. Maintainer releases site changes
   - Maintainer merges `dev` into `gh-pages`
   - Cloudflare Pages rebuilds and serves the new production version
   - No GitHub Pages dependency remains

### Edge cases

1. Cloudflare Pages is configured, but custom domain still points effectively at GitHub Pages
   - Mitigation: verify headers and domain bindings after cutover, not just successful Pages build

2. GitHub Pages custom domain setting conflicts with Pages cutover
   - Mitigation: inspect and remove GitHub Pages custom-domain config after Pages domain is active

3. Apex redirect breaks during migration
   - Mitigation: test both `randycounsman.com` and `www.randycounsman.com` before and after each cutover step

4. Build succeeds on GitHub Actions but fails on Cloudflare Pages due to environment differences
   - Mitigation: create and validate Pages build before touching traffic

## Acceptance Criteria

### Functional requirements

- [ ] Cloudflare Pages has a working production project for this repo.
- [ ] `www.randycounsman.com` is attached to the Pages project.
- [ ] `randycounsman.com` still redirects to `https://www.randycounsman.com/`.
- [ ] GitHub Pages is no longer serving production traffic.

### Non-functional requirements

- [ ] Production release flow remains gated and deliberate during migration.
- [ ] Docs describe Cloudflare Pages as the origin host only after cutover is complete.
- [ ] Monitoring and automation no longer refer to “Deploy to GitHub Pages.”

### Verification gates

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Cloudflare Pages production build passes.
- [ ] `curl -I https://www.randycounsman.com` no longer returns GitHub Pages / Fastly headers such as `x-github-request-id`, `x-served-by`, `x-fastly-request-id`, or `via: 1.1 varnish`.
- [ ] `curl -I -L https://randycounsman.com` still lands on `https://www.randycounsman.com/`.
- [ ] Manual smoke test confirms `/`, `/contact.html`, `/resume.html`, and at least one project page load correctly.

## Rollback Plan

If the Pages cutover fails:

1. Restore DNS / domain mapping to the previous GitHub Pages path.
2. Re-enable GitHub Pages custom-domain configuration if it was removed.
3. Restore or re-enable the GitHub Pages deployment workflow if it was removed too early.
4. Re-run header checks until GitHub Pages origin is confirmed again.

Rollback trigger conditions:

- Pages custom domain does not provision successfully
- TLS is broken
- Apex redirect fails
- Production responses return errors or incorrect assets after cutover

## Dependencies and Prerequisites

- Access to Cloudflare account and Pages admin for the domain
- Access to GitHub repo settings for Pages and Actions
- Ability to inspect and modify DNS for `randycounsman.com`
- A clean deployment window long enough to verify both hosts and redirect behavior

## References

- Linear placeholder issue: [BOO-9](https://linear.app/boo13/issue/BOO-9/move-site-from-gh-pages-to-cloudflare-pages)
- Active follow-up issue: [BOO-135](https://linear.app/boo13/issue/BOO-135/finish-migration-from-github-pages-origin-to-cloudflare-pages)
- GitHub Pages workflow: [.github/workflows/deploy.yml](/Users/randycounsman/Git/website/.github/workflows/deploy.yml)
- Current release command: [justfile](/Users/randycounsman/Git/website/justfile#L1)
