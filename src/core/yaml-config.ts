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
