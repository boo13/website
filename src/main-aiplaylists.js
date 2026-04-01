import './styles/aiplaylists.css';
import { gsap } from 'gsap';
import { CDN_BASE } from './config.js';

const FEED_URL = '/data/ai-playlists.json';
const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), audio[controls], [tabindex]:not([tabindex="-1"])';

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

const ARROW_RIGHT_ICON = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h12M8 2l5 5-5 5"/></svg>`;
const ARROW_LEFT_ICON = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M13 7H1M6 2 1 7l5 5"/></svg>`;
const CLOSE_ICON = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13"/></svg>`;

const feedState = document.getElementById('feed-state');
const playlistList = document.getElementById('playlist-list');

let teardownShowcase = () => {};

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

function hashCode(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function coverBackground(title) {
  const hash = hashCode(title);
  const hueA = hash % 360;
  const hueB = (hueA + 42 + ((hash >> 3) % 70)) % 360;
  const hueC = (hueA + 204 + ((hash >> 7) % 54)) % 360;
  const angle = 110 + ((hash >> 9) % 60);
  const xA = 18 + ((hash >> 4) % 28);
  const yA = 16 + ((hash >> 6) % 32);
  const xB = 60 + ((hash >> 10) % 18);
  const yB = 46 + ((hash >> 12) % 20);

  return [
    `radial-gradient(circle at ${xA}% ${yA}%, oklch(0.78 0.17 ${hueA} / 0.92), transparent 30%)`,
    `radial-gradient(circle at ${xB}% ${yB}%, oklch(0.62 0.16 ${hueB} / 0.82), transparent 38%)`,
    `linear-gradient(${angle}deg, oklch(0.18 0.03 ${hueC}) 0%, oklch(0.08 0.015 ${hueA}) 100%)`,
  ].join(', ');
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

function trackSearchUrl(track) {
  const query = [track.artist, track.title].filter(Boolean).join(' ');
  return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
}

function buildTrackMarkup(item) {
  const tracks = getTracks(item);
  const hasFullTracklist = Array.isArray(item.tracks) && item.tracks.length > 0;
  const heading = hasFullTracklist ? 'Tracklist' : 'Track preview';

  if (!tracks.length) {
    return `
      <section class="playlist-modal__track-panel">
        <div class="playlist-modal__track-head">
          <p>${heading}</p>
          <span>${escHtml(String(item.track_count || 0))} total</span>
        </div>
        <p class="playlist-modal__track-empty">Track data is not available for this playlist yet.</p>
      </section>
    `;
  }

  const items = tracks
    .map((track, index) => {
      const artist = escHtml(track.artist || 'Unknown artist');
      const title = escHtml(track.title || 'Unknown track');

      return `
        <li>
          <span class="playlist-modal__track-index">${String(index + 1).padStart(2, '0')}</span>
          <div class="playlist-modal__track-copy">
            <a href="${escHtml(trackSearchUrl(track))}" target="_blank" rel="noopener">${title}</a>
            <span>${artist}</span>
          </div>
        </li>
      `;
    })
    .join('');

  return `
    <section class="playlist-modal__track-panel">
      <div class="playlist-modal__track-head">
        <p>${heading}</p>
        <span>${escHtml(String(item.track_count || tracks.length))} total</span>
      </div>
      <ol class="playlist-modal__tracklist">${items}</ol>
    </section>
  `;
}

function createPlaylistCard(item, index) {
  const cleanTitle = stripSourcePrefix(item.title);
  const coverStyle = coverBackground(item.title || cleanTitle || `playlist-${index}`);
  const coverSrc = resolveAssetPath(item.cover_image);
  const coverVideoSrc = resolveAssetPath(item.cover_video_url);
  const meta = [labelForKind(item.playlist_kind), labelForSource(item.source)]
    .filter(Boolean)
    .join(' / ');
  const trackCount = `${escHtml(String(item.track_count || 0))} tracks`;

  return `
    <article class="coverflow-card" data-index="${index}" aria-hidden="true">
      <button
        class="coverflow-card__button"
        type="button"
        aria-label="Focus ${escHtml(cleanTitle)}"
      >
        <span class="coverflow-card__vinyl" aria-hidden="true"></span>
        <span class="coverflow-card__cover" style="background:${coverStyle}">
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
          <span class="coverflow-card__noise" aria-hidden="true"></span>
          <span class="coverflow-card__copy">
            <span class="coverflow-card__kicker">${escHtml(meta)}</span>
            <strong class="coverflow-card__title">${escHtml(cleanTitle)}</strong>
            <span class="coverflow-card__meta">
              <span>${trackCount}</span>
              <span>${escHtml(formatDate(item.created_at))}</span>
            </span>
          </span>
        </span>
      </button>
    </article>
  `;
}

function createModalRoot() {
  const modal = document.createElement('div');
  modal.className = 'playlist-modal';
  modal.hidden = true;
  modal.innerHTML = `
    <div class="playlist-modal__backdrop" data-modal-close></div>
    <div
      class="playlist-modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="playlist-modal-title"
      tabindex="-1"
    >
      <button class="playlist-modal__close" type="button" aria-label="Close playlist details" data-modal-close>
        ${CLOSE_ICON}
      </button>
      <div class="playlist-modal__body"></div>
    </div>
  `;
  document.body.appendChild(modal);
  return modal;
}

function createModalController() {
  const root = createModalRoot();
  const dialog = root.querySelector('.playlist-modal__dialog');
  const body = root.querySelector('.playlist-modal__body');
  const closeButton = root.querySelector('.playlist-modal__close');
  let lastFocusedElement = null;

  function resetAudio() {
    for (const audio of root.querySelectorAll('audio')) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  function trapFocus(event) {
    if (event.key !== 'Tab') return;

    const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
      (element) => !element.hasAttribute('disabled'),
    );

    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function close() {
    if (root.hidden) return;

    resetAudio();
    document.body.classList.remove('playlist-modal-open');
    root.classList.remove('is-open');
    root.hidden = true;
    body.innerHTML = '';
    window.removeEventListener('keydown', onKeydown);

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus({ preventScroll: true });
    }
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    trapFocus(event);
  }

  function open(item, trigger) {
    lastFocusedElement = trigger instanceof HTMLElement ? trigger : document.activeElement;

    const cleanTitle = stripSourcePrefix(item.title);
    const coverSrc = resolveAssetPath(item.cover_image);
    const coverVideoSrc = resolveAssetPath(item.cover_video_url);
    const audioSrc = resolveAssetPath(item.audio_intro_url);
    const hasPlaylistUrl =
      typeof item.playlist_url === 'string' && item.playlist_url.startsWith('https://');

    body.innerHTML = `
      <div class="playlist-modal__hero">
        <div class="playlist-modal__art-shell">
          <div class="playlist-modal__art" style="background:${coverBackground(item.title || cleanTitle)}">
            ${
              coverVideoSrc
                ? `<video class="playlist-modal__cover-video" src="${escHtml(coverVideoSrc)}" ${coverSrc ? `poster="${escHtml(coverSrc)}"` : ''} autoplay muted loop playsinline preload="metadata" crossorigin></video>`
                : ''
            }
            ${
              coverSrc
                ? `<img class="playlist-modal__cover-image" src="${escHtml(coverSrc)}" alt="" loading="lazy" decoding="async" width="960" height="960">`
                : ''
            }
            <span class="playlist-modal__art-noise" aria-hidden="true"></span>
          </div>
        </div>

        <div class="playlist-modal__summary">
          <p class="playlist-modal__eyebrow">${escHtml(labelForKind(item.playlist_kind))} / ${escHtml(labelForSource(item.source))}</p>
          <h2 id="playlist-modal-title">${escHtml(cleanTitle)}</h2>
          <p class="playlist-modal__meta">${escHtml(formatDate(item.created_at))}${item.genre ? ` / ${escHtml(item.genre)}` : ''} / ${escHtml(String(item.track_count || getTracks(item).length || 0))} tracks</p>
          <p class="playlist-modal__description">${escHtml(item.description || 'No description yet.')}</p>

          ${
            item.quote
              ? `<blockquote class="playlist-modal__quote">
                  <p>${escHtml(item.quote)}</p>
                  ${item.quote_source ? `<footer>${escHtml(item.quote_source)}</footer>` : ''}
                </blockquote>`
              : ''
          }

          <div class="playlist-modal__actions">
            ${
              hasPlaylistUrl
                ? `<a class="playlist-modal__action playlist-modal__action--primary" href="${escHtml(item.playlist_url)}" target="_blank" rel="noopener">Open in YouTube Music ${ARROW_RIGHT_ICON}</a>`
                : ''
            }
            ${
              audioSrc
                ? `<a class="playlist-modal__action" href="${escHtml(audioSrc)}" target="_blank" rel="noopener">Open narration audio ${ARROW_RIGHT_ICON}</a>`
                : ''
            }
          </div>
        </div>
      </div>

      <div class="playlist-modal__details">
        ${
          audioSrc
            ? `<section class="playlist-modal__panel">
                <div class="playlist-modal__panel-head">
                  <p>Narration</p>
                </div>
                <audio controls preload="none" src="${escHtml(audioSrc)}"></audio>
                ${
                  item.narration_text
                    ? `<p class="playlist-modal__liner-notes">${escHtml(item.narration_text)}</p>`
                    : '<p class="playlist-modal__liner-notes">Narration audio is available for this playlist, but no transcript text was published.</p>'
                }
              </section>`
            : ''
        }

        <section class="playlist-modal__panel">
          ${buildTrackMarkup(item)}
        </section>
      </div>
    `;

    for (const media of body.querySelectorAll('.playlist-modal__cover-image, .playlist-modal__cover-video')) {
      media.addEventListener(
        'error',
        () => {
          media.remove();
        },
        { once: true },
      );
    }

    root.hidden = false;
    document.body.classList.add('playlist-modal-open');
    root.classList.add('is-open');
    window.addEventListener('keydown', onKeydown);

    if (closeButton instanceof HTMLElement) {
      closeButton.focus({ preventScroll: true });
      window.setTimeout(() => {
        closeButton.focus({ preventScroll: true });
      }, 0);
    } else {
      dialog.focus({ preventScroll: true });
      window.setTimeout(() => {
        dialog.focus({ preventScroll: true });
      }, 0);
    }

    if (!REDUCED_MOTION) {
      gsap.fromTo(
        dialog,
        { autoAlpha: 0, y: 32, scale: 0.98 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.28, ease: 'power2.out', clearProps: 'opacity,transform' },
      );
      gsap.fromTo(
        root.querySelector('.playlist-modal__backdrop'),
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.24, ease: 'power1.out', clearProps: 'opacity' },
      );
    }
  }

  root.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.closest('[data-modal-close]')) {
      close();
    }
  });

  return {
    open,
    close,
    destroy() {
      close();
      root.remove();
    },
  };
}

