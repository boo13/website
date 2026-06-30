---
title: "feat: Gemini-generated cover art for AI playlists"
type: feat
status: completed
date: 2026-03-15
---

# Gemini-Generated Cover Art for AI Playlists

## Overview

Replace the CSS gradient placeholder covers on each playlist card with real AI-generated
images. When AIHome creates a new playlist, it calls the Gemini Imagen API, uploads the
result to Cloudflare R2, and writes a `cover_image` field to the playlist JSON. The website
renderer uses the real image when present and silently falls back to the existing CSS gradient
when not.

A companion backfill script handles the 9 existing playlists that were created before this
feature existed.

---

## Problem Statement

The current generative CSS gradient covers are clever but generic — they're hash-derived from
the title and have no visual relationship to the playlist's actual mood, genre, or content.
Every cover looks like the same family of abstract blobs. Real AI-generated album art would
make the feed visually distinctive and give each playlist a unique identity that reflects what
it actually sounds like.

---

## Architecture

```
AIHome creates playlist
        │
        ▼
generate_playlist_cover(playlist)     ← ⚠️ NEW in AIHome
        │
        ├─ craft prompt from title + genre + description
        ├─ call Gemini Imagen API  (imagen-3.0-generate-001)
        ├─ save image bytes to temp file
        ├─ upload to R2: portfolio-assets/ai-playlists/{slug}.jpg
        └─ write cover_image: "ai-playlists/{slug}.jpg" to playlist entry
                │
                ▼
        Export ai-playlists.json  (existing flow, unchanged)
                │
                ▼
        Website reads cover_image field
        └─ present → <img src="CDN_BASE/ai-playlists/{slug}.jpg">
        └─ absent  → CSS gradient fallback (existing behavior)
```

---

## Proposed Solution

### Phase 1 — Website: accept and render `cover_image` (this repo)

Wire the website to consume a `cover_image` field in the JSON. This is a small, self-contained
change that can ship independently before AIHome is updated.

**Files to change:**

#### `src/config.js`
No change needed — `CDN_BASE` is already exported here.

#### `src/main-aiplaylists.js`

1. Import `CDN_BASE` at the top:
   ```js
   import { CDN_BASE } from './config.js';
   ```

2. In `renderPlaylists`, change the cover-art element to use `<img>` when `cover_image` is
   present, falling back to the CSS gradient:
   ```js
   const hasCover = typeof item.cover_image === 'string' && item.cover_image.length > 0;
   const coverStyle = hasCover ? '' : coverBackground(item.title);
   const coverImgHtml = hasCover
     ? `<img src="${CDN_BASE}/${escHtml(item.cover_image)}"
             alt=""
             loading="lazy"
             decoding="async"
             width="190" height="190">`
     : '';
   // In the template:
   // <div class="playlist-card__cover-art" style="background: ${coverStyle}">${coverImgHtml}</div>
   ```

   Note: `alt=""` is correct — the cover is decorative; the title `<h2>` is the accessible label.

#### `src/styles/aiplaylists.css`

Add `<img>` sizing inside `.playlist-card__cover-art`:
```css
.playlist-card__cover-art img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
```

---

### Phase 2 — AIHome: generate cover at playlist creation time ⚠️ AIHome work required

> **Note:** This phase requires changes inside the AIHome codebase, not this website repo.
> The implementation notes below describe what AIHome needs to do. Implement when working
> in AIHome.

#### 2a. Install dependencies (in AIHome)

```bash
npm install @google/generative-ai
# Imagen is accessed via the same SDK, or via the REST API directly
```

Or use the REST API without an SDK (simpler for a one-function addition):
```bash
# No new dependency needed — plain fetch() works
```

#### 2b. Add `GEMINI_API_KEY` to AIHome environment

```
GEMINI_API_KEY=your_key_here
```

The API key needs access to the **Imagen 3** model. Enable it in Google AI Studio or
Google Cloud Console for the project linked to the key.

#### 2c. Create `lib/generate-cover.mjs` in AIHome

```js
// lib/generate-cover.mjs
// Calls Gemini Imagen 3 to generate a square cover image for a playlist.
// Returns a Buffer of JPEG bytes, or null on failure.

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'imagen-3.0-generate-001';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict`;

