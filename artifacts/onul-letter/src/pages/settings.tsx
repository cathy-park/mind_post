import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Bell, Moon, Info, Trash2, LogOut, Pencil, Check, X, ChevronDown } from 'lucide-react';
import { MobileContainer } from '@/components/layout/mobile-container';
import { BottomNav } from '@/components/layout/bottom-nav';
import { useSettings, useUpdateSettings } from '@/hooks/use-journal';
import { useQueryClient } from '@tanstack/react-query';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';

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

const REMINDER_TEMPLATES = [
  { id: 'daily',     icon: '📝', text: '오늘 기록이 아직 없어요',               sub: '매일 저녁 알림' },
  { id: 'lastweek',  icon: '🔁', text: '지난주 오늘의 기록이 기다리고 있어요',  sub: '일주일 전 기억' },
  { id: 'lastmonth', icon: '📅', text: '한 달 전 오늘의 편지가 도착했어요',     sub: '한 달 전 기억' },
  { id: 'lastyear',  icon: '✉️', text: '작년 오늘의 편지가 도착했어요',         sub: '1년 전 기억' },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const dark = useDarkMode();
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative', flexShrink: 0, width: 44, height: 24, borderRadius: 9999,
        border: 'none', outline: 'none', cursor: 'pointer', padding: 0,
        background: checked
          ? 'linear-gradient(180deg, #FCA5A5 0%, #F472B6 100%)'
          : dark ? '#374151' : '#D1D5DB',
        transition: 'background 0.25s ease',
      }}
    >
      <span className="sr-only">{checked ? 'ON' : 'OFF'}</span>
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
        borderRadius: '50%', background: 'white', boxShadow: '0 1px 4px rgba(0,0,0,0.22)',
        transition: 'left 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }} />
    </button>
  );
}

function SettingRow({
  icon, iconBg, title, sub, right, border,
}: {
  icon: React.ReactNode; iconBg: string; title: React.ReactNode; sub: React.ReactNode; right: React.ReactNode; border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between p-5 ${border ? 'border-b border-border/50' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
        </div>
      </div>
      <div className="flex-shrink-0 ml-3">{right}</div>
    </div>
  );
}

// ── Auth card — top of settings ────────────────────────────────────────────────
function AuthCard() {
  const { isAuthenticated, isLoading, user, nickname, login, logout, updateNickname, isLoggingIn } = useSupabaseAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const startEdit = () => {
    setDraft(user?.user_metadata?.nickname ?? '');
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setDraft('');
  };

  const saveEdit = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    await updateNickname(draft.trim());
    setSaving(false);
    setEditing(false);
  };

  if (isLoading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="surface-card overflow-hidden p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-muted animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted animate-pulse rounded w-1/2" />
          <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
        </div>
      </motion.div>
    );
  }

  if (!isAuthenticated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface-card overflow-hidden"
      >
        {/* Hero row */}
        <div className="px-5 pt-5 pb-4 flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xl">💌</span>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <p className="font-bold text-foreground text-[15px] leading-snug">기록을 안전하게 보관해드릴게요</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              로그인하면 기록이 모든 기기에서 동기화돼요
            </p>
          </div>
        </div>
        <div className="px-5 pb-5">
          <button
            onClick={login}
            disabled={isLoggingIn}
            className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2.5 bg-foreground text-background hover:opacity-90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                서버를 깨우고 있습니다... ⏳
              </span>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 48 48" fill="none">
                  <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
                  <path d="M6.306 14.691l6.571 4.819C14.655 15.108 19.001 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
                  <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
                  <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
                </svg>
                Google로 로그인하기
              </>
            )}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-card overflow-hidden"
    >
      {/* Greeting */}
      <div className="px-5 pt-5 pb-4 border-b border-border/50">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <span className="text-xl">🌷</span>
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <AnimatePresence mode="wait">
              {editing ? (
                <motion.div
                  key="edit"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2"
                >
                  <input
                    autoFocus
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                    maxLength={12}
                    placeholder="닉네임 입력"
                    className="flex-1 min-w-0 bg-muted rounded-xl px-3 py-1.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={saveEdit}
                    disabled={saving || !draft.trim()}
                    className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 hover:bg-primary/25 disabled:opacity-40 transition-colors"
                  >
                    <Check className="w-4 h-4 text-primary" />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 hover:bg-muted/80 transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="greet"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="font-bold text-foreground text-[15px]">안녕하세요, {nickname}님 🌷</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">기록이 안전하게 보관되고 있어요</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={startEdit}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-muted/40 transition-colors border-b border-border/50 group"
      >
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
        <div className="text-left">
          <p className="font-bold text-foreground text-sm">닉네임 수정</p>
          <p className="text-xs text-muted-foreground/70 mt-0.5">불리고 싶은 이름을 정해보세요</p>
        </div>
      </button>

    </motion.div>
  );
}

