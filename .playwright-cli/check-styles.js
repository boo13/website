async page => {
  const result = await page.evaluate(() => {
    const heroName = document.querySelector("h1");
    if (!heroName) return { error: "no hero name found" };
    const cs = window.getComputedStyle(heroName);
    const words = heroName.querySelectorAll(".word");
    const wordStyles = [];
    words.forEach((w, i) => {
      const wcs = window.getComputedStyle(w);
      wordStyles.push({
        i,
        textShadow: wcs.textShadow,
        color: wcs.color,
        zIndex: wcs.zIndex,
        position: wcs.position,
        mixBlendMode: wcs.mixBlendMode,
      });
    });
    const clones = heroName.querySelectorAll(".color-trail-word");
    return {
      tag: heroName.tagName,
      className: heroName.className,
      textShadow: cs.textShadow,
      color: cs.color,
      wordCount: words.length,
      cloneCount: clones.length,
      wordStyles,
    };
  });
  return result;
}
