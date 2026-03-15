import './styles/aiplaylists.css';

const FEED_URL = '/data/ai-playlists.json';

function escHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const SOURCE_LABELS = {
  nlm: 'NotebookLM',
  codex_fallback: 'Codex fallback',
  codex: 'Codex',
  sonnet: 'Claude Sonnet',
  opus: 'Claude Opus',
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

function formatDate(value) {
  if (!value) return 'Unknown date';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsed);
}

function labelForSource(source) {
  return SOURCE_LABELS[source] || escHtml(source) || 'Unknown source';
}

function labelForKind(kind) {
  return KIND_LABELS[kind] || escHtml(kind) || 'Playlist';
}

function createTrackPreview(tracks) {
  if (!Array.isArray(tracks) || tracks.length === 0) return '';

  const items = tracks
    .slice(0, 3)
    .map((track) => {
      const artist = escHtml(track.artist || 'Unknown artist');
      const title = escHtml(track.title || 'Untitled track');
      return `<li>${artist} <span>•</span> ${title}</li>`;
    })
    .join('');

  return `
    <div class="playlist-card__tracks">
      <p class="playlist-card__tracks-label">Preview</p>
      <ul>${items}</ul>
    </div>
  `;
}

function renderPlaylists(items) {
  playlistList.innerHTML = items
    .map(
      (item, index) => `
        <article class="playlist-card" style="--card-delay:${index * 70}ms">
          <div class="playlist-card__header">
            <div class="playlist-card__eyebrow-row">
              <span class="playlist-card__eyebrow">${labelForKind(item.playlist_kind)}</span>
              <span class="playlist-card__source">${labelForSource(item.source)}</span>
            </div>
            <h2>${escHtml(item.title)}</h2>
            <p class="playlist-card__date">${escHtml(formatDate(item.created_at))}</p>
          </div>

          <div class="playlist-card__body">
            ${
              item.genre
                ? `<p class="playlist-card__genre"><span>Genre</span>${escHtml(item.genre)}</p>`
                : ''
            }
            <p class="playlist-card__description">${escHtml(item.description)}</p>
            ${
              item.quote
                ? `
                  <blockquote class="playlist-card__quote">
                    <p>${escHtml(item.quote)}</p>
                    ${
                      item.quote_source
                        ? `<footer>${escHtml(item.quote_source)}</footer>`
                        : ''
                    }
                  </blockquote>
                `
                : ''
            }
            ${createTrackPreview(item.tracks_preview)}
          </div>

          <div class="playlist-card__footer">
            <p class="playlist-card__count">${escHtml(item.track_count)} tracks</p>
            ${
              typeof item.playlist_url === 'string' && item.playlist_url.startsWith('https://')
                ? `<a class="playlist-card__cta" href="${escHtml(item.playlist_url)}" target="_blank" rel="noopener">Open in YouTube Music</a>`
                : `<span class="playlist-card__cta">Open in YouTube Music</span>`
            }
          </div>
        </article>
      `
    )
    .join('');

  requestAnimationFrame(() => {
    for (const card of playlistList.querySelectorAll('.playlist-card')) {
      card.classList.add('is-visible');
    }
  });
}

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
    feedStatus.textContent = items.length > 0 ? 'Ready' : 'Empty';
    feedUpdated.textContent = payload.generated_at
      ? `Updated ${formatDate(payload.generated_at)}`
      : 'Feed timestamp unavailable';

    if (items.length === 0) {
      renderState({
        eyebrow: 'Empty feed',
        title: 'No public playlists yet.',
        description: 'The page is wired correctly, but the exported feed does not contain any public-ready playlist rows yet.',
      });
      return;
    }

    feedState.hidden = true;
    playlistList.hidden = false;
    renderPlaylists(items);
  } catch (error) {
    feedCount.textContent = '0';
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
