import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    'cli/index': 'src/cli/index.ts',
  },
  format: ['esm'],
  target: 'node20',
  splitting: false,
  bundle: true,
  platform: 'node',
  external: ['vite', 'puppeteer'],
  outDir: 'dist',
});
