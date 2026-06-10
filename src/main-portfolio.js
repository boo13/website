import './styles/portfolio.css';
import './styles/portfolio-lightbox.css';
import { initPortfolioGate } from './sections/portfolio-gate.js';
import { initPortfolioRows } from './sections/portfolio-rows.js';

const slug = document.body.dataset.portfolioSlug;
initPortfolioGate({
  slug,
  onUnlock: (data) => initPortfolioRows(data),
});
