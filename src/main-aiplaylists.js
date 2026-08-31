import './styles/aiplaylists.css';
import { gsap } from 'gsap';
import { CDN_BASE } from './config.js';

const FEED_URL = '/data/ai-playlists.json';
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const hoverPreference = window.matchMedia('(hover: hover) and (pointer: fine)');
const sourceLabels = {
  nlm: 'NotebookLM',
  notebooklm: 'NotebookLM',
  codex_fallback: 'Codex',
  codex: 'Codex',
  sonnet: 'Claude',
  opus: 'Claude',
  gemini: 'Gemini',
};
const arrowRight =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 10h14m-6-6 6 6-6 6"/></svg>';
const arrowLeft =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M17 10H3m6-6-6 6 6 6"/></svg>';
const arrowUp =
  '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 15 15 5M5 5h10v10"/></svg>';
const list = document.getElementById('playlist-list');
const feature = document.getElementById('featured-playlist');
const feedState = document.getElementById('feed-state');
const dialog = document.getElementById('playlist-dialog');
const dialogContent = document.getElementById('dialog-content');
const search = document.getElementById('playlist-search');
const sort = document.getElementById('playlist-sort');
const shuffle = document.getElementById('shuffle-playlist');
const events = new AbortController();
const motion = gsap.context(() => {}, document.body);
let records = [];
let visibleRecords = [];
let selectedFilter = 'all';
let featureIndex = 0;
let lastTrigger = null;
let lastRandomIndex = -1;
let dialogTween;
let entrancePlayed = false;
let loading = false;

function escapeHtml(value) {
  return String(value ?? '').replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character]
  );
}

function cleanTitle(value) {
  return String(value || 'Untitled selection')
    .replace(/^(?:Daily|NotebookLM|NLM|Codex|Sonnet|Opus|Gemini):\s*/i, '')
    .replace(/^\d{4}-\d{2}-\d{2}\s*/, '')
    .replace(/\s*[:—–-]?\s*\d{4}-\d{2}-\d{2}$/, '')
    .trim();
}

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Undated'
    : new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date);
}

function getTracks(item) {
  const tracks = item.tracks?.length ? item.tracks : item.tracks_preview;
  return Array.isArray(tracks)
    ? tracks.filter((track) => track && typeof track === 'object')
    : [];
}

