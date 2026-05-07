import { Client } from '@notionhq/client';
import { parsePreviewFolder } from '../core/parser.js';
import { readStore } from '../core/store.js';
import { join } from 'path';

export async function exportNotion(
  projectRoot: string,
  token: string,
  parentPageId: string,
  imageBaseUrl?: string
): Promise<void> {
  const notion = new Client({ auth: token });
  const previewDir = join(projectRoot, 'preview');
  const sections = parsePreviewFolder(previewDir);
  const store = readStore(projectRoot);

  console.log(`Syncing ${sections.length} sections to Notion...`);

  for (const section of sections) {
    const sectionPage = await notion.pages.create({
      parent: { page_id: parentPageId },
      properties: {
        title: { title: [{ text: { content: section.label } }] },
      },
    });

    for (const screen of section.screens) {
      const screenData = store.screens[screen.id] ?? { annotations: [], blocks: [] };

      const notionBlocks: object[] = [
        {
          object: 'block',
          type: 'heading_2',
          heading_2: { rich_text: [{ text: { content: screen.label } }] },
        },
        ...(imageBaseUrl ? [{
          object: 'block',
          type: 'image',
          image: {
            type: 'external',
            external: { url: `${imageBaseUrl.replace(/\/$/, '')}/${screen.imageUrl}` },
          },
        }] : []),
        ...screenData.blocks.map(block => {
          if (block.type === 'warning' || block.type === 'callout') {
            return {
              object: 'block',
              type: 'callout',
              callout: {
                rich_text: [{ text: { content: block.content } }],
                icon: { emoji: block.type === 'warning' ? '⚠️' : '💡' },
              },
            };
          }
          if (block.type === 'steps') {
            return {
              object: 'block',
              type: 'numbered_list_item',
              numbered_list_item: {
                rich_text: [{ text: { content: block.content } }],
              },
            };
          }
          return {
            object: 'block',
            type: 'paragraph',
            paragraph: { rich_text: [{ text: { content: block.content } }] },
          };
        }),
      ];

      await notion.blocks.children.append({
        block_id: sectionPage.id,
        children: notionBlocks as Parameters<typeof notion.blocks.children.append>[0]['children'],
      });

      console.log(`  ✓ ${section.label} > ${screen.label}`);
    }
  }

  console.log('Notion sync complete.');
}
