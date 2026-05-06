import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/app',
  base: './',
  build: {
    outDir: resolve(__dirname, 'dist/app'),
    emptyOutDir: true,
  },
});