export async function generateCoverImage(playlist) {
  const prompt = buildPrompt(playlist);

  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: '1:1',        // square — matches the cover art area
      outputMimeType: 'image/jpeg',
    },
  };

  const response = await fetch(`${ENDPOINT}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    console.error(`[cover-gen] Imagen API error ${response.status} for "${playlist.title}"`);
    return null;
  }

  const data = await response.json();
  const b64 = data?.predictions?.[0]?.bytesBase64Encoded;
  if (!b64) {
    console.error(`[cover-gen] No image data returned for "${playlist.title}"`);
    return null;
  }

  return Buffer.from(b64, 'base64');
}

function buildPrompt(playlist) {
  const genre = playlist.genre ? `Genre: ${playlist.genre}. ` : '';
  const mood = playlist.description
    ? playlist.description.replace(/[*_`]/g, '').slice(0, 120)
    : '';

  return [
    `Album cover art for a music playlist titled "${playlist.title}".`,
    genre,
    mood ? `Mood: ${mood}.` : '',
    'Dark, atmospheric, cinematic. Abstract or painterly.',
    'Deep shadows, rich color, moody light.',
    'No text, no words, no letters, no UI elements.',
    'Square format. Film photography or fine art aesthetic.',
  ]
    .filter(Boolean)
    .join(' ');
}
```

#### 2d. Add `lib/upload-cover.mjs` in AIHome

```js
// lib/upload-cover.mjs
// Uploads a JPEG buffer to Cloudflare R2 and returns the relative path.
// Uses wrangler CLI (consistent with how videos are uploaded from the website repo).

import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const R2_BUCKET = 'portfolio-assets';
const R2_PREFIX = 'ai-playlists';

export async function uploadCoverToR2(slug, jpegBuffer) {
  const tmpPath = join(tmpdir(), `${slug}.jpg`);
  const r2Key = `${R2_PREFIX}/${slug}.jpg`;

  try {
    writeFileSync(tmpPath, jpegBuffer);

    execSync(
      `npx wrangler r2 object put "${R2_BUCKET}/${r2Key}" ` +
        `--file "${tmpPath}" ` +
        `--content-type "image/jpeg" --remote`,
      { stdio: 'inherit' }
    );

    return r2Key; // "ai-playlists/{slug}.jpg"
  } catch (err) {
    console.error(`[upload-cover] R2 upload failed for ${slug}:`, err.message);
    return null;
  } finally {
    try { unlinkSync(tmpPath); } catch {}
  }
}
```

#### 2e. Wire into AIHome playlist creation flow (in AIHome)

In whatever function/module creates a playlist entry and writes it to JSON, add:

```js
import { generateCoverImage } from './lib/generate-cover.mjs';
import { uploadCoverToR2 } from './lib/upload-cover.mjs';

// After playlist entry is constructed, before writing JSON:
const imageBuffer = await generateCoverImage(playlist);
if (imageBuffer) {
  const coverPath = await uploadCoverToR2(playlist.slug, imageBuffer);
  if (coverPath) {
    playlist.cover_image = coverPath; // "ai-playlists/{slug}.jpg"
  }
}
// If generation or upload fails, cover_image is simply omitted —
// the website falls back to the CSS gradient automatically.
```

---

### Phase 3 — Backfill script (this repo)

A standalone script to generate covers for the 9 existing playlists (and any future ones
that were added before AIHome was updated). Lives in the website repo so it can be run as a
`just` recipe.

#### `scripts/generate-playlist-covers.mjs`

```js
#!/usr/bin/env node
// Generates Gemini cover art for any playlist missing a cover_image field.
// Usage: node scripts/generate-playlist-covers.mjs
//        GEMINI_API_KEY=xxx node scripts/generate-playlist-covers.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { writeFileSync as writeTmp, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FEED_PATH = 'public/data/ai-playlists.json';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = 'imagen-3.0-generate-001';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:predict`;

async function generateImage(playlist) { /* same as Phase 2 */ }
async function uploadToR2(slug, buf) { /* same as Phase 2 */ }

async function main() {
  const feed = JSON.parse(readFileSync(FEED_PATH, 'utf8'));
  let updated = 0;

  for (const item of feed.items) {
    if (item.cover_image) {
      console.log(`[skip] ${item.slug} — already has cover`);
      continue;
    }
    console.log(`[gen]  ${item.slug}`);
    const buf = await generateImage(item);
    if (!buf) continue;
    const path = await uploadToR2(item.slug, buf);
    if (!path) continue;
    item.cover_image = path;
    updated++;
    // Small delay to stay within API rate limits
    await new Promise(r => setTimeout(r, 1500));
  }

  if (updated > 0) {
    writeFileSync(FEED_PATH, JSON.stringify(feed, null, 2));
    console.log(`\nDone. Updated ${updated} entries. Commit public/data/ai-playlists.json.`);
  } else {
    console.log('\nNo entries needed updating.');
  }
}

