import type { GuideSection } from '../../core/types.js';

interface Props {
  sections: GuideSection[];
  selectedScreenId: string | null;
  onSelect: (id: string) => void;
}

export function Sidebar({ sections, selectedScreenId, onSelect }: Props) {
  return (
    <div style={{
      width: 240,
      borderRight: '1px solid #e5e7eb',
      overflowY: 'auto',
      background: '#fafafa',
    }}>
      <div style={{ padding: '12px 16px', fontWeight: 700, fontSize: 14, borderBottom: '1px solid #e5e7eb' }}>
        Guidepilot
      </div>
      {sections.map(section => (
        <div key={section.id}>
          <div style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {section.label}
          </div>
          {section.screens.map(screen => (
            <button
              key={screen.id}
              onClick={() => onSelect(screen.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '6px 16px 6px 24px',
                fontSize: 13,
                cursor: 'pointer',
                border: 'none',
                background: selectedScreenId === screen.id ? '#eff6ff' : 'transparent',
                color: selectedScreenId === screen.id ? '#2563eb' : '#374151',
                fontWeight: selectedScreenId === screen.id ? 500 : 400,
              }}
            >
              {screen.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
