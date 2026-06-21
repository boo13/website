async page => {
  const viewport = await page.viewportSize();
  const sizeLabel = `${viewport.width}x${viewport.height}`;

  // Route-aware: set AUDIT_PATH (e.g. "/contact.html", "/projects/wyatt-earp/")
  // and optionally AUDIT_BASE. Defaults to the homepage on the Vite dev server.
  const BASE = (process.env.AUDIT_BASE || 'http://localhost:5173').replace(
    /\/$/,
    ''
  );
  const ROUTE = process.env.AUDIT_PATH || '/';
  const url = `${BASE}${ROUTE.startsWith('/') ? ROUTE : `/${ROUTE}`}`;

  // Per-route scroll targets. Each entry scrolls the section into view, waits,
  // then captures. Selectors are skipped gracefully if absent on the page.
  const ROUTE_SECTIONS = {
    home: [
      ['.portal-scene', 'hero', 1500],
      ['#featured', 'featured_work', 1000],
      ['#work', 'work_credits', 1000],
      ['#cta', 'cta', 800],
      ['#site-footer', 'footer', 1000],
    ],
    project: [
      ['.project-hero--video', 'hero', 1200],
      ['.project-credits', 'credits', 1000],
      ['.project-footer', 'footer', 800],
    ],
    caseStudy: [
      ['.case-study__hero', 'hero', 1200],
      ['.case-study__intro', 'intro', 800],
      ['.case-study__pair', 'pair_grid', 800],
      ['.case-study__triptych', 'triptych', 800],
      ['.case-study__closing', 'closing', 800],
      ['.project-credits', 'credits', 1000],
    ],
  };

  function routeKind(routePath) {
    if (routePath.includes('upnext-news')) return 'caseStudy';
    if (routePath.startsWith('/projects/')) return 'project';
    return 'home';
  }

  const kind = routeKind(ROUTE);
  const sections = ROUTE_SECTIONS[kind];
  const routeLabel = ROUTE.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home';

  const START_TIME = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionDir = `screenshots/audit-${routeLabel}-${sizeLabel}-${timestamp}`;

  const capture = async (id, sectionName, delay = 0) => {
    if (delay > 0) await page.waitForTimeout(delay);
    const elapsed = ((Date.now() - START_TIME) / 1000).toFixed(2);
    const fileName = `${id.toString().padStart(2, '0')}_${sectionName}_${sizeLabel}_t${elapsed}s.png`;
    await page.screenshot({ path: `${sessionDir}/${fileName}`, scale: 'css' });
  };

  console.log(`[AUDIT] ${url} (${kind}) at ${sizeLabel} → ${sessionDir}`);

  await page.goto(url);
  await page.reload();

  // Preloader runs only on the homepage; wait it out where present.
  const hasPreloader = await page.locator('.loading-overlay').count();
  if (hasPreloader) {
    await capture(1, 'preloader', 200);
    await page
      .waitForFunction(() => !document.querySelector('.loading-overlay'), {
        timeout: 15000,
      })
      .catch(() => {});
  }

  let idx = 2;
  for (const [selector, name, delay] of sections) {
    const locator = page.locator(selector).first();
    if (!(await locator.count())) continue;
    await locator.scrollIntoViewIfNeeded().catch(() => {});
    await capture(idx, name, delay);
    idx += 1;
  }

  console.log(`[AUDIT] Visual audit complete for ${routeLabel} ${sizeLabel}.`);
}
