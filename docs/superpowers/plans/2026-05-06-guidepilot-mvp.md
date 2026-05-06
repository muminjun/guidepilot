# Guidepilot MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Guidepilot — a Node.js CLI that reads a `preview/` folder, serves a Konva.js annotation + Tiptap block editor, and exports to static HTML, PDF, and Notion.

**Architecture:** `guidepilot dev` starts an Express server that serves a pre-built React app alongside API routes. The React app fetches `/guide-data.json` (parsed `preview/` + `.guidepilot/data.json`) and PUTs saved annotations/blocks to `/api/data`. `guidepilot build` writes static files to `guidepilot-dist/`. Annotations are keyed by Screen ID (folder/filename), so replacing an image never loses annotation data.

**Tech Stack:** Node.js 20+, TypeScript, Commander.js, Express, Vite 5, React 18, Konva.js + react-konva, Tiptap 2, Puppeteer, @notionhq/client, tsup, Vitest

---

## File Map

| File | Responsibility |
|------|---------------|
| `package.json` | CLI entry (`bin.guidepilot → dist/cli/index.js`) |
| `tsconfig.json` | TypeScript config for CLI + server |
| `tsup.config.ts` | Bundles `src/cli/` + `src/server/` + `src/core/` + `src/export/` → `dist/` |
| `vite.config.ts` | Builds React app from `src/app/` → `dist/app/` |
| `src/cli/index.ts` | Commander entry: registers init, dev, build, export |
| `src/cli/cmd-init.ts` | `guidepilot init` — creates `guidepilot.yaml` + `.guidepilot/` |
| `src/cli/cmd-dev.ts` | `guidepilot dev` — starts dev server, opens browser |
| `src/cli/cmd-build.ts` | `guidepilot build` — static HTML output to `guidepilot-dist/` |
| `src/cli/cmd-export.ts` | `guidepilot export pdf` / `guidepilot export notion` |
| `src/core/types.ts` | All TypeScript interfaces (GuideSection, GuideScreen, Annotation, ContentBlock, DataStore) |
| `src/core/parser.ts` | `preview/` directory → `GuideSection[]` |
| `src/core/store.ts` | `.guidepilot/data.json` read/write |
| `src/core/yaml-config.ts` | `guidepilot.yaml` parsing (optional override) |
| `src/server/dev-server.ts` | Express + Vite middleware; serves `dist/app/` |
| `src/server/api-routes.ts` | `GET /guide-data.json`, `GET /api/data`, `PUT /api/data`, `GET /preview/*` |
| `src/app/index.html` | Vite HTML entry |
| `src/app/main.tsx` | React entry — mounts `<App />` |
| `src/app/App.tsx` | Root layout: `<Sidebar>` + `<ScreenEditor>` |
| `src/app/components/Sidebar.tsx` | Lists sections/screens, emits selected screen ID |
| `src/app/components/ScreenEditor.tsx` | 2-panel layout: canvas (left) + blocks (right) |
| `src/app/components/AnnotationCanvas.tsx` | Konva.js canvas with tool palette (arrow, circle, rect, text, badge) |
| `src/app/components/BlockEditor.tsx` | Tiptap editor with custom block types |
| `src/app/hooks/useGuide.ts` | Fetches `/guide-data.json`; saves via `PUT /api/data` |
| `src/export/pdf.ts` | Puppeteer: renders built guide → PDF |
| `src/export/notion.ts` | Notion API: syncs sections/screens as Notion pages |
| `tests/parser.test.ts` | Unit tests for `parser.ts` |
| `tests/store.test.ts` | Unit tests for `store.ts` |
| `tests/yaml-config.test.ts` | Unit tests for `yaml-config.ts` |

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsup.config.ts`
- Create: `vite.config.ts`

- [ ] **Step 1: Install dependencies**

```bash
cd /Users/minjun/Documents/guidepilot

npm init -y

npm install commander express js-yaml glob open react react-dom \
  react-konva konva \
  @tiptap/react @tiptap/pm @tiptap/starter-kit \
  puppeteer @notionhq/client

npm install --save-dev typescript @types/node @types/express @types/js-yaml \
  @vitejs/plugin-react vite tsup vitest @testing-library/react \
  @testing-library/jest-dom jsdom tsx
