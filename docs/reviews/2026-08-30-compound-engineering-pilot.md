# Compound Engineering installation pilot

Date: 2026-08-30

## Setup verification

- Installed and enabled `compound-engineering@compound-engineering-plugin` 3.23.4 through Codex's native plugin CLI.
- The bundled setup health check reports healthy project configuration, artifact root `docs/`, native implementation, and a current example template.
- Nine legacy workflow skills and seven prompt copies were archived with a hash manifest in the private local backup documented in `.compound-engineering/README.md`. Standalone specialist skills remain installed; the disabled Claude plugin and its settings were not changed.
- Removed the retired global tool map through AIHome's opt-in generator migration. Regeneration also incorporated existing source-of-truth Node-environment and verification rules; those source files were not edited.
- AIHome's full suite passed: 1,014 tests, including seven new migration checks. The website passed lint and build. All 1,631 production output files matched their pre-setup hashes exactly.

## Review scope and method

This was the installed `ce-code-review` skill's quick-review path, which delegates to the host's built-in review. The attached command was `codex review --base 445c082`. It reviewed the recent UI changes through `a66f926` and tracked setup edits present in the checkout. New, untracked setup documents were checked separately by the installer.

The fresh reviewer loaded the native plugin's review instructions and this repository's config. It ran lint/build and a comparison harness against the old and new video code. Review stayed report-only: no site fixes, production deployment, PR, or cross-provider review was run. This verifies the quick-review path; it is not a test of the full multi-agent or autonomous pipeline.

## Finding: P2 — video controls lose listeners after cached navigation

Location: `src/sections/project-video.js:150–152`, interacting with `src/main-project.js` and `src/utils/dom.js`.

The recent video change aborts its timeline event listeners in its cleanup. `onPageHide(cleanups)` calls that cleanup even for `pagehide.persisted === true`, when the browser retains the page in its back/forward cache. Restoring the cached page does not rerun initialization, so seeking and time/progress updates remain disconnected until reload.

The review's event-based comparison reproduced the regression: before the change, a simulated persisted pagehide/pageshow still allowed progress updates and seeking; after the change, progress stayed at the previous label and seeking did not change playback time. The reviewer did not verify an actual browser back/forward-cache restoration, so that remains the acceptance check for a fix.

Suggested fix: preserve the project page's initialized sections during persisted pagehide, matching the homepage's existing policy, or reinitialize the affected listeners on restoration. Verify real Back/Forward restoration and ordinary non-cached navigation before deploying the fix.

Disposition: recorded for follow-up. The installation task did not authorize applying review findings, and no website runtime files were changed.

## Resolution — 2026-08-31

Randy subsequently authorized fixing this finding. Work started from clean `dev`
at `43fff331c5ce3a1adbf61287d1e277624bcbec0e`, preserving the deployed performance changes.

Actual Chrome navigation reproduced the defect through `playwright-cli` against
the production build: the same document returned with `pageshow.persisted === true`.
The slider moved from 0.1 to 0.2 seconds without seeking; playback advanced to
1.64 seconds while the elapsed label stayed at `00:00`.

`onPageHide` now preserves initialized sections on persisted pagehide and removes
its handler only when performing final cleanup. No player, design, font, or
performance-loading code changed. A lifecycle regression test failed before the
fix; both cached-return and ordinary-disposal tests pass after it, including
repeated caching and exactly-once cleanup. Run `node --test tests/dom.test.js`.
`npm run lint`, `npm run build`, and `git diff --check` also passed.

Browser verification used Chrome through `playwright-cli` at 1440×1000 and
390×844. The CLI launch configuration ignored `--disable-back-forward-cache` so
actual cached navigation could be exercised; no synthetic pagehide events were
used for browser acceptance. Screenshots were inspected after fonts, scrolling,
and animation settled, then removed as required by repository instructions.

| Route | Result |
| --- | --- |
| `/projects/wyatt-earp/` | Pass: repeated cached Back/Forward, Close/Forward, refresh, keyboard and pointer seek, playback progress, Credits/back-to-video; cached Close/Forward also passed at phone width. |
| `/projects/sitting-bull/` | Pass: direct entry, Close, cached Back, keyboard seek and playback progress. |
| `/projects/men-who-built-america/`, `/projects/pope/` | Pass: direct entry, Close, Back, seek and progress through normal reload fallback. Chrome reported `outstanding-network-request`; cached restoration was not confirmed on these routes. |
| `/` | Pass: return to each opened gallery card without the preloader; offscreen hero videos stayed paused. |
| `/projects/upnext-news/`, `/case-study-wyatt.html` | Pass: genuine cached Back retained initialized transforms and working scroll animations. |

The local preview reported existing 404s for `/api/homepage-visit` and
`/favicon.ico`; no navigation-related JavaScript failure was observed. Verification
covered Chrome, not other browser engines. The small helper change was reviewed
directly with its tests; no broader cleanup or review pipeline was needed.

Deployment status at this handoff: verified locally, not deployed. Production
deployment requires a separately authorized `dev` → `gh-pages` release.

## Production verification — 2026-08-31

Randy authorized deployment after the preceding handoff. `just deploy` merged
the reviewed fix into `gh-pages` as `590db7ce0eba4263a60735eb547e455f70a7ff1d`
and returned the checkout to `dev`. The previous production revision was
`f7df2e1a88c5fcee1adb9d3b3a95f5ffe3f31d26`. The only runtime source change between
releases is `src/utils/dom.js`; performance, font, and release configuration
remain unchanged. Regression tests, lint, and build passed again before release.

[GitHub Pages deployment succeeded](https://github.com/boo13/website/actions/runs/33362566361)
at 06:02 UTC. The public [Wyatt Earp page](https://www.randycounsman.com/projects/wyatt-earp/)
returned HTTP 200 with the new build references, without a cache-busting query.
All nine referenced JavaScript files matched the local build byte for byte,
including `/assets/dom-BsTUfGXy.js` (SHA-256
`cc9bac5767b636e47e65c9645950890046cd2f73cf7f625570c2907dceb18c96`).

Live Chrome checks through `playwright-cli` passed:

- Desktop: gallery entry, two genuine cached Back/Forward cycles, Close/Forward,
  keyboard and pointer seeking, advancing elapsed-time/progress labels, and
  refresh. Cached restores retained the same document ID and reported
  `pageshow.persisted === true`; refresh created a new document with type `reload`.
- Gallery return: the opened card remained visible without a preloader. Both
  offscreen hero videos stayed paused with unchanged playback times.
- Phone viewport (390×844): Close restored the gallery card and Forward restored
  the cached video. Pointer seeking set both playback and range to 4.5 seconds;
  playback advanced to 6.09 seconds with the visible label at `00:06`.
- At the phone gallery return position, the hero still extends 198 pixels into
  view. After scrolling it fully offscreen, both hero videos paused and their
  times remained unchanged. No playback code was altered for this check.

No console errors were reported during the final live checks. Desktop and phone
screenshots were inspected after layout and motion settled, then removed.
Live acceptance covered the homepage and Wyatt Earp in Chrome; the earlier
local route matrix remains the coverage for other project pages. Safari,
Firefox, and physical phones were not tested. No deployment regression was
observed and no rollback was needed. The navigation fix is live.