export default function Settings() {
  const { data: settings } = useSettings();
  const { mutate: updateSettings } = useUpdateSettings();
  const queryClient = useQueryClient();
  const { isAuthenticated, logout } = useSupabaseAuth();
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleClearData = () => {
    if (window.confirm('설정을 초기화하시겠습니까?')) {
      localStorage.removeItem('onul-settings');
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  };

  if (!settings) return null;

  return (
    <MobileContainer>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-background px-5 pt-10 pb-4 border-b border-border/20">
          <h1 className="text-2xl font-bold text-foreground">설정</h1>
          <p className="text-sm text-muted-foreground mt-1">나만의 공간을 설정해보세요</p>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 space-y-5"
          style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}>

        {/* ── Auth card (top) ── */}
        <AuthCard />

        {/* ── App toggles ── */}
        <div className="surface-card overflow-hidden">
          {/* 다크모드 */}
          <SettingRow
            icon={<Moon className="w-5 h-5 text-blue-400" />}
            iconBg="bg-blue-100 dark:bg-blue-900/30"
            title="다크모드"
            sub="편안한 밤을 위한 어두운 테마"
            border
            right={
              <Toggle checked={settings.darkMode} onChange={v => updateSettings({ darkMode: v })} />
            }
          />

          {/* 알림 받기 — accordion */}
          <button
            onClick={() => setPreviewOpen(v => !v)}
            className="w-full flex items-center justify-between p-5 hover:bg-muted/30 active:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-foreground text-sm">알림 받기</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground leading-none">준비중</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">매일 원하는 시간에 기록 알림을 받아요</p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: previewOpen ? 180 : 0 }}
              transition={{ duration: 0.22 }}
              className="flex-shrink-0 ml-3"
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>

          {/* 아코디언 — 알림 메시지 예시 */}
          <motion.div
            initial={false}
            animate={{ height: previewOpen ? 'auto' : 0, opacity: previewOpen ? 1 : 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pt-3 pb-4 space-y-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-3">때에 맞춰 이런 알림이 도착할 거예요</p>
              {REMINDER_TEMPLATES.map((t) => (
                <div key={t.id} className="flex items-center gap-3 bg-muted/40 rounded-2xl px-3.5 py-3">
                  <span className="text-lg flex-shrink-0">{t.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-xs leading-snug">{t.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── About + danger ── */}
        <div className="surface-card overflow-hidden">
          <button className="w-full flex items-center justify-between p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <Info className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground text-sm">앱 정보</h3>
            </div>
            <span className="text-sm text-muted-foreground">v2.0.0</span>
          </button>
          <button
            onClick={handleClearData}
            className="w-full flex items-center justify-between p-5 border-t border-border/50 hover:bg-destructive/5 transition-colors"
          >
            <div className="flex items-center gap-3 text-destructive">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm">설정 초기화</h3>
            </div>
          </button>
        </div>

        {/* ── Logout (bottom, only when logged in) ── */}
        {isAuthenticated && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-5 py-4 surface-card hover:bg-muted/40 active:bg-muted/60 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
              <div className="text-left">
                <p className="font-bold text-muted-foreground group-hover:text-foreground transition-colors text-sm">로그아웃</p>
                <p className="text-xs text-muted-foreground/50 mt-0.5">또 만나요 👋</p>
              </div>
            </button>
          </motion.div>
        )}

      </div>
      </div>
      <BottomNav />
    </MobileContainer>
  );
}
