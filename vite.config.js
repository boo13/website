import { resolve } from 'path';
import { readdirSync, existsSync } from 'node:fs';
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

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [injectGallery()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        legacy: resolve(import.meta.dirname, 'index-legacy.html'),
        aiplaylists: resolve(import.meta.dirname, 'aiplaylists.html'),
        medialog: resolve(import.meta.dirname, 'medialog.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        resume: resolve(import.meta.dirname, 'resume.html'),
        sandbox: resolve(import.meta.dirname, 'sandbox.html'),
        wyatt: resolve(import.meta.dirname, 'case_study_wyatt.html'),
        experiments: resolve(import.meta.dirname, 'experiments/index.html'),
        ...discoverProjects(),
        ...discoverExperiments(),
      },
    },
  },
});
