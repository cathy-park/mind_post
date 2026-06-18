import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, ChevronUp } from 'lucide-react';
import { subDays, parseISO, isAfter } from 'date-fns';
import { JournalEntry, EMOTIONS, EmotionType } from '@/lib/constants';

type Range = '7일' | '30일' | '전체' | string; // string is YYYY-MM

const RANGE_OPTIONS: ('7일' | '30일' | '전체')[] = ['7일', '30일', '전체'];

interface Props {
  entries: JournalEntry[];
  expanded?: boolean;
  onToggle?: () => void;
}

function getLabel(range: Range) {
  if (range === '7일') return '최근 7일';
  if (range === '30일') return '최근 30일';
  if (range === '전체') return '전체 기간';
  return `${range.slice(0, 4)}년 ${Number(range.slice(5))}월`;
}

function summaryMessage(sorted: [EmotionType, number][], total: number, range: Range): string {
  if (total === 0) return '아직 기록된 감정이 없어요';
  const [topEmotion, topCount] = sorted[0];
  const emoji = EMOTIONS[topEmotion]?.emoji ?? '';
  const rangeLabel = getLabel(range);
  const pct = Math.round((topCount / total) * 100);
  return `${rangeLabel} 동안 ${emoji} ${topEmotion}을(를) 가장 많이 느꼈어요 (${pct}%)`;
}

export function EmotionSummary({ entries, expanded = true, onToggle }: Props) {
  const [range, setRange] = useState<Range>('30일');
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    entries.forEach(e => months.add(e.date.slice(0, 7)));
    return Array.from(months).sort().reverse();
  }, [entries]);

  const filtered = useMemo(() => {
    if (range === '전체') return entries;
    if (range === '7일' || range === '30일') {
      const cutoff = subDays(new Date(), range === '7일' ? 7 : 30);
      return entries.filter(e => isAfter(parseISO(e.date), cutoff));
    }
    // YYYY-MM
    return entries.filter(e => e.date.startsWith(range));
  }, [entries, range]);

  const counts = useMemo(() => {
    const map: Partial<Record<EmotionType, number>> = {};
    for (const e of filtered) {
      map[e.emotion] = (map[e.emotion] ?? 0) + 1;
    }
    return map;
  }, [filtered]);

  const sorted = useMemo(() => {
    return (Object.entries(counts) as [EmotionType, number][]).sort((a, b) => b[1] - a[1]);
  }, [counts]);

  const total = filtered.length;

  return (
    <div className="surface-card overflow-visible">
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <p className="text-sm font-bold text-foreground">모아의 감정 기록</p>
        <div className="flex items-center gap-1.5">
          <div className="flex gap-1 bg-muted rounded-full p-0.5">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt}
                onClick={() => setRange(opt)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  range === opt
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                {opt}
              </button>
            ))}
            {/* 월별 피커 */}
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker(v => !v)}
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  !RANGE_OPTIONS.includes(range as any)
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                {!RANGE_OPTIONS.includes(range as any)
                  ? `${Number(range.slice(5))}월`
                  : '월별'}
              </button>
              {showMonthPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                  <div className="absolute right-0 top-8 z-50 bg-card border border-card-border rounded-2xl shadow-xl overflow-hidden min-w-[120px]">
                    {availableMonths.map(m => (
                      <button
                        key={m}
                        onClick={() => { setRange(m); setShowMonthPicker(false); }}
                        className={`w-full px-4 py-2.5 text-xs font-semibold text-left transition-colors hover:bg-muted ${
                          range === m ? 'text-primary font-bold bg-primary/5' : 'text-foreground'
                        }`}
                      >
                        {m.slice(0, 4)}년 {Number(m.slice(5))}월
                      </button>
                    ))}
                    {availableMonths.length === 0 && (
                      <div className="px-4 py-3 text-xs text-muted-foreground text-center">기록이 없어요</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {onToggle && (
            <button
              onClick={onToggle}
              className="ml-0.5 p-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
              aria-label={expanded ? '접기' : '펼치기'}
            >
              <motion.span
                animate={{ rotate: expanded ? 0 : 180 }}
                transition={{ duration: 0.22 }}
                className="inline-flex"
              >
                <ChevronUp className="w-4 h-4" />
              </motion.span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible body */}
      <motion.div
        initial={false}
        animate={expanded ? 'open' : 'collapsed'}
        variants={{
          open:      { height: 'auto', opacity: 1 },
          collapsed: { height: 0,      opacity: 0 },
        }}
        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
        style={{ overflow: 'hidden' }}
      >
        <div className="px-4 pb-4 space-y-3">
          {/* Summary message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={range + total}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              {summaryMessage(sorted, total, range)}
            </motion.p>
          </AnimatePresence>

          {/* Emotion pills */}
          {sorted.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {sorted.map(([emotion, count], i) => {
                  const { emoji, colorClass } = EMOTIONS[emotion] ?? { emoji: '?', colorClass: 'bg-muted text-foreground' };
                  return (
                    <motion.div
                      key={emotion}
                      layout
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ delay: i * 0.03 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${colorClass}`}
                    >
                      <span>{emoji}</span>
                      <span>{emotion}</span>
                      <span className="opacity-60 font-normal">{count}번</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/60 text-center py-2">
              {getLabel(range)}에 작성된 기록이 없어요
            </p>
          )}

          {/* Total count */}
          {total > 0 && (
            <p className="text-xs text-muted-foreground/50 text-right">
              총 {total}개의 기록
            </p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
