/**
 * Credits Section — mb.studio-style accordion
 * Click a row to expand with large title + preview image + description.
 * Section inverts to black when any row is open.
 */

import { gsap, ScrollTrigger } from '../animations/scroll-defaults.js';

const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

const PLATFORM_LOGOS = {
  cnn: {
    src: 'images/logos/CNN_logo_red.svg',
    alt: 'CNN',
    variant: 'standard',
  },
  curiositystream: {
    src: 'images/logos/CuriosityStream_mono.svg',
    alt: 'CuriosityStream',
  },
  discovery: { src: 'images/logos/Discovery.png', alt: 'Discovery' },
  'fox nation': {
    src: 'images/logos/Fox_logo.svg',
    alt: 'Fox Nation',
    variant: 'mark',
  },
  history: { src: 'images/logos/History.png', alt: 'History', variant: 'mark' },
  'i.d.': {
    src: 'images/logos/ID_2020.svg',
    alt: 'Investigation Discovery',
    variant: 'standard',
  },
  id: {
    src: 'images/logos/ID_2020.svg',
    alt: 'Investigation Discovery',
    variant: 'standard',
  },
  'nat geo': {
    src: 'images/logos/NatGeoLogo_White.svg',
    alt: 'Nat Geo',
    variant: 'standard',
  },
  netflix: { src: 'images/logos/Netflix_white2.png', alt: 'Netflix' },
  pbs: {
    src: 'images/logos/pbs_logo_white.png',
    alt: 'PBS',
    variant: 'standard',
  },
  'a&e': { src: 'images/logos/A&E_logo.svg', alt: 'A&E', variant: 'standard' },
  amc: { src: 'images/logos/AMC_logo.svg', alt: 'AMC', variant: 'standard' },
  cmt: { src: 'images/logos/CMT_logo1.svg', alt: 'CMT', variant: 'standard' },
  hgtv: { src: 'images/logos/HGTV_logo.svg', alt: 'HGTV', variant: 'standard' },
  tlc: {
    src: 'images/logos/TLC_logo_mono.svg',
    alt: 'TLC',
    variant: 'standard',
    preserveContrast: true,
  },
};

function normalizePlatform(platform) {
  return (platform || '').trim().toLowerCase();
}

function publicAssetPath(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('/')) return path;
  return `/${path}`;
}

