import { useState, useEffect, useCallback } from 'react';
import { type User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getGuestEntries, clearGuestEntries } from '@/lib/guest-storage';
import { uploadPhoto } from '@/hooks/use-journal';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/query-client';
import { clearEntriesCache } from '@/lib/entries-cache';

declare const __REPLIT_DOMAIN__: string;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  nickname: string;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  isSyncing: boolean;
  isLoggingIn: boolean;
}

async function syncGuestEntries(userId: string): Promise<void> {
  const guests = getGuestEntries();
  if (guests.length === 0) return;

  const { id: toastId, update: updateToast } = toast({
    title: '동기화 진행 중...',
    description: '임시 기록을 클라우드에 저장하고 있습니다. 잠시만 기다려주세요 ⏳',
  });

  try {
    for (const g of guests) {
      const { data: existing } = await supabase
        .from('entries')
        .select('id')
        .eq('user_id', userId)
        .eq('entry_date', g.date)
        .maybeSingle();
      if (existing) continue;

      let photoUrl: string | null = null;
      if (g.photo) {
        photoUrl = await uploadPhoto(g.photo, userId, g.date);
      }
      const { error } = await supabase.from('entries').insert({
        user_id: userId,
        entry_date: g.date,
        emotion: g.emotion,
        short_answer: g.shortAnswer,
        long_answer: g.longAnswer ?? null,
        photo_url: photoUrl,
      });
      if (error) throw error;
    }
    clearGuestEntries();
    updateToast({
      id: toastId,
      title: '동기화 완료!',
      description: `${guests.length}개의 기록이 안전하게 보관되었습니다 💌`,
    });
    queryClient.invalidateQueries({ queryKey: ['entries'] });
  } catch (err) {
    console.error('Guest sync failed:', err);
    updateToast({
      id: toastId,
      title: '동기화 실패',
      description: '기록을 동기화하는 중 문제가 발생했습니다. 다시 시도해 주세요.',
      variant: 'destructive',
    });
  }
}

function getRedirectUrl(): string {
  const domain = typeof __REPLIT_DOMAIN__ !== 'undefined' ? __REPLIT_DOMAIN__ : '';
  if (domain) return `https://${domain}/`;
  return window.location.origin + '/';
}

export function useSupabaseAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    // 안전 장치: 3초 이상 걸리면 무조건 로딩 해제 (서버가 깨어나는 중일 때 무한 로딩 방지)
    const timeoutId = setTimeout(() => {
      if (isMounted) setIsLoading(false);
    }, 3000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setUser(session?.user ?? null);
      setIsLoading(false);
      clearTimeout(timeoutId);
    }).catch((err) => {
      console.error('Session error:', err);
      if (isMounted) setIsLoading(false);
      clearTimeout(timeoutId);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (event === 'SIGNED_IN' && session?.user) {
          setIsSyncing(true);
          syncGuestEntries(session.user.id).finally(() => {
            if (isMounted) setIsSyncing(false);
          });
          queryClient.invalidateQueries({ queryKey: ['entries'] });
        }

        if (event === 'SIGNED_OUT') {
          clearEntriesCache();
          queryClient.invalidateQueries({ queryKey: ['entries'] });
          queryClient.clear();
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const login = useCallback(async () => {
    if (isLoggingIn) return;
    
    setIsLoggingIn(true);
    let isAwake = false;
    
    // 3초 이상 걸리면 안내 토스트 띄우기
    const timeoutId = setTimeout(() => {
      if (!isAwake) {
        toast({
          title: '서버를 깨우는 중...',
          description: '오랜만에 접속하여 데이터베이스를 깨우고 있습니다. 최대 1~2분이 소요될 수 있습니다 💤',
          duration: 120000, // 2분
        });
      }
    }, 3000);

    try {
      // DB가 깨어날 때까지 대기 (최대 반복)
      for (let i = 0; i < 10; i++) {
        const { error } = await supabase.from('entries').select('id').limit(1);
        
        // 에러가 없거나, 5xx 에러(서버 준비 중)가 아니면 깨어난 것으로 간주
        const isServerStarting = error && (
          error.code === '504' || 
          error.code === '503' || 
          error.code === '502' || 
          error.message?.includes('timeout') ||
          error.message?.includes('Failed to fetch')
        );

        if (!isServerStarting) {
          isAwake = true;
          break;
        }
        await new Promise(r => setTimeout(r, 5000));
      }
      
      clearTimeout(timeoutId);
      const redirectTo = getRedirectUrl();
      
      // DB가 깨어난 것이 확인된 후 OAuth 리다이렉트 실행 (504 에러 방지)
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo },
      });
    } catch (err) {
      console.error('Login error:', err);
      toast({
        title: '로그인 실패',
        description: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
      setIsLoggingIn(false);
      clearTimeout(timeoutId);
    }
  }, [isLoggingIn]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const updateNickname = useCallback(async (nickname: string) => {
    const { data } = await supabase.auth.updateUser({
      data: { nickname },
    });
    if (data.user) setUser(data.user);
  }, []);


  const nickname = user?.user_metadata?.nickname || '기록자';

  return { user, isLoading, isAuthenticated: !!user, nickname, login, logout, updateNickname, isSyncing, isLoggingIn };
}
