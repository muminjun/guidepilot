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

  await page.goto(`http://127.0.0.1:${port}/?pdf=true`, { waitUntil: 'networkidle0' });

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