function resolveAsset(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const path = value.trim();
  if (path.startsWith('//')) return null;
  if (path.startsWith('/')) return path;
  if (/^https?:\/\//i.test(path)) return path;
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return null;
  return `${CDN_BASE}/${path}`;
}

function playlistUrl(item) {
  try {
    const url = new URL(item.playlist_url);
    if (
      !['music.youtube.com', 'www.youtube.com', 'youtube.com'].includes(
        url.hostname
      )
    )
      return null;
    const id = url.searchParams.get('list');
    return id
      ? `https://music.youtube.com/playlist?list=${encodeURIComponent(id)}`
      : null;
  } catch {
    return null;
  }
}

function trackUrl(track) {
  if (/^[\w-]{11}$/.test(track.video_id || '')) {
    return `https://music.youtube.com/watch?v=${encodeURIComponent(track.video_id)}`;
  }
  return `https://music.youtube.com/search?q=${encodeURIComponent([track.artist, track.title].filter(Boolean).join(' '))}`;
}

function getCategories(item) {
  const text =
    `${item.genre || ''} ${item.title} ${item.description || ''}`.toLowerCase();
  const categories = [];
  if (
    /electronic|techno|\bidm\b|rave|dance|disco|drum and bass|balearic|synth|ambient|drone/.test(
      text
    )
  )
    categories.push('electronic');
  if (/jazz|soul|blues|funk|lovers rock/.test(text)) categories.push('jazz');
  if (/punk|rock|metal|guitar|sludge|blackgaze|cowpunk|hardcore/.test(text))
    categories.push('guitars');
  if (
    /experimental|zolo|zeuhl|hauntology|shibuya|left.field|rothko|avant|no.wave/.test(
      text
    ) ||
    !categories.length
  )
    categories.push('leftfield');
  return categories;
}

function recordNumber(item) {
  return String(records.length - item.index).padStart(3, '0');
}

function artMarkup(item, { eager = false } = {}) {
  const image = resolveAsset(item.cover_image);
  const video = resolveAsset(item.cover_video_url);
  return `<span class="cover-art" ${video ? `data-video="${escapeHtml(video)}"` : ''}>
    ${image ? `<img src="${escapeHtml(image)}" alt="" width="768" height="768" loading="${eager ? 'eager' : 'lazy'}" ${eager ? 'fetchpriority="high"' : ''} decoding="async" />` : ''}
    <span class="cover-art__top mono" aria-hidden="true"><span>AI—${recordNumber(item)}</span><span>A listening experiment</span></span>
    <span class="cover-art__bottom" aria-hidden="true"><span class="cover-art__rule"></span><strong class="cover-art__title">${escapeHtml(item.name)}</strong></span>
    <span class="cover-art__open" aria-hidden="true">${arrowUp}</span>
  </span>`;
}

function handleImageErrors(root) {
  root.querySelectorAll('.cover-art img').forEach((image) => {
    image.addEventListener('error', () => image.remove(), {
      once: true,
      signal: events.signal,
    });
    if (image.complete && !image.naturalWidth) image.remove();
  });
}

function stopPreviews(root = document) {
  root.querySelectorAll('.cover-art video').forEach((video) => {
    video.pause();
    video.classList.remove('is-playing');
  });
}

function startPreview(button) {
  if (motionPreference.matches || !hoverPreference.matches || document.hidden)
    return;
  const art = button.querySelector('[data-video]');
  if (!art) return;
  let video = art.querySelector('video');
  if (!video) {
    video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.preload = 'none';
    video.setAttribute('aria-hidden', 'true');
    video.addEventListener('error', () => video.remove(), {
      once: true,
      signal: events.signal,
    });
    video.src = art.dataset.video;
    art.append(video);
  }
  const currentVideo = video;
  video
    .play()
    .then(() => {
      if (
        !button.matches(':hover') ||
        motionPreference.matches ||
        document.hidden ||
        dialog.open
      ) {
        currentVideo.pause();
        return;
      }
      currentVideo.classList.add('is-playing');
    })
    .catch(() => {});
}

function renderFeature({ animate = false, focusControl } = {}) {
  const item = records[featureIndex];
  stopPreviews(feature);
  feature.innerHTML = `<div class="feature__topline mono"><span class="feature__tag"><span class="signal-dot"></span>${featureIndex === 0 ? 'Fresh from the collection' : 'From the collection'}</span><span class="feature__edition">Selection ${recordNumber(item)}</span></div>
    <div class="feature__sleeve"><span class="feature__vinyl" aria-hidden="true"></span><button class="feature__cover" type="button" data-open="${item.index}" aria-label="Explore ${escapeHtml(item.name)}">${artMarkup(item, { eager: true })}</button></div>
    <div class="feature__caption"><div><h2>${escapeHtml(item.name)}</h2><p class="mono">${escapeHtml(item.genre || 'An unexpected selection')} / ${item.count} tracks</p></div><div class="feature__controls"><button class="icon-button" type="button" data-feature-step="-1" aria-label="Previous featured playlist" ${records.length < 2 ? 'disabled' : ''}>${arrowLeft}</button><button class="icon-button" type="button" data-feature-step="1" aria-label="Next featured playlist" ${records.length < 2 ? 'disabled' : ''}>${arrowRight}</button></div></div>`;
  feature.setAttribute('aria-busy', 'false');
  handleImageErrors(feature);
  if (animate && !motionPreference.matches) {
    motion.add(() => {
      gsap.fromTo(
        feature.querySelector('.feature__sleeve'),
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.5,
          ease: 'expo.out',
          clearProps: 'all',
        }
      );
    });
  }
  if (focusControl)
    feature
      .querySelector(`[data-feature-step="${focusControl}"]`)
      ?.focus({ preventScroll: true });
}

function cardMarkup(item) {
  return `<article class="record-card"><button class="record-card__button" type="button" data-open="${item.index}" aria-label="Explore ${escapeHtml(item.name)}, ${item.count} tracks">
    ${artMarkup(item)}
    <span class="record-card__meta mono"><span class="record-card__genre">${escapeHtml(item.genre || 'Free association')}</span><span class="record-card__count">${item.count} tracks</span></span>
    <span class="record-card__title">${escapeHtml(item.name)}</span>
    <span class="record-card__date mono">${escapeHtml(formatDate(item.created_at))}${item.audio_intro_url ? ' <span>· Narrated</span>' : ''}</span>
  </button></article>`;
}

