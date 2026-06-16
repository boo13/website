/**
 * Portfolio password gate with AES-256-GCM client-side decryption.
 *
 * In production: fetches /data/portfolios/<slug>.enc.json, decrypts via
 * WebCrypto PBKDF2 → AES-GCM, calls onUnlock(data) on success.
 *
 * In dev: middleware serves { dev: true, projects: [...] }; any non-empty
 * password unlocks.
 *
 * Unlock persists for the tab session via sessionStorage (clears on tab close).
 */

import { trackPortfolioUnlock } from '../utils/track-portfolio-unlock.js';
import { prefersReducedMotion } from '../utils/dom.js';

const SESSION_KEY_PREFIX = 'portfolio-unlock-';

function sessionKey(slug) {
  return SESSION_KEY_PREFIX + slug;
}

// ─── WebCrypto helpers ────────────────────────────────────────────────────────

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function decrypt(encJson, password) {
  const { subtle } = globalThis.crypto;
  const enc = new TextEncoder();

  const salt = b64ToBytes(encJson.salt);
  const iv = b64ToBytes(encJson.iv);
  const ciphertext = b64ToBytes(encJson.ciphertext);
  const iterations = encJson.iterations ?? 600_000;

  const baseKey = await subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  const aesKey = await subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    ciphertext
  );
  return JSON.parse(new TextDecoder().decode(plaintext));
}

// ─── DOM helpers ──────────────────────────────────────────────────────────────

function shakeInput(el) {
  if (prefersReducedMotion()) return;
  el.classList.remove('is-shaking');
  // Force reflow to restart animation
  void el.offsetWidth;
  el.classList.add('is-shaking');
}

// ─── Public init ──────────────────────────────────────────────────────────────

export function initPortfolioGate({ slug, onUnlock }) {
  // Resume from sessionStorage on refresh
  const cached = sessionStorage.getItem(sessionKey(slug));
  if (cached) {
    try {
      onUnlock(JSON.parse(cached));
      return;
    } catch {
      sessionStorage.removeItem(sessionKey(slug));
    }
  }

  const mount = document.getElementById('portfolio-gate');
  if (!mount) return;

  mount.innerHTML = `
    <div class="portfolio-gate__overlay">
      <div class="portfolio-gate__bg" aria-hidden="true">
        <video
          class="portfolio-gate__video"
          autoplay
          loop
          muted
          playsinline
          poster="/images/landing-poster.jpg"
          crossorigin
        >
          <source
            src="https://media.randycounsman.com/video/Beyond.the.Spotlight.10secReel.v01_1920x1080.webm"
            type="video/webm"
          >
        </video>
        <div class="portfolio-gate__shade"></div>
        <div class="portfolio-gate__grain"></div>
      </div>
      <div class="portfolio-gate__panel">
        <h1 class="portfolio-gate__title portfolio-gate__reveal portfolio-gate__reveal--2">Portfolio</h1>
        <form class="portfolio-gate__form portfolio-gate__reveal portfolio-gate__reveal--3" autocomplete="off" novalidate>
          <label class="portfolio-gate__label" for="portfolio-gate-input">Password</label>
          <div class="portfolio-gate__input-row">
            <input
              id="portfolio-gate-input"
              class="portfolio-gate__input"
              type="password"
              autocomplete="current-password"
              spellcheck="false"
              placeholder="Enter password"
              aria-describedby="portfolio-gate-error"
            >
            <button class="portfolio-gate__submit" type="submit" aria-label="Unlock">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          <p class="portfolio-gate__error" id="portfolio-gate-error" role="alert" aria-live="polite"></p>
        </form>
      </div>
    </div>`;

  const form = mount.querySelector('.portfolio-gate__form');
  const input = mount.querySelector('.portfolio-gate__input');
  const inputRow = mount.querySelector('.portfolio-gate__input-row');
  const errorEl = mount.querySelector('.portfolio-gate__error');
  const btn = mount.querySelector('.portfolio-gate__submit');

  input.focus();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = input.value;
    if (!password) return;

    btn.disabled = true;
    errorEl.textContent = '';

    try {
      const res = await fetch(`/data/portfolios/${slug}.enc.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();

      let data;
      if (payload.dev === true) {
        // Dev middleware fast-path: any non-empty password unlocks
        data = { ...payload, projects: payload.projects ?? [] };
        delete data.dev;
      } else {
        data = await decrypt(payload, password);
      }

      sessionStorage.setItem(sessionKey(slug), JSON.stringify(data));
      if (!payload.dev) trackPortfolioUnlock(slug);
      mount.remove();
      onUnlock(data);
    } catch {
      const contactUrl =
        '/contact.html?subject=Requesting%20Portfolio%20access&message=Hey%20Randy%2C%20Can%20I%20check%20out%20your%20portfolio%3F%20I%27m...';
      errorEl.innerHTML = `wrong password — need it? just ask… <a href="${contactUrl}">CONTACT</a>`;
      shakeInput(inputRow);
      input.value = '';
      input.focus();
      btn.disabled = false;
    }
  });
}
