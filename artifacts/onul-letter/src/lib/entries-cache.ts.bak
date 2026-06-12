// 마지막으로 성공한 Supabase 조회 결과를 localStorage에 저장
// 앱 시작 시 즉시 이전 데이터를 표시하고, 인증 완료 후 최신 데이터로 갱신

import { JournalEntry } from './constants';

const CACHE_KEY = 'onul_entries_cache_v2';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7일

export function saveEntriesToCache(entries: JournalEntry[], userId: string): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ entries, userId, savedAt: Date.now() }));
  } catch {
    // 저장 실패 무시 (용량 초과 등)
  }
}

export function loadEntriesFromCache(): { entries: JournalEntry[], savedAt: number } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { entries, savedAt } = JSON.parse(raw);
    if (!Array.isArray(entries) || entries.length === 0) return null;
    if (Date.now() - savedAt > MAX_AGE_MS) return null;
    return { entries: entries as JournalEntry[], savedAt };
  } catch {
    return null;
  }
}

export function clearEntriesCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {}
}
