async page => {
  await page.goto("http://localhost:5173/index2.html");

  // Capture at key moments during the animation
  const shots = [300, 600, 900, 1200, 1800];
  let start = Date.now();

  for (const ms of shots) {
    const elapsed = Date.now() - start;
    const wait = ms - elapsed;
    if (wait > 0) await page.waitForTimeout(wait);
    await page.screenshot({ path: `hero-trail-${ms}ms.png`, scale: "css" });
  }

  // Check clone state
  const state = await page.evaluate(() => {
    const clones = document.querySelectorAll(".color-trail-word");
    const arr = [];
    clones.forEach((el, i) => {
      arr.push({
        i,
        opacity: el.style.opacity,
        transform: el.style.transform,
        color: el.style.color,
      });
    });
    return { count: clones.length, clones: arr };
  });

  return state;
}
