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
        work: resolve(import.meta.dirname, 'work.html'),
        contact: resolve(import.meta.dirname, 'contact.html'),
        credits: resolve(import.meta.dirname, 'credits.html'),
      },
    },
  },
});
