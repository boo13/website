async page => {
  // Navigate and capture screenshots at multiple points during the animation
  await page.goto("http://localhost:5173/index2.html");

  // Capture at 0.5s (mid-animation, clones should be rising)
  await page.waitForTimeout(500);
  await page.screenshot({ path: "hero-t500ms.png", scale: "css" });

  // Capture at 1.0s (near end, clones should be fading)
  await page.waitForTimeout(500);
  await page.screenshot({ path: "hero-t1000ms.png", scale: "css" });

  // Capture at 1.5s (animation should be settling)
  await page.waitForTimeout(500);
  await page.screenshot({ path: "hero-t1500ms.png", scale: "css" });

  // Check clone state at each point
  const check = await page.evaluate(() => {
    const clones = document.querySelectorAll(".color-trail-word");
    const data = [];
    clones.forEach((el, i) => {
      const cs = window.getComputedStyle(el);
      data.push({
        i,
        opacity: cs.opacity,
        color: cs.color,
        transform: el.style.transform,
        yFromGsap: el._gsap ? el._gsap.y : "n/a",
      });
    });
    return { cloneCount: clones.length, clones: data };
  });

  return check;
}
