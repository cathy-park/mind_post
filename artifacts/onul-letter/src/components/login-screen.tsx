import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { MobileContainer } from '@/components/layout/mobile-container';
const MoaHome = '/assets/moa_home_1774860169050.png';
const PostDelivery = '/assets/post_delivery_1774860169051.png';

interface Props {
  onLogin: () => void;
  onGuest: () => void;
  onGuestTo: (path: string) => void;
}

export function LoginScreen({ onLogin, onGuest, onGuestTo }: Props) {
  return (
    <MobileContainer>
      <div className="flex flex-col items-center justify-between min-h-screen px-6 pt-14 pb-10">

        {/* ── App name ────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="text-center"
        >
          <p className="text-xs font-semibold tracking-[0.3em] text-muted-foreground/40 uppercase">오늘의 편지</p>
        </motion.div>

        {/* ── Hero ────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-7 w-full">

          {/* Mascot pair */}
          <motion.div
            initial={{ opacity: 0, scale: 0.93 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            className="flex items-end justify-center gap-3"
          >
            <div className="flex flex-col items-center gap-1">
              <img src={MoaHome} alt="모아" className="w-[6.5rem] h-[6.5rem] object-contain drop-shadow-sm" />
            </div>

            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.32, type: 'spring', stiffness: 220, damping: 14 }}
              className="text-2xl pb-6"
            >
              💌
            </motion.span>

            <div className="flex flex-col items-center gap-1">
              <img src={PostDelivery} alt="포스트" className="w-[6.5rem] h-[6.5rem] object-contain drop-shadow-sm" />
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.22 }}
            className="text-center space-y-1.5"
          >
            <h1 className="text-2xl font-bold text-foreground leading-snug tracking-tight">
              오늘의 감정을<br />남겨보세요
            </h1>
            <p className="text-sm text-muted-foreground/70 leading-relaxed">
              언젠가 다시 당신에게<br />돌아올 편지처럼
            </p>
          </motion.div>

          {/* ── Mascot entry-point actions ───────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32 }}
            className="w-full max-w-xs flex flex-col gap-2.5"
          >
            {/* 모아 → Record */}
            <motion.button
              whileTap={{ scale: 0.975 }}
              onClick={() => onGuestTo('/record')}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-orange-50 dark:bg-orange-900/15 border border-orange-100 dark:border-orange-900/25 hover:bg-orange-100/70 dark:hover:bg-orange-900/25 active:scale-[0.98] transition-all group"
            >
              <img src={MoaHome} alt="모아" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-[13px] font-bold text-orange-800 dark:text-orange-300 leading-none mb-0.5">오늘 감정 기록하기</p>
                <p className="text-[11px] text-orange-600/70 dark:text-orange-400/60">모아가 오늘의 마음을 모아둬요</p>
              </div>
              <ArrowRight className="w-4 h-4 text-orange-400/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </motion.button>

            {/* 포스트 → Archive */}
            <motion.button
              whileTap={{ scale: 0.975 }}
              onClick={() => onGuestTo('/')}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-blue-50 dark:bg-blue-900/15 border border-blue-100 dark:border-blue-900/25 hover:bg-blue-100/70 dark:hover:bg-blue-900/25 active:scale-[0.98] transition-all group"
            >
              <img src={PostDelivery} alt="포스트" className="w-10 h-10 object-contain flex-shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-[13px] font-bold text-blue-800 dark:text-blue-300 leading-none mb-0.5">기억 보관함 둘러보기</p>
                <p className="text-[11px] text-blue-600/70 dark:text-blue-400/60">포스트가 소중한 기억을 전해드려요</p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-400/60 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </motion.button>
          </motion.div>
        </div>

        {/* ── CTAs ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.44 }}
          className="w-full max-w-xs flex flex-col gap-2.5"
        >
          {/* Primary: Google login */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onLogin}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-border shadow-sm hover:shadow-md active:scale-[0.98] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
              <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
              <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
              <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
              <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
            </svg>
            <span className="text-foreground">Google로 시작하기</span>
          </motion.button>

          {/* Secondary: plain browse */}
          <button
            onClick={onGuest}
            className="w-full py-2.5 text-sm text-muted-foreground/60 hover:text-muted-foreground active:scale-[0.99] transition-all text-center"
          >
            로그인 없이 둘러보기
          </button>

          <p className="text-center text-[11px] text-muted-foreground/40 leading-relaxed pt-0.5">
            로그인하면 기록이 안전하게 저장되고<br />모든 기기에서 동기화돼요
          </p>
        </motion.div>

      </div>
    </MobileContainer>
  );
}
