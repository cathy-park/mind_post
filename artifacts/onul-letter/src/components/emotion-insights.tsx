import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useEmotionStats, useEntries } from '@/hooks/use-journal';
import { EMOTIONS, EmotionType } from '@/lib/constants';
import { resolveEmotion } from '@/lib/emotion-utils';
import { YearMonthPicker } from '@/components/year-month-picker';

const EMOTION_DOT: Record<EmotionType, string> = {
  '행복':       'bg-orange-300',
  '평온':       'bg-green-300',
  '보통':       'bg-gray-300',
  '스트레스':   'bg-red-300',
  '우울':       'bg-blue-300',
  '복잡함':     'bg-purple-300',
  '화남':       'bg-red-400',
  '슬픔':       'bg-sky-300',
  '피곤함':     'bg-slate-300',
  '불안':       'bg-yellow-300',
  '짜증':       'bg-orange-400',
  '외로움':     'bg-indigo-300',
  '감사':       'bg-emerald-300',
  '설렘':       'bg-pink-300',
  '뿌듯함':     'bg-teal-300',
  '혼란스러움': 'bg-violet-300',
  '아픔':       'bg-rose-300',
};

const EMOTION_BAR: Record<EmotionType, string> = {
  '행복':       'bg-orange-300',
  '평온':       'bg-green-300',
  '보통':       'bg-gray-300',
  '스트레스':   'bg-red-400',
  '우울':       'bg-blue-300',
  '복잡함':     'bg-purple-300',
  '화남':       'bg-red-500',
  '슬픔':       'bg-sky-300',
  '피곤함':     'bg-slate-300',
  '불안':       'bg-yellow-300',
  '짜증':       'bg-orange-400',
  '외로움':     'bg-indigo-300',
  '감사':       'bg-emerald-300',
  '설렘':       'bg-pink-300',
  '뿌듯함':     'bg-teal-300',
  '혼란스러움': 'bg-violet-300',
  '아픔':       'bg-rose-300',
};

export function EmotionInsights() {
  const { data: stats, isLoading: statsLoading } = useEmotionStats();
  const { data: allEntries = [], isLoading: entriesLoading } = useEntries();
  const [selDate, setSelDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  if (statsLoading || entriesLoading || !stats) {
    return <div className="h-48 bg-muted animate-pulse rounded-xl" />;
  }

  const { last7Days, totalEntries, streak } = stats;

  const monthStr = format(selDate, 'yyyy-MM');
  const isCurrentMonth = monthStr === format(new Date(), 'yyyy-MM');
  const monthEntries = allEntries.filter(e => e.date.startsWith(monthStr));

  const distribution: Record<string, number> = {};
  monthEntries.forEach(e => {
    distribution[e.emotion] = (distribution[e.emotion] || 0) + 1;
  });
  const distEntries = (Object.entries(distribution) as [EmotionType, number][])
    .sort((a, b) => b[1] - a[1]);
  const total = distEntries.reduce((s, [, c]) => s + c, 0) || 1;

  return (
    <div className="space-y-4">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[#fff8f0] border border-[#fde8d0] rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalEntries}</p>
          <p className="text-xs text-muted-foreground mt-0.5">총 기록</p>
        </div>
        <div className="bg-[#f0f8ff] border border-[#d0e8fd] rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{streak}</p>
          <p className="text-xs text-muted-foreground mt-0.5">연속 기록</p>
        </div>
      </div>

      {/* 7-day strip */}
      <div className="surface-card p-4 space-y-3">
        <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">최근 7일 감정</p>
        <div className="flex justify-between gap-1">
          {last7Days.map((day, i) => (
            <motion.div
              key={day.dateStr}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1.5 flex-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  day.emotion
                    ? (EMOTION_DOT[day.emotion as EmotionType] ?? 'bg-muted')
                    : 'bg-muted border-2 border-dashed border-muted-foreground/20'
                }`}
              >
                {day.emotion ? (resolveEmotion(day.emotion).emoji) : ''}
              </div>
              <p className="text-xs text-muted-foreground/70 font-medium">{day.dayLabel}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Monthly distribution */}
      <div className="surface-card p-4 space-y-3">
        {/* Header with month nav */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">감정 분포</p>
          <button
            onClick={() => setShowPicker(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted active:opacity-70 transition-opacity"
          >
            <span className="text-xs font-bold text-foreground">
              {format(selDate, 'yyyy년 M월')}
            </span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>

        {distEntries.length > 0 ? (
          <div className="space-y-2.5">
            {distEntries.map(([emotion, count], i) => (
              <motion.div
                key={`${monthStr}-${emotion}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                <span className="text-base w-6 text-center flex-shrink-0">{resolveEmotion(emotion).emoji}</span>
                <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${EMOTION_BAR[emotion as EmotionType] ?? 'bg-primary'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round((count / total) * 100)}%` }}
                    transition={{ duration: 0.5, delay: i * 0.06 + 0.1 }}
                  />
                </div>
                <span className="text-xs font-bold text-muted-foreground w-10 text-right">
                  {Math.round((count / total) * 100)}%
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center space-y-1">
            <p className="text-2xl">🌱</p>
            <p className="text-sm font-semibold text-foreground">기록이 없어요</p>
            <p className="text-xs text-muted-foreground">이 달에 남긴 기록이 없어요</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showPicker && (
          <YearMonthPicker
            year={selDate.getFullYear()}
            month={selDate.getMonth() + 1}
            onConfirm={(y, m) => {
              setSelDate(new Date(y, m - 1, 1));
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
