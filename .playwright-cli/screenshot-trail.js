async page => {
  await page.goto("http://localhost:5173/index2.html");

  // Animation starts ~2.3s after page load in headless
  // Take screenshots relative to that timing
  await page.waitForTimeout(2600);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: "trail-during.png", scale: "css" });

  await page.waitForTimeout(800);
  await page.screenshot({ path: "trail-settling.png", scale: "css" });

  await page.waitForTimeout(1000);
  await page.screenshot({ path: "trail-after.png", scale: "css" });

  // Check clone opacity at this point
  const state = await page.evaluate(() => {
    const clones = document.querySelectorAll(".color-trail-word");
    return Array.from(clones).map((el) => ({
      opacity: el.style.opacity,
      text: el.textContent,
    }));
  });

  return { cloneCount: state.length, clones: state };
}
