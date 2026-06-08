#!/usr/bin/env node
/**
 * Encrypt a portfolio data file for client-side AES-GCM gating.
 *
 * Usage: node scripts/encrypt-portfolio.mjs <slug>
 * Example: node scripts/encrypt-portfolio.mjs 0626
 *
 * Reads:  portfolio-data/<slug>.json
 * Reads:  PORTFOLIO_<SLUG>_PASSWORD env var (loaded from .env)
 * Writes: public/data/portfolios/<slug>.enc.json (committed)
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { createRequire } from 'module';

// Load .env if present
try {
  const require = createRequire(import.meta.url);
  require('dotenv/config');
} catch {
  // dotenv not installed — fall through to process.env only
}

const SLUG_RE = /^[a-z0-9-]+$/;
const ITERATIONS = 600_000;

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/encrypt-portfolio.mjs <slug>');
  process.exit(1);
}
if (!SLUG_RE.test(slug)) {
  console.error(`Invalid slug "${slug}". Slugs must match [a-z0-9-]+.`);
  process.exit(1);
}

// Resolve env var name: "client-acme" -> "PORTFOLIO_CLIENT_ACME_PASSWORD"
const envKey = `PORTFOLIO_${slug.toUpperCase().replace(/-/g, '_')}_PASSWORD`;
const password = process.env[envKey];
if (!password) {
  console.error(`Missing env var ${envKey}.`);
  console.error(`Add it to your .env file: ${envKey}=your-password`);
  process.exit(1);
}

// Read and validate source data
const srcPath = join('portfolio-data', `${slug}.json`);
let raw;
try {
  raw = readFileSync(srcPath, 'utf8');
} catch {
  console.error(`Source file not found: ${srcPath}`);
  console.error('Run: just portfolio-scaffold <slug>  to create a stub first.');
  process.exit(1);
}

let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  console.error(`${srcPath} is not valid JSON: ${e.message}`);
  process.exit(1);
}

if (!data || !Array.isArray(data.projects)) {
  console.error(`${srcPath} must have shape { "projects": [...] }, got: ${JSON.stringify(Object.keys(data ?? {}))}`);
  process.exit(1);
}

// Encrypt using Node's WebCrypto (same API as browser — avoids auth-tag mismatch)
const { subtle } = globalThis.crypto;
const plaintext = new TextEncoder().encode(JSON.stringify(data));
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await subtle.importKey(
  'raw',
  new TextEncoder().encode(password),
  'PBKDF2',
  false,
  ['deriveKey'],
);

const aesKey = await subtle.deriveKey(
  { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);

const ciphertext = await subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext);

function toB64(buf) {
  return Buffer.from(buf).toString('base64');
}

const output = {
  v: 1,
  kdf: 'PBKDF2-SHA256',
  iterations: ITERATIONS,
  salt: toB64(salt),
  iv: toB64(iv),
  ciphertext: toB64(ciphertext),
};

const outDir = join('public', 'data', 'portfolios');
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${slug}.enc.json`);
writeFileSync(outPath, JSON.stringify(output, null, 2) + '\n');

console.log(`Encrypted ${srcPath} → ${outPath}`);
console.log(`  Projects: ${data.projects.length}`);
console.log(`  Iterations: ${ITERATIONS.toLocaleString()}`);
console.log('  Commit public/data/portfolios/ to deploy.');
