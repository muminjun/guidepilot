// src/core/types.ts

export interface GuideSection {
  id: string;       // folder name, e.g. "레시피관리"
  label: string;    // display name (from yaml override or folder name)
  order: number;
  screens: GuideScreen[];
}

export interface GuideScreen {
  id: string;       // "레시피관리/01_목록"
  label: string;    // display name, number prefix stripped: "목록"
  imageUrl: string; // "preview/레시피관리/01_목록.png"
  order: number;
}

export type AnnotationType = 'arrow' | 'circle' | 'rect' | 'text' | 'badge';

export interface Annotation {
  id: string;
  type: AnnotationType;
  x_ratio: number;  // 0–1 relative to image width
  y_ratio: number;  // 0–1 relative to image height
  properties: {
    color?: string;
    label?: string;
    number?: number;
    width_ratio?: number;
    height_ratio?: number;
  };
}

export type BlockType = 'heading' | 'paragraph' | 'steps' | 'warning' | 'callout';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  order: number;
}

export interface ScreenData {
  annotations: Annotation[];
  blocks: ContentBlock[];
}

export interface DataStore {
  screens: Record<string, ScreenData>;  // keyed by GuideScreen.id
}

export interface YamlConfig {
  sections?: Array<{
    id: string;
    label: string;
    order: number;
  }>;
}

// Shape of GET /guide-data.json response
export interface GuideData {
  sections: GuideSection[];
  store: DataStore;
}
