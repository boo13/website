/**
 * Creates colored clone words inside each mask wrapper for a chromatic
 * aberration / color-trail effect during word-rise animations.
 *
 * Must be called AFTER SplitText has split the element into words with
 * mask wrappers. For each word, colored duplicates are inserted into
 * the same mask wrapper and positioned behind the original. Because
 * clones live inside the target element, they inherit any parent
 * transforms (e.g. Flip).
 *
 * The caller animates original words and clone words with different
 * staggers — the offset reveals colored trails during motion, and the
 * original (on top) covers clones once settled.
 *
 * @param {Element[]} words - Array of word elements from SplitText
 * @param {Object} [options]
 * @param {string[]} [options.colors=['oklch(0.804 0.146 220)','oklch(0.656 0.235 13)']] - Trail colors
 * @param {string} [options.blendMode='screen'] - CSS mix-blend-mode for clones
 * @returns {{ layers: { words: Element[], color: string }[], cleanup: Function }}
 */
export function createColorTrailWords(words, options = {}) {
  const { colors = ['oklch(0.804 0.146 220)', 'oklch(0.656 0.235 13)'], blendMode = 'screen' } = options;

  if (!words.length || !colors.length) {
    return { layers: [], cleanup() {} };
  }

  const layers = colors.map((color, colorIndex) => {
    const cloneWords = words.map((word) => {
      const maskWrapper = word.parentElement;

      // Ensure mask wrapper can anchor absolute clones
      maskWrapper.style.position = 'relative';

      // Original word sits on top
      word.style.position = 'relative';
      word.style.zIndex = String(colors.length + 1);

      const clone = word.cloneNode(true);
      clone.classList.add('color-trail-word');
      clone.setAttribute('aria-hidden', 'true');
      clone.style.position = 'absolute';
      clone.style.left = '0';
      clone.style.top = `${word.offsetTop}px`;
      clone.style.width = '100%';
      clone.style.zIndex = String(colorIndex + 1);
      clone.style.color = color;
      clone.style.mixBlendMode = blendMode;
      clone.style.pointerEvents = 'none';
      clone.style.overflow = 'clip';

      // Insert before original so it renders behind
      maskWrapper.insertBefore(clone, word);

      return clone;
    });

    return { words: cloneWords, color };
  });

  return {
    layers,
    cleanup() {
      layers.forEach((layer) => {
        layer.words.forEach((clone) => clone.remove());
      });
      // Restore inline styles on originals
      words.forEach((word) => {
        word.style.position = '';
        word.style.zIndex = '';
        if (word.parentElement) {
          word.parentElement.style.position = '';
        }
      });
    },
  };
}