main().catch(console.error);
```

#### `justfile` addition

```makefile
# Generate Gemini cover art for any playlist missing a cover image
cover-gen:
    GEMINI_API_KEY={{env_var('GEMINI_API_KEY')}} node scripts/generate-playlist-covers.mjs
```

---

## JSON Schema Change

Add one optional field to each playlist item:

```json
{
  "slug": "2026-03-12-sonnet-tokyo-burning",
  "title": "Tokyo Burning",
  "cover_image": "ai-playlists/2026-03-12-sonnet-tokyo-burning.jpg",
  ...
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `cover_image` | `string \| undefined` | No | R2-relative path. Absent = CSS gradient fallback. |

R2 full URL: `https://pub-722bb50dc4774406afca73534059fdd8.r2.dev/ai-playlists/{slug}.jpg`

---

## Acceptance Criteria

- [ ] New playlists created in AIHome automatically receive a `cover_image` field in the JSON
- [ ] The website renders `<img>` when `cover_image` is present; CSS gradient shows otherwise
- [ ] Fallback is silent — no broken image icon, no layout shift
- [ ] Cover images are square (1:1), served from R2 via CDN
- [ ] Backfill script processes all existing playlists missing covers
- [ ] Backfill is idempotent — re-running skips entries that already have `cover_image`
- [ ] `just cover-gen` runs the backfill from the website repo
- [ ] On mobile (≤480px), the wide-aspect cover still looks good with `object-fit: cover`
- [ ] No console errors, no layout shift on image load (`width`/`height` attrs on `<img>`)

---

## Prompt Engineering Notes

The prompt is the primary lever for cover quality. Iterate on these dimensions:

| Element | Why it matters |
|---|---|
| `"No text, no words, no letters"` | Imagen sometimes adds text to album-art-style prompts |
| `"Square format"` | Reinforces the 1:1 aspect ratio parameter |
| Title + genre | Most important signal for visual mood |
| Description (first 120 chars) | Provides tonal context without overwhelming the prompt |
| `"Dark, atmospheric"` | Matches the site's aesthetic so covers feel at home |
| `"No UI elements"` | Prevents Imagen from adding play buttons, phone frames, etc. |

Adjust the `buildPrompt()` function in AIHome after seeing real outputs. Prompt iteration
doesn't require a code deployment — just update the function and re-run.

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Imagen API key not enabled for Imagen 3 model | Medium | Enable in Google AI Studio; fallback to `imagen-3.0-fast-generate-001` |
| Generated image contains text/watermarks | Low | Explicit "no text" in prompt; regenerate on retry |
| R2 upload fails in AIHome (wrangler not available) | Low | Switch to direct R2 S3-compatible API (`@aws-sdk/client-s3` with R2 creds) |
| Rate limits during backfill | Low | 1.5s delay between requests in backfill script |
| Image file size too large for page load | Low | Imagen outputs JPEG; at 512×512 typical size is 50–120KB, acceptable |
| Wrangler auth not set up in AIHome environment | Medium | Document required `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` env vars |

---

## Dependencies & Prerequisites

**Website repo (Phase 1):**
- No new npm dependencies
- `CDN_BASE` already exported from `src/config.js`

**AIHome (Phase 2):**
- `GEMINI_API_KEY` env var with Imagen 3 access
- `CLOUDFLARE_ACCOUNT_ID` + `CLOUDFLARE_API_TOKEN` env vars (for wrangler)
- `npx wrangler` available (or switch to `@aws-sdk/client-s3` for R2 direct upload)
- Access to the playlist slug at creation time (needed for the R2 filename)

**Backfill script (Phase 3):**
- Same `GEMINI_API_KEY` in local shell
- Same wrangler auth
- Run from website repo root

---

## Implementation Order

1. **Phase 1 first** — ship the website changes; they're safe, backward-compatible, and unblock everything else
2. **Phase 3 second** — run the backfill script against the 9 existing playlists; commit the updated JSON
3. **Phase 2 last** — implement in AIHome so all future playlists auto-generate covers

This order means you get real cover art visible on the site quickly (via backfill) without
waiting for AIHome to be wired up.

---

## References

- `src/main-aiplaylists.js` — `renderPlaylists()`, `coverBackground()`
- `src/styles/aiplaylists.css` — `.playlist-card__cover`, `.playlist-card__cover-art`
- `src/config.js` — `CDN_BASE`
- `public/data/ai-playlists.json` — current feed schema
- `justfile` — `video-publish` recipe (R2 upload pattern to follow)
- [Imagen 3 API reference](https://ai.google.dev/api/generate-content) — `imagen-3.0-generate-001`
- [Cloudflare R2 + wrangler](https://developers.cloudflare.com/r2/api/s3/api/) — upload pattern
