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
