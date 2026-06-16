import { sendBeaconJSON, browserContext } from './beacon.js';

export function trackPortfolioUnlock(slug) {
  sendBeaconJSON('/api/portfolio-unlock', {
    ...browserContext(),
    slug,
  });
}
