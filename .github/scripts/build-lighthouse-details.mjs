#!/usr/bin/env node

import fs from 'fs';

const [,, reportPath, summaryPath] = process.argv;

if (!reportPath || !fs.existsSync(reportPath)) {
  console.error('Lighthouse report file is missing.');
  process.exit(1);
}

const readJsonIfExists = (path) => {
  if (!path || !fs.existsSync(path)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(path, 'utf8'));
};

const report = readJsonIfExists(reportPath);
if (!report) {
  console.error('Unable to parse Lighthouse report.');
  process.exit(1);
}

const summary = readJsonIfExists(summaryPath);

const categories = (summary && summary.categories) || report.categories || {};
const pct = (value) => (typeof value === 'number' ? `${Math.round(value * 100)}%` : 'n/a');

const catLines = [
  `Performance: ${pct(categories.performance && categories.performance.score)}`,
  `Accessibility: ${pct(categories.accessibility && categories.accessibility.score)}`,
  `Best Practices: ${pct(categories['best-practices'] && categories['best-practices'].score)}`,
  `SEO: ${pct(categories.seo && categories.seo.score)}`,
];

const audits = Object.values(report.audits || {});
const failingAudits = audits
  .filter((audit) => typeof audit.score === 'number' && audit.score < 1)
  .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))
  .slice(0, 5)
  .map((audit) => {
    const score = typeof audit.score === 'number' ? `${Math.round(audit.score * 100)}%` : 'n/a';
    const extra = audit.displayValue || audit.explanation || '';
    return `- ${audit.id}: ${audit.title} (${score})${extra ? ` - ${extra}` : ''}`;
  });

const details = [
  'Latest Lighthouse scores:',
  ...catLines,
  '',
  'Top failing audits:',
  failingAudits.length ? failingAudits.join('\n') : 'All monitored audits passed in the parsed report.',
].join('\n');

fs.writeFileSync('lighthouse-details.md', details + '\n');
