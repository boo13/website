async page => {
  // Instrument the page to log clone opacity over time
  await page.addInitScript(() => {
    window.__opacityLog = [];
    const logInterval = setInterval(() => {
      const clones = document.querySelectorAll(".color-trail-word");
      if (clones.length > 0) {
        const data = Array.from(clones).map((el) => parseFloat(el.style.opacity || "1"));
        window.__opacityLog.push({ t: Math.round(performance.now()), opacities: data });
      }
    }, 50); // sample every 50ms
    // Stop logging after 5s
    setTimeout(() => clearInterval(logInterval), 5000);
  });

  await page.goto("http://localhost:5173/index2.html");
  await page.waitForTimeout(5500);

  const log = await page.evaluate(() => window.__opacityLog);
  // Show just a summary: first and last few entries
  const summary = {
    totalSamples: log.length,
    first3: log.slice(0, 3),
    last3: log.slice(-3),
  };
  return summary;
}