function renderCollection() {
  const query = search.value.trim().toLowerCase();
  visibleRecords = records.filter(
    (item) =>
      (selectedFilter === 'all' || item.categories.includes(selectedFilter)) &&
      item.searchText.includes(query)
  );
  visibleRecords.sort((a, b) => {
    if (sort.value === 'title') return a.name.localeCompare(b.name);
    return sort.value === 'oldest'
      ? a.timestamp - b.timestamp
      : b.timestamp - a.timestamp;
  });
  stopPreviews(list);
  list.innerHTML = visibleRecords.map(cardMarkup).join('');
  list.hidden = visibleRecords.length === 0;
  document.getElementById('empty-results').hidden = visibleRecords.length > 0;
  document.getElementById('collection-end').hidden =
    visibleRecords.length === 0;
  document.getElementById('results-count').textContent =
    `${String(visibleRecords.length).padStart(2, '0')} of ${records.length} records`;
  shuffle.disabled = visibleRecords.length === 0;
  document.querySelectorAll('[data-filter]').forEach((button) => {
    const active = button.dataset.filter === selectedFilter;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  handleImageErrors(list);
}

function trackMarkup(item) {
  const tracks = getTracks(item);
  return `<section class="track-panel"><h3 class="panel-title mono">${Array.isArray(item.tracks) && item.tracks.length ? 'The tracklist' : 'Track preview'}<span>${tracks.length} / ${item.count}</span></h3>
    ${tracks.length ? `<ol class="track-list">${tracks.map((track, index) => `<li><a href="${escapeHtml(trackUrl(track))}" target="_blank" rel="noopener noreferrer"><span class="track-list__number mono">${String(index + 1).padStart(2, '0')}</span><span><strong>${escapeHtml(track.title || 'Untitled track')}</strong><span class="track-list__artist">${escapeHtml(track.artist || 'Unknown artist')}</span></span><span class="track-list__arrow" aria-hidden="true">↗</span></a></li>`).join('')}</ol>` : '<p class="track-panel__empty">The tracklist hasn’t made it into the archive yet. Open the playlist on YouTube Music to explore it.</p>'}
  </section>`;
}

function openPlaylist(item, trigger) {
  if (!item || dialog.open) return;
  lastTrigger =
    trigger instanceof HTMLElement ? trigger : document.activeElement;
  stopPreviews();
  const url = playlistUrl(item);
  const audio = resolveAsset(item.audio_intro_url);
  const source = sourceLabels[item.source] || item.source || 'AI';
  dialogContent.className = 'dialog-content';
  dialogContent.innerHTML = `<div class="dialog-hero">${artMarkup(item, { eager: true })}<div class="dialog-summary"><p class="eyebrow">Selection ${recordNumber(item)} / Curated with ${escapeHtml(source)}</p><h2 id="dialog-title">${escapeHtml(item.name)}</h2><p class="dialog-summary__meta mono">${escapeHtml(item.genre || 'Free association')} · ${item.count} tracks · ${escapeHtml(formatDate(item.created_at))}</p><p class="dialog-description">${escapeHtml(item.description || 'An unexpected way into the music. Explore the tracklist and follow your ears.')}</p><div class="dialog-actions">${url ? `<a class="listen-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Listen on YouTube Music ${arrowUp}</a><button class="text-link" type="button" data-embed="${item.index}" aria-controls="dialog-player" aria-expanded="false">Play here <span aria-hidden="true">↗</span></button>` : '<p class="dialog-description">A listening link isn’t available for this selection yet.</p>'}</div></div></div>
    <div class="dialog-player" id="dialog-player" hidden></div>
    <div class="dialog-details"><section class="liner-notes"><h3 class="panel-title mono">Behind the selection</h3>${item.quote ? `<blockquote><p>“${escapeHtml(item.quote.replace(/^[“"]|[”"]$/g, ''))}”</p>${item.quote_source ? `<footer class="mono">${escapeHtml(item.quote_source)}</footer>` : ''}</blockquote>` : ''}${audio ? `<label class="mono" for="playlist-narration">Listen to the introduction</label><audio id="playlist-narration" controls preload="none" src="${escapeHtml(audio)}"></audio>` : ''}${item.narration_text ? `<details><summary>Read the introduction</summary><p>${escapeHtml(item.narration_text)}</p></details>` : ''}${!item.quote && !audio && !item.narration_text ? '<p class="liner-notes__empty">Start with a track. See where it takes you.</p>' : ''}</section>${trackMarkup(item)}</div>`;
  handleImageErrors(dialogContent);
  dialog.showModal();
  document.body.classList.add('dialog-open');
  dialog.scrollTop = 0;
  dialog.querySelector('.dialog-close').focus({ preventScroll: true });
  if (!motionPreference.matches) {
    motion.add(() => {
      dialogTween = gsap.fromTo(
        dialog,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'expo.out',
          clearProps: 'opacity,transform',
        }
      );
    });
  }
}

function cleanUpDialog() {
  dialogTween?.kill();
  gsap.set(dialog, { clearProps: 'opacity,transform' });
  dialogContent
    .querySelectorAll('audio, video')
    .forEach((media) => media.pause());
  dialogContent.innerHTML = '';
  document.body.classList.remove('dialog-open');
  if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true });
}

function closePlaylist() {
  if (!dialog.open) return;
  dialog.close();
  cleanUpDialog();
}

function toggleEmbed(button) {
  const player = document.getElementById('dialog-player');
  if (!player.hidden) {
    player.innerHTML = '';
    player.hidden = true;
    button.setAttribute('aria-expanded', 'false');
    button.innerHTML = 'Play here <span aria-hidden="true">↗</span>';
    return;
  }
  const item = records[Number(button.dataset.embed)];
  const url = playlistUrl(item);
  if (!url) return;
  const listId = new URL(url).searchParams.get('list');
  const firstTrack = getTracks(item).find((track) =>
    /^[\w-]{11}$/.test(track.video_id || '')
  );
  const embed = `https://www.youtube.com/embed/${firstTrack ? encodeURIComponent(firstTrack.video_id) : 'videoseries'}?list=${encodeURIComponent(listId)}&rel=0`;
  player.innerHTML = `<iframe src="${escapeHtml(embed)}" title="${escapeHtml(item.name)} — YouTube playlist player" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" referrerpolicy="strict-origin-when-cross-origin"></iframe><p>Some tracks can only be played on YouTube Music. <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Open the full playlist ↗</a></p>`;
  player.hidden = false;
  button.setAttribute('aria-expanded', 'true');
  button.innerHTML = 'Hide player <span aria-hidden="true">×</span>';
}

function animateEntrance() {
  if (entrancePlayed) return;
  entrancePlayed = true;
  if (motionPreference.matches) return;
  motion.add(() => {
    gsap
      .timeline()
      .from('.intro h1 > *', {
        y: 28,
        opacity: 0,
        duration: 0.9,
        stagger: 0.09,
        ease: 'expo.out',
        clearProps: 'all',
      })
      .from(
        '.intro__bottom',
        {
          y: 15,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
          clearProps: 'all',
        },
        0.2
      )
      .from(
        feature,
        { y: 30, opacity: 0, duration: 1, ease: 'expo.out', clearProps: 'all' },
        0.15
      );
  });
}

function renderFeedState({ title, description, retry = false }) {
  feature.innerHTML =
    '<div class="feature__loading mono">More sounds on the way.</div>';
  feature.setAttribute('aria-busy', 'false');
  feedState.hidden = false;
  feedState.innerHTML = `<span class="eyebrow">${retry ? 'A little interference' : 'Coming soon'}</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(description)}</p>${retry ? '<button class="text-link" type="button" data-retry>Try again <span aria-hidden="true">↗</span></button>' : ''}`;
}

async function loadFeed() {
  if (loading) return;
  loading = true;
  const retryButton = feedState.querySelector('[data-retry]');
  if (retryButton) {
    retryButton.disabled = true;
    retryButton.textContent = 'Trying again…';
  }
  try {
    const response = await fetch(FEED_URL, {
      headers: { Accept: 'application/json' },
      signal: events.signal,
    });
    if (!response.ok) throw new Error(`Feed response: ${response.status}`);
    const payload = await response.json();
    const items = Array.isArray(payload) ? payload : payload.items;
    if (!Array.isArray(items)) throw new Error('Invalid playlist collection');
    records = items
      .filter(
        (item) =>
          item && typeof item === 'object' && typeof item.title === 'string'
      )
      .map((item) => ({ ...item, timestamp: Date.parse(item.created_at) || 0 }))
      .sort((a, b) => b.timestamp - a.timestamp)
      .map((item, index) => ({
        ...item,
        index,
        name: cleanTitle(item.title),
        count: Number(item.track_count) || getTracks(item).length,
        categories: getCategories(item),
        searchText: [
          item.title,
          item.genre,
          item.description,
          ...getTracks(item).flatMap((track) => [track.title, track.artist]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      }));
    document.querySelectorAll('[data-playlist-count]').forEach((element) => {
      element.textContent = String(records.length).padStart(2, '0');
    });
    if (!records.length) {
      renderFeedState({
        title: 'The first selection is on its way.',
        description: 'Check back soon for a new way into the music.',
      });
      return;
    }
    const count = records.reduce((total, item) => total + item.count, 0);
    document.getElementById('archive-stats').textContent =
      `${records.length} playlists / ${count.toLocaleString()} tracks / Endless detours`;
    featureIndex = 0;
    renderFeature();
    renderCollection();
    feedState.hidden = true;
    document.getElementById('collection-tools').hidden = false;
    document.getElementById('collection-meta').hidden = false;
    Promise.race([
      document.fonts.ready,
      new Promise((resolve) => window.setTimeout(resolve, 800)),
    ]).then(() => {
      if (!events.signal.aborted) animateEntrance();
    });
  } catch (error) {
    if (error.name === 'AbortError') return;
    renderFeedState({
      title: 'The records are out of reach.',
      description:
        'The collection couldn’t load this time. Give it another spin.',
      retry: true,
    });
  } finally {
    loading = false;
  }
}

function listen(target, event, handler) {
  target.addEventListener(event, handler, { signal: events.signal });
}

listen(document, 'click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.open !== undefined)
    openPlaylist(records[Number(button.dataset.open)], button);
  if (button.dataset.featureStep) {
    const step = Number(button.dataset.featureStep);
    featureIndex = (featureIndex + step + records.length) % records.length;
    renderFeature({ animate: true, focusControl: button.dataset.featureStep });
  }
  if (button.dataset.filter) {
    selectedFilter = button.dataset.filter;
    renderCollection();
  }
  if (button.hasAttribute('data-retry')) loadFeed();
  if (button.dataset.embed !== undefined) toggleEmbed(button);
  if (button.classList.contains('dialog-close')) closePlaylist();
});

listen(search, 'input', renderCollection);
listen(sort, 'change', renderCollection);
listen(document.getElementById('reset-filters'), 'click', () => {
  selectedFilter = 'all';
  search.value = '';
  renderCollection();
  search.focus({ preventScroll: true });
});
listen(shuffle, 'click', () => {
  const pool = visibleRecords.filter((item) => item.index !== lastRandomIndex);
  const choices = pool.length ? pool : visibleRecords;
  const item = choices[Math.floor(Math.random() * choices.length)];
  if (!item) return;
  lastRandomIndex = item.index;
  openPlaylist(item, shuffle);
});
listen(dialog, 'cancel', (event) => {
  event.preventDefault();
  closePlaylist();
});
listen(dialog, 'close', () => {
  if (!dialog.open && dialogContent.hasChildNodes()) cleanUpDialog();
});
let backdropPointerDown = false;
function outsideDialog(event) {
  const rect = dialog.getBoundingClientRect();
  return (
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  );
}
listen(dialog, 'pointerdown', (event) => {
  backdropPointerDown = event.target === dialog && outsideDialog(event);
});
listen(dialog, 'click', (event) => {
  if (backdropPointerDown && event.target === dialog && outsideDialog(event))
    closePlaylist();
  backdropPointerDown = false;
});
listen(document, 'pointerover', (event) => {
  if (!(event.target instanceof Element) || dialog.open) return;
  const button = event.target.closest('.record-card__button, .feature__cover');
  if (button && !button.contains(event.relatedTarget)) startPreview(button);
});
listen(document, 'pointerout', (event) => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('.record-card__button, .feature__cover');
  if (button && !button.contains(event.relatedTarget)) stopPreviews(button);
});
listen(document, 'visibilitychange', () => {
  if (document.hidden) {
    stopPreviews();
    dialogContent.querySelectorAll('audio').forEach((audio) => audio.pause());
  }
});
listen(motionPreference, 'change', () => {
  if (motionPreference.matches) {
    stopPreviews();
    motion.revert();
  }
});

loadFeed();

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    events.abort();
    if (dialog.open) dialog.close();
    cleanUpDialog();
    stopPreviews();
    motion.revert();
  });
}
