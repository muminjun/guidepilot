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
