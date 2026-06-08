#!/usr/bin/env node
/**
 * Scaffold a new portfolio variant.
 *
 * Usage: node scripts/scaffold-portfolio.mjs <slug>
 * Example: node scripts/scaffold-portfolio.mjs 0726
 *
 * Creates:
 *   portfolio/<slug>/index.html    — gated HTML shell
 *   portfolio-data/<slug>.json     — empty project list (gitignored)
 *   Appends PORTFOLIO_<SLUG>_PASSWORD= to .env.example
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';

const SLUG_RE = /^[a-z0-9-]+$/;

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/scaffold-portfolio.mjs <slug>');
  process.exit(1);
}
if (!SLUG_RE.test(slug)) {
  console.error(`Invalid slug "${slug}". Slugs must match [a-z0-9-]+ (lowercase letters, digits, hyphens only).`);
  process.exit(1);
}

const htmlDir = join('portfolio', slug);
const htmlPath = join(htmlDir, 'index.html');
if (existsSync(htmlPath)) {
  console.error(`${htmlPath} already exists. Aborting.`);
  process.exit(1);
}

const envKey = `PORTFOLIO_${slug.toUpperCase().replace(/-/g, '_')}_PASSWORD`;
const label = `(PORTFOLIO-${slug.toUpperCase()})`;

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Portfolio — Randy Counsman</title>
  <meta name="description" content="Selected documentary and television work by Randy Counsman — Executive Producer, Co-Executive Producer, Writer.">
  <meta name="robots" content="noindex, nofollow">

  <!-- Critical inline styles to prevent flash -->
  <style>
    html, body { background: #020202; margin: 0; padding: 0; }
  </style>

  <!-- Typekit Fonts -->
  <link rel="stylesheet" href="https://use.typekit.net/bnp0hyp.css">
</head>
<body data-portfolio-slug="${slug}">

  <!-- Fixed wordmark header -->
  <div class="portfolio-header">
    <a href="/" class="portfolio-wordmark">Randy Counsman</a>
  </div>

  <!-- Page identifier -->
  <p class="portfolio-id" aria-hidden="true">${label}</p>

  <!-- Gate overlay — rendered by JS, removed on unlock -->
  <div id="portfolio-gate"></div>

  <!-- Project rows — populated by JS after unlock -->
  <main class="portfolio-rows" id="portfolio-rows"></main>

  <!-- Footer -->
  <footer class="portfolio-footer">
    <span>© Randy Counsman, <span id="footer-year"></span></span>
  </footer>

  <!-- Tweakpane mount — only rendered on ?debug=1 -->
  <div id="tweakpane-mount"></div>

  <script type="module" src="/src/main-portfolio.js"></script>
</body>
</html>`;

// Create portfolio/slug/index.html
mkdirSync(htmlDir, { recursive: true });
writeFileSync(htmlPath, html);
console.log(`Created ${htmlPath}`);

// Create portfolio-data/slug.json stub
const dataDir = 'portfolio-data';
const dataPath = join(dataDir, `${slug}.json`);
mkdirSync(dataDir, { recursive: true });
writeFileSync(dataPath, JSON.stringify({ projects: [] }, null, 2) + '\n');
console.log(`Created ${dataPath}`);

// Append to .env.example
const examplePath = '.env.example';
const exampleLine = `${envKey}=\n`;
const existing = existsSync(examplePath) ? readFileSync(examplePath, 'utf8') : '';
if (!existing.includes(envKey)) {
  appendFileSync(examplePath, exampleLine);
  console.log(`Appended ${envKey}= to ${examplePath}`);
}

console.log('');
console.log('Next steps:');
console.log(`  1. Add to .env:          ${envKey}=your-password`);
console.log(`  2. Populate:             portfolio-data/${slug}.json`);
console.log(`  3. Encrypt:              just portfolio-encrypt ${slug}`);
console.log(`  4. Commit & push:        git add public/data/portfolios/${slug}.enc.json portfolio/${slug}/`);
