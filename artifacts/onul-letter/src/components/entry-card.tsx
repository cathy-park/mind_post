import { format, parseISO } from 'date-fns';
import { Image as ImageIcon, MessageCircle } from 'lucide-react';
import { JournalEntry } from '@/lib/constants';
import { resolveEmotion } from '@/lib/emotion-utils';
import { motion } from 'framer-motion';

interface EntryCardProps {
  entry: JournalEntry;
  onClick: () => void;
  highlight?: boolean;
  label?: string;
}

export function EntryCard({ entry, onClick, highlight, label }: EntryCardProps) {
  const emotionData = resolveEmotion(entry.emotion);
  const dateObj = parseISO(entry.date);
  const reflectionCount = entry.reflections?.length ?? 0;

  return (
    <motion.div
      whileHover={{ scale: 0.98 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`cursor-pointer p-5 rounded-xl bg-card border flex flex-col gap-3 relative overflow-hidden transition-all ${
        highlight ? 'border-primary/50 ring-1 ring-primary/20' : 'border-card-border'
      }`}
    >
      {/* Label Badge */}
      {label && (
        <div className="absolute top-0 right-0 bg-primary/10 text-primary px-3 py-1 text-xs font-bold rounded-bl-xl rounded-tr-3xl">
          {label}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <span className="text-xs font-semibold text-muted-foreground tracking-wider">
            {format(dateObj, 'yyyy년 M월 d일')} ({entry.weekday})
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl">{emotionData?.emoji ?? '📝'}</span>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-full ${emotionData?.colorClass ?? 'bg-muted text-muted-foreground'}`}>
              {entry.emotion}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {entry.photo && (
            <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <ImageIcon className="w-4 h-4" />
            </div>
          )}
          {reflectionCount > 0 && (
            <div className="flex items-center gap-1 text-xs font-bold text-violet-500 bg-violet-50 dark:bg-violet-950/30 px-2 py-0.5 rounded-full">
              <MessageCircle className="w-3 h-3" />
              {reflectionCount}
            </div>
          )}
        </div>
      </div>

      <p className="text-foreground text-sm font-medium line-clamp-2 mt-1">
        {entry.shortAnswer}
      </p>
    </motion.div>
  );
}
