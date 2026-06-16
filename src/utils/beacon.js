/** Send JSON data to `url` via sendBeacon (with fetch keepalive fallback). */
export function sendBeaconJSON(url, data) {
  const payload = JSON.stringify(data);
  const blob = new Blob([payload], { type: 'application/json' });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, blob);
  } else {
    fetch(url, {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  }
}

/** Common analytics fields collected from the browser environment. */
export function browserContext() {
  return {
    referrer: document.referrer,
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screenWidth: screen.width,
    screenHeight: screen.height,
    language: navigator.language,
  };
}
