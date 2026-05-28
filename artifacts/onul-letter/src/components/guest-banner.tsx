import { motion } from 'framer-motion';
import { useGuest } from '@/lib/guest-context';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

export function GuestBanner() {
  const { isGuest, exitGuestMode } = useGuest();
  const { login } = useSupabaseAuth();

  if (!isGuest) return null;

  const handleLogin = async () => {
    exitGuestMode();
    await login();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto mx-4 mt-3 w-full max-w-sm bg-foreground/90 backdrop-blur-sm text-background rounded-2xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg">
        <p className="text-xs font-medium opacity-80 leading-snug">
          둘러보는 중이에요
        </p>
        <button
          onClick={handleLogin}
          className="flex-shrink-0 text-xs font-bold bg-background text-foreground rounded-full px-3 py-1 hover:opacity-90 active:scale-95 transition-all"
        >
          로그인
        </button>
      </div>
    </motion.div>
  );
}
