import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';
import { JournalEntry, AppSettings, DEFAULT_SETTINGS, WEEKDAYS, EmotionType, Reflection } from '@/lib/constants';
import { EMOTIONS } from '@/lib/constants';
import { supabase } from '@/lib/supabase';
import { GuestEntry, getGuestEntries, addGuestEntry, upsertGuestEntry, deleteGuestEntry, guestToJournalEntry } from '@/lib/guest-storage';
import { saveEntriesToCache, loadEntriesFromCache } from '@/lib/entries-cache';
import '@/lib/auth-ready'; // INITIAL_SESSION 구독 설정 (side-effect)

const SETTINGS_KEY = 'onul-settings';

// ── Supabase row types ─────────────────────────────────────────────────────

interface DbEntry {
  id: string;
  user_id: string;
  entry_date: string;
  emotion: string;
  short_answer: string;
  long_answer: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
  reflection_comments: DbReflection[];
}

interface DbReflection {
  id: string;
  entry_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function dbToEntry(row: DbEntry): JournalEntry {
  return {
    id: row.id,
    date: row.entry_date,
    weekday: WEEKDAYS[parseISO(row.entry_date).getDay()],
    emotion: row.emotion as EmotionType,
    question: EMOTIONS[row.emotion as EmotionType]?.question ?? '',
    shortAnswer: row.short_answer,
    longAnswer: row.long_answer ?? undefined,
    photo: row.photo_url ?? undefined,
    createdAt: row.created_at,
    reflections: (row.reflection_comments ?? []).map((r) => ({
      id: r.id,
      content: r.comment,
      createdAt: r.created_at,
    })),
  };
}

async function getCurrentUserId(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error('로그인이 필요해요');
  return session.user.id;
}

export async function uploadPhoto(base64: string, userId: string, date: string): Promise<string | null> {
  if (!base64.startsWith('data:')) return base64;

  const [header, data] = base64.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
  const ext = mimeType.split('/')[1] ?? 'jpg';
  const bytes = atob(data);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: mimeType });

  const path = `${userId}/${date}-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from('journal-photos')
    .upload(path, blob, { upsert: true, contentType: mimeType });

  if (error) {
    console.error('Photo upload error:', error);
    return base64;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('journal-photos')
    .getPublicUrl(path);

  return publicUrl;
}

// localStorage에서 Supabase 세션을 직접 읽음 (동기, Supabase JS 초기화 불필요)
function getStoredSupabaseSession(): {
  access_token: string; refresh_token: string; expires_at: number; user: { id: string };
} | null {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith('sb-') || !key?.endsWith('-auth-token')) continue;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    }
  } catch {}
  return null;
}

// Supabase 클라이언트를 통해 데이터 fetch (CORS 안전, 브라우저 환경 권장)
async function fetchDirect(_accessToken: string, userId: string): Promise<JournalEntry[] | null> {
  try {
    const { data, error } = await supabase
      .from('entries')
      .select('*, reflection_comments(*)')
      .order('entry_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase fetch error:', error.message);
      return null;
    }
    const entries = (data as DbEntry[]).map(dbToEntry);
    saveEntriesToCache(entries, userId);
    return entries;
  } catch (e) {
    console.error('fetchDirect error:', e);
    return null;
  }
}

import { queryClient } from '@/lib/query-client';

// 캐시가 있을 때 백그라운드로 최신 데이터 갱신 (UI는 즉시 표시)
let _bgFetching = false;
async function triggerBackgroundFetch(accessToken: string, userId: string) {
  if (_bgFetching) return;
  _bgFetching = true;
  try {
    const entries = await fetchDirect(accessToken, userId);
    if (entries !== null) {
      queryClient.setQueryData(['entries'], entries);
    }
  } catch (err) {
    console.error('Background fetch error:', err);
  } finally {
    _bgFetching = false;
  }
}

async function fetchAllEntries(): Promise<JournalEntry[]> {
  console.log('[fetchAllEntries] 시작');
  // 1️⃣ 캐시가 있으면 즉시 반환하고 백그라운드 갱신 시도
  const cached = loadEntriesFromCache();
  if (cached?.entries && cached.entries.length > 0) {
    console.log('[fetchAllEntries] 캐시 히트', { count: cached.entries.length });
    const stored = getStoredSupabaseSession();
    const nowSecs = Math.floor(Date.now() / 1000);
    if (stored?.access_token && stored.expires_at > nowSecs + 30 && stored.user?.id) {
      console.log('[fetchAllEntries] 백그라운드 갱신 트리거', { userId: stored.user.id });
      triggerBackgroundFetch(stored.access_token, stored.user.id);
    }
    return cached.entries;
  }

  // 2️⃣ 세션 확보
  console.log('[fetchAllEntries] 세션 확보 시도');
  const { data: { session } = { session: null } } = await supabase.auth.getSession();
  if (!session?.user) {
    console.log('[fetchAllEntries] 비회원 처리');
    return getGuestEntries()
      .map(guestToJournalEntry)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  // 3️⃣ Supabase 데이터 조회
  console.log('[fetchAllEntries] Supabase 조회 실행');
  const { data, error } = await supabase
    .from('entries')
    .select('*, reflection_comments(*)')
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[fetchAllEntries] Supabase fetch error:', error);
    if (error.code === 'PGRST116' || error.message.includes('JWT')) return [];
    throw new Error(error.message);
  }

  const entries = (data as DbEntry[]).map(dbToEntry);
  console.log('[fetchAllEntries] 조회 완료, 건수', entries.length);
  saveEntriesToCache(entries, session.user.id);
  return entries;
}

const getLocalSettings = (): AppSettings => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : DEFAULT_SETTINGS;
};

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['entries'] });
};

// ── Read hooks ────────────────────────────────────────────────────────────

export function useEntries() {
  return useQuery({
    queryKey: ['entries'],
    queryFn: fetchAllEntries,
    staleTime: 30_000,
    // placeholderData 제거: 빈 배열이 "데이터 없음" UI를 유발하므로
    // 대신 query-client.ts에서 캐시를 initialData로 주입
  });
}

export function useTodayEntry() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['entries'],
    queryFn: fetchAllEntries,
    select: (entries) => entries.find((e) => e.date === todayStr) ?? null,
    staleTime: 30_000,
  });
}

export function useTodayEntries() {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  return useQuery({
    queryKey: ['entries'],
    queryFn: fetchAllEntries,
    select: (entries) => entries.filter((e) => e.date === todayStr),
    staleTime: 30_000,
  });
}

export function useTimeLetters() {
  return useQuery({
    queryKey: ['entries'],
    queryFn: fetchAllEntries,
    select: (entries) => {
      const today = new Date();
      const find = (d: string) => entries.find((e) => e.date === d) ?? null;
      const todayDay = today.getDate();
      const lastMonthDate = subMonths(today, 1);
      const lastYearDate = subYears(today, 1);
      return {
        lastWeek: find(format(subDays(today, 7), 'yyyy-MM-dd')),
        lastMonth:
          lastMonthDate.getDate() === todayDay
            ? find(format(lastMonthDate, 'yyyy-MM-dd'))
            : null,
        lastYear:
          lastYearDate.getDate() === todayDay
            ? find(format(lastYearDate, 'yyyy-MM-dd'))
            : null,
      };
    },
    staleTime: 30_000,
  });
}

export interface ArchiveItem {
  num: number;
  label: string;
  dateStr: string;
  entry: JournalEntry;
}

export function useArchiveLetters() {
  return useQuery({
    queryKey: ['entries'],
    queryFn: fetchAllEntries,
    select: (entries): { weekly: ArchiveItem[]; monthly: ArchiveItem[]; yearly: ArchiveItem[] } => {
      const today = new Date();
      const todayDay = today.getDate();

      const weekly: ArchiveItem[] = [];
      for (let w = 1; w <= 52; w++) {
        const d = subDays(today, 7 * w);
        const dateStr = format(d, 'yyyy-MM-dd');
        const entry = entries.find((e) => e.date === dateStr);
        if (entry) weekly.push({ num: w, label: `${w}주 전`, dateStr, entry });
      }

      const monthly: ArchiveItem[] = [];
      for (let m = 1; m <= 36; m++) {
        const d = subMonths(today, m);
        if (d.getDate() !== todayDay) continue;
        const dateStr = format(d, 'yyyy-MM-dd');
        const entry = entries.find((e) => e.date === dateStr);
        if (entry) monthly.push({ num: m, label: `${m}달 전`, dateStr, entry });
      }

      const yearly: ArchiveItem[] = [];
      for (let y = 1; y <= 10; y++) {
        const d = subYears(today, y);
        if (d.getDate() !== todayDay) continue;
        const dateStr = format(d, 'yyyy-MM-dd');
        const entry = entries.find((e) => e.date === dateStr);
        if (entry) yearly.push({ num: y, label: `${y}년 전`, dateStr, entry });
      }

      return { weekly, monthly, yearly };
    },
    staleTime: 30_000,
  });
}

export function useEmotionStats() {
  return useQuery({
    queryKey: ['entries'],
    queryFn: fetchAllEntries,
    select: (entries) => {
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(today, 6 - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const entry = entries.find((e) => e.date === dateStr);
        return {
          dateStr,
          dayLabel: WEEKDAYS[date.getDay()],
          emotion: (entry?.emotion as EmotionType | null) ?? null,
        };
      });
      const monthStr = format(today, 'yyyy-MM');
      const monthEntries = entries.filter((e) => e.date.startsWith(monthStr));
      const distribution = {} as Record<EmotionType, number>;
      monthEntries.forEach((e) => {
        distribution[e.emotion] = (distribution[e.emotion] || 0) + 1;
      });
      let streak = 0;
      for (let i = 0; ; i++) {
        const d = format(subDays(today, i), 'yyyy-MM-dd');
        if (entries.some((e) => e.date === d)) streak++;
        else break;
      }
      return {
        last7Days,
        monthDistribution: distribution,
        totalEntries: entries.length,
        streak,
      };
    },
    staleTime: 30_000,
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => getLocalSettings(),
  });
}

// ── Write hooks ───────────────────────────────────────────────────────────

export function useAddEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      entry: Omit<JournalEntry, 'id' | 'createdAt' | 'weekday' | 'reflections'>,
    ) => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user) {
        const guestEntry: GuestEntry = {
          id: `guest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: entry.date,
          emotion: entry.emotion,
          shortAnswer: entry.shortAnswer,
          longAnswer: entry.longAnswer,
          photo: entry.photo,
          createdAt: new Date().toISOString(),
        };
        addGuestEntry(guestEntry);
        return guestToJournalEntry(guestEntry);
      }

      const userId = session.user.id;
      const photoUrl = entry.photo
        ? await uploadPhoto(entry.photo, userId, entry.date)
        : null;

      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: userId,
          entry_date: entry.date,
          emotion: entry.emotion,
          short_answer: entry.shortAnswer,
          long_answer: entry.longAnswer ?? null,
          photo_url: photoUrl,
        })
        .select('*, reflection_comments(*)')
        .single();

      if (error) throw new Error(error.message);
      return dbToEntry(data as DbEntry);
    },
    onSuccess: (newEntry) => {
      queryClient.setQueryData(['entries'], (old: JournalEntry[] | undefined) => {
        const newEntries = old ? [newEntry, ...old] : [newEntry];
        saveEntriesToCache(newEntries, 'current_user'); // ID doesn't matter much for immediate cache read
        return newEntries;
      });
      invalidateAll(queryClient);
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updated: JournalEntry) => {
      const userId = await getCurrentUserId();
      const photoUrl = updated.photo
        ? await uploadPhoto(updated.photo, userId, updated.date)
        : null;

      const { data, error } = await supabase
        .from('entries')
        .update({
          emotion: updated.emotion,
          short_answer: updated.shortAnswer,
          long_answer: updated.longAnswer ?? null,
          photo_url: photoUrl,
          entry_date: updated.date,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updated.id)
        .select('*, reflection_comments(*)')
        .single();

      if (error) throw new Error(error.message);
      return dbToEntry(data as DbEntry);
    },
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(['entries'], (old: JournalEntry[] | undefined) => {
        const newEntries = old ? old.map(e => e.id === updatedEntry.id ? updatedEntry : e) : [updatedEntry];
        saveEntriesToCache(newEntries, 'current_user');
        return newEntries;
      });
      invalidateAll(queryClient);
    },
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('guest-')) {
        deleteGuestEntry(id);
        return id;
      }
      const { error } = await supabase
        .from('entries')
        .delete()
        .eq('id', id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['entries'], (old: JournalEntry[] | undefined) => {
        const newEntries = old ? old.filter(e => e.id !== deletedId) : [];
        saveEntriesToCache(newEntries, 'current_user');
        return newEntries;
      });
      invalidateAll(queryClient);
    },
  });
}

