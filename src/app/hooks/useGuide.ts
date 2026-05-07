import { useState, useEffect, useCallback } from 'react';
import type { GuideData, DataStore, ScreenData } from '../../core/types.js';

export function useGuide() {
  const [data, setData] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('./guide-data.json')
      .then(r => r.json())
      .then((d: GuideData) => { setData(d); setLoading(false); })
      .catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  const saveScreenData = useCallback(async (screenId: string, screenData: ScreenData) => {
    if (!data) return;
    const newStore: DataStore = {
      screens: { ...data.store.screens, [screenId]: screenData },
    };
    await fetch('/api/data', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newStore),
    });
    setData(prev => prev ? { ...prev, store: newStore } : prev);
  }, [data]);

  return { data, loading, error, saveScreenData };
}
