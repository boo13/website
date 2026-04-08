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

  const fixedHeroName = document.getElementById('hero-name-fixed');
  const topGradient = document.querySelector('.hero-top-transition-gradient');

  const lightGradient = 'linear-gradient(180deg, oklch(1 0 0 / 0.55) 0%, oklch(1 0 0 / 0.3) 52%, oklch(1 0 0 / 0) 100%)';

  // Toggle the fixed header gradient + hero name between light-bg and dark-bg modes.
  function setHeroHeaderLight(onLight) {
    if (topGradient) topGradient.style.background = onLight ? lightGradient : '';
    if (fixedHeroName) {
      fixedHeroName.style.color = onLight ? 'oklch(0.14 0 0)' : '';
      fixedHeroName.style.textShadow = onLight ? 'none' : '';
    }
  }

  const darkVars = {
    '--credits-bg': 'oklch(0.14 0 0)',
    '--credits-text': 'oklch(0.968 0.006 75)',
    '--credits-border': 'oklch(0.968 0.006 75 / 0.1)',
    '--credits-hover-bg': 'oklch(1 0 0 / 0.06)',
    '--credits-muted': 'oklch(0.968 0.006 75 / 0.6)',
  };
  const lightVars = {
    '--credits-bg': 'oklch(0.968 0.006 75)',
    '--credits-text': 'oklch(0.14 0 0)',
    '--credits-border': 'oklch(0.14 0 0 / 0.1)',
    '--credits-hover-bg': 'oklch(0.14 0 0 / 0.04)',
    '--credits-muted': 'oklch(0.14 0 0 / 0.5)',
  };

  // Adds a color inversion tween to `tl` at position `pos`.
  // Slower and in the same timeline as the row expansion so it feels coupled.
  function invertColors(toDark, tl, pos) {
    if (prefersReducedMotion) {
      section.classList.toggle('is-expanded', toDark);
      // When row is expanded (toDark), credits bg goes dark → hero header stays dark.
      // When row is closed (!toDark), credits bg returns to light → hero header goes light.
      setHeroHeaderLight(!toDark);
      return;
    }
    const vars = { ...(toDark ? darkVars : lightVars), duration: 0.9, ease: 'power2.inOut' };
    if (tl) {
      tl.to(section, vars, pos ?? 0);
    } else {
      gsap.to(section, vars);
    }
    setHeroHeaderLight(!toDark);
  }

  // Grow the header title to display size; shrink it back when closing.
  // fontFamily must be swapped before calling so the display font scales up from small.
  function growTitle(titleEl, tl, pos) {
    const startPx = parseFloat(getComputedStyle(titleEl).fontSize);
    titleEl.dataset.baseSize = startPx;
    tl.fromTo(titleEl, { fontSize: startPx }, { fontSize: '2.25rem', duration: 0.5, ease: 'expo.out' }, pos);
  }

  function shrinkTitle(titleEl, tl, pos) {
    const basePx = parseFloat(titleEl.dataset.baseSize || getComputedStyle(titleEl).fontSize);
    tl.to(
      titleEl,
      {
        fontSize: basePx,
        duration: 0.35,
        ease: 'expo.inOut',
        onComplete() {
          // Clear inline overrides so CSS resumes control
          titleEl.style.fontFamily = '';
          titleEl.style.letterSpacing = '';
          titleEl.style.lineHeight = '';
          gsap.set(titleEl, { clearProps: 'fontSize' });
        },
      },
      pos
    );
  }

  function handleRowClick(row) {
    if (isDisposed) return;

    // Snap any in-progress tween to end
    if (activeTween?.isActive()) activeTween.progress(1);

    const titleEl = row.querySelector('.credit-row__title');

    if (activeRow === row) {
      // Toggle closed: shrink title + collapse height + return to light
      const details = row.querySelector('.credit-row__details');
      row.classList.remove('is-active');
      row.querySelector('.credit-row__header').setAttribute('aria-expanded', 'false');
      details.setAttribute('aria-hidden', 'true');
      details.style.overflow = 'clip';
      activeRow = null;

      if (prefersReducedMotion) {
        details.style.height = '0';
        ScrollTrigger.refresh();
        invertColors(false);
        titleEl.style.fontFamily = '';
        gsap.set(titleEl, { clearProps: 'fontSize' });
      } else {
        const closeTl = gsap.timeline();
        invertColors(false, closeTl, 0);
        shrinkTitle(titleEl, closeTl, 0);
        closeTl.to(
          details,
          { height: 0, duration: 0.4, ease: 'expo.inOut', onComplete: () => ScrollTrigger.refresh() },
          0
        );
        activeTween = closeTl;
      }
    } else {
      const tl = gsap.timeline();

      if (activeRow) {
        // Switch rows: shrink previous title + close its panel (stay dark)
        const prevTitleEl = activeRow.querySelector('.credit-row__title');
        const prevDetails = activeRow.querySelector('.credit-row__details');
        activeRow.classList.remove('is-active');
        activeRow.querySelector('.credit-row__header').setAttribute('aria-expanded', 'false');
        prevDetails.setAttribute('aria-hidden', 'true');
        prevDetails.style.overflow = 'clip';

        if (prefersReducedMotion) {
          prevDetails.style.height = '0';
          prevTitleEl.style.fontFamily = '';
          gsap.set(prevTitleEl, { clearProps: 'fontSize' });
        } else {
          shrinkTitle(prevTitleEl, tl, 0);
          tl.to(prevDetails, { height: 0, duration: 0.3, ease: 'expo.inOut' }, 0);
        }
      } else {
        // First expansion: invert to dark
        invertColors(true, prefersReducedMotion ? null : tl, 0);
      }

      // Expand new row — switch title to display font before growing
      const details = row.querySelector('.credit-row__details');
      const inner = details.querySelector('.credit-row__details-inner');
      row.classList.add('is-active');
      row.querySelector('.credit-row__header').setAttribute('aria-expanded', 'true');
      details.setAttribute('aria-hidden', 'false');

      if (!prefersReducedMotion) {
        // Swap font-family immediately so display font scales up from small
        titleEl.style.fontFamily = 'ivypresto-display, Georgia, serif';
        titleEl.style.letterSpacing = '-0.02em';
        titleEl.style.lineHeight = '1';
        growTitle(titleEl, tl, activeRow ? 0.05 : 0);
      }

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
              gsap.from(inner.children, {
                opacity: 0,
                y: 16,
                duration: 0.5,
                ease: 'expo.out',
                stagger: 0.07,
              });
            },
          },
          activeRow ? 0.1 : 0
        );
      }

      activeRow = row;
      activeTween = tl;
    }
  }

  // Hero header color: switch to light mode when the credits section (offwhite bg)
  // is at the top of the viewport, dark mode otherwise.
  ctx.add(() => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: 'bottom top',
      onEnter() {
        if (!activeRow) setHeroHeaderLight(true);
      },
      onLeave() {
        setHeroHeaderLight(false);
      },
      onEnterBack() {
        if (!activeRow) setHeroHeaderLight(true);
      },
      onLeaveBack() {
        setHeroHeaderLight(false);
      },
      // Handle already-scrolled-into state on load/refresh
      onRefresh(self) {
        if (!activeRow) setHeroHeaderLight(self.isActive);
      },
    });
  });

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
