import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parsePreviewFolder } from '../core/parser.js';
import { readStore } from '../core/store.js';
import type { GuideData } from '../core/types.js';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

function copyDir(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    if (statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

export async function runBuild(projectRoot: string): Promise<void> {
  const outDir = join(projectRoot, 'guidepilot-dist');
  const previewDir = join(projectRoot, 'preview');

  if (!existsSync(previewDir)) {
    console.error('No preview/ folder found. Run: guidepilot init');
    process.exit(1);
  }

  console.log('Building guide...');

  const appDistDir = join(__dirname, '..', 'app');
  copyDir(appDistDir, outDir);

  const previewOutDir = join(outDir, 'preview');
  copyDir(previewDir, previewOutDir);

  const sections = parsePreviewFolder(previewDir);
  const store = readStore(projectRoot);
  const guideData: GuideData = { sections, store };
  writeFileSync(join(outDir, 'guide-data.json'), JSON.stringify(guideData, null, 2), 'utf-8');

  console.log(`Guide built to: ${outDir}`);
  console.log('Deploy guidepilot-dist/ to GitHub Pages or any static host.');
}
