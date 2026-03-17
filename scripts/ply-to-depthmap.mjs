#!/usr/bin/env node
/**
 * Extract a depth map from a Gaussian Splat PLY file.
 * Rasterizes Z values into a grayscale image matching the source photo dimensions.
 * Outputs a raw grayscale buffer, then uses ImageMagick to convert to PNG.
 */

import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';

const PLY_PATH = '3d/RandyHeroPic.ply';
const OUT_PATH = 'public/images/RandyHeroPic-depth.png';
const WIDTH = 1280;
const HEIGHT = 853;
const OPACITY_THRESHOLD = 0.5;

// --- Parse PLY header ---
const buffer = readFileSync(PLY_PATH);
const headerSearch = buffer.subarray(0, 4096).toString('utf-8');
const markerIdx = headerSearch.indexOf('end_header\n');
if (markerIdx === -1) throw new Error('No end_header found');
const headerEnd = markerIdx + 'end_header\n'.length;

const lines = headerSearch.substring(0, markerIdx).split('\n');
let vertexCount = 0;
const properties = [];
for (const line of lines) {
  const parts = line.trim().split(/\s+/);
  if (parts[0] === 'element' && parts[1] === 'vertex') vertexCount = parseInt(parts[2]);
  else if (parts[0] === 'property') properties.push({ type: parts[1], name: parts[2] });
}

const propIndex = {};
properties.forEach((p, i) => (propIndex[p.name] = i));
const stride = properties.length * 4;

const xIdx = propIndex['x'];
const yIdx = propIndex['y'];
const zIdx = propIndex['z'];
const opIdx = propIndex['opacity'];

const sigmoid = (x) => 1 / (1 + Math.exp(-x));

console.log(`PLY: ${vertexCount} vertices, ${properties.length} properties, stride ${stride}`);

// --- First pass: find bounds ---
let xMin = Infinity, xMax = -Infinity;
let yMin = Infinity, yMax = -Infinity;
let zMin = Infinity, zMax = -Infinity;
let eligible = 0;

for (let i = 0; i < vertexCount; i++) {
  const off = headerEnd + i * stride;
  const op = sigmoid(buffer.readFloatLE(off + opIdx * 4));
  if (op < OPACITY_THRESHOLD) continue;
  eligible++;

  const x = buffer.readFloatLE(off + xIdx * 4);
  const y = buffer.readFloatLE(off + yIdx * 4);
  const z = buffer.readFloatLE(off + zIdx * 4);
  xMin = Math.min(xMin, x); xMax = Math.max(xMax, x);
  yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
  zMin = Math.min(zMin, z); zMax = Math.max(zMax, z);
}

console.log(`Eligible: ${eligible} (${((eligible / vertexCount) * 100).toFixed(1)}%)`);
console.log(`X: [${xMin.toFixed(3)}, ${xMax.toFixed(3)}]`);
console.log(`Y: [${yMin.toFixed(3)}, ${yMax.toFixed(3)}]`);
console.log(`Z: [${zMin.toFixed(3)}, ${zMax.toFixed(3)}]`);

// --- Second pass: accumulate depth into image grid ---
// Each pixel accumulates weighted Z values. We use the closest (smallest Z) approach
// with a median-like accumulation.
const depthAccum = new Float32Array(WIDTH * HEIGHT).fill(Infinity);
const depthCount = new Uint16Array(WIDTH * HEIGHT);

const xRange = xMax - xMin;
const yRange = yMax - yMin;
const zRange = zMax - zMin;

for (let i = 0; i < vertexCount; i++) {
  const off = headerEnd + i * stride;
  const op = sigmoid(buffer.readFloatLE(off + opIdx * 4));
  if (op < OPACITY_THRESHOLD) continue;

  const x = buffer.readFloatLE(off + xIdx * 4);
  const y = buffer.readFloatLE(off + yIdx * 4);
  const z = buffer.readFloatLE(off + zIdx * 4);

  // Map XY to pixel coordinates
  const px = Math.floor(((x - xMin) / xRange) * (WIDTH - 1));
  const py = Math.floor(((y - yMin) / yRange) * (HEIGHT - 1));

  if (px < 0 || px >= WIDTH || py < 0 || py >= HEIGHT) continue;

  const idx = py * WIDTH + px;
  depthCount[idx]++;
  // Keep minimum Z (closest to camera) for each pixel
  if (z < depthAccum[idx]) depthAccum[idx] = z;
}

// --- Convert to grayscale PNG ---
// Normalize: closer = brighter (white), farther = darker (black)
const grayBuf = Buffer.alloc(WIDTH * HEIGHT);
let filledPixels = 0;

for (let i = 0; i < WIDTH * HEIGHT; i++) {
  if (depthAccum[i] === Infinity) {
    grayBuf[i] = 0; // No data = black (far)
  } else {
    // Invert: close=bright, far=dark
    const normalized = 1.0 - (depthAccum[i] - zMin) / zRange;
    grayBuf[i] = Math.round(Math.max(0, Math.min(255, normalized * 255)));
    filledPixels++;
  }
}

console.log(`Filled ${filledPixels}/${WIDTH * HEIGHT} pixels (${((filledPixels / (WIDTH * HEIGHT)) * 100).toFixed(1)}%)`);

// Write raw gray and convert with ImageMagick
const rawPath = '/tmp/depth-raw.gray';
writeFileSync(rawPath, grayBuf);
execSync(`magick -size ${WIDTH}x${HEIGHT} -depth 8 gray:${rawPath} -blur 0x2 ${OUT_PATH}`);
unlinkSync(rawPath);

console.log(`Wrote ${OUT_PATH}`);
