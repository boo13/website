# Homepage optimization results

## Initial assets

| Metric | Before | After | Reduction |
| --- | ---: | ---: | ---: |
| Initial JavaScript, gzip bytes | 86,761 | 72,638 | 16.3% |
| Initial CSS, gzip bytes | 12,081 | 9,528 | 21.1% |
| Combined JS + CSS, gzip bytes | 98,842 | 82,166 | 16.9% |

The current homepage makes zero GLightbox requests after the change. Adobe kit stylesheet links fall from two to one. These are asset savings, not a claim that the whole page loads the same percentage faster.

## Gallery image selection

| Viewport | Before selected bytes | After selected bytes | Reduction |
| --- | ---: | ---: | ---: |
| 1440×900, DPR 1 | 680,654 | 485,626 | 28.7% |
| 375×812, DPR 2 | 680,654 | 392,690 | 42.3% |
| 375×812, DPR 1 | 680,654 | 115,512 | 83.0% |
| 768×1024, DPR 2 | 680,654 | 680,654 | 0.0% |
| 1024×768, DPR 1 | 680,654 | 648,902 | 4.7% |
| 1440×900, DPR 2 | 680,654 | 680,654 | 0.0% |

Totals represent all four selected image files after visiting the gallery, not initial page transfer. Higher-density displays retain larger sources to preserve quality. Original assets remain available.

## Offscreen motion

Across all six configurations, the background video advanced 48–49 decoded frames per two-second sample before the change and zero afterward. Both hero videos remained paused at the footer, and the marquee transform remained unchanged. Returning to the hero resumed eligible motion without replaying the preloader.

## Typography limitation

The unused homepage kit was removed and the serving origin receives a preconnect. The active kit still supplies only IvyPresto Display 300. Full intended typography requires a verified Adobe kit for IvyPresto Display 300/400 and Aktiv Grotesk 300/400/500/600. No substitute font or provider settings were introduced.

## Method and limits

Baseline revision: b4645fd33936ff593a57f2afbd2012fdf4439b1c. Before/after artifacts are production builds tested through Playwright CLI request fulfillment from local files. Six fresh Chromium viewport/DPR contexts use the same method and live external fonts/media, with no CPU or network throttle. Viewport emulation is not a physical phone or Safari test.

Exact build gzip sizes, selected image sizes, and offscreen frame counters support the claims above. Raw timing and main-thread samples remain in the JSON for inspection, but are single lab samples affected by live media and other machine work. They do not establish production Core Web Vitals, battery savings, or a general loading-speed percentage.

Screenshots used in the presentation were recaptured after the entire entrance settled. Poster comparisons temporarily hide preview videos to compare the responsive image crop; normal page behavior was restored afterward.
