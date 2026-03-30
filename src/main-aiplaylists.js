import './styles/aiplaylists.css';
import { gsap } from 'gsap';
import { CDN_BASE } from './config.js';

const FEED_URL = '/data/ai-playlists.json';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const SOURCE_LABELS = {
  nlm: 'NotebookLM',
  codex_fallback: 'Codex',
  codex: 'Codex',
  sonnet: 'Sonnet',
  opus: 'Opus',
  gemini: 'Gemini',
};

const KIND_LABELS = {
  daily_nlm: 'Daily roulette',
  ai_curated: 'One-off curation',
};

const PLAY_ICON = `<svg viewBox="0 0 48 48" fill="none" aria-hidden="true"><circle cx="24" cy="24" r="23" stroke="currentColor" stroke-width="1.5"/><path d="M19 15.5L33 24L19 32.5V15.5Z" fill="currentColor"/></svg>`;
const ARROW_RIGHT_ICON = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h12M8 2l5 5-5 5"/></svg>`;
const ARROW_LEFT_ICON = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 7H1M6 2 1 7l5 5"/></svg>`;

const feedState = document.getElementById('feed-state');
const playlistList = document.getElementById('playlist-list');

let teardownCoverflow = () => {};

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(parsed);
}

function labelForSource(source) {
  return SOURCE_LABELS[source] || escHtml(source) || 'Unknown';
}

function labelForKind(kind) {
  return KIND_LABELS[kind] || escHtml(kind) || 'Playlist';
}

function stripSourcePrefix(title) {
  return String(title ?? '')
    .replace(/^[^:]+:\s*/, '')
    .replace(/^\d{4}-\d{2}-\d{2}\s*/, '')
    .replace(/\s*\d{4}-\d{2}-\d{2}$/, '')
    .trim();
}

