import { useState, useCallback } from 'react';
import { AnnotationCanvas } from './AnnotationCanvas.js';
import { BlockEditor } from './BlockEditor.js';
import type { GuideScreen, ScreenData, AnnotationType, Annotation, ContentBlock } from '../../core/types.js';

interface Props {
  screen: GuideScreen;
  screenData: ScreenData;
  onSave: (data: ScreenData) => Promise<void>;
}

const TOOLS: { type: AnnotationType; label: string }[] = [
  { type: 'arrow', label: '→ 화살표' },
  { type: 'circle', label: '○ 원' },
  { type: 'rect', label: '□ 박스' },
  { type: 'badge', label: '① 번호' },
  { type: 'text', label: 'T 텍스트' },
];

export function ScreenEditor({ screen, screenData, onSave }: Props) {
  const [activeTool, setActiveTool] = useState<AnnotationType | null>(null);
  const [saving, setSaving] = useState(false);

  const handleAnnotationsChange = useCallback((annotations: Annotation[]) => {
    onSave({ ...screenData, annotations });
  }, [screenData, onSave]);

  const handleBlocksChange = useCallback((blocks: ContentBlock[]) => {
    setSaving(true);
    onSave({ ...screenData, blocks }).finally(() => setSaving(false));
  }, [screenData, onSave]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>
          {screen.label}
        </span>
        {saving && <span style={{ fontSize: 12, color: '#9ca3af' }}>저장 중...</span>}
      </div>

      <div style={{
        display: 'flex',
        gap: 8,
        padding: '8px 16px',
        borderBottom: '1px solid #f3f4f6',
        background: '#fafafa',
      }}>
        {TOOLS.map(tool => (
          <button
            key={tool.type}
            onClick={() => setActiveTool(prev => prev === tool.type ? null : tool.type)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              border: `1px solid ${activeTool === tool.type ? '#2563eb' : '#d1d5db'}`,
              borderRadius: 4,
              cursor: 'pointer',
              background: activeTool === tool.type ? '#eff6ff' : 'white',
              color: activeTool === tool.type ? '#2563eb' : '#374151',
              fontWeight: activeTool === tool.type ? 600 : 400,
            }}
          >
            {tool.label}
          </button>
        ))}
        {screenData.annotations.length > 0 && (
          <button
            onClick={() => onSave({ ...screenData, annotations: [] })}
            style={{
              marginLeft: 'auto',
              padding: '4px 10px',
              fontSize: 12,
              border: '1px solid #fca5a5',
              borderRadius: 4,
              cursor: 'pointer',
              background: 'white',
              color: '#ef4444',
            }}
          >
            전체 삭제
          </button>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <AnnotationCanvas
            imageUrl={screen.imageUrl}
            annotations={screenData.annotations}
            activeTool={activeTool}
            onChange={handleAnnotationsChange}
          />
        </div>
        <div style={{
          width: 320,
          borderLeft: '1px solid #e5e7eb',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <BlockEditor
            key={screen.id}
            blocks={screenData.blocks}
            onChange={handleBlocksChange}
          />
        </div>
      </div>
    </div>
  );
}