export function useAddReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      content,
    }: {
      entryId: string;
      content: string;
    }) => {
      const userId = await getCurrentUserId();

      const { error: reflErr } = await supabase
        .from('reflection_comments')
        .insert({ entry_id: entryId, user_id: userId, comment: content.trim() });
      if (reflErr) throw new Error(reflErr.message);

      const { data, error } = await supabase
        .from('entries')
        .select('*, reflection_comments(*)')
        .eq('id', entryId)
        .single();
      if (error) throw new Error(error.message);
      return dbToEntry(data as DbEntry);
    },
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(['entries'], (old: JournalEntry[] | undefined) => {
        const newEntries = old ? old.map(e => e.id === updatedEntry.id ? updatedEntry : e) : [updatedEntry];
        saveEntriesToCache(newEntries, 'current_user');
        return newEntries;
      });
      invalidateAll(queryClient);
    },
  });
}

export function useUpdateReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      reflectionId,
      content,
    }: {
      entryId: string;
      reflectionId: string;
      content: string;
    }) => {
      const { error: updErr } = await supabase
        .from('reflection_comments')
        .update({ comment: content.trim() })
        .eq('id', reflectionId);
      if (updErr) throw new Error(updErr.message);

      const { data, error } = await supabase
        .from('entries')
        .select('*, reflection_comments(*)')
        .eq('id', entryId)
        .single();
      if (error) throw new Error(error.message);
      return dbToEntry(data as DbEntry);
    },
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(['entries'], (old: JournalEntry[] | undefined) => {
        const newEntries = old ? old.map(e => e.id === updatedEntry.id ? updatedEntry : e) : [updatedEntry];
        saveEntriesToCache(newEntries, 'current_user');
        return newEntries;
      });
      invalidateAll(queryClient);
    },
  });
}

export function useDeleteReflection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entryId,
      reflectionId,
    }: {
      entryId: string;
      reflectionId: string;
    }) => {
      const { error: delErr } = await supabase
        .from('reflection_comments')
        .delete()
        .eq('id', reflectionId);
      if (delErr) throw new Error(delErr.message);

      const { data, error } = await supabase
        .from('entries')
        .select('*, reflection_comments(*)')
        .eq('id', entryId)
        .single();
      if (error) throw new Error(error.message);
      return dbToEntry(data as DbEntry);
    },
    onSuccess: (updatedEntry) => {
      queryClient.setQueryData(['entries'], (old: JournalEntry[] | undefined) => {
        const newEntries = old ? old.map(e => e.id === updatedEntry.id ? updatedEntry : e) : [updatedEntry];
        saveEntriesToCache(newEntries, 'current_user');
        return newEntries;
      });
      invalidateAll(queryClient);
    },
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newSettings: Partial<AppSettings>) => {
      const current = getLocalSettings();
      const updated = { ...current, ...newSettings };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
      if (updated.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}
