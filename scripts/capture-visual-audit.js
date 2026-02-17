async page => {
  const viewport = await page.viewportSize();
  const sizeLabel = `${viewport.width}x${viewport.height}`;

  const BASE_URL = "http://localhost:5173/";
  const START_TIME = Date.now();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionDir = `screenshots/audit-${sizeLabel}-${timestamp}`;

  const capture = async (id, sectionName, delay = 0) => {
    if (delay > 0) await page.waitForTimeout(delay);
    const elapsed = ((Date.now() - START_TIME) / 1000).toFixed(2);
    const fileName = `${id.toString().padStart(2, '0')}_${sectionName}_${sizeLabel}_t${elapsed}s.png`;
    const path = `${sessionDir}/${fileName}`;
    await page.screenshot({ path, scale: 'css' });
  };

  console.log(`[AUDIT] Starting visual audit for ${sizeLabel} in ${sessionDir}`);

  await page.goto(BASE_URL);
  await page.reload();
  await capture(1, 'preloader_init', 200);
  await page.waitForTimeout(400);
  await capture(2, 'preloader_exit', 0);
  await page.waitForFunction(() => !document.querySelector('.loading-overlay'), { timeout: 15000 });
  await capture(3, 'hero_entry', 500);
  await capture(4, 'hero_settled', 1500);
  await page.locator('.about-intro-section').scrollIntoViewIfNeeded();
  await capture(5, 'about_intro', 800);
  await page.locator('.slide-goes-big').scrollIntoViewIfNeeded();
  await capture(6, 'about_slides_epic', 1200);
  await page.locator('.slide-in-your-hand').scrollIntoViewIfNeeded();
  await capture(7, 'about_slides_hand', 1200);
  await page.locator('#work').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const el = document.querySelector('#work');
    if (el) window.scrollTo(0, el.offsetTop + 400);
  });
  await capture(8, 'featured_work_reveal', 1000);
  await page.locator('#credits').scrollIntoViewIfNeeded();
  await capture(9, 'credits_table', 1000);
  await page.locator('#clients').scrollIntoViewIfNeeded();
  await capture(10, 'clients_marquee', 800);
  await page.locator('.site-footer').scrollIntoViewIfNeeded();
  await capture(11, 'footer_final', 1000);

  console.log(`[AUDIT] Visual audit complete for ${sizeLabel}.`);
}
