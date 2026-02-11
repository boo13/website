async page => {
  await page.goto("http://localhost:5173/index2.html");

  // Check clone states at multiple points
  const results = [];
  const checkClones = async (label) => {
    const state = await page.evaluate(() => {
      const clones = document.querySelectorAll(".color-trail-word");
      return Array.from(clones).map((el, i) => ({
        i,
        opacity: el.style.opacity,
        transform: el.style.transform,
      }));
    });
    results.push({ label, count: state.length, clones: state });
  };

  await page.waitForTimeout(400);
  await checkClones("400ms");

  await page.waitForTimeout(400);
  await checkClones("800ms");

  await page.waitForTimeout(400);
  await checkClones("1200ms");

  await page.waitForTimeout(600);
  await checkClones("1800ms");

  return results;
}
