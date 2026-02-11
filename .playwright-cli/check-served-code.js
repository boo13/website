async page => {
  // Wait for animation to complete
  await page.waitForTimeout(3000);

  // Check what code is actually in the served text-mask-rise module
  const result = await page.evaluate(async () => {
    // Fetch the source file directly from Vite dev server
    const resp = await fetch("/src/animations/text-mask-rise.js");
    const text = await resp.text();

    // Look for key signatures of each version
    const hasOnUpdate = text.includes("onUpdate");
    const hasKeyframes = text.includes("keyframes");
    const hasFadeStart = text.includes("fadeStart");
    const hasProgress = text.includes("this.progress()");

    // Extract the clone animation section
    const cloneSection = text.substring(
      text.indexOf("trail.layers.forEach"),
      text.indexOf("trail.layers.forEach") + 800
    );

    return {
      hasOnUpdate,
      hasKeyframes,
      hasFadeStart,
      hasProgress,
      cloneSection,
    };
  });
  return result;
}
