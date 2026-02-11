async page => {
  // Inject a MutationObserver BEFORE page loads to catch clone creation/removal
  await page.addInitScript(() => {
    window.__trailDebug = { created: 0, removed: 0, log: [] };
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.classList && node.classList.contains("color-trail-word")) {
            window.__trailDebug.created++;
            window.__trailDebug.log.push({
              t: performance.now(),
              action: "add",
              text: node.textContent.trim(),
            });
          }
        }
        for (const node of m.removedNodes) {
          if (node.classList && node.classList.contains("color-trail-word")) {
            window.__trailDebug.removed++;
            window.__trailDebug.log.push({
              t: performance.now(),
              action: "remove",
              text: node.textContent.trim(),
            });
          }
        }
      }
    });
    document.addEventListener("DOMContentLoaded", () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  await page.goto("http://localhost:5173/index2.html");
  await page.waitForTimeout(3000);

  const debug = await page.evaluate(() => window.__trailDebug);
  return debug;
}
