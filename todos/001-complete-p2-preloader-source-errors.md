---
status: complete
priority: p2
issue_id: "001"
tags: [code-review, frontend, reliability, preloader]
dependencies: []
---

# Preloader Source Errors Still Force Timeout

Fix the homepage preloader so failed nested video sources count as completed load tasks.

## Problem Statement

The branch attempted to fix a 15 second preloader stall when critical videos fail, but the implemented listener only handles `error` on the `<video>` element. The homepage videos in `index.html` use nested `<source>` elements, and failed source loads fire `error` on those source nodes. As a result, the preloader still waits for the force-complete timeout when CDN video sources fail.

## Findings

- `src/components/preloader.js:35` registers `loadeddata` and `error` only on the video element.
- The homepage critical videos at `index.html:224` and `index.html:266` use `<source>` children for WebM and MP4.
- Browser verification with Playwright CLI aborted `https://media.randycounsman.com/**`; after 4.5 seconds `.loading-overlay` was still present.
- Instrumentation showed four `error` events on `SOURCE` elements and no `VIDEO` error events.
- A full aborted-media run removed the overlay after about 17.4 seconds, consistent with the existing 15 second force-complete timeout plus exit animation.

## Proposed Solutions

### Option 1: Listen To Source Errors

**Approach:** In `waitForVideoFrame`, attach `error` listeners to the video element and all child `<source>` elements. Treat the video task as done when the video loads data or when all source elements have errored.

**Pros:**
- Handles the current markup directly.
- Preserves normal successful video loading behavior.
- Keeps the fix local to the preloader utility.

**Cons:**
- Needs careful cleanup of listeners on both video and source nodes.
- Single-source video elements still need the existing video-level error path.

**Effort:** 30-60 minutes

**Risk:** Low

---

### Option 2: Add A Short Per-Video Fallback Timeout

**Approach:** Add a small timeout per tracked video task so a failed or stalled video cannot block overall progress.

**Pros:**
- Covers unusual browser media edge cases beyond source error events.
- Simple to reason about from a user-facing timeout perspective.

**Cons:**
- Can mask slow-but-valid video loads if the timeout is too aggressive.
- Less precise than resolving from concrete media events.

**Effort:** 30-60 minutes

**Risk:** Medium

## Recommended Action

Implemented a variant of Option 1 that turned out to need a state-poll fallback (see Work Log 2026-07-03 - Fix Applied): attaching `error` listeners to `<video>` and each `<source>` was not sufficient on its own — see findings below.

## Technical Details

**Affected files:**
- `src/components/preloader.js` - media task completion logic.
- `index.html` - homepage critical videos use nested `<source>` children.

**Related components:**
- `src/main.js` calls `runPreloader({ criticalRootSelector: '#hero' })` on the homepage.

**Database changes:** None.

## Resources

- Plan under review: `docs/plans/2026-07-03-fable-bug-hunt-plan.md`
- Review branch: `claude/bug-search-severity-ranking-7vqxue`
- Verification command used Playwright CLI route abort for `https://media.randycounsman.com/**`.

## Acceptance Criteria

- [x] With CDN media requests aborted, the homepage preloader exits promptly without waiting for the 15 second force-complete timeout.
- [x] Source-level errors are cleaned up after the task completes.
- [x] Successful video loads still advance preloader progress normally.
- [x] `npm run lint` passes.
- [x] `npm run build` passes.

## Work Log

### 2026-07-03 - Review Discovery

**By:** Codex

**Actions:**
- Reviewed the committed `src/components/preloader.js` change against the Fable bug hunt plan.
- Ran `npm run lint` and `npm run build`; both passed.
- Used Playwright CLI to abort CDN video requests and confirmed the homepage overlay remained after 4.5 seconds.
- Instrumented media events and observed `SOURCE` error events without corresponding `VIDEO` error events.

**Learnings:**
- The current fix is incomplete for the shipped homepage markup because `<source>` load failures do not resolve the preloader's video task.

### 2026-07-03 - Fix Applied

**By:** Claude (Sonnet 5)

**Actions:**
- First tried Option 1 as specced (listen for `error` on `<video>` plus each child `<source>`, counting down until all sources have errored).
- Re-ran the same Playwright CLI repro (block `https://media.randycounsman.com/**`, instrument `error`/`loadeddata` on every video/source via `addInitScript` so listeners exist before navigation). Result: **zero** `error` or `loadeddata` events were observed on either the `<source>` or `<video>` elements, yet the overlay still didn't clear until ~17.3s — the same broken timing as before the fix.
- Inspected final element state: `video.networkState === 3` (`NETWORK_NO_SOURCE`, i.e. the browser *did* reach the terminal failure state) but `video.error` stayed `null` and no `error` event was ever dispatched to a listener. Root cause: on a fast/local 404 (near-zero round trip), the browser can flip `networkState` to `NETWORK_NO_SOURCE` before `waitForVideoFrame` even attaches its listeners — there's no "already failed" check, only the existing "already loaded" (`readyState >= 2`) check. Event-based detection alone cannot be made reliable against this race.
- Rewrote `waitForVideoFrame` to treat `readyState >= 2 || networkState === NETWORK_NO_SOURCE || video.error` as "settled," checked synchronously at attach time (fixes the race) and then polled every `requestAnimationFrame` as the source of truth going forward, with the `loadeddata`/`error` listeners kept only as an instant fast-path for the common case where the event does fire after attach. Dropped the per-`<source>` listener/counter — polling the aggregate `networkState` on the video itself is sufficient and simpler.
- Re-ran the same instrumented repro: overlay now clears at **~2.3s** with CDN blocked (previously ~17.3s), and at ~2.7s in the unblocked case with `loadeddata` observed at ~410-508ms and both hero videos confirmed actually playing (`paused: false`, `currentTime` advancing).
- `npx eslint src/components/preloader.js` and `npm run build` both pass.

**Learnings:**
- Don't trust media element `error` events alone for detecting failure, even on `<source>` children — a fast/local failure can resolve before your listener attaches, with no event ever delivered to catch. Check the element's current state synchronously first, and prefer polling real state (`readyState`/`networkState`/`error`) over relying purely on events when the failure can happen faster than your setup code runs.

## Notes

- Resolved on `claude/bug-search-severity-ranking-7vqxue`. Commit fixes `src/components/preloader.js`; see git log for hash.
