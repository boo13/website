#!/usr/bin/env node
/**
 * Scaffold a project detail page from Projects.json data.
 *
 * Usage: node scripts/scaffold-project.mjs <project-id>
 * Example: node scripts/scaffold-project.mjs sitting-bull
 */
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const { cdnBase: CDN_BASE } = JSON.parse(
  readFileSync('cdn-base.json', 'utf8')
);

const projectId = process.argv[2];
if (!projectId) {
  console.error('Usage: node scripts/scaffold-project.mjs <project-id>');
  process.exit(1);
}

const data = JSON.parse(readFileSync('public/data/Projects.json', 'utf8'));
const project = data.projects.find((p) => p.id === projectId);

if (!project) {
  console.error(`Project "${projectId}" not found in Projects.json`);
  console.error(
    'Available IDs:',
    data.projects.map((p) => p.id).join(', ')
  );
  process.exit(1);
}

const slug = projectId;
const dir = join('projects', slug);

if (existsSync(join(dir, 'index.html'))) {
  console.error(`${dir}/index.html already exists. Aborting.`);
  process.exit(1);
}

const videoSrc = project.lightboxVideo
  ? `${CDN_BASE}/${project.lightboxVideo}`
  : project.videoStandard
    ? project.videoStandard
    : '';

const posterSrc = project.preview || project.poster || '';

// Preserve unicode en-dashes in year display
const yearDisplay = project.year || '';

const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${esc(project.title)} - Randy Counsman</title>
    <meta name="description" content="${escAttr(project.description || project.title)}">

    <!-- Open Graph -->
    <meta property="og:title" content="${escAttr(project.title)} - Randy Counsman">
    <meta property="og:description" content="${escAttr(project.description || project.title)}">
    <meta property="og:image" content="/${posterSrc}">
    <meta property="og:type" content="website">

    <!-- Critical inline styles to prevent white flash -->
    <style>
      html, body {
        background: #020202;
        margin: 0;
        padding: 0;
      }
    </style>

    <!-- Typekit Fonts -->
    <link rel="stylesheet" href="https://use.typekit.net/bnp0hyp.css">
</head>
<body data-project-id="${escAttr(project.id)}">

    <!-- SECTION 1: VIDEO HERO -->
    <section class="project-hero--video">
        <div class="project-hero__player">
            <a class="project-hero__close" href="/">Close</a>
            <div class="project-hero__scroll-text">scroll to view credits</div>

            <div class="project-hero__video-container">
                <video
                    autoplay
                    muted
                    playsinline
                    crossorigin
                    poster="/${posterSrc}"
                >${videoSrc ? `
                    <source src="${videoSrc}" type="video/${videoSrc.endsWith('.mp4') ? 'mp4' : 'webm'}">` : '\n                    <!-- TODO: add video source -->'}
                </video>

                <div class="project-hero__bottom">
                    <div class="project-hero__info">
                        <div class="project-hero__info-left">
                            <span>${esc(project.title)}</span>
                            <button class="project-hero__play-btn" aria-label="Play/Pause">&#9654;</button>
                        </div>
                        <div class="project-hero__info-right">
                            <button class="project-hero__credits-btn">credits</button>
                        </div>
                    </div>
                    <div class="project-hero__timeline">
                        <div class="project-hero__timeline-progress"></div>
                    </div>
                    <div class="project-hero__time">
                        <span class="project-hero__time-current">00:00</span>
                        <span class="project-hero__time-total">00:00</span>
                    </div>
                </div>

                <button class="project-hero__sound-btn" aria-label="Toggle sound">sound off</button>
            </div>
        </div>
    </section>

    <!-- SECTION 2: CREDITS -->
    <section class="project-credits">
        <div class="project-credits__gradient"></div>
        <div class="project-credits__wrapper">
            <div class="project-credits__text">

                <div class="project-credits__header">
                    <div class="project-credits__title">${esc(project.title)}</div>
                    <div class="project-credits__year">(${esc(yearDisplay)})</div>
                </div>

                <div class="project-credits__line"></div>

                <div class="project-credits__about-section">
                    <div class="project-credits__subtitle">About</div>
                    <div class="project-credits__about">
                        ${esc(project.description || 'TODO: add description')}
                    </div>
                </div>

                <div class="project-credits__line"></div>

                <!-- TODO: Add full credits list -->
                <div class="project-credits__detail-section">
                    <div class="project-credits__subtitle">Credits</div>
                    <div class="project-credits__list">
                        <div class="project-credits__item">
                            <div class="project-credits__item-title">${esc(project.role)}</div>
                            <div class="project-credits__item-text">Randy Counsman</div>
                        </div>
                        <div class="project-credits__item">
                            <div class="project-credits__item-title">Network</div>
                            <div class="project-credits__item-text">${esc(project.platform)}</div>
                        </div>
                    </div>
                </div>

                <div class="project-credits__line"></div>
            </div>

            <div class="project-credits__image">
                <img src="/${posterSrc}" alt="${escAttr(project.title)} poster">
            </div>
        </div>

        <footer class="project-footer">
            <a class="project-footer__ticker" href="mailto:RandyCounsman@gmail.com">
                <span class="project-footer__ticker-inner">get in touch today &nbsp;&mdash;&nbsp; get in touch today &nbsp;&mdash;&nbsp; get in touch today &nbsp;&mdash;&nbsp; get in touch today &nbsp;&mdash;&nbsp;</span>
            </a>
            <button class="project-footer__back-btn">back to video</button>
            <div class="project-footer__links">
                <a href="https://www.linkedin.com/in/randycounsman/" target="_blank" rel="noopener">Li</a>
                <a href="https://vimeo.com/randycounsman" target="_blank" rel="noopener">Vi</a>
                <span>&copy; 2026</span>
            </div>
        </footer>
    </section>

    <script type="module" src="/src/main-project.js"></script>
</body>
</html>`;

mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, 'index.html'), html);
console.log(`Created ${dir}/index.html`);
console.log('  → Edit the credits section to add full crew list');
if (!videoSrc) {
  console.log('  ⚠ No video source found — add a <source> tag manually');
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escAttr(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
