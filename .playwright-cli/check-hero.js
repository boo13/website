async page => {
  const el = await page.evaluate(() => {
    const h = document.querySelector("h1");
    if (!h) return null;
    const r = h.getBoundingClientRect();
    const cs = window.getComputedStyle(h);
    return {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      opacity: cs.opacity,
      visibility: cs.visibility,
      display: cs.display,
      text: h.textContent.trim(),
      transform: cs.transform,
    };
  });
  return el;
}
