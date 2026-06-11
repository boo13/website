#!/usr/bin/env node
/**
 * Two-tier WebP conversion for portfolio strip images.
 *
 * For every jpg/jpeg/png under public/images/portfolio (recursively):
 *   foo.jpg → foo.thumb.webp  (900px long-edge, q72, strip metadata)
 *             foo.large.webp  (1600px long-edge, q78, strip metadata)
 * Originals are deleted once both derivatives exist and are non-empty.
 * Idempotent: files that already have both derivatives are skipped.
 *
 * Usage:
 *   node scripts/optimize-portfolio-images.mjs [<path-to-dir>]
 *
 * Default root: public/images/portfolio
 */

import { execFileSync } from 'node:child_process';
import {
  readdirSync,
  statSync,
  unlinkSync,
  existsSync,
} from 'node:fs';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', 'public', 'images', 'portfolio');

const targetRoot = process.argv[2]
  ? new URL(process.argv[2], `file://${process.cwd()}/`).pathname
  : ROOT;

const EXTS = new Set(['.jpg', '.jpeg', '.png']);
const SKIP_SUFFIXES = ['.thumb.webp', '.large.webp'];

function collectImages(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectImages(full));
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      if (!EXTS.has(ext)) continue;
      if (SKIP_SUFFIXES.some((s) => entry.name.endsWith(s))) continue;
      results.push(full);
    }
  }
  return results;
}

function derivedPaths(src) {
  const dir = dirname(src);
  const base = basename(src, extname(src));
  return {
    thumb: join(dir, `${base}.thumb.webp`),
    large: join(dir, `${base}.large.webp`),
  };
}

function fileSize(p) {
  try {
    return statSync(p).size;
  } catch {
    return 0;
  }
}

function fmt(bytes) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(0)} KB`;
}

function convert(src, dest, longEdge, quality) {
  // Use execFileSync with arg array so the ">" in geometry isn't shell-expanded
  execFileSync('magick', [
    src,
    '-resize', `${longEdge}x${longEdge}>`,
    '-quality', String(quality),
    '-strip',
    dest,
  ], { stdio: 'pipe' });
}

const images = collectImages(targetRoot);

if (images.length === 0) {
  console.log('No jpg/png source files found — nothing to do.');
  process.exit(0);
}

let totalBefore = 0;
let totalAfter = 0;
let converted = 0;
let skipped = 0;

for (const src of images) {
  const { thumb, large } = derivedPaths(src);

  const thumbExists = existsSync(thumb) && fileSize(thumb) > 0;
  const largeExists = existsSync(large) && fileSize(large) > 0;

  if (thumbExists && largeExists && !existsSync(src)) {
    skipped++;
    continue;
  }

  const before = fileSize(src);
  totalBefore += before;

  process.stdout.write(`  ${basename(src)} → `);

  try {
    if (!thumbExists) convert(src, thumb, 900, 72);
    if (!largeExists) convert(src, large, 1600, 78);
  } catch (err) {
    console.error(`\nERROR processing ${src}:\n${err.message}`);
    continue;
  }

  const thumbSize = fileSize(thumb);
  const largeSize = fileSize(large);
  totalAfter += thumbSize + largeSize;

  if (thumbSize > 0 && largeSize > 0) {
    unlinkSync(src);
    console.log(`thumb ${fmt(thumbSize)} + large ${fmt(largeSize)}  (was ${fmt(before)})`);
    converted++;
  } else {
    console.log(`WARNING: derivative empty, keeping original`);
  }
}

console.log('\n─────────────────────────────────────────');
console.log(`Converted : ${converted} files`);
console.log(`Skipped   : ${skipped} files (already done)`);
console.log(`Before    : ${fmt(totalBefore)}`);
console.log(`After     : ${fmt(totalAfter)}`);
if (totalBefore > 0) {
  const savings = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(0);
  console.log(`Savings   : ${savings}%`);
}
