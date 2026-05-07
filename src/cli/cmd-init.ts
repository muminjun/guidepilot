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
