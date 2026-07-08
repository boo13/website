import { gsap } from '../animations/scroll-defaults.js';
import { prefersReducedMotion, canHover } from '../utils/dom.js';

export function initCustomCursor() {
  if (!canHover()) return () => {};
  if (prefersReducedMotion()) return () => {};

  document.body.classList.add('has-custom-cursor');

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
  const DOT_IDLE_OPACITY = 1;
  const DOT_ACTIVE_OPACITY = 0.35;
  // Leave settles slightly faster so corners never lag behind the pointer.
  const CORNER_ENTER = 0.5;
  const CORNER_LEAVE = 0.45;

  let lastMouseX = 0;
  let lastMouseY = 0;
  let hasMousePosition = false;
  let dotTargetOpacity = DOT_IDLE_OPACITY;
  // When true the frame is wrapped to a target and must not follow the cursor.
  let framing = false;

  const dotX = gsap.quickTo(dot, 'x', { duration: 0.3, ease: 'power2.out' });
  const dotY = gsap.quickTo(dot, 'y', { duration: 0.3, ease: 'power2.out' });
  const frameX = gsap.quickTo(frame, 'x', {
    duration: 0.7,
    ease: 'power2.out',
  });
  const frameY = gsap.quickTo(frame, 'y', {
    duration: 0.7,
    ease: 'power2.out',
  });
  const snapFrameX = gsap.quickTo(frame, 'x', {
    duration: 0.4,
    ease: 'power3.out',
  });
  const snapFrameY = gsap.quickTo(frame, 'y', {
    duration: 0.4,
    ease: 'power3.out',
  });
  const snapFrameW = gsap.quickTo(frame, 'width', {
    duration: 0.4,
    ease: 'power3.out',
  });
  const snapFrameH = gsap.quickTo(frame, 'height', {
    duration: 0.4,
    ease: 'power3.out',
  });

  function setDotOpacity(opacity, duration = 0.3) {
    dotTargetOpacity = opacity;
    gsap.to(dot, { opacity, scale: 1, duration, overwrite: 'auto' });
  }

  function handleMouseMove(e) {
    hasMousePosition = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    gsap.to(frame, { opacity: 1, duration: 0.3, overwrite: 'auto' });
    gsap.to(dot, {
      opacity: dotTargetOpacity,
      scale: 1,
      duration: 0.3,
      overwrite: 'auto',
    });
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

  function setFrameToSnapTarget() {
    if (!snappedEl) return;
    const { x, y, w, h } = snapFrameToEl(snappedEl);
    snapFrameX(x);
    snapFrameY(y);
    snapFrameW(w);
    snapFrameH(h);
  }

  let lastScrollY = window.scrollY;
  let lastTickScrollX = window.scrollX;
  let lastTickScrollY = window.scrollY;
  let scrollRetargetUntil = 0;
  let scrollReturnTimer;
  function handleScroll() {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    lastScrollY = currentScrollY;
    scrollRetargetUntil = performance.now() + 900;
    // Snapped re-pinning is handled per-frame by onTick (gsap.ticker) so it
    // stays in sync with ScrollSmoother's transform-based scroll. Nothing to do
    // here when framing — just handle the non-snapped cursor nudge effect.
    if (framing) return;
    const offset = Math.min(Math.max(delta * 1.2, -5), 5);
    frameY(lastMouseY + offset);
    clearTimeout(scrollReturnTimer);
    scrollReturnTimer = setTimeout(() => frameY(lastMouseY), 80);
  }

  function handleInteractiveEnter() {
    const d = 5;
    setDotOpacity(DOT_ACTIVE_OPACITY);
    gsap.to(corners.lt, {
      x: -d,
      y: -d,
      duration: CORNER_ENTER,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    gsap.to(corners.rt, {
      x: d,
      y: -d,
      duration: CORNER_ENTER,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    gsap.to(corners.lb, {
      x: -d,
      y: d,
      duration: CORNER_ENTER,
      ease: 'power2.out',
      overwrite: 'auto',
    });
    gsap.to(corners.rb, {
      x: d,
      y: d,
      duration: CORNER_ENTER,
      ease: 'power2.out',
      overwrite: 'auto',
    });
  }

  function handleInteractiveLeave() {
    setDotOpacity(DOT_IDLE_OPACITY);
    Object.values(corners).forEach((c) =>
      gsap.to(c, {
        x: 0,
        y: 0,
        duration: CORNER_LEAVE,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    );
  }

  let snappedEl = null;

  function snapToTarget(el) {
    framing = true;
    snappedEl = el;
    el.classList.add('is-cursor-snapping');
    setDotOpacity(DOT_ACTIVE_OPACITY, 0.2);
    setFrameToSnapTarget();
  }

  function resetFrame() {
    framing = false;
    if (snappedEl) {
      snappedEl.classList.remove('is-cursor-snapping');
      snappedEl = null;
    }
    // Kick them toward the last cursor position so the frame catches up even
    // without a follow-up mousemove (snap target scrolling out of view, etc).
    frameX(lastMouseX);
    frameY(lastMouseY);
    setDotOpacity(DOT_IDLE_OPACITY);
    snapFrameW(BASE_W);
    snapFrameH(BASE_H);
    Object.values(corners).forEach((c) =>
      gsap.to(c, {
        x: 0,
        y: 0,
        duration: CORNER_LEAVE,
        ease: 'power2.out',
        overwrite: 'auto',
      })
    );
  }

  // Delegated hover handling so dynamically-added targets (e.g. credits titles
  // built after a fetch) are covered without re-wiring. mouseover/mouseout
  // bubble, unlike mouseenter/mouseleave.
  const SNAP_SELECTOR = '[data-cursor-snap]';
  const DEFAULT_SELECTOR = '[data-cursor-default]';
  const EXPAND_SELECTOR = 'a, button';
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

  function resolveTargetAt(node) {
    const { snap, expand } = targetFor(node);

    if (snap) {
      if (activeExpandEl) {
        handleInteractiveLeave();
        activeExpandEl = null;
      }
      if (snap !== activeSnapEl) {
        if (activeSnapEl) resetFrame();
        activeSnapEl = snap;
        snapToTarget(snap);
      }
      return;
    }

    if (activeSnapEl) {
      resetFrame();
      activeSnapEl = null;
    }

    if (expand) {
      if (expand !== activeExpandEl) {
        if (activeExpandEl) handleInteractiveLeave();
        activeExpandEl = expand;
        handleInteractiveEnter();
      }
      return;
    }

    if (activeExpandEl) {
      handleInteractiveLeave();
      activeExpandEl = null;
    }
  }

  function onTick() {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    const scrollChanged =
      scrollX !== lastTickScrollX || scrollY !== lastTickScrollY;

    if (scrollChanged) {
      lastTickScrollX = scrollX;
      lastTickScrollY = scrollY;
      scrollRetargetUntil = performance.now() + 900;
    }

    if (
      hasMousePosition &&
      (scrollChanged || performance.now() < scrollRetargetUntil)
    ) {
      resolveTargetAt(document.elementFromPoint(lastMouseX, lastMouseY));
    }

    if (framing && snappedEl) setFrameToSnapTarget();
  }

  function handleMouseOver(e) {
    resolveTargetAt(e.target);
  }

  function handleMouseOut(e) {
    resolveTargetAt(e.relatedTarget);
  }

  document.addEventListener('mousemove', handleMouseMove);
  window.addEventListener('scroll', handleScroll, { passive: true });
  gsap.ticker.add(onTick);

  document.addEventListener('mouseover', handleMouseOver);
  document.addEventListener('mouseout', handleMouseOut);

  return () => {
    if (snappedEl) snappedEl.classList.remove('is-cursor-snapping');
    document.body.classList.remove('has-custom-cursor');
    document.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('scroll', handleScroll);
    document.removeEventListener('mouseover', handleMouseOver);
    document.removeEventListener('mouseout', handleMouseOut);
    gsap.ticker.remove(onTick);
    clearTimeout(scrollReturnTimer);
    dot.remove();
    frame.remove();
  };
}
