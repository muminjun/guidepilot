import { readdirSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import type { GuideSection, GuideScreen } from './types.js';
import { loadYamlConfig } from './yaml-config.js';

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp']);

export function parsePreviewFolder(previewDir: string): GuideSection[] {
  const config = loadYamlConfig(previewDir);

  const folders = readdirSync(previewDir).filter(name => {
    try {
      return statSync(join(previewDir, name)).isDirectory();
    } catch {
      return false;
    }
  });

  return folders
    .map((folderName, index) => {
      const override = config?.sections?.find(s => s.id === folderName);
      return {
        id: folderName,
        label: override?.label ?? folderName,
        order: override?.order ?? index,
        screens: parseSectionFolder(join(previewDir, folderName), folderName),
      };
    })
    .sort((a, b) => a.order - b.order);
}

function parseSectionFolder(dir: string, sectionId: string): GuideScreen[] {
  return readdirSync(dir)
    .filter(name => IMAGE_EXTS.has(extname(name).toLowerCase()))
    .map((fileName, index) => {
      const nameWithoutExt = basename(fileName, extname(fileName));
      const orderMatch = nameWithoutExt.match(/^(\d+)/);
      const order = orderMatch ? parseInt(orderMatch[1], 10) : index;
      const label = nameWithoutExt.replace(/^\d+_/, '');
      return {
        id: `${sectionId}/${nameWithoutExt}`,
        label,
        imageUrl: `preview/${sectionId}/${fileName}`,
        order,
      };
    })
    .sort((a, b) => a.order - b.order);
}
