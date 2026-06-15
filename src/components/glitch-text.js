const PROFILES = {
  default: {
    tail: 0.06,
    maxEnergy: 0.68,
    restEnergy: 0.42,
    driftBase: 34,
    driftMax: 16,
    opacityMax: 0.54,
    opacityBase: 0.2,
    opacityGain: 0.44,
    trailMax: 0.46,
    trailOpacityBase: 0.09,
    trailOpacityGain: 0.5,
    bandBase: 9,
    bandRange: 17,
    tailBandBase: 6,
    tailBandRange: 13,
    shadow: 3.7,
    trailBase: 0.024,
    trailRange: 0.042,
  },
  detail: {
    tail: 0.045,
    maxEnergy: 0.78,
    restEnergy: 0.5,
    driftBase: 42,
    driftMax: 18,
    opacityMax: 0.74,
    opacityBase: 0.36,
    opacityGain: 0.46,
    trailMax: 0.58,
    trailOpacityBase: 0.18,
    trailOpacityGain: 0.38,
    bandBase: 7,
    bandRange: 16,
    tailBandBase: 5,
    tailBandRange: 12,
    shadow: 5.4,
    trailBase: 0.03,
    trailRange: 0.056,
  },
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const pct = (value) => `${(clamp(value, -0.08, 1.08) * 100).toFixed(2)}%`;

function trailClip(head, lag, width) {
  const dx = head.x - lag.x;
  const dy = head.y - lag.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = (-dy / length) * width;
  const ny = (dx / length) * width;
  const points = [
    [lag.x + nx, lag.y + ny],
    [head.x + nx, head.y + ny],
    [head.x - nx, head.y - ny],
    [lag.x - nx, lag.y - ny],
  ];
  return `polygon(${points.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(', ')})`;
}

export function setupGlitchText(target) {
  const isDetail = target.classList.contains('glitch-text--detail');
  const profile = isDetail ? PROFILES.detail : PROFILES.default;

  const pointer = { x: 0.5, y: 0.5 };
  const tail = { x: 0.5, y: 0.5 };
  const last = { x: 0.5, y: 0.5, time: performance.now() };
  let active = false;
  let frame = 0;
  let idleTimer = 0;
  let speed = 0;

  const setVar = (name, value) => target.style.setProperty(name, value);

  const renderGlitch = () => {
    frame = 0;

    tail.x += (pointer.x - tail.x) * profile.tail;
    tail.y += (pointer.y - tail.y) * profile.tail;
    speed *= active ? 0.92 : 0.82;

    const pathDistance = Math.hypot(pointer.x - tail.x, pointer.y - tail.y);
    const rawEnergy = pathDistance * 4.8 + speed * 0.62;
    const energy = active
      ? clamp(0.22 + rawEnergy * 0.52, 0, profile.maxEnergy)
      : clamp(rawEnergy * 0.38, 0, profile.restEnergy);
    const now = performance.now();
    const lineJitter =
      Math.sin(now * 0.04 + pointer.x * 13) * 0.006 +
      Math.sin(now * 0.11 + pointer.y * 19) * 0.003;
    const rawDrift =
      (pointer.x - tail.x) * profile.driftBase +
      Math.sin(now * 0.025 + pointer.y * 18) * (1.2 + energy * 2.4);
    const drift = clamp(rawDrift, -profile.driftMax, profile.driftMax);
    const opacity =
      active || energy > 0.025
        ? Math.min(
            profile.opacityMax,
            profile.opacityBase + energy * profile.opacityGain
          )
        : 0;
    const trailOpacity =
      active || energy > 0.025
        ? Math.min(
            profile.trailMax,
            profile.trailOpacityBase + energy * profile.trailOpacityGain
          )
        : 0;

    setVar('--glitch-y', pct(pointer.y + lineJitter));
    setVar('--glitch-tail-y', pct(tail.y - lineJitter * 0.7));
    setVar(
      '--glitch-band',
      `${(profile.bandBase + energy * profile.bandRange).toFixed(2)}px`
    );
    setVar(
      '--glitch-tail-band',
      `${(profile.tailBandBase + energy * profile.tailBandRange).toFixed(2)}px`
    );
    setVar('--glitch-shift', `${drift.toFixed(2)}px`);
    setVar('--glitch-counter-shift', `${(-drift * 0.56).toFixed(2)}px`);
    setVar(
      '--glitch-red-shadow',
      `${(-0.9 - energy * profile.shadow).toFixed(2)}px`
    );
    setVar(
      '--glitch-blue-shadow',
      `${(0.9 + energy * profile.shadow).toFixed(2)}px`
    );
    // Outer spectral pair — ~1.5× the inner offset, same energy scaling
    setVar(
      '--glitch-cyan-shadow',
      `${(-1.35 - energy * profile.shadow * 1.5).toFixed(2)}px`
    );
    setVar(
      '--glitch-yellow-shadow',
      `${(1.35 + energy * profile.shadow * 1.5).toFixed(2)}px`
    );
    setVar('--glitch-grit-x', `${Math.round(now * 0.06) % 29}px`);
    setVar('--glitch-grit-y', `${Math.round(now * 0.09) % 11}px`);
    setVar('--glitch-opacity', opacity.toFixed(3));
    setVar('--trail-opacity', trailOpacity.toFixed(3));
    setVar(
      '--trail-clip',
      trailClip(pointer, tail, profile.trailBase + energy * profile.trailRange)
    );

    if (active || energy > 0.012 || speed > 0.01) {
      frame = requestAnimationFrame(renderGlitch);
      return;
    }

    setVar('--glitch-opacity', '0');
    setVar('--trail-opacity', '0');
  };

  const start = () => {
    if (!frame) {
      frame = requestAnimationFrame(renderGlitch);
    }
  };

  const updatePointer = (event) => {
    const rect = target.getBoundingClientRect();
    const x = clamp((event.clientX - rect.left) / rect.width);
    const y = clamp((event.clientY - rect.top) / rect.height);
    const now = performance.now();
    const elapsed = Math.max(16, now - last.time) / 1000;
    const distance = Math.hypot(x - last.x, y - last.y);

    pointer.x = x;
    pointer.y = y;
    speed = Math.max(speed, clamp(distance / elapsed) * 0.18);
    last.x = x;
    last.y = y;
    last.time = now;
    active = true;

    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      active = false;
    }, 150);

    start();
  };

  const handleLeave = () => {
    active = false;
    start();
  };

  target.addEventListener('pointerenter', updatePointer);
  target.addEventListener('pointermove', updatePointer);
  target.addEventListener('pointerleave', handleLeave);

  return function cleanup() {
    target.removeEventListener('pointerenter', updatePointer);
    target.removeEventListener('pointermove', updatePointer);
    target.removeEventListener('pointerleave', handleLeave);
    if (frame) {
      cancelAnimationFrame(frame);
      frame = 0;
    }
    window.clearTimeout(idleTimer);
  };
}

export function initGlitchText(root = document) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');

  if (!finePointer.matches || reduceMotion.matches) return () => {};

  const targets = [...root.querySelectorAll('[data-glitch-text]')];
  const cleanups = targets.map(setupGlitchText);

  return function cleanup() {
    cleanups.forEach((fn) => fn());
  };
}
