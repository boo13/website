# Open Work Tracker

> Single source of truth for what's still **open** in `docs/`. Generated 2026-06-13 from an
> audit of every plan/brainstorm against the actual codebase and git history.
> Completed plans live in `docs/archive/`. Reference post-mortems live in `docs/solutions/`.

## Status at a glance

| # | Thread | Linear | Source doc | Real status | Recommended order |
|---|--------|--------|-----------|-------------|-------------------|
| 1 | Homepage IA fixes | [BOO-147](https://linear.app/boo13/issue/BOO-147) | `index-html-revised-plan.md` | **Open — 0% shipped** | 1st (highest value, newest) |
| 2 | Credit title cards | [BOO-149](https://linear.app/boo13/issue/BOO-149) | `poster-todo.md` | **Open — 6 cards needed** | 2nd (small, parallelizable) |
| 3 | Index performance rebuild (remainder) | [BOO-148](https://linear.app/boo13/issue/BOO-148) | `plans/2026-04-05-Index-Rebuild.md` | **Partial** | 3rd |
| 4 | Cloudflare Pages origin migration | [BOO-135](https://linear.app/boo13/issue/BOO-135) | `plans/2026-04-08-...cloudflare-pages-plan.md` | **Open — not started** | 4th (decide go/kill) |
| 5 | Linear task workflow | — (killed) | `plans/2026-04-07-...linear-task-workflow-plan.md` | **Killed — superseded** | n/a |

> **Linear note:** Issue tracking lives in the **WebsiteTeam / Website v1** project. #4 was already filed as
> **BOO-135** (not duplicated). #5 is not filed — the older "Plan-to-Linear Sync" issues already covered that
> ground and are retired. Misfiled non-website issues to relocate/close: **BOO-143** (TrueNAS),
> **BOO-138** (Netflix Workday adapter), **BOO-137** (Better Stack/Sentry for producer-producer-api).

---

## 1. Homepage IA fixes — `index-html-revised-plan.md`
**Newest plan (Jun 12). The current active work. Nothing in it has shipped yet.**

Verified against code:
- Featured gallery still has **4** cards (`Projects.json` `featured:true`); plan targets 6–8.
- `<h2 class="section-title">Work</h2>` is still **commented out** (`index.html:325`); no `#featured` heading.
- **No** "View full archive" toggle in `src/sections/credits.js` (38 rows render flat).
- **No** About item in `.pill-nav` (`index.html:175`) — still Featured / Work / Contact.
- Hero poster: a 1×1 poster was added (`996e92ca`), but the *designed* fallback still needs verifying.
- DESIGN.md drift unfixed: doc says hero pin `150%`, code pins `+=230%` (`hero-aperture-dual.js:383`).

Next steps (in plan's own order): designed hero fallback → curate featured + add headings + archive toggle → elevate About beat + nav button → reconcile DESIGN.md.

## 2. Credit title cards — `poster-todo.md`
**6 shows need a 16:9 title card** (1280×720, → `public/images/shows/<Name>_TitleCard.webp`, update `preview` in `Projects.json`).

- No image at all: **The Séance** (`the-seance`), **Travel Testers** (`travel-testers`).
- Low-res 4:3 placeholders to replace: **Inside the NSA**, **Heavily Ever After**, **Holiday Inc**, **Ton of Love**.

Independent of everything else — can be knocked out in any spare session.

## 3. Index performance rebuild — remainder of `plans/2026-04-05-Index-Rebuild.md`
**Partially shipped.** Done: about-slides section removed (`4cd524fa`). Still open:
- **Remove Three.js** — `"three"` is still in `package.json` deps, imported nowhere. Easy win.
- **Gallery video lifecycle** — create/destroy hover `<video>` on enter/leave instead of in DOM at load.
- **`about-showcase` section** — the lighter replacement for the removed about-slides was never built. **Decision needed:** is this still wanted, or is the section gone for good?
- Re-confirm hero poster-first + MP4 fallback and the performance rules (LCP/INP/CLS need measurement infra that doesn't exist yet).

## 4. Cloudflare Pages origin migration — `plans/2026-04-08-...cloudflare-pages-plan.md`
**Status `active` but not started.** Origin is still GitHub Pages (justfile deploys `dev`→`gh-pages`; CLAUDE.md confirms Fastly/GH headers on the live response). The final checkbox ("docs describe CF Pages as origin only after cutover") is unchecked.

**Decision needed:** commit to the migration or formally shelve it. Until then, CLAUDE.md's "deployment reality" caveats stay accurate.

## 5. Linear task workflow — `plans/2026-04-07-...linear-task-workflow-plan.md`  — KILLED
**Status `planned`, never built.** No `scripts/linear-task.mjs`, no `linear:next/list/done` npm scripts. The `docs/linear.md` policy doc stands on its own without it. Superseded by tracking open work directly in Linear (WebsiteTeam) + this file; the retired "Plan-to-Linear Sync" issues already explored the automation path. **No Linear issue filed.** Safe to move this plan to `docs/archive/plans/` (or delete) once you're comfortable.

---

## Suggested sequence
1. **Decide #4 and #5** (go/kill) so the open set is honest.
2. **Ship #1** — highest user-facing value, and it's the freshest thinking.
3. **#2 title cards** in parallel (no code dependency).
4. **#3 leftovers** — Three.js removal is a 5-minute cleanup; do it next time you touch deps. Resolve the about-showcase question before treating #3 as closeable.
