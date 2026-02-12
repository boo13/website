## Video Hosting
- Videos served from **Cloudflare R2** bucket `portfolio-assets`
- CDN URL: `https://pub-722bb50dc4774406afca73534059fdd8.r2.dev`
- `src/config.js` exports `CDN_BASE` — use this for all video URLs in JS
- HTML files reference R2 URLs directly (not relative paths)
- All `<video>` elements loading from R2 must have the `crossorigin` attribute (cross-origin fetch). If a `<link rel="preload">` also has `crossorigin`, the video element must match or the preloaded response is discarded.
- `public/video/` is gitignored — local copies are for dev/optimization only
- Upload optimized videos: `npx wrangler r2 object put portfolio-assets/video/FILENAME --file public/video/FILENAME --content-type video/webm --remote`
- Optimization script: `scripts/optimize-videos.sh` (FFmpeg VP9 two-pass)