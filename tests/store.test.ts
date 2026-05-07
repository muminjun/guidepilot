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
