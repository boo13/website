# Homepage optimization benchmarks

The before build is frozen from revision `b4645fd33936ff593a57f2afbd2012fdf4439b1c`. The after build uses the same benchmark script and browser configurations.

Run `node scripts/benchmark-homepage.mjs BUILD_DIRECTORY LABEL` with a `playwright-cli` session named `perf-benchmark` open. The script reads a Vite production build and serves same-origin requests from its files through Playwright route fulfillment. It does not start a local server or change production. External Adobe fonts and R2 media remain live. Requests to the site's worker telemetry are blocked.

Each configuration uses a fresh Chromium context with no CPU or network throttling. Six viewport/DPR combinations cover phone, tablet, compact desktop, and desktop. Hero and gallery screenshots are retained because they support the requested before/after presentation.

## Measurements

- Exact initial JS and CSS bytes and gzip bytes from the build's entry/preload links.
- Requested resources, selected font faces, and descriptive FCP/LCP/preloader timing samples.
- Gallery `currentSrc`, source-file bytes, intrinsic and rendered dimensions.
- Two-second offscreen video frame/time and marquee samples after scroll smoothing settles.
- Main-thread task/script/layout/style durations over the same offscreen sample.
- Return-to-hero state and uncaught page errors.

Asset byte totals are deterministic build measurements. Timings and CPU samples are noisy local lab observations, not production Core Web Vitals, battery measurements, or guaranteed speedups. Cross-origin transfer sizes may be zero when timing headers do not permit reporting. Image byte totals use selected source-file sizes, not an assertion that every gallery image loads on initial navigation.

Baseline and after JSON are the evidence source for the results report and presentation. Production checks are recorded separately; they do not replace same-method build comparisons.

## Behavioral verification

`behavior-qa.json` records initial/revealed/return playback, dynamic reduced-motion suspension and resume, offscreen samples, and project-return restoration. Its attempted tab-switch sample reports `hidden:false`: this harness did not reproduce native hidden-tab behavior, so that check is not counted as passed.

`lightbox-qa.json` covers delayed first click, loaded video, Escape close, disposal during loading, and dependency failure. `preview-qa.json` verifies active previews pause during the lightbox and resume after closing. `failure-qa.json` blocks external fonts and media in a touch/coarse-pointer reduced-motion viewport: the preloader exits, videos stay paused, and no page exception occurs.

`visual-qa.json` records stable entrance styles before the final desktop/phone captures. The initial benchmark pass used a shorter entrance delay; those presentation images were replaced with settled captures, and the reusable script now waits 5.1 seconds. Raw timing samples are retained as exploratory data only.

PNG screenshots and the PowerPoint are retained locally and excluded from git. JSON evidence, the comparison report, and the reusable scripts are tracked. Run `node scripts/compare-homepage-benchmarks.mjs` to regenerate comparison.json and RESULTS.md.

`production-qa.json` verifies the live root's application bundle paths and offscreen behavior after deployment. `production-images.json` verifies all seven new image variants against local SHA-256 hashes. The final deployment and remaining limitations are summarized in RESULTS.md.
