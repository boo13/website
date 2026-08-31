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
