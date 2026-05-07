import { useState, useEffect } from 'react';
import { useGuide } from './hooks/useGuide.js';
import { Sidebar } from './components/Sidebar.js';
import { ScreenEditor } from './components/ScreenEditor.js';

const isPdfMode = new URLSearchParams(window.location.search).get('pdf') === 'true';

export function App() {
  const { data, loading, error, saveScreenData } = useGuide();
  const [selectedScreenId, setSelectedScreenId] = useState<string | null>(null);

  useEffect(() => {
    if (isPdfMode && data && !selectedScreenId) {
      const firstScreen = data.sections[0]?.screens[0];
      if (firstScreen) setSelectedScreenId(firstScreen.id);
    }
  }, [data, selectedScreenId]);

  if (loading) return <div style={{ padding: 24 }}>Loading guide...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>Error: {error}</div>;
  if (!data) return null;

  const selectedScreen = data.sections
    .flatMap(s => s.screens)
    .find(s => s.id === selectedScreenId) ?? null;

  const screenData = selectedScreenId
    ? (data.store.screens[selectedScreenId] ?? { annotations: [], blocks: [] })
    : null;

  return (
    <div
      style={{ display: 'flex', height: '100vh' }}
      {...(selectedScreen ? { 'data-guidepilot-ready': 'true' } : {})}
    >
      <Sidebar
        sections={data.sections}
        selectedScreenId={selectedScreenId}
        onSelect={setSelectedScreenId}
      />
      {selectedScreen && screenData ? (
        <ScreenEditor
          screen={selectedScreen}
          screenData={screenData}
          onSave={d => saveScreenData(selectedScreen.id, d)}
        />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
          왼쪽에서 화면을 선택하세요
        </div>
      )}
    </div>
  );
}
