/**
 * Credits Section — mb.studio-style accordion
 * Click a row to expand with large title + preview image + description.
 * Section inverts to black when any row is open.
 */

import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

function buildRow(project) {
  const row = document.createElement('div');
  row.className = 'credit-row';
  row.setAttribute('role', 'listitem');

  // Header button
  const header = document.createElement('button');
  header.className = 'credit-row__header';
  header.setAttribute('aria-expanded', 'false');
  header.type = 'button';

  const icon = document.createElement('span');
  icon.className = 'credit-row__icon';
  icon.textContent = '+';
  icon.setAttribute('aria-hidden', 'true');

  const title = document.createElement('span');
  title.className = 'credit-row__title';
  title.textContent = project.title;

  const platform = document.createElement('span');
  platform.className = 'credit-row__platform';
  platform.textContent = project.platform || '';

  const role = document.createElement('span');
  role.className = 'credit-row__role';
  role.textContent = project.role || '';

  header.appendChild(icon);
  header.appendChild(title);
  header.appendChild(platform);
  header.appendChild(role);

  // Details panel
  const details = document.createElement('div');
  details.className = 'credit-row__details';
  details.setAttribute('aria-hidden', 'true');

  const inner = document.createElement('div');
  inner.className = 'credit-row__details-inner';

  const detailTitle = document.createElement('h3');
  detailTitle.className = 'credit-row__detail-title';
  detailTitle.textContent = project.title;

  const detailImage = document.createElement('div');
  detailImage.className = 'credit-row__detail-image';
  const img = document.createElement('img');
  img.alt = project.title;
  if (project.preview) {
    img.dataset.src = project.preview;
  } else if (project.poster) {
    img.dataset.src = project.poster;
  }
  detailImage.appendChild(img);

  const detailDesc = document.createElement('p');
  detailDesc.className = 'credit-row__detail-desc';
  if (project.description) {
    detailDesc.textContent = project.description;
  } else {
    detailDesc.style.display = 'none';
  }

  inner.appendChild(detailTitle);
  inner.appendChild(detailImage);
  inner.appendChild(detailDesc);
  details.appendChild(inner);

  row.appendChild(header);
  row.appendChild(details);

  return row;
}

export function initCredits() {
  const section = document.querySelector('.credits-section');
  const list = document.querySelector('.credits-list');
  if (!section || !list) return () => {};

  let activeRow = null;
  let activeTween = null;
  let isDisposed = false;

  const ctx = gsap.context(() => {});

  function invertColors(toDark) {
    if (prefersReducedMotion) {
      section.classList.toggle('is-expanded', toDark);
      return;
    }
    const dark = {
      '--credits-bg': 'oklch(0.14 0 0)',
      '--credits-text': 'oklch(0.968 0.006 75)',
      '--credits-border': 'oklch(0.968 0.006 75 / 0.1)',
      '--credits-hover-bg': 'oklch(0.767 0.139 91 / 0.08)',
      '--credits-hover-title': 'oklch(0.767 0.139 91)',
      '--credits-muted': 'oklch(0.968 0.006 75 / 0.6)',
    };
    const light = {
      '--credits-bg': 'oklch(0.968 0.006 75)',
      '--credits-text': 'oklch(0.14 0 0)',
      '--credits-border': 'oklch(0.14 0 0 / 0.1)',
      '--credits-hover-bg': 'oklch(0.14 0 0 / 0.04)',
      '--credits-hover-title': 'oklch(0.55 0.15 91)',
      '--credits-muted': 'oklch(0.14 0 0 / 0.5)',
    };
    gsap.to(section, { ...(toDark ? dark : light), duration: 0.4, ease: 'expo.out' });
  }

  function collapseRow(row) {
    const details = row.querySelector('.credit-row__details');
    row.classList.remove('is-active');
    row.querySelector('.credit-row__icon').textContent = '+';
    row.querySelector('.credit-row__header').setAttribute('aria-expanded', 'false');
    details.setAttribute('aria-hidden', 'true');
    details.style.overflow = 'clip';

    if (prefersReducedMotion) {
      details.style.height = '0';
      ScrollTrigger.refresh();
      return;
    }

    gsap.to(details, {
      height: 0,
      duration: 0.4,
      ease: 'expo.inOut',
      onComplete() {
        ScrollTrigger.refresh();
      },
    });
  }

  function handleRowClick(row) {
    if (isDisposed) return;

    // Snap any in-progress tween to end
    if (activeTween?.isActive()) activeTween.progress(1);

    if (activeRow === row) {
      // Toggle closed
      collapseRow(row);
      activeRow = null;
      invertColors(false);
    } else {
      const tl = gsap.timeline();

      if (activeRow) {
        // Close previous row (stay dark)
        const prevDetails = activeRow.querySelector('.credit-row__details');
        activeRow.classList.remove('is-active');
        activeRow.querySelector('.credit-row__icon').textContent = '+';
        activeRow.querySelector('.credit-row__header').setAttribute('aria-expanded', 'false');
        prevDetails.setAttribute('aria-hidden', 'true');
        prevDetails.style.overflow = 'clip';

        if (prefersReducedMotion) {
          prevDetails.style.height = '0';
        } else {
          tl.to(prevDetails, { height: 0, duration: 0.3, ease: 'expo.inOut' }, 0);
        }
      } else {
        // First expansion: invert to dark
        invertColors(true);
      }

      // Expand new row
      const details = row.querySelector('.credit-row__details');
      row.classList.add('is-active');
      row.querySelector('.credit-row__icon').textContent = '\u2022';
      row.querySelector('.credit-row__header').setAttribute('aria-expanded', 'true');
      details.setAttribute('aria-hidden', 'false');

      // Lazy-load image on first expand
      const img = details.querySelector('img[data-src]');
      if (img) {
        img.src = img.dataset.src;
        delete img.dataset.src;
      }

      if (prefersReducedMotion) {
        details.style.height = 'auto';
        ScrollTrigger.refresh();
      } else {
        tl.to(
          details,
          {
            height: 'auto',
            duration: 0.5,
            ease: 'expo.out',
            onComplete() {
              details.style.overflow = 'visible';
              ScrollTrigger.refresh();
            },
          },
          activeRow ? 0.1 : 0
        );
      }

      activeRow = row;
      activeTween = tl;
    }
  }

  fetch('data/Projects.json')
    .then((response) => response.json())
    .then((data) => {
      if (isDisposed) return;

      list.innerHTML = '';
      data.projects.forEach((project) => {
        const row = buildRow(project);
        row.querySelector('.credit-row__header').addEventListener('click', () =>
          handleRowClick(row)
        );
        list.appendChild(row);
      });

      // Row entrance animation
      if (!prefersReducedMotion) {
        ctx.add(() => {
          gsap.from('.credit-row', {
            opacity: 0,
            y: 15,
            duration: 0.6,
            ease: 'expo.out',
            stagger: 0.04,
            scrollTrigger: {
              trigger: section,
              start: 'top 85%',
              once: true,
            },
          });
        });
      }

      ScrollTrigger.refresh();
    })
    .catch((err) => {
      if (isDisposed) return;
      console.error('Error loading projects:', err);
    });

  return () => {
    isDisposed = true;
    ctx.revert();
  };
}
