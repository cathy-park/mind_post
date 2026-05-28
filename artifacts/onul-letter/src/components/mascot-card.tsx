import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

// ── useDarkMode hook — reactive to .dark class changes ───────────────────────
function useDarkMode() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

// ── Pose image paths (public/assets) ─────────────────────────────────────────
const moaHomeImg    = '/assets/moa_home_1774860169050.png';
const moaEntryImg   = '/assets/moa_entry_1774860169049.png';
const moaPromptImg  = '/assets/moa_prompt_1774860169050.png';
const moaWaitingImg = '/assets/moa_waiting_1774860169051.png';
const moaSuccessImg = '/assets/moa_success_1774860169051.png';
const moaIdleImg    = '/assets/moa_idle_1774860169050.png';

const postSentImg       = '/assets/post_sent_1774860169052.png';
const postDeliveryImg   = '/assets/post_delivery_1774860169051.png';
const postYearImg       = '/assets/post_year_1774860169052.png';
const postOpenLetterImg = '/assets/post_open_letter_1774860169052.png';
const postIdleImg       = '/assets/post_idle_1774860169051.png';
const postEmptyImg      = '/assets/post_empty_1774860169051.png';

// ── Pose maps ─────────────────────────────────────────────────────────────────
export type MoaPose = 'home' | 'entry' | 'prompt' | 'waiting' | 'success' | 'idle';
export type PostPose = 'sent' | 'delivery' | 'year' | 'open_letter' | 'idle' | 'empty';

const MOA_POSES: Record<MoaPose, string> = {
  home:    moaHomeImg,
  entry:   moaEntryImg,
  prompt:  moaPromptImg,
  waiting: moaWaitingImg,
  success: moaSuccessImg,
  idle:    moaIdleImg,
};

const POST_POSES: Record<PostPose, string> = {
  sent:        postSentImg,
  delivery:    postDeliveryImg,
  year:        postYearImg,
  open_letter: postOpenLetterImg,
  idle:        postIdleImg,
  empty:       postEmptyImg,
};

// ── Size map ──────────────────────────────────────────────────────────────────
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
const SIZE_PX: Record<Size, number> = { xs: 36, sm: 52, md: 72, lg: 96, xl: 128 };

// ── PoseMascot — renders the exact contextual pose image ─────────────────────
interface PoseMascotProps {
  type: 'moa';
  pose: MoaPose;
  size?: Size;
  float?: boolean;
}
interface PostMascotProps {
  type: 'post';
  pose: PostPose;
  size?: Size;
  float?: boolean;
}

export function PoseMascot(props: PoseMascotProps | PostMascotProps) {
  const { type, size = 'md', float = false } = props;
  const px = SIZE_PX[size];
  const src = type === 'moa'
    ? MOA_POSES[(props as PoseMascotProps).pose]
    : POST_POSES[(props as PostMascotProps).pose];

  return (
    <motion.img
      src={src}
      alt={type === 'moa' ? '모아' : '포스트'}
      style={{ width: px, height: px, objectFit: 'contain', flexShrink: 0 }}
      animate={float ? { y: [0, -5, 0] } : {}}
      transition={float ? { repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 0.8 } : {}}
    />
  );
}

// ── Legacy MascotImage (uses mascots.png sprite — kept for compatibility) ─────
export function MascotImage({ type, size = 'md' }: { type: 'moa' | 'post'; size?: Size }) {
  const px = SIZE_PX[size];
  const style: React.CSSProperties = {
    width: px,
    height: px,
    backgroundImage: 'url(/images/mascots.png)',
    backgroundSize: '210% auto',
    backgroundPosition: type === 'moa' ? '15% 55%' : '88% 55%',
    backgroundRepeat: 'no-repeat',
    flexShrink: 0,
  };
  return <div style={style} aria-hidden />;
}

