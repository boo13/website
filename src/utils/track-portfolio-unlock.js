export function trackPortfolioUnlock(slug) {
  const payload = JSON.stringify({
    slug,
    referrer: document.referrer,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: screen.width,
    screenHeight: screen.height,
    language: navigator.language,
  });

  const blob = new Blob([payload], { type: 'application/json' });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/portfolio-unlock', blob);
  } else {
    fetch('/api/portfolio-unlock', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
}
