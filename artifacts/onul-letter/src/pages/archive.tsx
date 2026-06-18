import { useState, useMemo, useRef } from 'react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, CalendarDays, Search, X, PenLine } from 'lucide-react';
import { MobileContainer } from '@/components/layout/mobile-container';
import { BottomNav } from '@/components/layout/bottom-nav';
import { EntryCard } from '@/components/entry-card';
import { EntryDetailModal } from '@/components/entry-detail-modal';
import { EmotionInsights } from '@/components/emotion-insights';
import { EmotionSummary } from '@/components/emotion-summary';
import { PoseMascot, MascotGuide } from '@/components/mascot-card';
import { useEntries } from '@/hooks/use-journal';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { JournalEntry, EMOTIONS, EmotionType } from '@/lib/constants';

type Tab = 'list' | 'insights';

export default function Archive() {
  const { data: entries = [], isLoading, isFetching, isError, error } = useEntries();
  const { nickname, isAuthenticated } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [tab, setTab] = useState<Tab>('list');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [emotionFilter, setEmotionFilter] = useState<EmotionType | 'all'>('all');
  const [photoOnly, setPhotoOnly] = useState(false);
  const [audioOnly, setAudioOnly] = useState(false);
  const [reflectionOnly, setReflectionOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string>('all'); // 'all' or 'yyyy-MM'
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Derive available months from all entries
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    entries.forEach(e => months.add(e.date.slice(0, 7)));
    return Array.from(months).sort().reverse(); // newest first
  }, [entries]);

  const filtered = useMemo(() => {
    let result = [...entries];
    // Month filter
    if (selectedMonth !== 'all') {
      result = result.filter(e => e.date.startsWith(selectedMonth));
    }
    // Text search
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(e => {
        const body = [
          e.shortAnswer,
          e.longAnswer ?? '',
          e.emotion,
          ...(e.reflections?.map(r => r.content) ?? []),
        ].join(' ').toLowerCase();
        return body.includes(q);
      });
    }
    if (emotionFilter !== 'all') result = result.filter(e => e.emotion === emotionFilter);
    if (photoOnly) result = result.filter(e => !!e.photo || (e.photos && e.photos.length > 0));
    if (audioOnly) result = result.filter(e => !!e.audio || (e.audios && e.audios.length > 0));
    if (reflectionOnly) result = result.filter(e => (e.reflections?.length ?? 0) > 0);
    if (sortOrder === 'asc') result.reverse();
    return result;
  }, [entries, selectedMonth, searchQuery, emotionFilter, photoOnly, audioOnly, reflectionOnly, sortOrder]);

  // Group by year-month for "월별 보기"
  const grouped = useMemo(() => {
    const map = new Map<string, JournalEntry[]>();
    filtered.forEach(e => {
      const key = e.date.slice(0, 7); // "yyyy-MM"
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    // Return in sort order (map preserves insertion order from filtered)
    return Array.from(map.entries()).map(([key, items]) => ({
      label: `${key.slice(0, 4)}년 ${Number(key.slice(5))}월`,
      items,
    }));
  }, [filtered]);

  const liveSelected = selectedEntry
    ? (entries.find(e => e.id === selectedEntry.id) ?? null)
    : null;

  return (
    <MobileContainer>
      <div className="flex flex-col h-full overflow-hidden">

        {/* ── FIXED: title + tabs + mascot guide + (list) search + filters ── */}
        <div className="flex-shrink-0 bg-background px-5 pt-10 pb-4 space-y-4 border-b border-border/20">
          <h1 className="text-2xl font-bold text-foreground">보관함</h1>

          {/* 탭 — 편지함과 동일한 스타일 */}
          <div className="flex gap-2">
            <button
              onClick={() => { setTab('list'); scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === 'list' ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'}`}
            >
              기록 목록
            </button>
            <button
              onClick={() => { setTab('insights'); scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${tab === 'insights' ? 'bg-primary text-white shadow-sm' : 'bg-muted text-muted-foreground'}`}
            >
              감정 통계
            </button>
          </div>

          {/* 모아 guide — 탭 바로 아래, list 탭만 */}
          {tab === 'list' && (
            <MascotGuide
              type="moa"
              pose={entries.length > 0 ? 'success' : 'waiting'}
              message={
                <span>
                  모아가 모은{' '}
                  <span style={{ color: '#e07080', fontWeight: 700 }}>{nickname}</span>
                  님의 감정기록이에요
                </span>
              }
              sub={entries.length > 0 ? `총 ${entries.length}개의 기록` : '첫 기록을 남겨볼까요?'}
              size="lg"
              messageKey="archive-guide"
            />
          )}

          {tab === 'list' && (
            <div className="space-y-3">
              {/* Search bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="기록을 검색해보세요"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-card border border-card-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full opacity-50 hover:opacity-80 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5 text-foreground" />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button
                  onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-card border border-card-border rounded-full text-xs font-semibold text-foreground"
                >
                  <Filter className="w-3.5 h-3.5" />
                  {sortOrder === 'desc' ? '최신순' : '과거순'}
                </button>
                
                {/* Month selector */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowMonthPicker(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                      selectedMonth !== 'all'
                        ? 'bg-secondary text-secondary-foreground shadow-sm'
                        : 'bg-card border border-card-border text-foreground'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    {selectedMonth === 'all'
                      ? '기간'
                      : `${selectedMonth.slice(0, 4)}년 ${Number(selectedMonth.slice(5))}월`}
                  </button>
                  {showMonthPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                      <div className="absolute left-0 top-10 z-50 bg-card border border-card-border rounded-2xl shadow-xl overflow-hidden min-w-[160px]">
                        <button
                          onClick={() => { setSelectedMonth('all'); setShowMonthPicker(false); }}
                          className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-muted ${
                            selectedMonth === 'all' ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                          }`}
                        >
                          기간
                        </button>
                        {availableMonths.map(m => (
                          <button
                            key={m}
                            onClick={() => { setSelectedMonth(m); setShowMonthPicker(false); }}
                            className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-muted flex items-center justify-between gap-2 ${
                              selectedMonth === m ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                            }`}
                          >
                            <span>{m.slice(0, 4)}년 {Number(m.slice(5))}월</span>
                            <span className="text-muted-foreground text-[10px]">
                              {entries.filter(e => e.date.startsWith(m)).length}개
                            </span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Emotion selector */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setShowEmotionPicker(v => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${
                      emotionFilter !== 'all'
                        ? 'bg-secondary text-secondary-foreground shadow-sm'
                        : 'bg-card border border-card-border text-foreground'
                    }`}
                  >
                    {emotionFilter === 'all'
                      ? '감정'
                      : `${EMOTIONS[emotionFilter].emoji} ${emotionFilter}`}
                  </button>
                  {showEmotionPicker && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowEmotionPicker(false)} />
                      <div className="absolute left-0 top-10 z-50 bg-card border border-card-border rounded-2xl shadow-xl overflow-hidden min-w-[120px] max-h-[300px] overflow-y-auto scrollbar-hide">
                        <button
                          onClick={() => { setEmotionFilter('all'); setShowEmotionPicker(false); }}
                          className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-muted ${
                            emotionFilter === 'all' ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                          }`}
                        >
                          전체 감정
                        </button>
                        {(Object.keys(EMOTIONS) as EmotionType[]).map(e => (
                          <button
                            key={e}
                            onClick={() => { setEmotionFilter(e); setShowEmotionPicker(false); }}
                            className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-muted flex items-center gap-2 ${
                              emotionFilter === e ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                            }`}
                          >
                            <span>{EMOTIONS[e].emoji}</span>
                            <span>{e}</span>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => setPhotoOnly(v => !v)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${photoOnly ? 'bg-primary text-white shadow-sm' : 'bg-card border border-card-border text-foreground'}`}
                >
                  📷 사진
                </button>
                <button
                  onClick={() => setAudioOnly(v => !v)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${audioOnly ? 'bg-primary text-white shadow-sm' : 'bg-card border border-card-border text-foreground'}`}
                >
                  🎵 음성
                </button>
                <button
                  onClick={() => setReflectionOnly(v => !v)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${reflectionOnly ? 'bg-primary text-white shadow-sm' : 'bg-card border border-card-border text-foreground'}`}
                >
                  💬 댓글
                </button>
              </div>
            </div>
          )}

          {tab === 'list' && entries.length > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border/40" />
              <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">기록 목록</p>
              <div className="flex-1 h-px bg-border/40" />
            </div>
          )}
        </div>

        {/* ── SCROLLABLE: entries / insights ── */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 space-y-4"
          style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}
        >
          <AnimatePresence mode="wait">
            {tab === 'list' && (
              <motion.div key="list" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

                {(isLoading || (isFetching && entries.length === 0)) ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4">
                    <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                    <p className="text-muted-foreground font-medium animate-pulse">기록을 불러오는 중...</p>
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
                    <p className="text-red-400 font-bold">데이터를 불러오는 데 실패했습니다.</p>
                    <p className="text-xs text-muted-foreground break-all px-4">{error?.message}</p>
                    <button onClick={() => window.location.reload()} className="px-5 py-2 mt-2 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full text-sm font-bold active:scale-95 transition-transform">
                      다시 시도하기
                    </button>
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <PoseMascot type="moa" pose="idle" size="lg" float />
                    {searchQuery.trim() ? (
                      <>
                        <p className="font-bold text-foreground">검색 결과가 없어요</p>
                        <p className="text-muted-foreground text-sm">
                          <span className="font-semibold">"{searchQuery.trim()}"</span>과 일치하는 기록이 없어요
                        </p>
                      </>
                    ) : emotionFilter !== 'all' || photoOnly || reflectionOnly ? (
                      <>
                        <p className="font-bold text-foreground">조건에 맞는 기록이 없어요</p>
                        <p className="text-muted-foreground text-sm">다른 필터를 선택해 보세요</p>
                      </>
                    ) : (
                      <>
                        <p className="font-bold text-foreground">아직 보관된 기억이 없어요</p>
                        <p className="text-muted-foreground text-sm mb-4">첫 번째 마음을 남기거나 로그인해서 기록을 불러오세요.</p>
                        
                        {!isAuthenticated && (
                          <button
                            onClick={() => {
                              const btn = document.querySelector('[href="/settings"]') as HTMLAnchorElement;
                              if (btn) btn.click();
                            }}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-full font-bold shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
                          >
                            로그인하러 가기
                          </button>
                        )}

                        <motion.button
                          whileTap={{ scale: 0.97 }}
                          onClick={() => setLocation('/record')}
                          className="mt-2 flex items-center gap-2 px-6 py-3 rounded-2xl bg-foreground text-background font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
                        >
                          <PenLine className="w-4 h-4" />
                          오늘 기록하기
                        </motion.button>
                      </>
                    )}
                  </div>
                ) : selectedMonth === 'all' ? (
                  // ── Month-grouped view ─────────────────────────────────────
                  <AnimatePresence mode="wait">
                    <motion.div
                      key="month-view"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="space-y-6"
                    >
                      {grouped.map(({ label, items }) => (
                        <div key={label} className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-border/50" />
                            <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase flex-shrink-0">
                              {label}
                            </span>
                            <span className="text-xs text-muted-foreground/60 flex-shrink-0">{items.length}개</span>
                            <div className="flex-1 h-px bg-border/50" />
                          </div>
                          <AnimatePresence mode="popLayout">
                            {items.map(entry => (
                              <motion.div
                                key={entry.id}
                                layout
                                initial={{ opacity: 0, scale: 0.96 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.96 }}
                                transition={{ duration: 0.18 }}
                              >
                                <EntryCard entry={entry} onClick={() => setSelectedEntry(entry)} />
                              </motion.div>
                            ))}
                          </AnimatePresence>
                        </div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  // ── Flat list view ─────────────────────────────────────────
                  <AnimatePresence mode="popLayout">
                    {filtered.map(entry => (
                      <motion.div
                        key={entry.id}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.18 }}
                      >
                        <EntryCard entry={entry} onClick={() => setSelectedEntry(entry)} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </motion.div>
            )}

            {tab === 'insights' && (
              <motion.div key="insights" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <EmotionSummary
                  entries={entries}
                  expanded={summaryExpanded}
                  onToggle={() => setSummaryExpanded(v => !v)}
                />
                <EmotionInsights />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />

      <AnimatePresence>
        {liveSelected && (
          <EntryDetailModal
            key={liveSelected.id}
            entry={liveSelected}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>
    </MobileContainer>
  );
}
