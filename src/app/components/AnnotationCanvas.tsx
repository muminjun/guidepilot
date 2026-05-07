import { useRef, useState, useEffect } from 'react';
import { Stage, Layer, Arrow, Circle, Rect, Text, Group, Label, Tag } from 'react-konva';
import type { Annotation, AnnotationType } from '../../core/types.js';

interface Props {
  imageUrl: string;
  annotations: Annotation[];
  activeTool: AnnotationType | null;
  onChange: (annotations: Annotation[]) => void;
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export function AnnotationCanvas({ imageUrl, annotations, activeTool, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [imgSize, setImgSize] = useState({ width: 600, height: 400 });

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImgSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width } = entries[0].contentRect;
      const scale = width / imgSize.width;
      setSize({ width, height: imgSize.height * scale });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [imgSize]);

  const scale = size.width / imgSize.width;

  function handleStageClick(e: { target: { getStage: () => { getPointerPosition: () => { x: number; y: number } | null } } }) {
    if (!activeTool) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    const x_ratio = pos.x / size.width;
    const y_ratio = pos.y / size.height;

    const newAnnotation: Annotation = {
      id: nanoid(),
      type: activeTool,
      x_ratio,
      y_ratio,
      properties: activeTool === 'badge'
        ? { number: annotations.filter(a => a.type === 'badge').length + 1, color: '#2563eb' }
        : activeTool === 'arrow'
        ? { color: '#ef4444', label: '' }
        : { color: '#f59e0b' },
    };

    onChange([...annotations, newAnnotation]);
  }

  function removeAnnotation(id: string) {
    onChange(annotations.filter(a => a.id !== id));
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <img
        src={imageUrl}
        alt="screen"
        style={{ width: '100%', display: 'block' }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>
        <Stage
          width={size.width}
          height={size.height}
          onClick={handleStageClick}
          style={{ cursor: activeTool ? 'crosshair' : 'default' }}
        >
          <Layer>
            {annotations.map(ann => {
              const x = ann.x_ratio * size.width;
              const y = ann.y_ratio * size.height;

              if (ann.type === 'arrow') {
                return (
                  <Arrow
                    key={ann.id}
                    points={[x - 40 * scale, y - 20 * scale, x, y]}
                    stroke={ann.properties.color ?? '#ef4444'}
                    strokeWidth={2}
                    fill={ann.properties.color ?? '#ef4444'}
                    onClick={() => removeAnnotation(ann.id)}
                  />
                );
              }
              if (ann.type === 'circle') {
                return (
                  <Circle
                    key={ann.id}
                    x={x} y={y}
                    radius={20 * scale}
                    stroke={ann.properties.color ?? '#f59e0b'}
                    strokeWidth={2}
                    onClick={() => removeAnnotation(ann.id)}
                  />
                );
              }
              if (ann.type === 'rect') {
                return (
                  <Rect
                    key={ann.id}
                    x={x - 20 * scale} y={y - 15 * scale}
                    width={40 * scale} height={30 * scale}
                    stroke={ann.properties.color ?? '#8b5cf6'}
                    strokeWidth={2}
                    onClick={() => removeAnnotation(ann.id)}
                  />
                );
              }
              if (ann.type === 'badge') {
                return (
                  <Group key={ann.id} x={x} y={y} onClick={() => removeAnnotation(ann.id)}>
                    <Circle radius={12 * scale} fill={ann.properties.color ?? '#2563eb'} />
                    <Text
                      text={String(ann.properties.number ?? '')}
                      fontSize={10 * scale}
                      fill="white"
                      align="center"
                      verticalAlign="middle"
                      offsetX={5 * scale}
                      offsetY={5 * scale}
                    />
                  </Group>
                );
              }
              if (ann.type === 'text') {
                return (
                  <Label key={ann.id} x={x} y={y} onClick={() => removeAnnotation(ann.id)}>
                    <Tag fill="#1f2937" cornerRadius={4} />
                    <Text
                      text={ann.properties.label ?? 'Label'}
                      fontSize={12 * scale}
                      fill="white"
                      padding={4 * scale}
                    />
                  </Label>
                );
              }
              return null;
            })}
          </Layer>
        </Stage>
      </div>
    </div>
  );
}