function getPlatformLogo(project) {
  const fallbackLogo =
    PLATFORM_LOGOS[normalizePlatform(project.platform)] || null;

  if (project.networkLogo) {
    return {
      ...fallbackLogo,
      src: publicAssetPath(project.networkLogo),
      alt:
        project.networkLogoAlt || fallbackLogo?.alt || project.platform || '',
    };
  }

  if (!fallbackLogo) return null;

  return {
    ...fallbackLogo,
    src: publicAssetPath(fallbackLogo.src),
  };
}

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
  const logo = getPlatformLogo(project);
  if (logo) {
    platform.setAttribute('aria-label', logo.alt || project.platform || '');

    const logoImg = document.createElement('img');
    logoImg.className = 'credit-row__platform-logo';
    if (logo.variant) {
      logoImg.classList.add(`credit-row__platform-logo--${logo.variant}`);
    }
    if (logo.preserveContrast) {
      logoImg.classList.add('credit-row__platform-logo--preserve-contrast');
    }
    logoImg.src = logo.src;
    logoImg.alt = '';
    logoImg.loading = 'lazy';
    logoImg.decoding = 'async';
    platform.appendChild(logoImg);
  } else {
    platform.textContent = project.platform || '';
  }

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
    img.dataset.src = publicAssetPath(project.preview);
  } else if (project.poster) {
    img.dataset.src = publicAssetPath(project.poster);
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
  let hoveredHeader = null;
  const cleanupHandlers = [];

  const ctx = gsap.context(() => {});
  section.dataset.caCurve ??= 'fade-only';

  const fixedHeroName = document.getElementById('hero-name-fixed');
  const topGradient = document.querySelector('.hero-top-transition-gradient');

  const lightGradient =
    'linear-gradient(180deg, oklch(0.968 0.006 75 / 0.55) 0%, ' +
    'oklch(0.968 0.006 75 / 0.3) 52%, ' +
    'oklch(0.968 0.006 75 / 0) 100%)';

  // Toggle the fixed header gradient + hero name between light-bg and dark-bg modes.
  function setHeroHeaderLight(onLight) {
    if (topGradient)
      topGradient.style.background = onLight ? lightGradient : '';
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
    '--credits-logo-invert': 1,
  };
  const lightVars = {
    '--credits-bg': 'oklch(0.968 0.006 75)',
    '--credits-text': 'oklch(0.14 0 0)',
    '--credits-border': 'oklch(0.14 0 0 / 0.1)',
    '--credits-hover-bg': 'oklch(0.14 0 0 / 0.04)',
    '--credits-muted': 'oklch(0.14 0 0 / 0.5)',
    '--credits-logo-invert': 0,
  };

  // Adds a color inversion tween to `tl` at position `pos`.
  // Slower and in the same timeline as the row expansion so it feels coupled.
  function invertColors(toDark, tl, pos) {
    section.classList.toggle('is-expanded', toDark);

    if (prefersReducedMotion) {
      // When row is expanded (toDark), credits bg goes dark → hero header stays dark.
      // When row is closed (!toDark), credits bg returns to light → hero header goes light.
      setHeroHeaderLight(!toDark);
      return;
    }
    const vars = {
      ...(toDark ? darkVars : lightVars),
      duration: 0.9,
      ease: 'power2.inOut',
    };
    if (tl) {
      tl.to(section, vars, pos ?? 0);
    } else {
      gsap.to(section, vars);
    }
    setHeroHeaderLight(!toDark);
  }

  function growTitle(titleEl, tl, pos) {
    const startPx = parseFloat(getComputedStyle(titleEl).fontSize);
    titleEl.dataset.baseSize = startPx;
    tl.fromTo(
      titleEl,
      { fontSize: startPx },
      { fontSize: '2.25rem', duration: 0.5, ease: 'expo.out' },
      pos
    );
  }

  function shrinkTitle(titleEl, tl, pos) {
    const basePx = parseFloat(
      titleEl.dataset.baseSize || getComputedStyle(titleEl).fontSize
    );
    tl.to(
      titleEl,
      {
        fontSize: basePx,
        duration: 0.35,
        ease: 'expo.inOut',
        onComplete() {
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
      row
        .querySelector('.credit-row__header')
        .setAttribute('aria-expanded', 'false');
      details.setAttribute('aria-hidden', 'true');
      details.style.overflow = 'clip';
      activeRow = null;

      if (prefersReducedMotion) {
        details.style.height = '0';
        gsap.delayedCall(0, () => ScrollTrigger.refresh());
        invertColors(false);
        gsap.set(titleEl, { clearProps: 'fontSize' });
      } else {
        const closeTl = gsap.timeline();
        invertColors(false, closeTl, 0);
        shrinkTitle(titleEl, closeTl, 0);
        closeTl.to(
          details,
          {
            height: 0,
            duration: 0.4,
            ease: 'expo.inOut',
            onComplete: () =>
              gsap.delayedCall(0, () => ScrollTrigger.refresh()),
          },
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
        activeRow
          .querySelector('.credit-row__header')
          .setAttribute('aria-expanded', 'false');
        prevDetails.setAttribute('aria-hidden', 'true');
        prevDetails.style.overflow = 'clip';

        if (prefersReducedMotion) {
          prevDetails.style.height = '0';
          gsap.set(prevTitleEl, { clearProps: 'fontSize' });
        } else {
          shrinkTitle(prevTitleEl, tl, 0);
          tl.to(
            prevDetails,
            { height: 0, duration: 0.3, ease: 'expo.inOut' },
            0
          );
        }
      } else {
        // First expansion: invert to dark
        invertColors(true, prefersReducedMotion ? null : tl, 0);
      }

      // Expand new row
      const details = row.querySelector('.credit-row__details');
      const inner = details.querySelector('.credit-row__details-inner');
      row.classList.add('is-active');
      row
        .querySelector('.credit-row__header')
        .setAttribute('aria-expanded', 'true');
      details.setAttribute('aria-hidden', 'false');

      if (!prefersReducedMotion) {
        titleEl.style.letterSpacing = '-0.02em';
        titleEl.style.lineHeight = '1';
        growTitle(titleEl, tl, activeRow ? 0.05 : 0);
      }

      // Lazy-load image on first expand
      const img = details.querySelector('img[data-src]');
      if (img) {
        gsap.set(img, { opacity: 0 });
        img.onload = () =>
          gsap.to(img, { opacity: 1, duration: 0.4, ease: 'power2.out' });
        img.src = img.dataset.src;
        delete img.dataset.src;
      }

      if (prefersReducedMotion) {
        details.style.height = 'auto';
        details.style.overflow = 'visible';
        gsap.delayedCall(0, () => ScrollTrigger.refresh());
      } else {
        tl.to(
          details,
          {
            height: 'auto',
            duration: 0.5,
            ease: 'expo.out',
            onComplete() {
              details.style.overflow = 'visible';
              gsap.delayedCall(0, () => ScrollTrigger.refresh());
              gsap.from(inner.children, {
                opacity: 0,
                y: 16,
                filter: 'blur(4px)',
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

  // Hero header switches to the light-bg treatment while credits are pinned at top.
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
      // onRefresh fires after recalculation — handles already-active state on load/refresh
      onRefresh(self) {
        if (!activeRow) setHeroHeaderLight(self.isActive);
      },
    });
  });

  function setHoveredHeader(nextHeader) {
    if (hoveredHeader === nextHeader) return;

    hoveredHeader = nextHeader;
    const headers = list.querySelectorAll('.credit-row__header');
    headers.forEach((headerEl) => {
      headerEl.classList.toggle('is-hovered', headerEl === nextHeader);
    });
    list.classList.toggle('is-row-hovered', Boolean(nextHeader));
  }

  function clearHoveredHeader() {
    setHoveredHeader(null);
  }

  const handleListPointerLeave = (event) => {
    if (!event.relatedTarget || !list.contains(event.relatedTarget)) {
      clearHoveredHeader();
    }
  };
  const handleListFocusOut = (event) => {
    if (!event.relatedTarget || !list.contains(event.relatedTarget)) {
      clearHoveredHeader();
    }
  };
  list.addEventListener('pointerleave', handleListPointerLeave);
  list.addEventListener('focusout', handleListFocusOut);
  cleanupHandlers.push(() => {
    list.removeEventListener('pointerleave', handleListPointerLeave);
    list.removeEventListener('focusout', handleListFocusOut);
  });

  fetch('/data/Projects.json')
    .then((response) => response.json())
    .then((data) => {
      if (isDisposed) return;

      list.innerHTML = '';
      data.projects.forEach((project) => {
        const row = buildRow(project);
        const header = row.querySelector('.credit-row__header');
        const handleClick = () => handleRowClick(row);
        const handlePointerEnter = () => setHoveredHeader(header);
        const handleFocus = () => setHoveredHeader(header);

        header.addEventListener('click', handleClick);
        header.addEventListener('pointerenter', handlePointerEnter);
        header.addEventListener('focus', handleFocus);
        cleanupHandlers.push(() => {
          header.removeEventListener('click', handleClick);
          header.removeEventListener('pointerenter', handlePointerEnter);
          header.removeEventListener('focus', handleFocus);
        });
        list.appendChild(row);
      });

      // Row entrance animation
      if (!prefersReducedMotion) {
        ctx.add(() => {
          gsap.from('.credit-row', {
            opacity: 0,
            y: 15,
            filter: 'blur(4px)',
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
    cleanupHandlers.forEach((cleanup) => cleanup());
    list.classList.remove('is-row-hovered');
    ctx.revert();
  };
}
