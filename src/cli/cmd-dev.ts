import { startDevServer } from '../server/dev-server.js';
import open from 'open';

export async function runDev(projectRoot: string, port: number): Promise<void> {
  console.log(`Starting Guidepilot editor on http://localhost:${port} ...`);
  await startDevServer(projectRoot, port);
  console.log(`Editor running at http://localhost:${port}`);
  await open(`http://localhost:${port}`);
}
