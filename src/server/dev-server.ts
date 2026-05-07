import express from 'express';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { createApiRouter } from './api-routes.js';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export async function startDevServer(projectRoot: string, port: number): Promise<void> {
  const app = express();
  app.use(express.json());

  app.use('/preview', express.static(join(projectRoot, 'preview')));
  app.use(createApiRouter(projectRoot));

  const appDistDir = join(__dirname, '..', 'app');
  app.use(express.static(appDistDir));

  app.get('/{*splat}', (_req, res) => {
    res.sendFile(join(appDistDir, 'index.html'));
  });

  await new Promise<void>(resolve => {
    app.listen(port, () => resolve());
  });
}