function excerpt(text, limit = 148) {
  const value = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (!value) return 'No description yet.';
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 1).trimEnd()}…`;
}

function hashCode(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function coverBackground(title) {
  const hash = hashCode(title);
  const hueA = hash % 360;
  const hueB = (hueA + 25 + ((hash >> 4) % 90)) % 360;
  const hueC = (hueA + 180 + ((hash >> 9) % 70)) % 360;
  const angle = (hash >> 13) % 180;
  const xA = 18 + ((hash >> 3) % 32);
  const yA = 12 + ((hash >> 5) % 40);
  const xB = 56 + ((hash >> 7) % 28);
  const yB = 40 + ((hash >> 11) % 28);
  const xC = 68 + ((hash >> 15) % 18);
  const yC = 14 + ((hash >> 18) % 26);

  return [
    `radial-gradient(circle at ${xA}% ${yA}%, oklch(0.74 0.18 ${hueA} / 0.9), transparent 32%)`,
    `radial-gradient(circle at ${xB}% ${yB}%, oklch(0.62 0.14 ${hueB} / 0.8), transparent 38%)`,
    `radial-gradient(circle at ${xC}% ${yC}%, oklch(0.55 0.12 ${hueC} / 0.65), transparent 42%)`,
    `linear-gradient(${angle + 22}deg, oklch(0.15 0.02 ${hueA}) 0%, oklch(0.08 0.01 ${hueC}) 100%)`,
  ].join(', ');
}

function trackSearchUrl(track) {
  const query = [track.artist, track.title].filter(Boolean).join(' ');
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
}

function resolveAssetPath(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (/^https?:\/\//.test(raw)) return raw;
  return `${CDN_BASE}/${raw.replace(/^\/+/, '')}`;
}

function getTracks(item) {
  if (Array.isArray(item.tracks) && item.tracks.length) return item.tracks;
  if (Array.isArray(item.tracks_preview) && item.tracks_preview.length) return item.tracks_preview;
  return [];
}

function renderTrackList(item) {
  const tracks = getTracks(item);
  const hasFullTracklist = Array.isArray(item.tracks) && item.tracks.length > 0;
  const heading = hasFullTracklist ? 'Tracklist' : 'Track preview';

  if (!tracks.length) {
    return `
      <section class="coverflow-card__track-panel">
        <div class="coverflow-card__track-head">
          <p>${heading}</p>
          <span>${escHtml(String(item.track_count || 0))} total</span>
        </div>
        <p class="coverflow-card__track-empty">Track data is not available for this playlist yet.</p>
      </section>
    `;
  }

  const items = tracks
    .map((track, index) => {
      const artist = escHtml(track.artist || 'Unknown artist');
      const title = escHtml(track.title || 'Unknown track');
      return `
        <li>
          <span class="coverflow-card__track-index">${String(index + 1).padStart(2, '0')}</span>
          <div class="coverflow-card__track-copy">
            <a href="${escHtml(trackSearchUrl(track))}" target="_blank" rel="noopener">${title}</a>
            <span>${artist}</span>
          </div>
        </li>
      `;
    })
    .join('');

  return `
    <section class="coverflow-card__track-panel">
      <div class="coverflow-card__track-head">
        <p>${heading}</p>
        <span>${escHtml(String(item.track_count || tracks.length))} total</span>
      </div>
      <ol class="coverflow-card__tracklist">${items}</ol>
    </section>
  `;
}

function createPlaylistCard(item, index) {
  const cleanTitle = stripSourcePrefix(item.title);
  const coverStyle = coverBackground(item.title || cleanTitle || `playlist-${index}`);
  const coverSrc = resolveAssetPath(item.cover_image);
  const coverVideoSrc = resolveAssetPath(item.cover_video_url);
  const audioSrc = resolveAssetPath(item.audio_intro_url);
  const hasPlaylistUrl =
    typeof item.playlist_url === 'string' && item.playlist_url.startsWith('https://');
  const metaLine = [
    labelForKind(item.playlist_kind),
    labelForSource(item.source),
    formatDate(item.created_at),
  ]
    .filter(Boolean)
    .join(' / ');

  return `
    <article class="coverflow-card" data-index="${index}" aria-label="${escHtml(cleanTitle)}">
      <div class="coverflow-card__shell">
        <div class="coverflow-card__inner">
          <button
            class="coverflow-card__face coverflow-card__face--front coverflow-card__flip-trigger"
            type="button"
            aria-expanded="false"
            aria-label="Flip ${escHtml(cleanTitle)} to reveal playlist details"
          >
            <span class="coverflow-card__cover-art" style="background:${coverStyle}">
              ${
                coverVideoSrc
                  ? `<video class="coverflow-card__cover-video" src="${escHtml(coverVideoSrc)}" ${coverSrc ? `poster="${escHtml(coverSrc)}"` : ''} autoplay muted loop playsinline preload="metadata" crossorigin></video>`
                  : ''
              }
              ${
                coverSrc
                  ? `<img class="coverflow-card__cover-image" src="${escHtml(coverSrc)}" alt="" loading="lazy" decoding="async" width="768" height="768">`
                  : ''
              }
            </span>
            <span class="coverflow-card__front-copy">
              <span class="coverflow-card__front-kicker">${escHtml(item.genre || labelForKind(item.playlist_kind))}</span>
              <strong class="coverflow-card__front-title">${escHtml(cleanTitle)}</strong>
              <span class="coverflow-card__front-meta">${escHtml(String(item.track_count || 0))} tracks</span>
            </span>
            <span class="coverflow-card__front-hint">Tap to flip</span>
          </button>

          <div class="coverflow-card__face coverflow-card__face--back">
            <div class="coverflow-card__notes">
              <div class="coverflow-card__notes-top">
                <p class="coverflow-card__notes-kicker">${escHtml(metaLine)}</p>
                <button class="coverflow-card__close" type="button" data-action="flip-close">Close</button>
              </div>

              <h3>${escHtml(cleanTitle)}</h3>
              <p class="coverflow-card__back-description">${escHtml(item.description || 'No description yet.')}</p>

              ${
                item.quote
                  ? `<blockquote class="coverflow-card__quote">
                      <p>${escHtml(item.quote)}</p>
                      ${item.quote_source ? `<footer>${escHtml(item.quote_source)}</footer>` : ''}
                    </blockquote>`
                  : ''
              }

              <div class="coverflow-card__action-row">
                ${
                  audioSrc
                    ? `<button class="coverflow-card__action" type="button" data-action="audio-toggle" aria-expanded="false">${PLAY_ICON}<span>Play narration</span></button>`
                    : ''
                }
                ${
                  hasPlaylistUrl
                    ? `<a class="coverflow-card__action coverflow-card__action--primary" href="${escHtml(item.playlist_url)}" target="_blank" rel="noopener">Open in YouTube Music ${ARROW_RIGHT_ICON}</a>`
                    : ''
                }
              </div>

              ${
                audioSrc
                  ? `<div class="coverflow-card__audio-panel" hidden>
                      <audio controls preload="none" src="${escHtml(audioSrc)}"></audio>
                      ${
                        item.narration_text
                          ? `<p class="coverflow-card__liner-notes">${escHtml(item.narration_text)}</p>`
                          : ''
                      }
                    </div>`
                  : ''
              }

              ${renderTrackList(item)}
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderPlaylists(items) {
  teardownCoverflow();

  playlistList.innerHTML = `
    <section class="coverflow" aria-label="AI playlist cover flow">
      <div class="coverflow__frame">
        <button class="coverflow__nav coverflow__nav--prev" type="button" aria-label="Previous playlist">
          ${ARROW_LEFT_ICON}
        </button>

        <div class="coverflow__viewport">
          <div class="coverflow__track">
            ${items.map((item, index) => createPlaylistCard(item, index)).join('')}
          </div>
        </div>

        <button class="coverflow__nav coverflow__nav--next" type="button" aria-label="Next playlist">
          ${ARROW_RIGHT_ICON}
        </button>
      </div>

      <p id="coverflow-counter" class="coverflow__counter"></p>
    </section>
  `;

  for (const img of playlistList.querySelectorAll('.coverflow-card__cover-image')) {
    img.addEventListener(
      'error',
      () => {
        img.remove();
      },
      { once: true },
    );
  }

  for (const video of playlistList.querySelectorAll('.coverflow-card__cover-video')) {
    video.addEventListener(
      'error',
      () => {
        video.remove();
      },
      { once: true },
    );
  }

  mountCoverflow(items);
}

