import { resolve } from 'path';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { defineConfig } from 'vite';
import injectGallery from './build/inject-gallery.js';

// Auto-discover project pages: projects/*/index.html
function discoverProjects() {
  try {
    return Object.fromEntries(
      readdirSync('projects', { withFileTypes: true })
        .filter(
          (d) =>
            d.isDirectory() && existsSync(resolve('projects', d.name, 'index.html')),
        )
        .map((d) => [
          `project-${d.name}`,
          resolve(import.meta.dirname, `projects/${d.name}/index.html`),
        ]),
    );
  } catch {
    return {};
  }
}

// Auto-discover portfolio variant pages: portfolio/*/index.html
function discoverPortfolio() {
  try {
    return Object.fromEntries(
      readdirSync('portfolio', { withFileTypes: true })
        .filter(
          (d) =>
            d.isDirectory() && existsSync(resolve('portfolio', d.name, 'index.html')),
        )
        .map((d) => [
          `portfolio-${d.name}`,
          resolve(import.meta.dirname, `portfolio/${d.name}/index.html`),
        ]),
    );
  } catch {
    return {};
  }
}

// Auto-discover experiment pages: experiments/*/index.html
function discoverExperiments() {
  try {
    return Object.fromEntries(
      readdirSync('experiments', { withFileTypes: true })
        .filter(
          (d) =>
            d.isDirectory() && existsSync(resolve('experiments', d.name, 'index.html')),
        )
        .map((d) => [
          `experiment-${d.name}`,
          resolve(import.meta.dirname, `experiments/${d.name}/index.html`),
        ]),
    );
  } catch {
    return {};
  }
}

// Dev middleware: serves plaintext portfolio data so the gate fast-paths
// without requiring a re-encrypt on every JSON edit.
function portfolioCleanUrlRedirect() {
  const redirect = (req, res, next) => {
    const [pathname, query = ''] = (req.url ?? '').split('?');
    const match = pathname.match(/^\/portfolio\/([a-z0-9-]+)$/);
    if (!match) return next();

    const indexPath = resolve(import.meta.dirname, `portfolio/${match[1]}/index.html`);
    if (!existsSync(indexPath)) return next();

    res.statusCode = 308;
    res.setHeader('Location', `${pathname}/${query ? `?${query}` : ''}`);
    res.end();
  };

  return {
    name: 'portfolio-clean-url-redirect',
    configureServer(server) {
      server.middlewares.use(redirect);
    },
    configurePreviewServer(server) {
      server.middlewares.use(redirect);
    },
  };
}

function portfolioDevServer() {
  return {
    name: 'portfolio-dev-data',
    configureServer(server) {
      server.middlewares.use('/data/portfolios/', (req, res, next) => {
        const match = req.url.match(/^\/([a-z0-9-]+)\.enc\.json$/);
        if (!match) return next();
        const slug = match[1];
        const dataPath = resolve(import.meta.dirname, `portfolio-data/${slug}.json`);
        try {
          const raw = readFileSync(dataPath, 'utf8');
          const data = JSON.parse(raw);
          const payload = JSON.stringify({ ...data, dev: true, projects: data.projects ?? [] });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(payload);
        } catch {
          // No source file — serve a 404 the gate handles gracefully
          next();
        }
      });
    },
  };
}

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [injectGallery(), portfolioCleanUrlRedirect(), portfolioDevServer()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        aiplaylists: resolve(import.meta.dirname, 'aiplaylists.html'),
        medialog: resolve(import.meta.dirname, 'medialog.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        resume: resolve(import.meta.dirname, 'resume.html'),
        sandbox: resolve(import.meta.dirname, 'sandbox.html'),
        wyatt: resolve(import.meta.dirname, 'case-study-wyatt.html'),
        experiments: resolve(import.meta.dirname, 'experiments/index.html'),
        ...discoverPortfolio(),
        ...discoverProjects(),
        ...discoverExperiments(),
      },
    },
  },
});
