import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        index2: resolve(import.meta.dirname, 'index2.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        resume: resolve(import.meta.dirname, 'resume.html'),
        sandbox: resolve(import.meta.dirname, 'sandbox.html'),
        wyatt: resolve(import.meta.dirname, 'case_study_wyatt.html'),
        wyatt2: resolve(import.meta.dirname, 'case_study_wyatt2.html'),
      },
    },
  },
});
