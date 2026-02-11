async page => {
  await page.addInitScript(() => {
    window.__trailDebug = { created: 0, removed: 0, log: [] };
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.classList && node.classList.contains("color-trail-word")) {
            window.__trailDebug.created++;
            window.__trailDebug.log.push({ t: performance.now(), action: "add" });
          }
        }
        for (const node of m.removedNodes) {
          if (node.classList && node.classList.contains("color-trail-word")) {
            window.__trailDebug.removed++;
            window.__trailDebug.log.push({ t: performance.now(), action: "remove" });
          }
        }
      }
    });
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  await page.goto("http://localhost:5173/index2.html");

  // Wait 6s — well beyond animation completion
  await page.waitForTimeout(6000);

  const debug = await page.evaluate(() => window.__trailDebug);

  // Also check current state of any remaining clones
  const cloneState = await page.evaluate(() => {
    const clones = document.querySelectorAll(".color-trail-word");
    return Array.from(clones).map((el, i) => ({
      i,
      opacity: el.style.opacity,
      transform: el.style.transform,
    }));
  });

  return { debug, cloneState };
}
