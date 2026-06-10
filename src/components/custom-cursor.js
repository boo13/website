import { gsap } from '../animations/scroll-defaults.js';

export function initCustomCursor() {
  if ('ontouchstart' in window) return () => {};
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    return () => {};

  const dot = document.createElement('div');
  dot.className = 'custom-cursor-dot';

  const frame = document.createElement('div');
  frame.className = 'custom-cursor-frame';
  frame.innerHTML =
    '<span class="custom-cursor-corner custom-cursor-corner-lt"></span>' +
    '<span class="custom-cursor-corner custom-cursor-corner-rt"></span>' +
    '<span class="custom-cursor-corner custom-cursor-corner-lb"></span>' +
    '<span class="custom-cursor-corner custom-cursor-corner-rb"></span>';

  document.body.appendChild(dot);
  document.body.appendChild(frame);

  const corners = {
    lt: frame.querySelector('.custom-cursor-corner-lt'),
    rt: frame.querySelector('.custom-cursor-corner-rt'),
    lb: frame.querySelector('.custom-cursor-corner-lb'),
    rb: frame.querySelector('.custom-cursor-corner-rb'),
  };

  // Base frame size — must match .custom-cursor-frame in index.css (40×22, 16:9)
  const BASE_W = 40;
  const BASE_H = 22;
  const SNAP_PAD = 10;

  let lastMouseX = 0;
  let lastMouseY = 0;
  // When true the frame is wrapped to a target and must NOT follow the cursor.
  let framing = false;

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.3, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.3, ease: 'power2.out' });
  // quickTo's internal tween gets its PropTweens killed by snapToTarget's
  // overwrite:'auto', leaving the frame frozen after any snap. Rebuild on
  // demand in resetFrame so the catch-up and subsequent mousemoves work.
  let frameX = gsap.quickTo(frame, 'x', { duration: 0.7, ease: 'power2.out' });
  let frameY = gsap.quickTo(frame, 'y', { duration: 0.7, ease: 'power2.out' });
  function rebuildFrameQuick() {
    frameX = gsap.quickTo(frame, 'x', { duration: 0.7, ease: 'power2.out' });
    frameY = gsap.quickTo(frame, 'y', { duration: 0.7, ease: 'power2.out' });
  }

  function handleMouseMove(e) {
    gsap.to([dot, frame], { opacity: 1, duration: 0.3, overwrite: 'auto' });
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    dotX(e.clientX);
    dotY(e.clientY);
    if (!framing) {
      frameX(e.clientX);
      frameY(e.clientY);
    }
  }

  function snapFrameToEl(el) {
    const r = el.getBoundingClientRect();
    const w = r.width + SNAP_PAD * 2;
    const h = r.height + SNAP_PAD * 2;
    return {
      x: r.left + r.width / 2 + BASE_W / 2 - w / 2,
      y: r.top + r.height / 2 + BASE_H / 2 - h / 2,
      w,
      h,
    };
  }

  let lastScrollY = window.scrollY;
  let scrollReturnTimer;
  function handleScroll() {
    // While snapped, re-pin the frame to the target's new viewport position
    // each scroll tick. Without this, position:fixed leaves the frame parked
    // at its initial screen coords while the target moves with the page.
    if (framing && snappedEl) {
      const { x, y } = snapFrameToEl(snappedEl);
      gsap.set(frame, { x, y });
      lastScrollY = window.scrollY;
      return;
    }
    const delta = window.scrollY - lastScrollY;
    lastScrollY = window.scrollY;
    const offset = Math.min(Math.max(delta * 1.2, -5), 5);
    frameY(lastMouseY + offset);
    clearTimeout(scrollReturnTimer);
    scrollReturnTimer = setTimeout(() => frameY(lastMouseY), 80);
  }

  function handleInteractiveEnter() {
    const d = 5;
    gsap.to(dot, { scale: 0, duration: 0.3, overwrite: 'auto' });
    gsap.to(corners.lt, {
      x: -d,
      y: -d,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    gsap.to(corners.rt, {
      x: d,
      y: -d,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    gsap.to(corners.lb, {
      x: -d,
      y: d,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    gsap.to(corners.rb, {
      x: d,
      y: d,
      duration: 0.5,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  function handleInteractiveLeave() {
    gsap.to(dot, { scale: 1, duration: 0.3, overwrite: 'auto' });
    Object.values(corners).forEach((c) =>
      gsap.to(c, {
        x: 0,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    );
  }

  let snappedEl = null;

  function snapToTarget(e) {
    const el = e.currentTarget;
    framing = true;
    snappedEl = el;
    el.classList.add('is-cursor-snapping');
    gsap.to(dot, { scale: 0, duration: 0.2, overwrite: 'auto' });
    // CSS centers base frame via top/left = -BASE/2; offset x/y so the resized frame stays centered on target.
    const { x, y, w, h } = snapFrameToEl(el);
    gsap.to(frame, {
      x,
      y,
      width: w,
      height: h,
      duration: 0.45,
      ease: 'power3.out',
      overwrite: 'auto',
    });
  }

  function resetFrame() {
    framing = false;
    if (snappedEl) {
      snappedEl.classList.remove('is-cursor-snapping');
      snappedEl = null;
    }
    // Rebuild the position quickTos — snap's gsap.to(...overwrite:'auto') strips
    // their internal PropTweens, so they silently no-op until recreated.
    rebuildFrameQuick();
    // Kick them toward the last cursor position so the frame catches up even
    // without a follow-up mousemove (snap target scrolling out of view, etc).
    frameX(lastMouseX);
    frameY(lastMouseY);
    gsap.to(dot, { scale: 1, duration: 0.3, overwrite: 'auto' });
    gsap.to(frame, {
      width: BASE_W,
      height: BASE_H,
      duration: 0.4,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    Object.values(corners).forEach((c) =>
      gsap.to(c, {
        x: 0,
        y: 0,
        duration: 0.45,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    );
  }

  document.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', handleScroll, { passive: true });

  // Delegated hover handling so dynamically-added targets (e.g. credits titles
  // built after a fetch) are covered without re-wiring. mouseover/mouseout
  // bubble, unlike mouseenter/mouseleave.
  const SNAP_SELECTOR = '[data-cursor-snap]';
  const DEFAULT_SELECTOR = '[data-cursor-default]';
  const EXPAND_SELECTOR = 'a, button, .gallery-card';
  let activeSnapEl = null;
  let activeExpandEl = null;

  function targetFor(node) {
    if (!(node instanceof Element)) return { snap: null, expand: null };
    const snap = node.closest(SNAP_SELECTOR);
    if (snap) return { snap, expand: null };
    // Opt-out: element wants the default follow cursor, no expand.
    // Checked AFTER snap so a snap descendant inside an opt-out ancestor still snaps.
    if (node.closest(DEFAULT_SELECTOR)) return { snap: null, expand: null };
    const expand = node.closest(EXPAND_SELECTOR);
    return { snap: null, expand };
  }

  function handleMouseOver(e) {
    const { snap, expand } = targetFor(e.target);

    if (snap && snap !== activeSnapEl) {
      if (activeExpandEl) {
        handleInteractiveLeave();
        activeExpandEl = null;
      }
      activeSnapEl = snap;
      snapToTarget({ currentTarget: snap });
      return;
    }

    if (expand && expand !== activeExpandEl) {
      if (activeSnapEl) {
        resetFrame();
        activeSnapEl = null;
      }
      activeExpandEl = expand;
      handleInteractiveEnter();
    }
  }

  function handleMouseOut(e) {
    // Only act when leaving the active target entirely (relatedTarget outside it).
    const to = e.relatedTarget;
    if (activeSnapEl && (!to || !activeSnapEl.contains(to))) {
      resetFrame();
      activeSnapEl = null;
    }
    if (
      activeExpandEl &&
      (!to || !activeExpandEl.contains(to)) &&
      !(to instanceof Element && to.closest(EXPAND_SELECTOR) === activeExpandEl)
    ) {
      handleInteractiveLeave();
      activeExpandEl = null;
    }
  }

  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);

  return () => {
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    clearTimeout(scrollReturnTimer);
    dot.remove();
    frame.remove();
  };
}
