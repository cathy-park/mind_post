// 인증 이벤트 발생 시 entries를 invalidate → 최신 데이터로 교체
// 이 모듈을 import하는 것만으로 구독이 설정됨 (use-journal.ts에서 side-effect import)
//
// 흐름:
//  ① 앱 시작: fetchAllEntries → getSession() vs 500ms 타임아웃 레이스
//     - 토큰 유효: 즉시 Supabase 조회 (빠른 경로)
//     - 토큰 만료: 캐시 반환 (느린 경로) → 이 파일이 TOKEN_REFRESHED 수신 후 재조회 트리거
//  ② 로그인/로그아웃: SIGNED_IN/SIGNED_OUT → use-supabase-auth.ts에서 처리

import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/query-client';

supabase.auth.onAuthStateChange((event) => {
  if (event === 'TOKEN_REFRESHED') {
    // 토큰 갱신 완료 → 항상 최신 데이터 재조회 (만료 후 복귀 시 필수)
    queryClient.invalidateQueries({ queryKey: ['entries'] });
  } else if (event === 'INITIAL_SESSION') {
    // 초기화 완료 → 백그라운드 fetch로 이미 최신 데이터가 있으면 중복 조회 생략
    const state = queryClient.getQueryState(['entries']);
    const age = state?.dataUpdatedAt ? Date.now() - state.dataUpdatedAt : Infinity;
    if (age > 10_000) {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
    }
  }
});
