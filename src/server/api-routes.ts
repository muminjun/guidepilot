import { Router } from 'express';
import { parsePreviewFolder } from '../core/parser.js';
import { readStore, writeStore } from '../core/store.js';
import type { DataStore, GuideData } from '../core/types.js';
import { join } from 'path';

export function createApiRouter(projectRoot: string): Router {
  const router = Router();
  const previewDir = join(projectRoot, 'preview');

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

  router.get('/api/data', (_req, res) => {
    res.json(readStore(projectRoot));
  });

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
