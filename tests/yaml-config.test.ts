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
