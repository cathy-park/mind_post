import { QueryClient } from '@tanstack/react-query';
import { loadEntriesFromCache } from './entries-cache';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 30_000,
    },
  },
});

// 앱 시작 직후 이전 세션 캐시로 QueryClient 선주입
// → 인증 완료 전에도 홈/편지함에 즉시 데이터 표시
const cached = loadEntriesFromCache();
if (cached) {
  queryClient.setQueryData(['entries'], cached);
}
