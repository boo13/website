## Video Hosting Overview
- Videos served from **Cloudflare R2** bucket `portfolio-assets`
- CDN URL (reference only — always use `CDN_BASE` from `src/config.js` in JS): `https://pub-722bb50dc4774406afca73534059fdd8.r2.dev`
- All `<video>` elements must have the `crossorigin` attribute

## Commands
- Optimize into both WebM + MP4: `bash scripts/optimize-videos.sh INPUT_FILE [--suffix SUFFIX] [--out-dir DIR] [--max-width N] [--max-height N] [--overwrite] [--no-audio] [--dry-run]`
    - Only use `--no-audio` if user asks for video without audio
- Upload optimized videos: `npx wrangler r2 object put portfolio-assets/video/FILENAME --file public/video/FILENAME --content-type video/webm --remote` (`--content-type video/mp4` also works)

## Usage
- All videos should be WebM/VP9 with MP4 fallback
- HTML files reference R2 URLs directly (not relative paths)
- `public/video/` is gitignored — local copies are for dev/optimization only
- Output naming keeps the source stem and appends optional suffixes:
  - `MyClip.mp4` -> `MyClip.webm` + `MyClip.mp4`
  - `MyClip.mp4 --suffix 360p` -> `MyClip_360p.webm` + `MyClip_360p.mp4`
  - `MyClip.mp4 --suffix teaser --no-audio` -> `MyClip_teaser.webm` + `MyClip_teaser.mp4` (video-only outputs)

## Adding a New Video
1. Place source file in `public/video/` if not already there
2. Optimize + upload in one step: `just video-publish public/video/YourSource.mp4 --suffix 360p`
3. Reference via `CDN_BASE` in JS or full URL in HTML
4. Add `crossorigin` attribute to the `<video>` element
