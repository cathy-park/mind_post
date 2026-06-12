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
  const { data: entries = [], isLoading, isFetching } = useEntries();
  const { nickname, isAuthenticated } = useSupabaseAuth();
  const [, setLocation] = useLocation();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [tab, setTab] = useState<Tab>('list');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [emotionFilter, setEmotionFilter] = useState<EmotionType | 'all'>('all');
  const [photoOnly, setPhotoOnly] = useState(false);
  const [reflectionOnly, setReflectionOnly] = useState(false);
  const [monthView, setMonthView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryExpanded, setSummaryExpanded] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    let result = [...entries];
    // Text search: match against shortAnswer, longAnswer, emotion, reflection comments
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
    if (photoOnly) result = result.filter(e => !!e.photo);
    if (reflectionOnly) result = result.filter(e => (e.reflections?.length ?? 0) > 0);
    if (sortOrder === 'asc') result.reverse();
    return result;
  }, [entries, searchQuery, emotionFilter, photoOnly, reflectionOnly, sortOrder]);

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
                <select
                  value={emotionFilter}
                  onChange={e => setEmotionFilter(e.target.value as any)}
                  className="flex-shrink-0 px-3 py-2 bg-card border border-card-border rounded-full text-xs font-semibold text-foreground focus:outline-none appearance-none pr-7"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center' }}
                >
                  <option value="all">모든 감정</option>
                  {(Object.keys(EMOTIONS) as EmotionType[]).map(e => (
                    <option key={e} value={e}>{EMOTIONS[e].emoji} {e}</option>
                  ))}
                </select>
                <button
                  onClick={() => setPhotoOnly(v => !v)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${photoOnly ? 'bg-primary text-white shadow-sm' : 'bg-card border border-card-border text-foreground'}`}
                >
                  📷 사진 있음
                </button>
                <button
                  onClick={() => setReflectionOnly(v => !v)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${reflectionOnly ? 'bg-primary text-white shadow-sm' : 'bg-card border border-card-border text-foreground'}`}
                >
                  💬 댓글 있음
                </button>
                <button
                  onClick={() => setMonthView(v => !v)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all ${monthView ? 'bg-primary text-white shadow-sm' : 'bg-card border border-card-border text-foreground'}`}
                >
                  <CalendarDays className="w-3.5 h-3.5" /> 월별 보기
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
                ) : monthView ? (
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
