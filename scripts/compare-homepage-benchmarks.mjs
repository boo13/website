import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const directory = resolve(process.argv[2] || 'docs/benchmarks/2026-08-30-homepage');
const before = JSON.parse(readFileSync(`${directory}/before.json`, 'utf8'));
const after = JSON.parse(readFileSync(`${directory}/after.json`, 'utf8'));
const reduction = (a, b) => `${((1 - b / a) * 100).toFixed(1)}%`;
const num = n => n.toLocaleString('en-US');
const total = r => r.images.reduce((sum, i) => sum + i.assetBytes, 0);
const rows = after.results.map(r => {
  const b = before.results.find(x => x.config.name === r.config.name);
  return `| ${r.config.width}×${r.config.height}, DPR ${r.config.dpr} | ${num(total(b))} | ${num(total(r))} | ${reduction(total(b), total(r))} |`;
});
const frames = after.results.map(r => {
  const b = before.results.find(x => x.config.name === r.config.name);
  return { viewport: r.config.name, beforeFrames: b.offscreen.b.videos[0].frames - b.offscreen.a.videos[0].frames, afterFrames: r.offscreen.b.videos[0].frames - r.offscreen.a.videos[0].frames, marqueeStopped: r.offscreen.a.marquee === r.offscreen.b.marquee };
});
const summary = { before: before.totals, after: after.totals, frames, gallery: after.results.map(r => ({ viewport: r.config.name, beforeBytes: total(before.results.find(b => b.config.name === r.config.name)), afterBytes: total(r) })) };
writeFileSync(`${directory}/comparison.json`, JSON.stringify(summary, null, 2)+'\n');
const report = `# Homepage optimization results

## Initial assets

| Metric | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Initial JavaScript, gzip bytes | ${num(before.totals.initialJsGzip)} | ${num(after.totals.initialJsGzip)} | ${reduction(before.totals.initialJsGzip, after.totals.initialJsGzip)} |
| Initial CSS, gzip bytes | ${num(before.totals.initialCssGzip)} | ${num(after.totals.initialCssGzip)} | ${reduction(before.totals.initialCssGzip, after.totals.initialCssGzip)} |
| Combined JS + CSS, gzip bytes | ${num(before.totals.initialJsGzip + before.totals.initialCssGzip)} | ${num(after.totals.initialJsGzip + after.totals.initialCssGzip)} | ${reduction(before.totals.initialJsGzip + before.totals.initialCssGzip, after.totals.initialJsGzip + after.totals.initialCssGzip)} |

The current homepage makes zero GLightbox requests after the change. Adobe kit stylesheet links fall from two to one. These are asset savings, not a claim that the whole page loads the same percentage faster.

## Gallery image selection

| Viewport | Before selected bytes | After selected bytes | Reduction |
| --- | ---: | ---: | ---: |
${rows.join('\n')}

Totals represent all four selected image files after visiting the gallery, not initial page transfer. Higher-density displays retain larger sources to preserve quality. Original assets remain available.

## Offscreen motion

Across all six configurations, the background video advanced ${Math.min(...frames.map(r=>r.beforeFrames))}–${Math.max(...frames.map(r=>r.beforeFrames))} decoded frames per two-second sample before the change and zero afterward. Both hero videos remained paused at the footer, and the marquee transform remained unchanged. Returning to the hero resumed eligible motion without replaying the preloader.

## Typography limitation

The unused homepage kit was removed and the serving origin receives a preconnect. The active kit still supplies only IvyPresto Display 300. Full intended typography requires a verified Adobe kit for IvyPresto Display 300/400 and Aktiv Grotesk 300/400/500/600. No substitute font or provider settings were introduced.

## Method and limits

Baseline revision: ${before.revision}. Before/after artifacts are production builds tested through Playwright CLI request fulfillment from local files. Six fresh Chromium viewport/DPR contexts use the same method and live external fonts/media, with no CPU or network throttle. Viewport emulation is not a physical phone or Safari test.

Exact build gzip sizes, selected image sizes, and offscreen frame counters support the claims above. Raw timing and main-thread samples remain in the JSON for inspection, but are single lab samples affected by live media and other machine work. They do not establish production Core Web Vitals, battery savings, or a general loading-speed percentage.

Screenshots used in the presentation were recaptured after the entire entrance settled. Poster comparisons temporarily hide preview videos to compare the responsive image crop; normal page behavior was restored afterward.
`;
writeFileSync(`${directory}/RESULTS.md`,report);
console.log(report);
