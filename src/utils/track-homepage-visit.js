import { sendBeaconJSON, browserContext } from './beacon.js';

const SESSION_KEY = 'homepage-visit-sent';

export function trackHomepageVisit() {
  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // sessionStorage unavailable (private mode, embedded iframe, etc.)
  }

  sendBeaconJSON('/api/homepage-visit', {
    ...browserContext(),
    path: location.pathname,
  });
}
