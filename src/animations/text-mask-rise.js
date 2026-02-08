import { gsap } from 'gsap';
import SplitText from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

// Default motion recipe for the mask-rise reveal.
// Override any value via textMaskRiseWords(targets, { ...overrides }).
const preset = {
  name: 'Mask Rise - Words',
  duration: 1.5,
  stagger: 0.2,
  ease: 'expo.out',
  yOffset: 30,
};

// Normalize single elements / selector strings / arrays into a clean array.
const toArray = (targets) => gsap.utils.toArray(targets).filter(Boolean);

// Splits text into masked words and animates them upward into view.
// Returns a cleanup function that reverts SplitText changes.
export function textMaskRiseWords(targets, overrides = {}) {
  const settings = { ...preset, ...overrides };
  const elements = toArray(targets);

  if (!elements.length) {
    return () => {};
  }

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)',
  ).matches;

  if (prefersReducedMotion) {
    // Respect user preference: show content immediately, no animation.
    gsap.set(elements, { opacity: 1, y: 0 });
    return () => {};
  }

  const splits = elements.map((element) =>
    SplitText.create(element, {
      type: 'words',
      mask: 'words',
      tag: 'span',
      wordsClass: 'word',
    }),
  );

  splits.forEach((split) => {
    // Animate each word from below while the word mask clips overflow.
    gsap.fromTo(
      split.words,
      { opacity: 0, y: settings.yOffset },
      {
        opacity: 1,
        y: 0,
        duration: settings.duration,
        ease: settings.ease,
        stagger: settings.stagger,
      },
    );
  });

  return () => {
    splits.forEach((split) => split.revert());
  };
}

// Optional export if you want to inspect or reuse the default settings elsewhere.
export { preset as textMaskRisePreset };
