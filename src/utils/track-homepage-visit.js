const SESSION_KEY = 'homepage-visit-sent';

export function trackHomepageVisit() {
  if (sessionStorage.getItem(SESSION_KEY)) return;
  sessionStorage.setItem(SESSION_KEY, '1');

  const payload = JSON.stringify({
    referrer: document.referrer,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: screen.width,
    screenHeight: screen.height,
    language: navigator.language,
    path: location.pathname,
  });

  const blob = new Blob([payload], { type: 'application/json' });

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/homepage-visit', blob);
  } else {
    fetch('/api/homepage-visit', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
}