```

- [ ] **Step 2: Write package.json**

```json
{
  "name": "guidepilot",
  "version": "0.1.0",
  "description": "Code-first guide editor for any framework",
  "type": "module",
  "bin": {
    "guidepilot": "./dist/cli/index.js"
  },
  "scripts": {
    "dev:cli": "tsx src/cli/index.ts",
    "build:cli": "tsup",
    "build:app": "vite build",
    "build": "npm run build:cli && npm run build:app",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "files": ["dist/"]
}
```

- [ ] **Step 3: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "exclude": ["src/app"]
}
```

- [ ] **Step 4: Write tsup.config.ts**

```typescript
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
```

- [ ] **Step 5: Write vite.config.ts**

```typescript
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
```

- [ ] **Step 6: Commit**

```bash
git add package.json tsconfig.json tsup.config.ts vite.config.ts
git commit -m "chore: project scaffold with tsup + vite"
```

---

## Task 2: Core Types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Write types**

```typescript
// src/core/types.ts

export interface GuideSection {
  id: string;       // folder name, e.g. "레시피관리"
  label: string;    // display name (from yaml override or folder name)
  order: number;
  screens: GuideScreen[];
}

export interface GuideScreen {
  id: string;       // "레시피관리/01_목록"
  label: string;    // display name, number prefix stripped: "목록"
  imageUrl: string; // "preview/레시피관리/01_목록.png"
  order: number;
}

export type AnnotationType = 'arrow' | 'circle' | 'rect' | 'text' | 'badge';

export interface Annotation {
  id: string;
  type: AnnotationType;
  x_ratio: number;  // 0–1 relative to image width
  y_ratio: number;  // 0–1 relative to image height
  properties: {
    color?: string;
    label?: string;
    number?: number;
    width_ratio?: number;
    height_ratio?: number;
  };
}

export type BlockType = 'heading' | 'paragraph' | 'steps' | 'warning' | 'callout';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  order: number;
}

export interface ScreenData {
  annotations: Annotation[];
  blocks: ContentBlock[];
}

export interface DataStore {
  screens: Record<string, ScreenData>;  // keyed by GuideScreen.id
}

export interface YamlConfig {
  sections?: Array<{
    id: string;
    label: string;
    order: number;
  }>;
}

// Shape of GET /guide-data.json response
export interface GuideData {
  sections: GuideSection[];
  store: DataStore;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/types.ts
git commit -m "feat: core type definitions"
```

---

## Task 3: yaml-config.ts + Tests

**Files:**
- Create: `src/core/yaml-config.ts`
- Create: `tests/yaml-config.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/yaml-config.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { loadYamlConfig } from '../src/core/yaml-config.js';

const TMP = '/tmp/guidepilot-test-yaml';

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('loadYamlConfig', () => {
  it('returns null when guidepilot.yaml does not exist', () => {
    expect(loadYamlConfig(TMP)).toBeNull();
  });

  it('parses sections from guidepilot.yaml', () => {
    writeFileSync(
      join(TMP, 'guidepilot.yaml'),
      'sections:\n  - id: recipe\n    label: 레시피 관리\n    order: 1\n'
    );
    const config = loadYamlConfig(TMP);
    expect(config?.sections).toHaveLength(1);
    expect(config?.sections?.[0].label).toBe('레시피 관리');
    expect(config?.sections?.[0].order).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/yaml-config.test.ts
```

Expected: FAIL with "Cannot find module '../src/core/yaml-config.js'"

- [ ] **Step 3: Implement yaml-config.ts**

```typescript
// src/core/yaml-config.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import type { YamlConfig } from './types.js';

export function loadYamlConfig(previewDir: string): YamlConfig | null {
  const configPath = join(previewDir, 'guidepilot.yaml');
  if (!existsSync(configPath)) return null;
  return yaml.load(readFileSync(configPath, 'utf-8')) as YamlConfig;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/yaml-config.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/core/yaml-config.ts tests/yaml-config.test.ts
git commit -m "feat: yaml-config loader with tests"
```

---

## Task 4: parser.ts + Tests

**Files:**
- Create: `src/core/parser.ts`
- Create: `tests/parser.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/parser.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { parsePreviewFolder } from '../src/core/parser.js';

const TMP = '/tmp/guidepilot-test-parser';

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

function touch(path: string) {
  mkdirSync(join(TMP, path.split('/').slice(0, -1).join('/')), { recursive: true });
  writeFileSync(join(TMP, path), '');
}

describe('parsePreviewFolder', () => {
  it('returns sections from folder names', () => {
    touch('레시피관리/01_목록.png');
    touch('레시피관리/02_등록폼.png');
    const sections = parsePreviewFolder(TMP);
    expect(sections).toHaveLength(1);
    expect(sections[0].id).toBe('레시피관리');
    expect(sections[0].label).toBe('레시피관리');
  });

  it('parses screens ordered by numeric prefix', () => {
    touch('레시피관리/02_등록폼.png');
    touch('레시피관리/01_목록.png');
    const screens = parsePreviewFolder(TMP)[0].screens;
    expect(screens[0].label).toBe('목록');
    expect(screens[0].order).toBe(1);
    expect(screens[1].label).toBe('등록폼');
    expect(screens[1].order).toBe(2);
  });

  it('sets imageUrl as preview-relative path', () => {
    touch('레시피관리/01_목록.png');
    const screen = parsePreviewFolder(TMP)[0].screens[0];
    expect(screen.imageUrl).toBe('preview/레시피관리/01_목록.png');
  });

  it('sets screen id as sectionId/filename-without-ext', () => {
    touch('레시피관리/01_목록.png');
    const screen = parsePreviewFolder(TMP)[0].screens[0];
    expect(screen.id).toBe('레시피관리/01_목록');
  });

  it('applies yaml label override', () => {
    touch('recipe/01_list.png');
    writeFileSync(
      join(TMP, 'guidepilot.yaml'),
      'sections:\n  - id: recipe\n    label: 레시피 관리\n    order: 0\n'
    );
    const sections = parsePreviewFolder(TMP);
    expect(sections[0].label).toBe('레시피 관리');
  });

  it('supports jpg files', () => {
    touch('레시피관리/01_목록.jpg');
    const screens = parsePreviewFolder(TMP)[0].screens;
    expect(screens).toHaveLength(1);
  });

  it('ignores non-image files', () => {
    touch('레시피관리/01_목록.png');
    writeFileSync(join(TMP, '레시피관리/README.md'), '');
    const screens = parsePreviewFolder(TMP)[0].screens;
    expect(screens).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/parser.test.ts
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Implement parser.ts**

```typescript
// src/core/parser.ts
import { readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import type { GuideSection, GuideScreen } from './types.js';
import { loadYamlConfig } from './yaml-config.js';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export function parsePreviewFolder(previewDir: string): GuideSection[] {
  const config = loadYamlConfig(previewDir);

  const folders = readdirSync(previewDir).filter(name => {
    try {
      return statSync(join(previewDir, name)).isDirectory();
    } catch {
      return false;
    }
  });

  return folders
    .map((folderName, index) => {
      const override = config?.sections?.find(s => s.id === folderName);
      return {
        id: folderName,
        label: override?.label ?? folderName,
        order: override?.order ?? index,
        screens: parseSectionFolder(join(previewDir, folderName), folderName),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function parseSectionFolder(dir: string, sectionId: string): GuideScreen[] {
  return readdirSync(dir)
    .filter(name => IMAGE_EXTS.has(extname(name).toLowerCase()))
    .map((fileName, index) => {
      const nameWithoutExt = basename(fileName, extname(fileName));
      const orderMatch = nameWithoutExt.match(/^(\d+)/);
      const order = orderMatch ? parseInt(orderMatch[1], 10) : index;
      const label = nameWithoutExt.replace(/^\d+_/, '');
      return {
        id: `${sectionId}/${nameWithoutExt}`,
        label,
        imageUrl: `preview/${sectionId}/${fileName}`,
        order,
      };
    })
    .sort((a, b) => a.order - b.order);
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/parser.test.ts
```

Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/core/parser.ts tests/parser.test.ts
git commit -m "feat: preview folder parser with tests"
```

---

## Task 5: store.ts + Tests

**Files:**
- Create: `src/core/store.ts`
- Create: `tests/store.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// tests/store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { readStore, writeStore, ensureStoreDir } from '../src/core/store.js';

const TMP = '/tmp/guidepilot-test-store';

beforeEach(() => mkdirSync(TMP, { recursive: true }));
afterEach(() => rmSync(TMP, { recursive: true, force: true }));

describe('store', () => {
  it('readStore returns empty store when file does not exist', () => {
    const store = readStore(TMP);
    expect(store.screens).toEqual({});
  });

  it('writeStore then readStore round-trips data', () => {
    const data = {
      screens: {
        '레시피관리/01_목록': {
          annotations: [
            { id: 'a1', type: 'arrow' as const, x_ratio: 0.3, y_ratio: 0.15, properties: { color: '#FF5500' } },
          ],
          blocks: [
            { id: 'b1', type: 'steps' as const, content: '1. 검색', order: 0 },
          ],
        },
      },
    };
    writeStore(TMP, data);
    const loaded = readStore(TMP);
    expect(loaded.screens['레시피관리/01_목록'].annotations).toHaveLength(1);
    expect(loaded.screens['레시피관리/01_목록'].blocks[0].content).toBe('1. 검색');
  });

  it('ensureStoreDir creates .guidepilot directory', async () => {
    ensureStoreDir(TMP);
    const { existsSync } = await import('fs');
    expect(existsSync(join(TMP, '.guidepilot'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npx vitest run tests/store.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement store.ts**

```typescript
// src/core/store.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { DataStore } from './types.js';

const STORE_FILE = '.guidepilot/data.json';

export function ensureStoreDir(projectRoot: string): void {
  mkdirSync(join(projectRoot, '.guidepilot'), { recursive: true });
}

export function readStore(projectRoot: string): DataStore {
  const filePath = join(projectRoot, STORE_FILE);
  if (!existsSync(filePath)) return { screens: {} };
  return JSON.parse(readFileSync(filePath, 'utf-8')) as DataStore;
}

export function writeStore(projectRoot: string, data: DataStore): void {
  ensureStoreDir(projectRoot);
  writeFileSync(
    join(projectRoot, STORE_FILE),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
npx vitest run tests/store.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Run all tests**

```bash
npx vitest run
```

Expected: PASS (12 tests total)

- [ ] **Step 6: Commit**

```bash
git add src/core/store.ts tests/store.test.ts
git commit -m "feat: data store with tests"
```

---

## Task 6: CLI Entry + `guidepilot init`

**Files:**
- Create: `src/cli/index.ts`
- Create: `src/cli/cmd-init.ts`

- [ ] **Step 1: Write cmd-init.ts**

```typescript
// src/cli/cmd-init.ts
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { ensureStoreDir } from '../core/store.js';

const YAML_TEMPLATE = `# guidepilot.yaml — optional overrides
# Remove this file to use folder/file names directly.
#
# sections:
#   - id: my-folder-name
#     label: My Display Name
#     order: 1
`;

export function runInit(projectRoot: string): void {
  const yamlPath = join(projectRoot, 'preview', 'guidepilot.yaml');
  const previewDir = join(projectRoot, 'preview');

  if (!existsSync(previewDir)) {
    console.log('Creating preview/ folder...');
    mkdirSync(previewDir, { recursive: true });
  }

  if (existsSync(yamlPath)) {
    console.log('guidepilot.yaml already exists, skipping.');
  } else {
    writeFileSync(yamlPath, YAML_TEMPLATE, 'utf-8');
    console.log('Created preview/guidepilot.yaml');
  }

  ensureStoreDir(projectRoot);
  console.log('Created .guidepilot/');
  console.log('\nDone. Add screenshots to preview/<section>/<screen>.png and run: guidepilot dev');
}
```

- [ ] **Step 2: Write src/cli/index.ts**

```typescript
#!/usr/bin/env node
// src/cli/index.ts
import { Command } from 'commander';
import { runInit } from './cmd-init.js';

const program = new Command();

program
  .name('guidepilot')
  .description('Code-first guide editor for any framework')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize guidepilot in the current project')
  .action(() => runInit(process.cwd()));

program
  .command('dev')
  .description('Start the guide editor (local web server)')
  .option('-p, --port <port>', 'Port to listen on', '4242')
  .action(async (opts) => {
    const { runDev } = await import('./cmd-dev.js');
    await runDev(process.cwd(), parseInt(opts.port, 10));
  });

program
  .command('build')
  .description('Build static guide to guidepilot-dist/')
  .action(async () => {
    const { runBuild } = await import('./cmd-build.js');
    await runBuild(process.cwd());
  });

program
  .command('export')
  .description('Export guide to pdf or notion')
  .argument('<target>', 'pdf | notion')
  .option('--token <token>', 'Notion API token (for notion target)')
  .option('--page-id <id>', 'Notion parent page ID (for notion target)')
  .option('-o, --output <path>', 'Output PDF path (for pdf target)', 'guidepilot-guide.pdf')
  .option('--image-base-url <url>', 'Public base URL for images in Notion export (e.g. https://raw.githubusercontent.com/org/repo/main)')
  .action(async (target, opts) => {
    const { runExport } = await import('./cmd-export.js');
    await runExport(process.cwd(), target, opts);
  });

program.parse();
```

- [ ] **Step 3: Test init command manually**

```bash
cd /tmp && mkdir test-project && cd test-project
node /Users/minjun/Documents/guidepilot/src/cli/index.ts init
```

Expected output:
```
Created preview/guidepilot.yaml
Created .guidepilot/
Done. Add screenshots to preview/<section>/<screen>.png and run: guidepilot dev
```

- [ ] **Step 4: Commit**

```bash
cd /Users/minjun/Documents/guidepilot
git add src/cli/index.ts src/cli/cmd-init.ts
git commit -m "feat: CLI entry + guidepilot init command"
```

---

## Task 7: Dev Server + API Routes

**Files:**
- Create: `src/server/api-routes.ts`
- Create: `src/server/dev-server.ts`
- Create: `src/cli/cmd-dev.ts`

- [ ] **Step 1: Write api-routes.ts**

```typescript
// src/server/api-routes.ts
import { Router } from 'express';
import { parsePreviewFolder } from '../core/parser.js';
import { readStore, writeStore } from '../core/store.js';
import type { DataStore, GuideData } from '../core/types.js';
import { join } from 'path';

export function createApiRouter(projectRoot: string): Router {
  const router = Router();
  const previewDir = join(projectRoot, 'preview');

  // Returns sections + stored annotations/blocks as one payload
  router.get('/guide-data.json', (_req, res) => {
    try {
      const sections = parsePreviewFolder(previewDir);
      const store = readStore(projectRoot);
      const payload: GuideData = { sections, store };
      res.json(payload);
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // Returns raw store (for debugging)
  router.get('/api/data', (_req, res) => {
    res.json(readStore(projectRoot));
  });

  // Saves updated store from editor
  router.put('/api/data', (req, res) => {
    try {
      writeStore(projectRoot, req.body as DataStore);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  return router;
}
```

- [ ] **Step 2: Write dev-server.ts**

```typescript
// src/server/dev-server.ts
import express from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createApiRouter } from './api-routes.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function startDevServer(projectRoot: string, port: number): Promise<void> {
  const app = express();
  app.use(express.json());

  // Serve preview/ images from the user's project
  app.use('/preview', express.static(join(projectRoot, 'preview')));

  // API routes
  app.use(createApiRouter(projectRoot));

  // Serve the pre-built React app from dist/app/
  // In production CLI usage, dist/app/ is bundled with the npm package.
  const appDistDir = join(__dirname, '..', 'app');
  app.use(express.static(appDistDir));

  // SPA fallback — use Express 5-compatible catch-all pattern
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(appDistDir, 'index.html'));
  });

  await new Promise<void>(resolve => {
    app.listen(port, () => resolve());
  });
}
```

- [ ] **Step 3: Write cmd-dev.ts**

```typescript
// src/cli/cmd-dev.ts
import { startDevServer } from '../server/dev-server.js';
import open from 'open';

export async function runDev(projectRoot: string, port: number): Promise<void> {
  console.log(`Starting Guidepilot editor on http://localhost:${port} ...`);
  await startDevServer(projectRoot, port);
  console.log(`Editor running at http://localhost:${port}`);
  await open(`http://localhost:${port}`);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/server/api-routes.ts src/server/dev-server.ts src/cli/cmd-dev.ts
git commit -m "feat: dev server with API routes"
```

---

## Task 8: React App Scaffold

**Files:**
- Create: `src/app/index.html`
- Create: `src/app/main.tsx`
- Create: `src/app/App.tsx`
- Create: `src/app/hooks/useGuide.ts`

- [ ] **Step 1: Write src/app/index.html**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Guidepilot</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: Write src/app/hooks/useGuide.ts**

```typescript
// src/app/hooks/useGuide.ts
import { useState, useEffect, useCallback } from 'react';
import type { GuideData, DataStore, ScreenData } from '../../core/types.js';

export function useGuide() {
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('./guide-data.json')
      .then(r => r.json())
      .then((d: GuideData) => { setData(d); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  const saveScreenData = useCallback(async (screenId: string, screenData: ScreenData) => {
    if (!data) return;
    const newStore: DataStore = {
      screens: { ...data.store.screens, [screenId]: screenData },
    };
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStore),
    });
    setData(prev => prev ? { ...prev, store: newStore } : prev);
  }, [data]);

  return { data, loading, error, saveScreenData };
}
```

- [ ] **Step 3: Write src/app/App.tsx**

```tsx
// src/app/App.tsx
import { useState, useEffect } from 'react';
import { useGuide } from './hooks/useGuide.js';
import { Sidebar } from './components/Sidebar.js';
import { ScreenEditor } from './components/ScreenEditor.js';

const isPdfMode = new URLSearchParams(window.location.search).get('pdf') === 'true';

export function App() {
  const { data, loading, error, saveScreenData } = useGuide();
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);

  // In PDF mode, auto-select the first screen so Puppeteer captures real content
  useEffect(() => {
    if (isPdfMode && data && !selectedScreenId) {
      const firstScreen = data.sections[0]?.screens[0];
      if (firstScreen) setSelectedScreenId(firstScreen.id);
    }
  }, [data, selectedScreenId]);

  if (loading) return <div style={{ padding: 24 }}>Loading guide...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>;
  if (!data) return null;

  const selectedScreen = data.sections
    .flatMap(s => s.screens)
    .find(s => s.id === selectedScreenId) ?? null;

  const screenData = selectedScreenId
    ? (data.store.screens[selectedScreenId] ?? { annotations: [], blocks: [] })
    : null;

  // data-guidepilot-ready only appears after a screen is selected and rendered,
  // so Puppeteer doesn't capture the "select a screen" empty state in PDF mode.
  return (
    <div
      style={{ display: 'flex', height: '100vh' }}
      {...(selectedScreen ? { 'data-guidepilot-ready': 'true' } : {})}
    >
      <Sidebar
        sections={data.sections}
        selectedScreenId={selectedScreenId}
        onSelect={setSelectedScreenId}
      />
      {selectedScreen && screenData ? (
        <ScreenEditor
          screen={selectedScreen}
          screenData={screenData}
          onSave={d => saveScreenData(selectedScreen.id, d)}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          왼쪽에서 화면을 선택하세요
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Write src/app/main.tsx**

```tsx
// src/app/main.tsx
import { createRoot } from 'react-dom/client';
import { App } from './App.js';

createRoot(document.getElementById('root')!).render(<App />);
```

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: React app scaffold with useGuide hook"
```

---

## Task 9: Sidebar Component

**Files:**
- Create: `src/app/components/Sidebar.tsx`

- [ ] **Step 1: Write Sidebar.tsx**

```tsx
// src/app/components/Sidebar.tsx
import type { GuideSection } from '../../../src/core/types.js';

interface Props {
  sections: GuideSection[];
  selectedScreenId: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ sections, selectedScreenId, onSelect }: Props) {
  return (
    <div style={{
      width: 240,
      borderRight: '1px solid #e5e7eb',
      overflowY: 'auto',
      background: '#fafafa',
    }}>
      <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid #e5e7eb' }}>
        Guidepilot
      </div>
      {sections.map(section => (
        <div key={section.id}>
          <div style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {section.label}
          </div>
          {section.screens.map(screen => (
            <button
              key={screen.id}
              onClick={() => onSelect(screen.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 16px 6px 24px',
                fontSize: 13,
                cursor: 'pointer',
                border: 'none',
                background: selectedScreenId === screen.id ? '#eff6ff' : 'transparent',
                color: selectedScreenId === screen.id ? '#2563eb' : '#374151',
                fontWeight: selectedScreenId === screen.id ? 500 : 400,
              }}
            >
              {screen.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/Sidebar.tsx
git commit -m "feat: Sidebar navigation component"
```

---

## Task 10: AnnotationCanvas (Konva.js)

**Files:**
- Create: `src/app/components/AnnotationCanvas.tsx`

- [ ] **Step 1: Write AnnotationCanvas.tsx**

```tsx
// src/app/components/AnnotationCanvas.tsx
import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Arrow, Circle, Rect, Text, Group, Label, Tag } from 'react-konva';
import type { Annotation, AnnotationType } from '../../../src/core/types.js';

interface Props {
  imageUrl: string;
  annotations: Annotation[];
  activeTool: AnnotationType | null;
  onChange: (annotations: Annotation[]) => void;
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export function AnnotationCanvas({ imageUrl, annotations, activeTool, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [imgSize, setImgSize] = useState({ width: 600, height: 400 });

  // Load image to get natural dimensions
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Resize canvas to container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      const scale = width / imgSize.width;
      setSize({ width, height: imgSize.height * scale });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [imgSize]);

  const scale = size.width / imgSize.width;

  function handleStageClick(e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) {
    if (!activeTool) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    const x_ratio = pos.x / size.width;
    const y_ratio = pos.y / size.height;

    const newAnnotation: Annotation = {
      id: nanoid(),
      type: activeTool,
      x_ratio,
      y_ratio,
      properties: activeTool === 'badge'
        ? { number: annotations.filter(a => a.type === 'badge').length + 1, color: '#2563eb' }
        : activeTool === 'arrow'
        ? { color: '#ef4444', label: '' }
        : { color: '#f59e0b' },
    };

    onChange([...annotations, newAnnotation]);
  }

  function removeAnnotation(id: string) {
    onChange(annotations.filter(a => a.id !== id));
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <img
        src={imageUrl}
        alt="screen"
        style={{ width: '100%', display: 'block' }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <Stage
          width={size.width}
          height={size.height}
          onClick={handleStageClick}
          style={{ cursor: activeTool ? 'crosshair' : 'default' }}
        >
          <Layer>
            {annotations.map(ann => {
              const x = ann.x_ratio * size.width;
              const y = ann.y_ratio * size.height;

              if (ann.type === 'arrow') {
                return (
                  <Arrow
                    key={ann.id}
                    points={[x - 40 * scale, y - 20 * scale, x, y]}
                    stroke={ann.properties.color ?? '#ef4444'}
                    strokeWidth={2}
                    fill={ann.properties.color ?? '#ef4444'}
                    onClick={() => removeAnnotation(ann.id)}
                  />
                );
              }
              if (ann.type === 'circle') {
                return (
                  <Circle
                    key={ann.id}
                    x={x} y={y}
                    radius={20 * scale}
                    stroke={ann.properties.color ?? '#f59e0b'}
                    strokeWidth={2}
                    onClick={() => removeAnnotation(ann.id)}
                  />
                );
              }
              if (ann.type === 'rect') {
                return (
                  <Rect
                    key={ann.id}
                    x={x - 20 * scale} y={y - 15 * scale}
                    width={40 * scale} height={30 * scale}
                    stroke={ann.properties.color ?? '#8b5cf6'}
                    strokeWidth={2}
                    onClick={() => removeAnnotation(ann.id)}
                  />
                );
              }
              if (ann.type === 'badge') {
                return (
                  <Group key={ann.id} x={x} y={y} onClick={() => removeAnnotation(ann.id)}>
                    <Circle radius={12 * scale} fill={ann.properties.color ?? '#2563eb'} />
                    <Text
                      text={String(ann.properties.number ?? '')}
                      fontSize={10 * scale}
                      fill="white"
                      align="center"
                      verticalAlign="middle"
                      offsetX={5 * scale}
                      offsetY={5 * scale}
                    />
                  </Group>
                );
              }
              if (ann.type === 'text') {
                return (
                  <Label key={ann.id} x={x} y={y} onClick={() => removeAnnotation(ann.id)}>
                    <Tag fill="#1f2937" cornerRadius={4} />
                    <Text
                      text={ann.properties.label ?? 'Label'}
                      fontSize={12 * scale}
                      fill="white"
                      padding={4 * scale}
                    />
                  </Label>
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/AnnotationCanvas.tsx
git commit -m "feat: Konva.js annotation canvas"
```

---

## Task 11: BlockEditor (Tiptap)

**Files:**
- Create: `src/app/components/BlockEditor.tsx`

- [ ] **Step 1: Write BlockEditor.tsx**

```tsx
// src/app/components/BlockEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import type { ContentBlock } from '../../../src/core/types.js';

interface Props {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks
    .sort((a, b) => a.order - b.order)
    .map(b => {
      switch (b.type) {
        case 'heading': return `<h2>${b.content}</h2>`;
        case 'warning': return `<blockquote><p>⚠️ ${b.content}</p></blockquote>`;
        case 'callout': return `<blockquote><p>💡 ${b.content}</p></blockquote>`;
        case 'steps':
          return `<ol>${b.content.split('\n').map(line => `<li>${line.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
        default: return `<p>${b.content}</p>`;
      }
    })
    .join('');
}

function htmlToBlocks(html: string): ContentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: ContentBlock[] = [];
  let order = 0;

  doc.body.childNodes.forEach(node => {
    if (!(node instanceof HTMLElement)) return;
    const text = node.textContent ?? '';
    if (node.tagName === 'H2') {
      blocks.push({ id: crypto.randomUUID(), type: 'heading', content: text, order: order++ });
    } else if (node.tagName === 'BLOCKQUOTE') {
      const inner = text.replace(/^[⚠️💡]\s*/, '');
      const type = text.startsWith('⚠️') ? 'warning' : 'callout';
      blocks.push({ id: crypto.randomUUID(), type, content: inner, order: order++ });
    } else if (node.tagName === 'OL') {
      const steps = Array.from(node.querySelectorAll('li'))
        .map((li, i) => `${i + 1}. ${li.textContent}`)
        .join('\n');
      blocks.push({ id: crypto.randomUUID(), type: 'steps', content: steps, order: order++ });
    } else if (text.trim()) {
      blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: text, order: order++ });
    }
  });

  return blocks;
}

export function BlockEditor({ blocks, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: blocksToHtml(blocks),
    onUpdate: ({ editor }) => {
      onChange(htmlToBlocks(editor.getHTML()));
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(blocksToHtml(blocks), false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);
  // Note: intentionally only on `editor` mount — BlockEditor must be remounted
  // with key={screen.id} in ScreenEditor when the selected screen changes,
  // so the editor reinitializes from props rather than syncing mid-session.

  return (
    <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} style={btnStyle}>목록</button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} style={btnStyle}>단계</button>
        <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} style={btnStyle}>⚠️ 주의</button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle}>제목</button>
      </div>
      <EditorContent
        editor={editor}
        style={{
          minHeight: 200,
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          padding: 12,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  border: '1px solid #d1d5db',
  borderRadius: 4,
  cursor: 'pointer',
  background: 'white',
};
```

- [ ] **Step 2: Commit**

```bash
git add src/app/components/BlockEditor.tsx
git commit -m "feat: Tiptap block editor"
```

---

## Task 12: ScreenEditor (wires canvas + blocks together)

**Files:**
- Create: `src/app/components/ScreenEditor.tsx`

- [ ] **Step 1: Write ScreenEditor.tsx**

```tsx
// src/app/components/ScreenEditor.tsx
import { useState, useCallback } from 'react';
import { AnnotationCanvas } from './AnnotationCanvas.js';
import { BlockEditor } from './BlockEditor.js';
import type { GuideScreen, ScreenData, AnnotationType, Annotation, ContentBlock } from '../../../src/core/types.js';

interface Props {
  screen: GuideScreen;
  screenData: ScreenData;
  onSave: (data: ScreenData) => Promise<void>;
}

const TOOLS: { type: AnnotationType; label: string }[] = [
  { type: 'arrow', label: '→ 화살표' },
  { type: 'circle', label: '○ 원' },
  { type: 'rect', label: '□ 박스' },
  { type: 'badge', label: '① 번호' },
  { type: 'text', label: 'T 텍스트' },
];

export function ScreenEditor({ screen, screenData, onSave }: Props) {
  const [activeTool, setActiveTool] = useState<AnnotationType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAnnotationsChange = useCallback((annotations: Annotation[]) => {
    onSave({ ...screenData, annotations });
  }, [screenData, onSave]);

  const handleBlocksChange = useCallback((blocks: ContentBlock[]) => {
    setSaving(true);
    onSave({ ...screenData, blocks }).finally(() => setSaving(false));
  }, [screenData, onSave]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
          {screen.label}
        </span>
        {saving && <span style={{ fontSize: 12, color: '#9ca3af' }}>저장 중...</span>}
      </div>

      {/* Tool palette */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: '8px 16px',
        borderBottom: '1px solid #f3f4f6',
        background: '#fafafa',
      }}>
        {TOOLS.map(tool => (
          <button
            key={tool.type}
            onClick={() => setActiveTool(prev => prev === tool.type ? null : tool.type)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: `1px solid ${activeTool === tool.type ? '#2563eb' : '#d1d5db'}`,
              borderRadius: 4,
              cursor: 'pointer',
              background: activeTool === tool.type ? '#eff6ff' : 'white',
              color: activeTool === tool.type ? '#2563eb' : '#374151',
              fontWeight: activeTool === tool.type ? 600 : 400,
            }}
          >
            {tool.label}
          </button>
        ))}
        {screenData.annotations.length > 0 && (
          <button
            onClick={() => onSave({ ...screenData, annotations: [] })}
            style={{
              marginLeft: 'auto',
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #fca5a5',
              borderRadius: 4,
              cursor: 'pointer',
              background: 'white',
              color: '#ef4444',
            }}
          >
            전체 삭제
          </button>
        )}
      </div>

      {/* 2-panel editor */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <AnnotationCanvas
            imageUrl={screen.imageUrl}
            annotations={screenData.annotations}
            activeTool={activeTool}
            onChange={handleAnnotationsChange}
          />
        </div>
        <div style={{
          width: 320,
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <BlockEditor
            key={screen.id}
            blocks={screenData.blocks}
            onChange={handleBlocksChange}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build the React app**

```bash
cd /Users/minjun/Documents/guidepilot
npm run build:app
```

Expected: `dist/app/index.html` + `dist/app/assets/` created.

- [ ] **Step 3: Build the CLI**

```bash
npm run build:cli
```

Expected: `dist/cli/index.js` created.

- [ ] **Step 4: Test end-to-end in a sample project**

```bash
# Create a sample project with screenshots
mkdir -p /tmp/sample-project/preview/레시피관리
cp /path/to/any/screenshot.png /tmp/sample-project/preview/레시피관리/01_목록.png

# Run guidepilot dev
cd /tmp/sample-project
node /Users/minjun/Documents/guidepilot/dist/cli/index.js dev
```

Expected: Browser opens at `http://localhost:4242`, sidebar shows "레시피관리 > 목록", clicking the screen shows the image with annotation tools and block editor.

- [ ] **Step 5: Commit**

```bash
cd /Users/minjun/Documents/guidepilot
git add src/app/components/ScreenEditor.tsx
git commit -m "feat: ScreenEditor wiring canvas + blocks"
```

---

## Task 13: `guidepilot build` (Static HTML)

**Files:**
- Create: `src/cli/cmd-build.ts`

- [ ] **Step 1: Write cmd-build.ts**

```typescript
// src/cli/cmd-build.ts
import { copyFileSync, mkdirSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
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

  // 1. Copy pre-built React app from CLI package
  const appDistDir = join(__dirname, '..', 'app');
  copyDir(appDistDir, outDir);

  // 2. Copy preview images
  const previewOutDir = join(outDir, 'preview');
  copyDir(previewDir, previewOutDir);

  // 3. Write guide-data.json (static)
  const sections = parsePreviewFolder(previewDir);
  const store = readStore(projectRoot);
  const guideData: GuideData = { sections, store };
  writeFileSync(join(outDir, 'guide-data.json'), JSON.stringify(guideData, null, 2), 'utf-8');

  console.log(`Guide built to: ${outDir}`);
  console.log('Deploy guidepilot-dist/ to GitHub Pages or any static host.');
}
```

- [ ] **Step 2: Test build command**

```bash
cd /tmp/sample-project
node /Users/minjun/Documents/guidepilot/dist/cli/index.js build
ls guidepilot-dist/
```

Expected:
```
index.html
assets/
preview/
guide-data.json
```

- [ ] **Step 3: Verify static site works**

```bash
cd /tmp/sample-project/guidepilot-dist
npx serve .
```

Open `http://localhost:3000` — should show the same editor UI with data pre-loaded.

- [ ] **Step 4: Commit**

```bash
cd /Users/minjun/Documents/guidepilot
git add src/cli/cmd-build.ts
git commit -m "feat: guidepilot build static HTML output"
```

---

## Task 14: PDF Export

**Files:**
- Create: `src/export/pdf.ts`

- [ ] **Step 1: Write pdf.ts**

```typescript
// src/export/pdf.ts
import puppeteer from 'puppeteer';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';

const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'application/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml',
};

function serveStatic(distDir: string): Promise<{ port: number; close: () => void }> {
  const server = createServer((req, res) => {
    const url = new URL(req.url!, 'http://localhost');
    let file = join(distDir, url.pathname === '/' ? 'index.html' : url.pathname);
    if (!existsSync(file)) file = join(distDir, 'index.html');
    const mime = MIME[extname(file)] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    res.end(readFileSync(file));
  });
  return new Promise(resolve =>
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      resolve({ port, close: () => server.close() });
    })
  );
}

export async function exportPdf(projectRoot: string, outputPath: string): Promise<void> {
  const distDir = join(projectRoot, 'guidepilot-dist');

  if (!existsSync(distDir)) {
    console.error('Run `guidepilot build` first.');
    process.exit(1);
  }

  console.log('Starting local server for PDF render...');
  const { port, close } = await serveStatic(distDir);

  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Serve over HTTP so root-relative data fetches work correctly
  await page.goto(`http://127.0.0.1:${port}/?pdf=true`, { waitUntil: 'networkidle0' });

  // data-guidepilot-ready appears only after a screen is selected and rendered
  await page.waitForSelector('[data-guidepilot-ready]', { timeout: 15000 }).catch(() => {
    console.warn('App ready signal not found — guide may have no screens.');
  });

  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    printBackground: true,
  });

  await browser.close();
  close();
  console.log(`PDF saved to: ${outputPath}`);
}
```

- [ ] **Step 2: Add `data-guidepilot-ready` to App.tsx**

In `src/app/App.tsx`, update the root div after data loads:

```tsx
// Replace the outer div in App.tsx with:
<div style={{ display: 'flex', height: '100vh' }} data-guidepilot-ready="true">
```

- [ ] **Step 3: Write cmd-export.ts**

```typescript
// src/cli/cmd-export.ts

interface ExportOptions {
  token?: string;
  pageId?: string;
  output?: string;
  imageBaseUrl?: string;
}

export async function runExport(projectRoot: string, target: string, opts: ExportOptions): Promise<void> {
  if (target === 'pdf') {
    const { exportPdf } = await import('../export/pdf.js');
    await exportPdf(projectRoot, opts.output ?? 'guidepilot-guide.pdf');
  } else if (target === 'notion') {
    if (!opts.token) {
      console.error('--token <NOTION_TOKEN> is required for notion export.');
      process.exit(1);
    }
    if (!opts.pageId) {
      console.error('--page-id <NOTION_PAGE_ID> is required for notion export.');
      process.exit(1);
    }
    const { exportNotion } = await import('../export/notion.js');
    await exportNotion(projectRoot, opts.token, opts.pageId, opts.imageBaseUrl);
  } else {
    console.error(`Unknown export target: ${target}. Use: pdf | notion`);
    process.exit(1);
  }
}
```

- [ ] **Step 4: Rebuild and test**

```bash
npm run build
cd /tmp/sample-project
node /Users/minjun/Documents/guidepilot/dist/cli/index.js build
node /Users/minjun/Documents/guidepilot/dist/cli/index.js export pdf -o guide.pdf
ls -la guide.pdf
```

Expected: `guide.pdf` created.

- [ ] **Step 5: Commit**

```bash
cd /Users/minjun/Documents/guidepilot
git add src/export/pdf.ts src/cli/cmd-export.ts src/app/App.tsx
git commit -m "feat: PDF export via Puppeteer"
```

---

## Task 15: Notion Export

**Files:**
- Create: `src/export/notion.ts`

- [ ] **Step 1: Write notion.ts**

```typescript
// src/export/notion.ts
import { Client } from '@notionhq/client';
import { parsePreviewFolder } from '../core/parser.js';
import { readStore } from '../core/store.js';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

export async function exportNotion(
  projectRoot: string,
  token: string,
  parentPageId: string,
  imageBaseUrl?: string
): Promise<void> {
  const notion = new Client({ auth: token });
  const previewDir = join(projectRoot, 'preview');
  const sections = parsePreviewFolder(previewDir);
  const store = readStore(projectRoot);

  console.log(`Syncing ${sections.length} sections to Notion...`);

  for (const section of sections) {
    // Create section page
    const sectionPage = await notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: { title: [{ text: { content: section.label } }] },
      },
    });

    for (const screen of section.screens) {
      const screenData = store.screens[screen.id] ?? { annotations: [], blocks: [] };

      // Build Notion blocks for this screen
      const notionBlocks: object[] = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: screen.label } }] },
        },
        // Image block only included when a public base URL is provided via --image-base-url.
        // Without it, Notion can't reach local files, so we skip rather than embed a broken URL.
        ...(imageBaseUrl ? [{
          object: 'block',
          type: 'image',
          image: {
            type: 'external',
            external: { url: `${imageBaseUrl.replace(/\/$/, '')}/${screen.imageUrl}` },
          },
        }] : []),
        ...screenData.blocks.map(block => {
          if (block.type === 'warning' || block.type === 'callout') {
            return {
              object: 'block',
              type: 'callout',
              callout: {
                rich_text: [{ text: { content: block.content } }],
                icon: { emoji: block.type === 'warning' ? '⚠️' : '💡' },
              },
            };
          }
          if (block.type === 'steps') {
            return {
              object: 'block',
              type: 'numbered_list_item',
              numbered_list_item: {
                rich_text: [{ text: { content: block.content } }],
              },
            };
          }
          return {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: block.content } }] },
          };
        }),
      ];

      await notion.blocks.children.append({
        block_id: sectionPage.id,
        children: notionBlocks as Parameters<typeof notion.blocks.children.append>[0]['children'],
      });

      console.log(`  ✓ ${section.label} > ${screen.label}`);
    }
  }

  console.log('Notion sync complete.');
}
```

- [ ] **Step 2: Commit**

```bash
git add src/export/notion.ts
git commit -m "feat: Notion export via Notion API"
```

---

## Task 16: GitHub Actions Template + README

**Files:**
- Create: `templates/guidepilot.yml`
- Create: `templates/guidepilot-flutter.yml`
- Create: `README.md`

- [ ] **Step 1: Write templates/guidepilot.yml**

```yaml
# .github/workflows/guidepilot.yml
# Copy this file to your project's .github/workflows/ folder.
name: Guidepilot — Build Guide

on:
  push:
    branches: [main]
    paths:
      - 'preview/**'
      - '.guidepilot/**'

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-guide:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npx guidepilot build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: guidepilot-dist/
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 2: Write templates/guidepilot-flutter.yml**

```yaml
# .github/workflows/guidepilot-flutter.yml
# For Flutter projects that generate screenshots via flutter test.
name: Guidepilot — Flutter Guide

on:
  push:
    branches: [main]
    paths: ['lib/src/dev/preview/**']

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-guide:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      # This test generates screenshots into preview/
      - run: flutter test test/preview_screenshot_test.dart
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npx guidepilot build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: guidepilot-dist/
      - uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Write README.md**

```markdown
# Guidepilot

> Drop screenshots in `preview/`, edit annotations, export anywhere.

Code-first guide editor for any framework — Flutter, React, Vue, anything.

## Install

```bash
npm install -g guidepilot
# or
npx guidepilot
```

## Quick Start

```bash
# 1. Initialize in your project
cd your-project
guidepilot init

# 2. Add screenshots
mkdir -p preview/Your-Feature
cp screenshot.png preview/Your-Feature/01_Screen.png

# 3. Open the editor
guidepilot dev

# 4. Build static guide
guidepilot build

# 5. Export
guidepilot export pdf
guidepilot export notion --token <TOKEN> --page-id <PAGE_ID>
```

## Folder Convention

```
preview/
├── Feature-Name/
│   ├── 01_Screen.png   # numbered prefix = order
│   └── 02_Other.png
└── guidepilot.yaml     # optional label overrides
```

## How annotations survive image updates

Annotations are stored in `.guidepilot/data.json` keyed by screen ID
(`Feature-Name/01_Screen`), not by image content. Replace the image, the
annotations stay exactly where you placed them.

## CI / GitHub Pages

Copy `templates/guidepilot.yml` (or `templates/guidepilot-flutter.yml` for
Flutter) to `.github/workflows/` in your project.

## Why Guidepilot?

| | Scribe | Guidde | Storybook | **Guidepilot** |
|---|---|---|---|---|
| Mobile (Flutter) | ❌ | ❌ | ✅ (components only) | ✅ |
| Auto-update | ❌ | ❌ | ✅ | ✅ |
| Annotation persistence | ❌ | ❌ | ❌ | ✅ |
| Framework-agnostic | ❌ | ❌ | ✅ | ✅ |

## License

MIT
```

- [ ] **Step 4: Commit**

```bash
git add templates/ README.md
git commit -m "docs: README and GitHub Actions templates"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| `guidepilot init/dev/build/export` | Tasks 6, 7, 13, 14, 15 |
| `preview/` folder parsing | Task 4 |
| `guidepilot.yaml` override | Task 3 |
| Annotation editor (arrow, circle, rect, text, badge) | Task 10 |
| Block editor (text, steps, warning, callout) | Task 11 |
| Annotation persistence (image replace → annotations stay) | Task 2, 5 (Screen ID key) |
| Static HTML build + GitHub Pages | Task 13, 16 |
| PDF export | Task 14 |
| Notion sync | Task 15 |
| GitHub Actions template | Task 16 |

All spec requirements covered. ✅
