import { gsap } from 'gsap';
import SplitText from 'gsap/SplitText';
import { createColorTrailWords } from './color-trail.js';

gsap.registerPlugin(SplitText);

// Default motion recipe for the mask-rise reveal.
// Override any value via textMaskRiseWords(targets, { ...overrides }).
const preset = {
  name: 'Mask Rise - Words',
  duration: 1.5,
  stagger: 0.2,
  ease: 'expo.out',
  yOffset: 30,
  delay: 0,
};

// Normalize single elements / selector strings / arrays into a clean array.
const toArray = (targets) => gsap.utils.toArray(targets).filter(Boolean);

// Splits text into masked words and animates them upward into view.
// Returns a cleanup function that reverts SplitText changes.
//
// When `colorTrail` is provided, colored clone words are inserted inside
// each mask wrapper and animated with progressively larger staggers.
// The effect is word-level (preserving the mask-rise feel) — clone words
// lag behind the original during motion, revealing colored trails.
//
// colorTrail: {
//   colors: ['#00d4ff', '#ff3366'],
//   blendMode: 'screen',
//   staggerOffset: 0.06,
// }
export function textMaskRiseWords(targets, overrides = {}) {
  const settings = { ...preset, ...overrides };
  const elements = toArray(targets);

  if (!elements.length) {
    return () => {};
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  if (prefersReducedMotion) {
    // Respect user preference: show content immediately, no animation.
    gsap.set(elements, { opacity: 1, y: 0 });
    return () => {};
  }

  // Ensure parent elements aren't stuck at opacity: 0 from CSS.
  gsap.set(elements, { opacity: 1 });

  const trailConfig = settings.colorTrail;
  const hasTrail =
    trailConfig && trailConfig.colors && trailConfig.colors.length;

  // Split all elements into words with mask wrappers (same for both paths).
  const splits = elements.map((element) => {
    const split = SplitText.create(element, {
      type: 'words',
      mask: 'words',
      tag: 'span',
      wordsClass: 'word',
    });

    // SplitText's auto-aria adds aria-label to parent + aria-hidden to children.
    // aria-label is prohibited on non-heading/non-interactive elements (div, p, span).
    const tag = element.tagName.toLowerCase();
    if (!/^h[1-6]$/.test(tag)) {
      element.removeAttribute('aria-label');
      split.words.forEach((word) => {
        word.removeAttribute('aria-hidden');
        if (word.parentElement !== element) {
          word.parentElement?.removeAttribute('aria-hidden');
        }
      });
    }

    return split;
  });

  let reverted = false;
  const revertSplits = () => {
    if (reverted) return;
    reverted = true;
    splits.forEach((split) => split.revert());
  };

  const tl = gsap.timeline({
    delay: settings.delay,
  });

  // --- Color trail path: word-level animation with clone words in mask wrappers ---
  if (hasTrail) {
    const trailCleanups = [];
    let trailsCleaned = false;

    const removeTrailClones = () => {
      if (trailsCleaned) return;
      trailsCleaned = true;
      trailCleanups.forEach((trail) => trail.cleanup());
    };

    tl.eventCallback('onComplete', removeTrailClones);

    splits.forEach((split) => {
      const trail = createColorTrailWords(split.words, {
        colors: trailConfig.colors,
        blendMode: trailConfig.blendMode || 'screen',
      });
      trailCleanups.push(trail);

      const staggerOffset = trailConfig.staggerOffset ?? 0.06;

      // Animate original words (on top, normal stagger)
      tl.fromTo(
        split.words,
        { opacity: 0, y: settings.yOffset },
        {
          opacity: 1,
          y: 0,
          duration: settings.duration,
          ease: settings.ease,
          stagger: settings.stagger,
        },
        0
      );

      // Clone animation per layer:
      // Each layer's y-animation starts later than the original, so clones
      // physically lag behind during the rise — creating visible color trails.
      // staggerOffset controls the delay (in seconds) per layer.
      trail.layers.forEach((layer, i) => {
        const layerDelay = (i + 1) * staggerOffset;

        // Hide clones until their delayed entrance
        tl.set(layer.words, { opacity: 0 }, 0);

        // Mirror original rise but delayed — spatial lag creates color trail
        tl.fromTo(
          layer.words,
          { opacity: 0, y: settings.yOffset },
          {
            opacity: 0.85,
            y: 0,
            duration: settings.duration,
            ease: settings.ease,
            stagger: settings.stagger,
          },
          layerDelay
        );

        // Fade out clones as they settle into final position
        tl.to(
          layer.words,
          {
            opacity: 0,
            duration: settings.duration * 0.25,
            ease: 'power2.in',
            stagger: settings.stagger,
          },
          layerDelay + settings.duration * 0.75
        );
      });
    });

    return () => {
      tl.kill();
      removeTrailClones();
      revertSplits();
    };
  }

  // --- Default path: word-level animation (unchanged) ---
  splits.forEach((split) => {
    // Animate each word from below while the word mask clips overflow.
    tl.fromTo(
      split.words,
      { opacity: 0, y: settings.yOffset },
      {
        opacity: 1,
        y: 0,
        duration: settings.duration,
        ease: settings.ease,
        stagger: settings.stagger,
      },
      0
    );
  });

  // Keep SplitText wrappers after animation to preserve layout height
  // and per-word shadows. Revert only via manual cleanup if needed.
  return () => {
    tl.kill();
    revertSplits();
  };
}

// Optional export if you want to inspect or reuse the default settings elsewhere.
export { preset as textMaskRisePreset };
