## Video Hosting Overview
- Videos served from **Cloudflare R2** bucket `portfolio-assets`
- CDN URL (reference only — always use `CDN_BASE` from `src/config.js` in JS): `https://pub-722bb50dc4774406afca73534059fdd8.r2.dev`
- All `<video>` elements must have the `crossorigin` attribute

## Commands
- Upload optimized videos: `npx wrangler r2 object put portfolio-assets/video/FILENAME --file public/video/FILENAME --content-type video/webm --remote` (--content-type video/mp4 also works)

## Usage
- All videos should be WebM/VP9 with mp4 fallback
- HTML files reference R2 URLs directly (not relative paths)
- `public/video/` is gitignored — local copies are for dev/optimization only

## Adding a New Video
1. Place source file in `public/video/` if not already there
2. Run `scripts/optimize-videos.sh`
3. Upload with the wrangler command above
4. Reference via `CDN_BASE` in JS or full URL in HTML
5. Add `crossorigin` attribute to the `<video>` element