// ── Speech bubble — dark-mode-aware ──────────────────────────────────────────
function SpeechBubble({
  message, sub, color = 'moa',
}: {
  message: React.ReactNode; sub?: string; color?: 'moa' | 'post';
}) {
  const dark = useDarkMode();

  // Light mode: soft warm pastels / Dark mode: rich deep tones
  const lightBg    = color === 'moa' ? '#fff5f0' : '#f3efff';
  const darkBg     = color === 'moa' ? '#2d1e22' : '#1e1b2d';
  const lightBd    = color === 'moa' ? '#fad4c8' : '#ddd0ff';
  const darkBd     = color === 'moa' ? '#4a2d35' : '#342d4a';

  const bg         = dark ? darkBg  : lightBg;
  const bd         = dark ? darkBd  : lightBd;

  // Arrow tail colors match bubble bg / border
  const tailFill   = bg;
  const tailStroke = bd;

  return (
    <div
      className="relative rounded-2xl px-4 py-3 flex-1 min-w-0"
      style={{ background: bg, border: `1px solid ${bd}` }}
    >
      {/* Outer stroke arrow */}
      <span
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: -9, width: 0, height: 0, borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: `9px solid ${tailStroke}` }}
      />
      {/* Inner fill arrow */}
      <span
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: -7, width: 0, height: 0, borderTop: '7px solid transparent', borderBottom: '7px solid transparent', borderRight: `8px solid ${tailFill}` }}
      />
      <p style={{ color: dark ? '#F3F4F6' : '#3d2825', fontWeight: 600, fontSize: '0.875rem', lineHeight: '1.375' }}>
        {message}
      </p>
      {sub && (
        <p style={{ color: dark ? '#9CA3AF' : '#a07060', fontSize: '0.75rem', marginTop: 4 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

// ── MascotGuide — inline guide with speech bubble ─────────────────────────────
export function MascotGuide(props: {
  type: 'moa'; pose: MoaPose; message: React.ReactNode; sub?: string; size?: Size; messageKey?: string;
} | {
  type: 'post'; pose: PostPose; message: React.ReactNode; sub?: string; size?: Size; messageKey?: string;
}) {
  const { type, message, sub, size = 'md', messageKey } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut', repeatDelay: 1 }}
      >
        {type === 'moa'
          ? <PoseMascot type="moa" pose={(props as any).pose} size={size} />
          : <PoseMascot type="post" pose={(props as any).pose} size={size} />}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={messageKey ?? (typeof message === 'string' ? message : 'msg')}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 6 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0"
        >
          <SpeechBubble message={message} sub={sub} color={type} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── MascotHero — centered hero with floating bubble ───────────────────────────
export function MascotHero(props: {
  type: 'moa'; pose: MoaPose; message: string; sub?: string;
} | {
  type: 'post'; pose: PostPose; message: string; sub?: string;
}) {
  const { type, message, sub } = props;
  const isMoa = type === 'moa';
  const dark = useDarkMode();
  const glowCls = isMoa ? 'bg-rose-200' : 'bg-purple-200';

  const bubbleBg = dark
    ? (isMoa ? '#2d1e22' : '#1e1b2d')
    : (isMoa ? '#fff5f0' : '#f3efff');
  const bubbleBd = dark
    ? (isMoa ? '#4a2d35' : '#342d4a')
    : (isMoa ? '#fad4c8' : '#ddd0ff');

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center gap-3 pt-2"
    >
      <div className="relative flex items-center justify-center">
        <div className={`absolute w-28 h-28 rounded-full blur-2xl opacity-40 ${glowCls}`} />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', repeatDelay: 0.5 }}
        >
          {type === 'moa'
            ? <PoseMascot type="moa" pose={(props as any).pose} size="xl" />
            : <PoseMascot type="post" pose={(props as any).pose} size="xl" />}
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={message}
          initial={{ opacity: 0, scale: 0.92, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92 }}
          transition={{ type: 'spring', bounce: 0.3, duration: 0.4 }}
          className="rounded-2xl px-5 py-3 text-center max-w-xs"
          style={{ background: bubbleBg, border: `1px solid ${bubbleBd}` }}
        >
          <p style={{ color: dark ? '#F3F4F6' : '#3d2825', fontWeight: 600, fontSize: '0.875rem', lineHeight: '1.375' }}>
            {message}
          </p>
          {sub && (
            <p style={{ color: dark ? '#9CA3AF' : '#a07060', fontSize: '0.75rem', marginTop: 4 }}>
              {sub}
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

// ── Legacy MascotCard alias ───────────────────────────────────────────────────
export function MascotCard({ type, message }: { type: 'moa' | 'post'; message: string }) {
  return type === 'moa'
    ? <MascotGuide type="moa" pose="idle" message={message} />
    : <MascotGuide type="post" pose="idle" message={message} />;
}
