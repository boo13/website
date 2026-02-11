async page => {
  await page.addInitScript(() => {
    window.__opacityLog = [];
    const logInterval = setInterval(() => {
      const clones = document.querySelectorAll(".color-trail-word");
      if (clones.length > 0) {
        const data = Array.from(clones).map((el) =>
          Math.round(parseFloat(el.style.opacity || "1") * 1000) / 1000
        );
        window.__opacityLog.push({ t: Math.round(performance.now()), o: data });
      }
    }, 100);
    setTimeout(() => clearInterval(logInterval), 5000);
  });

  await page.goto("http://localhost:5173/index2.html");
  await page.waitForTimeout(5500);

  const log = await page.evaluate(() => window.__opacityLog);
  return log;
}
