/**
 * Vite plugin: injects gallery cards into index.html from Projects.json.
 *
 * Replaces <!-- GALLERY_CARDS --> in index.html with rendered card HTML
 * at build time (and during dev serve). Zero runtime cost.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { escHtml, escAttr } from '../src/utils/escape.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const { cdnBase: CDN_BASE } = JSON.parse(
  readFileSync(resolve(__dirname, '..', 'cdn-base.json'), 'utf8')
);

export default function injectGallery() {
  let root;

  return {
    name: 'inject-gallery',

    configResolved(config) {
      root = config.root;
    },

    transformIndexHtml(html) {
      if (!html.includes('<!-- GALLERY_CARDS -->')) return html;

      const jsonPath = resolve(root, 'public/data/Projects.json');
      const data = JSON.parse(readFileSync(jsonPath, 'utf8'));
      const cards = renderGalleryCards(data.projects);

      return html.replace('<!-- GALLERY_CARDS -->', cards);
    },

    // Hot-reload index.html when Projects.json changes during dev
    configureServer(server) {
      const jsonPath = resolve(root, 'public/data/Projects.json');
      server.watcher.add(jsonPath);
      server.watcher.on('change', (file) => {
        if (file === jsonPath) {
          server.ws.send({ type: 'full-reload' });
        }
      });
    },
  };
}

function renderGalleryCards(projects) {
  const featured = projects
    .filter((p) => p.featured)
    .sort(
      (a, b) =>
        (a.galleryOrder ?? 99) - (b.galleryOrder ?? 99) ||
        a.id.localeCompare(b.id)
    );

  return featured
    .map((p) => {
      const hasHoverVideo = Boolean(p.hoverVideo);
      const hasLightbox = Boolean(p.lightboxVideo);
      const hasNetworkLogo = Boolean(p.networkLogo);
      const slug = p.gallerySlug || p.id;

      const detailUrl = p.detailPage ? `/projects/${slug}/` : null;
      const useLightbox = hasLightbox && !detailUrl;

      const classes = useLightbox
        ? 'gallery-card glightbox-video'
        : 'gallery-card';

      const glightboxAttrs = useLightbox
        ? ` data-glightbox="type: video"` +
          ` data-title="${escAttr(p.title)}"` +
          ` data-description="${escAttr(p.role)}, ${escAttr(p.year)}"` +
          ` data-href="${cdnAssetPath(p.lightboxVideo)}"`
        : '';

      const noVideoAttr = hasHoverVideo ? '' : ' data-no-video';

      let videoHtml = '';
      if (hasHoverVideo) {
        const fallbackSource = p.hoverVideoFallback
          ? `\n                            <source src="${cdnAssetPath(p.hoverVideoFallback)}" type="video/${ext(p.hoverVideoFallback)}">`
          : '';
        videoHtml = `
                        <video
                            class="card-video"
                            muted
                            loop
                            playsinline
                            crossorigin
                            preload="none"
                        >
                            <source src="${cdnAssetPath(p.hoverVideo)}" type="video/${ext(p.hoverVideo)}">${fallbackSource}
                        </video>`;
      }

      const previewSrc = publicAssetPath(p.preview || p.poster || '');
      const imageAttrs = galleryImageAttrs(p, previewSrc);

      const networkLogoHtml = hasNetworkLogo
        ? `
                        <img
                            class="card-network"
                            src="${publicAssetPath(p.networkLogo)}"
                            alt="${escAttr(p.networkLogoAlt || '')}"
                        >`
        : '';

      const cardLinkHtml = detailUrl
        ? `
                    <a class="card-link" href="${detailUrl}" aria-label="${escAttr(p.title)}"></a>`
        : '';

      return `                <article class="${classes}" data-project="${escAttr(slug)}" data-cursor-snap${glightboxAttrs}${noVideoAttr}>${cardLinkHtml}
                    <div class="card-media">
                        <img
                            class="card-thumbnail"
                            src="${escAttr(previewSrc)}"${imageAttrs}
                            alt="${escAttr(p.title)}"
                            loading="lazy"
                        >${videoHtml}
                    </div>
                    <div class="card-content">
                        <h3 class="card-title">${escHtml(p.title)}</h3>${networkLogoHtml}
                    </div>
                </article>`;
    })
    .join('\n\n');
}

function galleryImageAttrs(project, previewSrc) {
  const image = project.galleryImage;
  if (!image?.width || !image?.height) return '';

  const dimensions = ` width="${escAttr(image.width)}" height="${escAttr(image.height)}"`;
  if (!image.sources?.length) return dimensions;

  const candidates = [...image.sources, { src: previewSrc, width: image.width }]
    .sort((a, b) => a.width - b.width)
    .map(({ src, width }) => `${publicAssetPath(src)} ${width}w`)
    .join(', ');
  const ratio = image.width / image.height;
  const compactScale = Math.max(1, (3 / 4) * ratio);
  const rounded = (value) => Number(value.toFixed(6));
  // Cover can scale landscape sources by card height, beyond their visible width.
  const sizes = [
    `(max-width: 480px) max(calc(${rounded(100 * compactScale)}vw - ${rounded(2.5 * compactScale)}rem), ${rounded(280 * ratio)}px)`,
    `(max-width: 1024px) calc(${rounded(100 * compactScale)}vw - clamp(${rounded(3 * compactScale)}rem, ${rounded(10 * compactScale)}vw, ${rounded(8 * compactScale)}rem))`,
    `max(min(60vw, 900px), min(${rounded(70 * ratio)}vh, ${rounded(700 * ratio)}px))`,
  ].join(', ');

  return `${dimensions} srcset="${escAttr(candidates)}" sizes="${escAttr(sizes)}"`;
}

function ext(path) {
  return path.split('.').pop() || 'webm';
}

function publicAssetPath(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

function cdnAssetPath(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path)) return path;
  return `${CDN_BASE}/${path.replace(/^\.?\//, '')}`;
}
