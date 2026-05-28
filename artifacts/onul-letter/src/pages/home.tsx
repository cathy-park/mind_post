import { useLocation } from 'wouter';
import { format, parseISO } from 'date-fns';
import { X, ChevronRight, BookOpen, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { MobileContainer } from '@/components/layout/mobile-container';
import { BottomNav } from '@/components/layout/bottom-nav';
import { PoseMascot } from '@/components/mascot-card';
import { EntryDetailModal } from '@/components/entry-detail-modal';
import { useTodayEntries, useTimeLetters } from '@/hooks/use-journal';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useNotifications, AppNotification } from '@/hooks/use-notifications';
import { WEEKDAYS, EMOTIONS, JournalEntry } from '@/lib/constants';
import { resolveEmotion } from '@/lib/emotion-utils';

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

// ── Login prompt bottom sheet ─────────────────────────────────────────────────
function LoginPromptSheet({
  onLogin,
  onClose,
  onContinueAsGuest,
}: {
  onLogin: () => void;
  onClose: () => void;
  onContinueAsGuest: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.18, duration: 0.42 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-card rounded-t-3xl pt-6 px-6 shadow-2xl"
        style={{ paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))' }}
      >
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-6" />

        {/* 모아 mascot */}
        <div className="flex justify-center mb-4">
          <PoseMascot type="moa" pose="home" size="lg" />
        </div>

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-lg font-bold text-foreground">기록을 저장하려면 로그인이 필요해요</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            오늘의 마음을 안전하게 보관하고,<br />
            모든 기기에서 다시 만나려면 로그인해 주세요.
          </p>
        </div>

        {/* Google login */}
        <button
          onClick={onLogin}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm mb-3"
          style={{ background: '#1a1a1a', color: '#ffffff' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google로 로그인하기
        </button>

        <button
          onClick={onContinueAsGuest}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-muted-foreground bg-muted/60"
        >
          나중에 할게요
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Notification cards ────────────────────────────────────────────────────────
function NotificationCard({
  notif, dark, onDismiss, onOpen, onWrite,
}: {
  notif: AppNotification; dark: boolean;
  onDismiss: () => void; onOpen?: (entry: JournalEntry) => void; onWrite?: () => void;
}) {
  const isMemory = notif.id !== 'daily';
  const bg = isMemory
    ? dark ? 'rgba(139,92,246,0.12)' : 'rgba(167,139,250,0.10)'
    : dark ? 'rgba(251,191,36,0.10)' : 'rgba(251,191,36,0.10)';
  const border = isMemory
    ? dark ? '1px solid rgba(139,92,246,0.22)' : '1px solid rgba(167,139,250,0.22)'
    : dark ? '1px solid rgba(251,191,36,0.22)' : '1px solid rgba(251,191,36,0.25)';
  const titleColor = isMemory
    ? dark ? '#c4b5fd' : '#5b21b6'
    : dark ? '#fcd34d' : '#92400e';
  const subColor = dark ? '#9CA3AF' : '#78716c';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: bg, border }}
    >
      <span className="text-xl flex-shrink-0">{notif.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold leading-snug truncate" style={{ color: titleColor }}>{notif.title}</p>
        <p className="text-xs mt-0.5 truncate" style={{ color: subColor }}>{notif.sub}</p>
      </div>
      {isMemory && notif.entry ? (
        <button
          onClick={() => onOpen?.(notif.entry!)}
          className="flex items-center gap-1 flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold"
          style={{ background: dark ? 'rgba(139,92,246,0.2)' : 'rgba(167,139,250,0.18)', color: dark ? '#c4b5fd' : '#5b21b6' }}
        >
          <span>{EMOTIONS[notif.entry.emotion]?.emoji}</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      ) : (
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={onWrite} className="px-3 py-1.5 rounded-xl text-xs font-bold"
            style={{ background: 'rgba(251,191,36,0.2)', color: dark ? '#fcd34d' : '#92400e' }}>
            기록하기
          </button>
          <button onClick={onDismiss} className="p-1 opacity-40 hover:opacity-80 transition-opacity">
            <X className="w-3.5 h-3.5" style={{ color: subColor }} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ── Home ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [, setLocation] = useLocation();
  const { data: todayEntries = [] } = useTodayEntries();
  const hasTodayEntry = todayEntries.length > 0;
  const { data: timeLetters } = useTimeLetters();
  const { isAuthenticated, nickname, login } = useSupabaseAuth();
  const { active: activeNotifications } = useNotifications();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [selectedLetter, setSelectedLetter] = useState<JournalEntry | null>(null);
  const [showLoginSheet, setShowLoginSheet] = useState(false);
  const dark = useDarkMode();

  const today = new Date();
  const dateStr = format(today, 'yyyy년 M월 d일');
  const weekdayStr = WEEKDAYS[today.getDay()] + '요일';

  const topLetter = timeLetters?.lastYear || timeLetters?.lastMonth || timeLetters?.lastWeek;

  const visibleNotifications = activeNotifications.filter(n => !dismissed.has(n.id));
  const dismiss = (id: string) => setDismissed(prev => new Set(prev).add(id));

  const handleWriteClick = () => {
    if (!isAuthenticated) { setShowLoginSheet(true); return; }
    setLocation('/record');
  };

  // Card background
  const heroBg = dark
    ? 'linear-gradient(145deg, #221828 0%, #1e1b2d 50%, #1c1f2e 100%)'
    : 'linear-gradient(145deg, #fff5f5 0%, #fdf6ff 50%, #f3efff 100%)';
  const moaLabelColor = dark ? '#FCA5A5' : '#c06050';
  const postLabelColor = dark ? '#c4b5fd' : '#7c5ec8';

  return (
    <MobileContainer>
      <div className="flex flex-col h-full">

        {/* ── Page header ─────────────────────────────────────────── */}
        <div className="flex-shrink-0 bg-background px-5 pt-10 pb-4 border-b border-border/20">
          <h1 className="text-2xl font-bold text-foreground">오늘의 편지 💌</h1>
        </div>

        {/* ── Scrollable body ───────────────────────────────────── */}
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col"
          style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}>

        {/* ── Notification area ─────────────────────────────────── */}
        <div className="px-4 pt-4 space-y-3">
          <AnimatePresence mode="popLayout">
            {visibleNotifications.map(notif => (
              <NotificationCard
                key={notif.id}
                notif={notif} dark={dark}
                onDismiss={() => dismiss(notif.id)}
                onOpen={(entry) => setSelectedLetter(entry)}
                onWrite={handleWriteClick}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* ═══ Hero card — vertically centered in remaining space ═ */}
        <div className="flex-1 flex flex-col justify-center px-4 py-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="rounded-xl overflow-hidden relative px-5 pt-6 pb-5 flex flex-col border border-border/20"
            style={{
              background: heroBg,
            }}
          >
            {/* Background glows */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div style={{
                position: 'absolute', top: -40, left: -20, width: 200, height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(249,168,168,0.45) 0%, transparent 70%)',
                filter: 'blur(30px)', opacity: dark ? 0.25 : 0.7,
              }} />
              <div style={{
                position: 'absolute', top: -40, right: -20, width: 200, height: 200,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.45) 0%, transparent 70%)',
                filter: 'blur(30px)', opacity: dark ? 0.25 : 0.7,
              }} />
            </div>

            {/* Date strip */}
            <p className="relative z-10 text-center text-[11px] font-bold tracking-[0.2em] mb-3"
              style={{ color: dark ? '#9CA3AF' : '#b08880' }}>
              {dateStr} · {weekdayStr}
            </p>

            {/* ── Dual mascot row ───────────────────────────────── */}
            <div className="relative z-10 flex justify-center items-end gap-4 mb-4">

              {/* 모아 — today */}
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut', repeatDelay: 0.3 }}
                >
                  <PoseMascot type="moa" pose={hasTodayEntry ? 'success' : 'waiting'} size="lg" />
                </motion.div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                    color: dark ? '#F9A8D4' : '#c06070',
                    border: `1px solid ${dark ? 'rgba(249,168,212,0.2)' : 'rgba(192,96,112,0.15)'}`,
                  }}>
                  모아
                </span>
                <span className="text-[9px] font-semibold tracking-wide"
                  style={{ color: moaLabelColor }}>
                  {hasTodayEntry
                    ? (todayEntries.length > 1 ? `✓ ${todayEntries.length}개 기록` : '✓ 오늘 완료')
                    : '오늘 기록'}
                </span>
              </div>

              {/* Divider line */}
              <div className="w-px h-16 flex-shrink-0 self-center"
                style={{ background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }} />

              {/* 포스트 — past letters */}
              <div className="flex flex-col items-center gap-1">
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ repeat: Infinity, duration: 3.8, ease: 'easeInOut', repeatDelay: 0.7 }}
                >
                  <PoseMascot type="post" pose={topLetter ? 'sent' : 'empty'} size="lg" />
                </motion.div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: dark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.7)',
                    color: dark ? '#C4B5FD' : '#7060b0',
                    border: `1px solid ${dark ? 'rgba(196,181,253,0.2)' : 'rgba(112,96,176,0.15)'}`,
                  }}>
                  포스트
                </span>
                <span className="text-[9px] font-semibold tracking-wide"
                  style={{ color: postLabelColor }}>
                  {topLetter ? '편지 도착 ✉️' : '과거 편지'}
                </span>
              </div>
            </div>

            {/* ── Headline ────────────────────────────────────────── */}
            <div className="relative z-10 text-center mb-4 space-y-1">
              <h2 className="text-[19px] font-bold leading-snug"
                style={{ color: dark ? '#F3F4F6' : '#3a2030' }}>
                <span className="text-primary">{nickname}</span>님, 오늘도 안녕하세요 🌸
              </h2>
              <p className="text-sm" style={{ color: dark ? '#9CA3AF' : '#9a7070' }}>
                {hasTodayEntry
                  ? '오늘 마음을 담아뒀어요 — 포스트가 전달할게요 💌'
                  : '오늘의 감정을 기록하면, 언젠가 편지로 돌아와요'}
              </p>
            </div>

            {/* Today's entries preview */}
            {todayEntries.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 mb-4 space-y-1.5"
              >
                {todayEntries.length > 1 && (
                  <p className="text-[10px] font-bold tracking-[0.15em] text-center mb-1"
                    style={{ color: dark ? '#9CA3AF' : '#b08880' }}>
                    오늘 남긴 감정들
                  </p>
                )}
                {todayEntries.map(entry => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedLetter(entry)}
                    className="w-full flex items-center gap-3 rounded-2xl px-4 py-2.5 text-left active:scale-[0.98] transition-transform"
                    style={{
                      background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.6)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span className="text-2xl flex-shrink-0">{resolveEmotion(entry.emotion).emoji}</span>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-sm" style={{ color: dark ? '#F3F4F6' : '#3a2030' }}>
                          {entry.emotion}
                        </p>
                        <span className="text-[10px] font-medium" style={{ color: dark ? '#6B7280' : '#c0a0a0' }}>
                          {entry.createdAt ? format(parseISO(entry.createdAt), 'HH:mm') : ''}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5 line-clamp-1" style={{ color: dark ? '#9CA3AF' : '#9a7070' }}>
                        {entry.shortAnswer}
                      </p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}

            {/* ── Action buttons ───────────────────────────────────── */}
            <div className="relative z-10 flex flex-col gap-2.5">
              {/* Primary: write today */}
              <button
                onClick={handleWriteClick}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2"
                style={{
                  background: hasTodayEntry
                    ? dark ? 'rgba(249,168,168,0.15)' : 'rgba(249,168,168,0.22)'
                    : 'linear-gradient(135deg, #f9a8a8 0%, #f472b6 100%)',
                  color: hasTodayEntry ? (dark ? '#FCA5A5' : '#b04050') : 'white',
                  boxShadow: hasTodayEntry ? 'none' : '0 6px 20px -4px rgba(244,114,182,0.4)',
                }}
              >
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                {hasTodayEntry ? '오늘 기록 남기기' : '오늘 감정 기록하기'}
              </button>

              {/* Secondary: past letters */}
              <button
                onClick={() => topLetter ? setSelectedLetter(topLetter) : setLocation('/time-letter')}
                className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2"
                style={{
                  background: topLetter
                    ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)'
                    : dark ? 'rgba(167,139,250,0.10)' : 'rgba(167,139,250,0.12)',
                  color: topLetter ? 'white' : dark ? '#a78bfa' : '#7c5ec8',
                  boxShadow: topLetter ? '0 6px 20px -4px rgba(124,58,237,0.32)' : 'none',
                }}
              >
                <Inbox className="w-4 h-4 flex-shrink-0" />
                {topLetter ? '과거 편지 열어보기' : '기억 보관함 둘러보기'}
              </button>
            </div>
          </motion.div>
        </div>

        </div>{/* scrollable body */}
      </div>

      <BottomNav />

      {/* ── Login prompt sheet ──────────────────────────────────── */}
      <AnimatePresence>
        {showLoginSheet && (
          <LoginPromptSheet
            onLogin={async () => { setShowLoginSheet(false); await login(); }}
            onClose={() => setShowLoginSheet(false)}
            onContinueAsGuest={() => { setShowLoginSheet(false); setLocation('/record'); }}
          />
        )}
      </AnimatePresence>

      {/* ── Entry detail modal ──────────────────────────────────── */}
      <AnimatePresence>
        {selectedLetter && (
          <EntryDetailModal
            key={selectedLetter.id}
            entry={selectedLetter}
            onClose={() => setSelectedLetter(null)}
            showMascotFooter
          />
        )}
      </AnimatePresence>
    </MobileContainer>
  );
}
