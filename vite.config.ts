import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/app',
  base: './',
  build: {
    outDir: '../../dist/app',
    emptyOutDir: true,
  },
});
