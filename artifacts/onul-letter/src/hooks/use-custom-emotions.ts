import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'onul_custom_emotions';

export interface CustomEmotion {
  id: string;
  name: string;
  emoji: string;
  colorClass: string;
  usageCount: number;
  createdAt: string;
}

function load(): CustomEmotion[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'); }
  catch { return []; }
}

function persist(items: CustomEmotion[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Supabase user_metadata에 커스텀 감정 업로드 (기기 간 동기화)
async function uploadToServer(items: CustomEmotion[]): Promise<void> {
  try {
    await supabase.auth.updateUser({ data: { custom_emotions: items } });
  } catch {}
}

// 서버(user_metadata)에서 최신 커스텀 감정 가져와 localStorage 갱신
async function syncFromServer(): Promise<CustomEmotion[] | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const serverEmotions: CustomEmotion[] = user.user_metadata?.custom_emotions ?? [];
    const localEmotions = load();

    if (serverEmotions.length === 0 && localEmotions.length === 0) return null;

    // 서버가 비어있고 로컬에 데이터 있음 → 로컬을 서버에 첫 업로드
    if (serverEmotions.length === 0 && localEmotions.length > 0) {
      await uploadToServer(localEmotions);
      return null;
    }

    // 서버 데이터로 로컬 덮어쓰기 (서버가 소스 오브 트루스)
    persist(serverEmotions);
    return serverEmotions;
  } catch {
    return null;
  }
}

export function getCustomEmotionData(name: string): CustomEmotion | null {
  return load().find(e => e.name === name) ?? null;
}

export function useCustomEmotions() {
  const [items, setItems] = useState<CustomEmotion[]>(load);

  // 마운트 시 서버에서 최신 데이터 동기화
  useEffect(() => {
    syncFromServer().then(serverData => {
      if (serverData !== null) {
        setItems(serverData);
      }
    });
  }, []);

  function mutate(next: CustomEmotion[]) {
    setItems(next);
    persist(next);
    // 서버에도 동기화 (fire and forget)
    uploadToServer(next);
  }

  const sorted = [...items].sort((a, b) => b.usageCount - a.usageCount);

  return {
    emotions: sorted,
    has: (name: string) => items.some(e => e.name === name),

    add(draft: { name: string; emoji: string; colorClass: string }) {
      const item: CustomEmotion = {
        ...draft,
        id: crypto.randomUUID(),
        usageCount: 0,
        createdAt: new Date().toISOString(),
      };
      mutate([...items, item]);
    },

    edit(id: string, changes: Partial<Pick<CustomEmotion, 'name' | 'emoji' | 'colorClass'>>) {
      mutate(items.map(e => e.id === id ? { ...e, ...changes } : e));
    },

    remove(id: string) {
      mutate(items.filter(e => e.id !== id));
    },

    incrementUsage(name: string) {
      mutate(items.map(e => e.name === name ? { ...e, usageCount: e.usageCount + 1 } : e));
    },
  };
}
