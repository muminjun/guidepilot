import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect } from 'react';
import type { ContentBlock } from '../../core/types.js';

interface Props {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
}

function blocksToHtml(blocks: ContentBlock[]): string {
  return blocks
    .sort((a, b) => a.order - b.order)
    .map(b => {
      switch (b.type) {
        case 'heading': return `<h2>${b.content}</h2>`;
        case 'warning': return `<blockquote><p>⚠️ ${b.content}</p></blockquote>`;
        case 'callout': return `<blockquote><p>💡 ${b.content}</p></blockquote>`;
        case 'steps':
          return `<ol>${b.content.split('\n').map(line => `<li>${line.replace(/^\d+\.\s*/, '')}</li>`).join('')}</ol>`;
        default: return `<p>${b.content}</p>`;
      }
    })
    .join('');
}

function htmlToBlocks(html: string): ContentBlock[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const blocks: ContentBlock[] = [];
  let order = 0;

  doc.body.childNodes.forEach(node => {
    if (!(node instanceof HTMLElement)) return;
    const text = node.textContent ?? '';
    if (node.tagName === 'H2') {
      blocks.push({ id: crypto.randomUUID(), type: 'heading', content: text, order: order++ });
    } else if (node.tagName === 'BLOCKQUOTE') {
      const inner = text.replace(/^[⚠️💡]\s*/, '');
      const type = text.startsWith('⚠️') ? 'warning' : 'callout';
      blocks.push({ id: crypto.randomUUID(), type, content: inner, order: order++ });
    } else if (node.tagName === 'OL') {
      const steps = Array.from(node.querySelectorAll('li'))
        .map((li, i) => `${i + 1}. ${li.textContent}`)
        .join('\n');
      blocks.push({ id: crypto.randomUUID(), type: 'steps', content: steps, order: order++ });
    } else if (text.trim()) {
      blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: text, order: order++ });
    }
  });

  return blocks;
}

export function BlockEditor({ blocks, onChange }: Props) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: blocksToHtml(blocks),
    onUpdate: ({ editor }) => {
      onChange(htmlToBlocks(editor.getHTML()));
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(blocksToHtml(blocks), false);
    }
  // Only run on editor mount — component must be remounted with key={screen.id}
  // when the selected screen changes so the editor reinitializes from props.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  return (
    <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => editor?.chain().focus().toggleBulletList().run()} style={btnStyle}>목록</button>
        <button onClick={() => editor?.chain().focus().toggleOrderedList().run()} style={btnStyle}>단계</button>
        <button onClick={() => editor?.chain().focus().toggleBlockquote().run()} style={btnStyle}>⚠️ 주의</button>
        <button onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} style={btnStyle}>제목</button>
      </div>
      <EditorContent
        editor={editor}
        style={{
          minHeight: 200,
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          padding: 12,
          fontSize: 14,
          lineHeight: 1.6,
        }}
      />
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 12,
  border: '1px solid #d1d5db',
  borderRadius: 4,
  cursor: 'pointer',
  background: 'white',
};