function renderShowcase(items) {
  teardownShowcase();

  playlistList.innerHTML = `
    <section class="coverflow" aria-label="AI playlist cover flow">
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

      <div class="coverflow__caption">
        <h3 id="coverflow-title" class="coverflow__caption-title"></h3>
        <p id="coverflow-counter" class="coverflow__counter"></p>
        <p class="coverflow__hint">Click the centered cover to open the playlist dossier.</p>
      </div>
    </section>
  `;

  for (const media of playlistList.querySelectorAll('.coverflow-card__cover-image, .coverflow-card__cover-video')) {
    media.addEventListener(
      'error',
      () => {
        media.remove();
      },
      { once: true },
    );
  }

  mountShowcase(items);
}

function mountShowcase(items) {
  const cards = Array.from(playlistList.querySelectorAll('.coverflow-card'));
  const viewport = playlistList.querySelector('.coverflow__viewport');
  const prevButton = playlistList.querySelector('.coverflow__nav--prev');
  const nextButton = playlistList.querySelector('.coverflow__nav--next');
  const title = playlistList.querySelector('#coverflow-title');
  const counter = playlistList.querySelector('#coverflow-counter');

  if (!cards.length || !viewport || !prevButton || !nextButton || !title || !counter) {
    return;
  }

  const modal = createModalController();
  const cleanup = [];
  let activeIndex = Math.floor(Math.max(0, items.length - 1) / 2);
  let pointerStart = null;
  let wheelLock = false;

  const context = gsap.context(() => {
    gsap.set(cards, {
      position: 'absolute',
      top: '50%',
      left: '50%',
      xPercent: -50,
      yPercent: -50,
      transformStyle: 'preserve-3d',
      transformPerspective: 2200,
    });
  }, playlistList);

  function on(target, eventName, handler, options) {
    target.addEventListener(eventName, handler, options);
    cleanup.push(() => target.removeEventListener(eventName, handler, options));
  }

  function currentItem() {
    return items[activeIndex];
  }

  function updateCaption() {
    const item = currentItem();
    title.textContent = stripSourcePrefix(item.title);
    counter.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
    prevButton.disabled = activeIndex === 0;
    nextButton.disabled = activeIndex === items.length - 1;
  }

  function layoutCard(card, offset) {
    const absOffset = Math.abs(offset);
    const isMobile = window.innerWidth <= 720;
    const nearSpread = isMobile
      ? Math.min(viewport.clientWidth * 0.54, 170)
      : Math.min(viewport.clientWidth * 0.34, 260);
    const farSpread = isMobile
      ? Math.min(viewport.clientWidth * 0.8, 260)
      : Math.min(viewport.clientWidth * 0.56, 430);

    const config =
      absOffset === 0
        ? {
            x: 0,
            y: 0,
            z: 260,
            scale: 1,
            rotateY: 0,
            rotateZ: 0,
            opacity: 1,
          }
        : absOffset === 1
          ? {
              x: offset * nearSpread,
              y: isMobile ? 20 : 8,
              z: -30,
              scale: isMobile ? 0.74 : 0.78,
              rotateY: offset < 0 ? 64 : -64,
              rotateZ: offset < 0 ? -2.5 : 2.5,
              opacity: 0.92,
            }
          : absOffset === 2
            ? {
                x: offset * farSpread,
                y: isMobile ? 28 : 16,
                z: -210,
                scale: isMobile ? 0.5 : 0.56,
                rotateY: offset < 0 ? 76 : -76,
                rotateZ: offset < 0 ? -3.5 : 3.5,
                opacity: 0.34,
              }
            : {
                x: offset * farSpread * 1.08,
                y: 34,
                z: -460,
                scale: 0.42,
                rotateY: offset < 0 ? 82 : -82,
                rotateZ: 0,
                opacity: 0,
              };

    card.classList.toggle('is-active', absOffset === 0);
    card.classList.toggle('is-near', absOffset <= 1);
    card.setAttribute('aria-hidden', absOffset === 0 ? 'false' : 'true');
    card.style.zIndex = String(100 - absOffset);

    const button = card.querySelector('.coverflow-card__button');
    if (button) {
      button.tabIndex = absOffset === 0 ? 0 : -1;
      button.setAttribute(
        'aria-label',
        absOffset === 0
          ? `Open ${stripSourcePrefix(items[Number(card.dataset.index)].title)}`
          : `Focus ${stripSourcePrefix(items[Number(card.dataset.index)].title)}`,
      );
    }

    gsap.to(card, {
      x: config.x,
      y: config.y,
      z: config.z,
      scale: config.scale,
      rotationY: config.rotateY,
      rotationZ: config.rotateZ,
      autoAlpha: config.opacity,
      duration: REDUCED_MOTION ? 0 : 0.68,
      ease: 'power3.out',
      overwrite: true,
    });
  }

  function syncLayout() {
    cards.forEach((card, index) => {
      layoutCard(card, index - activeIndex);
    });
    updateCaption();
  }

  function setActive(nextIndex) {
    const bounded = Math.max(0, Math.min(items.length - 1, nextIndex));
    if (bounded === activeIndex) return;
    activeIndex = bounded;
    syncLayout();
  }

  function openActive(trigger) {
    modal.open(currentItem(), trigger);
  }

  cards.forEach((card, index) => {
    const button = card.querySelector('.coverflow-card__button');
    if (!button) return;

    on(button, 'click', () => {
      if (index !== activeIndex) {
        setActive(index);
        return;
      }

      openActive(button);
    });
  });

  on(prevButton, 'click', () => setActive(activeIndex - 1));
  on(nextButton, 'click', () => setActive(activeIndex + 1));

  on(window, 'keydown', (event) => {
    const target = event.target;
    if (target instanceof HTMLElement && target.closest('.playlist-modal, input, textarea, select, audio')) {
      return;
    }

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

    if (event.key === 'Enter' || event.key === ' ') {
      const activeCardButton = cards[activeIndex]?.querySelector('.coverflow-card__button');
      if (document.activeElement === activeCardButton) {
        event.preventDefault();
        openActive(document.activeElement);
      }
    }
  });

  on(viewport, 'pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointerStart = { x: event.clientX, y: event.clientY };
  });

  on(viewport, 'pointerup', (event) => {
    if (!pointerStart) return;

    const deltaX = event.clientX - pointerStart.x;
    const deltaY = event.clientY - pointerStart.y;
    pointerStart = null;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY) * 1.1) return;
    if (deltaX < 0) setActive(activeIndex + 1);
    if (deltaX > 0) setActive(activeIndex - 1);
  });

  on(viewport, 'pointercancel', () => {
    pointerStart = null;
  });

  on(viewport, 'wheel', (event) => {
    if (wheelLock) return;

    const horizontalIntent = Math.abs(event.deltaX) > Math.abs(event.deltaY) || event.shiftKey;
    if (!horizontalIntent) return;

    event.preventDefault();
    wheelLock = true;
    window.setTimeout(() => {
      wheelLock = false;
    }, 220);

    if (event.deltaX > 8 || event.deltaY > 8) setActive(activeIndex + 1);
    if (event.deltaX < -8 || event.deltaY < -8) setActive(activeIndex - 1);
  }, { passive: false });

  on(window, 'resize', syncLayout);

  syncLayout();

  if (!REDUCED_MOTION) {
    gsap.from(playlistList.querySelectorAll('.coverflow__caption > *, .coverflow__nav'), {
      y: 18,
      autoAlpha: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power2.out',
      clearProps: 'opacity,transform',
    });
  }

  teardownShowcase = () => {
    cleanup.forEach((fn) => fn());
    modal.destroy();
    context.revert();
    teardownShowcase = () => {};
  };
}

function renderState({ eyebrow, title, description, error = false }) {
  teardownShowcase();
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
    renderShowcase(items);
  } catch {
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