function mountCoverflow(items) {
  const cards = Array.from(playlistList.querySelectorAll('.coverflow-card'));
  const viewport = playlistList.querySelector('.coverflow__viewport');
  const prevButton = playlistList.querySelector('.coverflow__nav--prev');
  const nextButton = playlistList.querySelector('.coverflow__nav--next');
  const counter = playlistList.querySelector('#coverflow-counter');

  if (!viewport || !prevButton || !nextButton || !counter) {
    return;
  }

  let activeIndex = 0;
  let flippedIndex = null;
  const cleanup = [];
  let pointerStart = null;

  const context = gsap.context(() => {
    gsap.set(cards, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      transformStyle: 'preserve-3d',
      transformPerspective: 1800,
    });

    gsap.set(cards.map((card) => card.querySelector('.coverflow-card__inner')), {
      transformStyle: 'preserve-3d',
      rotationY: 0,
    });
  }, playlistList);

  function on(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    cleanup.push(() => target.removeEventListener(eventName, handler, options));
  }

  function resetAudio(card) {
    const toggle = card.querySelector('[data-action="audio-toggle"]');
    const panel = card.querySelector('.coverflow-card__audio-panel');
    const audio = panel?.querySelector('audio');
    const label = toggle?.querySelector('span');

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (panel) panel.hidden = true;
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
    if (label) label.textContent = 'Play narration';
  }

  function closeFlippedCard(index = flippedIndex) {
    if (index == null) return;

    const card = cards[index];
    const inner = card.querySelector('.coverflow-card__inner');
    const trigger = card.querySelector('.coverflow-card__flip-trigger');

    resetAudio(card);
    card.classList.remove('is-flipped');
    trigger?.setAttribute('aria-expanded', 'false');

    gsap.to(inner, {
      rotationY: 0,
      duration: REDUCED_MOTION ? 0 : 0.72,
      ease: 'power3.inOut',
    });

    if (flippedIndex === index) flippedIndex = null;
  }

  function openFlippedCard(index) {
    if (index !== activeIndex) {
      setActive(index);
      return;
    }

    if (flippedIndex != null && flippedIndex !== index) closeFlippedCard(flippedIndex);
    if (flippedIndex === index) return;

    const card = cards[index];
    const inner = card.querySelector('.coverflow-card__inner');
    const trigger = card.querySelector('.coverflow-card__flip-trigger');

    card.classList.add('is-flipped');
    trigger?.setAttribute('aria-expanded', 'true');
    flippedIndex = index;

    gsap.to(inner, {
      rotationY: 180,
      duration: REDUCED_MOTION ? 0 : 0.82,
      ease: 'power3.inOut',
    });
  }

  function updateStatus() {
    const newCount = `${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    counter.textContent = newCount;
    if (!REDUCED_MOTION) {
      gsap.fromTo(counter, { autoAlpha: 0, y: 3 }, { autoAlpha: 1, y: 0, duration: 0.25, ease: 'power2.out' });
    }
    prevButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === items.length - 1;
  }

  function layoutCard(card, offset) {
    const absOffset = Math.abs(offset);
    const isMobile = window.innerWidth <= 768;
    const baseSpread = isMobile ? Math.min(viewport.clientWidth * 0.46, 180) : Math.min(viewport.clientWidth * 0.38, 320);
    const secondarySpread = isMobile ? baseSpread * 1.6 : baseSpread * 1.75;

    const config =
      absOffset === 0
        ? { x: 0, y: 0, z: 220, scale: 1, rotateY: 0, opacity: 1 }
        : absOffset === 1
          ? {
              x: offset * baseSpread,
              y: 12,
              z: -140,
              scale: isMobile ? 0.72 : 0.78,
              rotateY: offset < 0 ? 58 : -58,
              opacity: isMobile ? 0.55 : 0.72,
            }
          : absOffset === 2
            ? {
                x: offset * secondarySpread,
                y: 18,
                z: -320,
                scale: isMobile ? 0.48 : 0.58,
                rotateY: offset < 0 ? 74 : -74,
                opacity: isMobile ? 0.18 : 0.3,
              }
            : {
                x: offset * secondarySpread * 1.12,
                y: 26,
                z: -520,
                scale: 0.38,
                rotateY: offset < 0 ? 82 : -82,
                opacity: 0,
              };

    card.classList.toggle('is-active', absOffset === 0);
    card.setAttribute('aria-hidden', absOffset === 0 ? 'false' : 'true');
    card.style.zIndex = String(50 - absOffset);
    card.style.pointerEvents = absOffset <= 1 ? 'auto' : 'none';

    const trigger = card.querySelector('.coverflow-card__flip-trigger');
    if (trigger) trigger.tabIndex = absOffset === 0 ? 0 : -1;

    gsap.to(card, {
      x: config.x,
      y: config.y,
      z: config.z,
      scale: config.scale,
      rotationY: config.rotateY,
      autoAlpha: config.opacity,
      duration: REDUCED_MOTION ? 0 : 0.88,
      ease: 'power3.inOut',
      overwrite: true,
    });
  }

  function syncLayout() {
    cards.forEach((card, index) => {
      const offset = index - activeIndex;
      if (flippedIndex != null && flippedIndex !== activeIndex) closeFlippedCard(flippedIndex);
      if (offset !== 0 && index === flippedIndex) closeFlippedCard(index);
      layoutCard(card, offset);
    });
    updateStatus();
  }

  function setActive(nextIndex) {
    const bounded = Math.max(0, Math.min(items.length - 1, nextIndex));
    if (bounded === activeIndex) return;

    if (flippedIndex != null) closeFlippedCard(flippedIndex);
    activeIndex = bounded;
    syncLayout();
  }

  function toggleAudio(card) {
    const toggle = card.querySelector('[data-action="audio-toggle"]');
    const panel = card.querySelector('.coverflow-card__audio-panel');
    const audio = panel?.querySelector('audio');
    const label = toggle?.querySelector('span');

    if (!toggle || !panel || !audio) return;

    const shouldOpen = panel.hidden;

    for (const otherCard of cards) {
      if (otherCard !== card) resetAudio(otherCard);
    }

    panel.hidden = !shouldOpen;
    toggle.setAttribute('aria-expanded', String(shouldOpen));
    if (label) label.textContent = shouldOpen ? 'Hide narration' : 'Play narration';

    if (shouldOpen) {
      const playPromise = audio.play();
      if (playPromise?.catch) playPromise.catch(() => {});
      return;
    }

    audio.pause();
  }

  cards.forEach((card, index) => {
    const flipTrigger = card.querySelector('.coverflow-card__flip-trigger');
    const closeButton = card.querySelector('[data-action="flip-close"]');
    const audioButton = card.querySelector('[data-action="audio-toggle"]');

    if (flipTrigger) {
      on(flipTrigger, 'click', (event) => {
        event.stopPropagation();
        if (index !== activeIndex) {
          setActive(index);
          return;
        }
        openFlippedCard(index);
      });
    }

    if (closeButton) {
      on(closeButton, 'click', (event) => {
        event.stopPropagation();
        closeFlippedCard(index);
      });
    }

    if (audioButton) {
      on(audioButton, 'click', (event) => {
        event.stopPropagation();
        toggleAudio(card);
      });
    }

    on(card, 'click', (event) => {
      if (event.target.closest('a, button, audio, .coverflow-card__audio-panel')) return;
      if (index !== activeIndex) setActive(index);
    });
  });

  on(prevButton, 'click', () => setActive(activeIndex - 1));
  on(nextButton, 'click', () => setActive(activeIndex + 1));

  on(window, 'keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('input, textarea, select, audio')) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActive(activeIndex - 1);
      return;
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActive(activeIndex + 1);
      return;
    }

    if (event.key === 'Escape' && flippedIndex != null) {
      event.preventDefault();
      closeFlippedCard(flippedIndex);
      return;
    }

    if ((event.key === 'Enter' || event.key === ' ') && flippedIndex == null) {
      const focused = document.activeElement;
      const interactiveFocused =
        focused instanceof HTMLElement && focused.closest('a, button, input, textarea, select, audio');
      if (!interactiveFocused || focused === cards[activeIndex].querySelector('.coverflow-card__flip-trigger')) {
        event.preventDefault();
        openFlippedCard(activeIndex);
      }
    }
  });

  on(viewport, 'pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (event.target.closest('a, button, audio, .coverflow-card__audio-panel')) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  on(viewport, 'pointerup', (event) => {
    if (!pointerStart) return;

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;

    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) < Math.abs(deltaY) * 1.15) return;
    if (deltaX < 0) setActive(activeIndex + 1);
    if (deltaX > 0) setActive(activeIndex - 1);
  });

  on(viewport, 'pointercancel', () => {
    pointerStart = null;
  });

  on(window, 'resize', () => {
    syncLayout();
  });

  syncLayout();

  if (!REDUCED_MOTION) {
    gsap.from(playlistList.querySelectorAll('.coverflow__nav, .coverflow__counter'), {
      y: 18,
      autoAlpha: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power2.out',
      clearProps: 'opacity,transform',
    });
  }

  teardownCoverflow = () => {
    cleanup.forEach((fn) => fn());
    context.revert();
    teardownCoverflow = () => {};
  };
}

function renderState({ eyebrow, title, description, error = false }) {
  teardownCoverflow();
  feedState.hidden = false;
  playlistList.hidden = true;
  feedState.innerHTML = `
    <div class="feed-state__card ${error ? 'feed-state__card--error' : ''}">
      <p class="feed-state__eyebrow">${eyebrow}</p>
      <h2>${title}</h2>
      <p>${description}</p>
    </div>
  `;
}

async function loadFeed() {
  try {
    const response = await fetch(FEED_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Feed request failed with ${response.status}`);

    const payload = await response.json();
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.items)
        ? payload.items
        : null;

    if (!items) throw new Error('Feed payload is malformed');

    if (items.length === 0) {
      renderState({
        eyebrow: 'Empty feed',
        title: 'No public playlists yet.',
        description: 'The feed is wired correctly but contains no public-ready entries.',
      });
      return;
    }

    feedState.hidden = true;
    playlistList.hidden = false;
    renderPlaylists(items);
  } catch (error) {
    renderState({
      eyebrow: 'Feed error',
      title: 'The playlist archive could not be loaded.',
      description:
        'This page expects /data/ai-playlists.json to be present and valid JSON. Export the feed from AIHome and republish the site.',
      error: true,
    });
  }
}

loadFeed();
