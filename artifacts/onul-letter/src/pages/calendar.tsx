import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subMonths, addMonths, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { MobileContainer } from '@/components/layout/mobile-container';
import { BottomNav } from '@/components/layout/bottom-nav';
import { EntryDetailModal } from '@/components/entry-detail-modal';
import { YearMonthPicker } from '@/components/year-month-picker';
import { useEntries } from '@/hooks/use-journal';
import { JournalEntry, EMOTIONS, WEEKDAYS } from '@/lib/constants';
import { resolveEmotion } from '@/lib/emotion-utils';

const EMOTION_DOT_BG: Record<string, string> = {
  '행복': 'bg-orange-300', '평온': 'bg-green-300', '감사': 'bg-emerald-300',
  '설렘': 'bg-pink-300', '뿌듯함': 'bg-teal-300', '보통': 'bg-gray-300',
  '스트레스': 'bg-red-300', '우울': 'bg-blue-300', '복잡함': 'bg-purple-300',
  '화남': 'bg-red-400', '슬픔': 'bg-sky-300', '피곤함': 'bg-slate-300',
  '불안': 'bg-yellow-300', '짜증': 'bg-orange-400', '외로움': 'bg-indigo-300',
  '혼란스러움': 'bg-violet-300', '아픔': 'bg-rose-300',
};
const EMOTION_DOT_RING: Record<string, string> = {
  '행복': 'ring-orange-200', '평온': 'ring-green-200', '감사': 'ring-emerald-200',
  '설렘': 'ring-pink-200', '뿌듯함': 'ring-teal-200', '보통': 'ring-gray-200',
  '스트레스': 'ring-red-200', '우울': 'ring-blue-200', '복잡함': 'ring-purple-200',
  '화남': 'ring-red-300', '슬픔': 'ring-sky-200', '피곤함': 'ring-slate-200',
  '불안': 'ring-yellow-200', '짜증': 'ring-orange-300', '외로움': 'ring-indigo-200',
  '혼란스러움': 'ring-violet-200', '아픔': 'ring-rose-200',
};

export default function Calendar() {
  const { data: entries = [] } = useEntries();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = getDay(monthStart);
  const today = format(new Date(), 'yyyy-MM-dd');
  const monthStr = format(viewDate, 'yyyy년 M월');

  const entryMap = new Map<string, JournalEntry>();
  entries.forEach(e => entryMap.set(e.date, e));

  const goToPrev = () => setViewDate(d => subMonths(d, 1));
  const goToNext = () => setViewDate(d => addMonths(d, 1));

  const handlePickerConfirm = (y: number, m: number) => {
    setViewDate(new Date(y, m - 1, 1));
    setShowPicker(false);
  };

  return (
    <MobileContainer>
      <div className="px-5 pt-10 pb-4 space-y-4 border-b border-border/20 bg-background/80">

          {/* Page title */}
          <h1 className="text-2xl font-bold text-foreground">달력</h1>

          {/* Month header + nav */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <button
              onClick={() => setShowPicker(true)}
              className="flex items-center gap-1.5 group"
            >
              <div>
                <h1 className="text-2xl font-bold text-foreground group-active:opacity-70 transition-opacity">
                  {monthStr}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  감정이 담긴 날들
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </p>
              </div>
            </button>
            <div className="flex items-center gap-1.5">
              {format(viewDate, 'yyyy-MM') !== format(new Date(), 'yyyy-MM') && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setViewDate(new Date())}
                  className="px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary"
                >
                  오늘
                </motion.button>
              )}
              <button onClick={goToPrev} className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors">
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
              <button onClick={goToNext} className="p-2 rounded-full bg-muted hover:bg-muted/70 transition-colors">
                <ChevronRight className="w-5 h-5 text-foreground" />
              </button>
            </div>
          </motion.div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center">
            {WEEKDAYS.map((d, i) => (
              <p
                key={d}
                className={`text-xs font-bold py-1 ${
                  i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-muted-foreground/60'
                }`}
              >
                {d}
              </p>
            ))}
          </div>

          {/* Calendar grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={format(viewDate, 'yyyy-MM')}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-7 gap-y-2"
            >
              {Array.from({ length: startWeekday }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {days.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const entry = entryMap.get(dateStr);
                const isToday = dateStr === today;
                const isSun = getDay(day) === 0;
                const isSat = getDay(day) === 6;
                const emo = entry ? resolveEmotion(entry.emotion) : null;
                return (
                  <motion.button
                    key={dateStr}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    onClick={() => entry && setSelectedEntry(entry)}
                    className={`relative flex flex-col items-center py-1.5 rounded-2xl transition-all ${
                      entry ? 'cursor-pointer active:scale-90' : 'cursor-default'
                    } ${isToday ? 'ring-2 ring-primary/40 bg-primary/5' : ''}`}
                  >
                    <span className={`text-xs font-semibold leading-none mb-1 ${
                      isToday ? 'text-primary font-bold' : isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-foreground/70'
                    }`}>
                      {format(day, 'd')}
                    </span>
                    {entry ? (
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ring-2 ${EMOTION_DOT_BG[entry.emotion] ?? emo!.colorClass} ${EMOTION_DOT_RING[entry.emotion] ?? 'ring-primary/20'}`}>
                        {emo!.emoji}
                      </div>
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                    {entry?.photo && (
                      <div className="absolute bottom-0.5 right-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      </div>
                    )}
                    {(entry?.reflections?.length ?? 0) > 0 && (
                      <div className="absolute top-0.5 right-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Legend */}
          <div className="flex items-center gap-4 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary/50" />
              <span className="text-xs text-muted-foreground">사진</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-xs text-muted-foreground">되돌아보기</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-full ring-2 ring-primary/40 bg-primary/5" />
              <span className="text-xs text-muted-foreground">오늘</span>
            </div>
          </div>
        </div>

      {/* 이번 달 감정 요약 */}
      <div className="px-5 pt-5 pb-4 space-y-4">
        {entries.filter(e => e.date.startsWith(format(viewDate, 'yyyy-MM'))).length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="surface-card p-4"
          >
            <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-3">이번 달 감정</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(
                entries
                  .filter(e => e.date.startsWith(format(viewDate, 'yyyy-MM')))
                  .reduce((acc, e) => ({ ...acc, [e.emotion]: (acc[e.emotion] || 0) + 1 }), {} as Record<string, number>)
              )
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, count]) => {
                  const e = resolveEmotion(emotion);
                  return (
                    <span
                      key={emotion}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${e.colorClass}`}
                    >
                      {e.emoji} {emotion} {count}일
                    </span>
                  );
                })}
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />

      {/* Year/month picker */}
      <AnimatePresence>
        {showPicker && (
          <YearMonthPicker
            year={viewDate.getFullYear()}
            month={viewDate.getMonth() + 1}
            onConfirm={handlePickerConfirm}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEntry && (
          <EntryDetailModal
            key={selectedEntry.id}
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
          />
        )}
      </AnimatePresence>
    </MobileContainer>
  );
}
