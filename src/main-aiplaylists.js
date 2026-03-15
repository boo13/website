import './styles/aiplaylists.css';

const FEED_URL = '/data/ai-playlists.json';

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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

const feedCount = document.getElementById('feed-count');
const feedStatus = document.getElementById('feed-status');
const feedUpdated = document.getElementById('feed-updated');
const feedState = document.getElementById('feed-state');
const playlistList = document.getElementById('playlist-list');

/* ─── Formatting ─────────────────────────────────────────── */

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

/* ─── Generative cover art ───────────────────────────────── */

function hashCode(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function coverBackground(title) {
  const h = hashCode(title);

  // Derive unique parameters from hash
  const h1 = h % 360;
  const h2 = (h1 + 30 + ((h >> 6) % 60)) % 360;
  const h3 = (h1 + 150 + ((h >> 12) % 80)) % 360;
  const x1 = 15 + ((h >> 3) % 40);
  const y1 = 10 + ((h >> 5) % 35);
  const x2 = 50 + ((h >> 8) % 38);
  const y2 = 48 + ((h >> 10) % 38);
  const x3 = 60 + ((h >> 14) % 30);
  const y3 = 12 + ((h >> 16) % 28);
  const angle = (h >> 18) % 180;

  return [
    `radial-gradient(ellipse at ${x1}% ${y1}%, oklch(0.65 0.22 ${h1}) 0%, transparent 45%)`,
    `radial-gradient(ellipse at ${x2}% ${y2}%, oklch(0.50 0.18 ${h2}) 0%, transparent 40%)`,
    `radial-gradient(circle at ${x3}% ${y3}%, oklch(0.55 0.16 ${h3} / 0.7) 0%, transparent 38%)`,
    `conic-gradient(from ${angle}deg at 50% 50%, oklch(0.30 0.10 ${h3} / 0.5) 0deg, transparent 80deg, oklch(0.25 0.08 ${h1} / 0.4) 160deg, transparent 240deg, oklch(0.28 0.09 ${h2} / 0.3) 360deg)`,
    `linear-gradient(${angle + 30}deg, oklch(0.18 0.04 ${h1}) 0%, oklch(0.08 0.025 ${h3}) 100%)`,
  ].join(', ');
}

/* ─── SVG icons ──────────────────────────────────────────── */

const PLAY_ICON = `<svg viewBox="0 0 48 48" fill="none"><circle cx="24" cy="24" r="23" stroke="rgba(255,255,255,0.9)" stroke-width="1.5"/><path d="M19 15.5L33 24L19 32.5V15.5Z" fill="rgba(255,255,255,0.95)"/></svg>`;

const ARROW_ICON = `<svg viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 7h12M8 2l5 5-5 5"/></svg>`;

/* ─── Track preview ──────────────────────────────────────── */

function createTrackPreview(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return '';

  const items = tracks
    .slice(0, 3)
    .map((t) => {
      const artist = escHtml(t.artist || 'Unknown');
      const title = escHtml(t.title || 'Untitled');
      return `<li><span class="track-artist">${artist}</span> ${title}</li>`;
    })
    .join('');

  return `<div class="playlist-card__tracks"><ul>${items}</ul></div>`;
}

/* ─── Card rendering ─────────────────────────────────────── */

function renderPlaylists(items) {
  playlistList.innerHTML = items
    .map(
      (item, index) => {
        const sourceKey = escHtml(item.source || '');
        const hasUrl =
          typeof item.playlist_url === 'string' && item.playlist_url.startsWith('https://');
        const coverStyle = coverBackground(item.title);

        return `
        <article class="playlist-card" style="--card-delay:${index * 80}ms">
          <div class="playlist-card__cover">
            <div class="playlist-card__cover-art" style="background: ${coverStyle}"></div>
            <span class="playlist-card__cover-badge">${escHtml(item.track_count)} tracks</span>
            ${
              hasUrl
                ? `<a class="playlist-card__cover-play" href="${escHtml(item.playlist_url)}" target="_blank" rel="noopener" aria-label="Open ${escHtml(item.title)} in YouTube Music">${PLAY_ICON}</a>`
                : `<span class="playlist-card__cover-play">${PLAY_ICON}</span>`
            }
          </div>

          <div class="playlist-card__content">
            <div class="playlist-card__tags">
              <span class="playlist-card__tag playlist-card__tag--kind">${labelForKind(item.playlist_kind)}</span>
              <span class="playlist-card__tag playlist-card__tag--source playlist-card__tag--${sourceKey}">${labelForSource(item.source)}</span>
            </div>

            <h2>${escHtml(item.title)}</h2>

            <div class="playlist-card__meta">
              <span>${formatDate(item.created_at)}</span>
              ${item.genre ? `<span class="playlist-card__genre">${escHtml(item.genre)}</span>` : ''}
            </div>

            <p class="playlist-card__description">${escHtml(item.description)}</p>

            ${
              item.quote
                ? `<blockquote class="playlist-card__quote">
                    <p>${escHtml(item.quote)}</p>
                    ${item.quote_source ? `<footer>${escHtml(item.quote_source)}</footer>` : ''}
                  </blockquote>`
                : ''
            }

            ${createTrackPreview(item.tracks_preview)}

            ${
              hasUrl
                ? `<a class="playlist-card__cta" href="${escHtml(item.playlist_url)}" target="_blank" rel="noopener">Open in YouTube Music ${ARROW_ICON}</a>`
                : ''
            }
          </div>
        </article>
      `;
      },
    )
    .join('');

  // Staggered entrance
  requestAnimationFrame(() => {
    const cards = playlistList.querySelectorAll('.playlist-card');
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -40px 0px', threshold: 0.1 },
    );
    for (const card of cards) observer.observe(card);
  });
}

/* ─── Feed state ─────────────────────────────────────────── */

function renderState({ eyebrow, title, description, error = false }) {
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

/* ─── Load feed ──────────────────────────────────────────── */

async function loadFeed() {
  try {
    const response = await fetch(FEED_URL, { headers: { Accept: 'application/json' } });
    if (!response.ok) {
      throw new Error(`Feed request failed with ${response.status}`);
    }

    const payload = await response.json();
    const items = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.items)
        ? payload.items
        : null;

    if (!items) {
      throw new Error('Feed payload is malformed');
    }

    feedCount.textContent = String(items.length);
    feedStatus.textContent = items.length > 0 ? 'Live' : 'Empty';
    feedUpdated.textContent = payload.generated_at
      ? `Updated ${formatDate(payload.generated_at)}`
      : '';

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
    feedCount.textContent = '—';
    feedStatus.textContent = 'Error';
    feedUpdated.textContent = error instanceof Error ? error.message : 'Feed request failed';
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
