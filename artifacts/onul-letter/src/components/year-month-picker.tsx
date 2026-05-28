import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS_KO = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
const MIN_YEAR = 2020;
const MAX_YEAR = new Date().getFullYear() + 1;

export function YearMonthPicker({
  year, month, onConfirm, onClose,
}: {
  year: number;
  month: number;
  onConfirm: (y: number, m: number) => void;
  onClose: () => void;
}) {
  const [selYear, setSelYear] = useState(year);
  const [selMonth] = useState(month);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-sm bg-card rounded-t-3xl pt-6 px-6 shadow-2xl"
        style={{ paddingBottom: 'max(5rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-6" />

        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setSelYear(y => Math.max(MIN_YEAR, y - 1))}
            disabled={selYear <= MIN_YEAR}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-2xl font-bold text-foreground">{selYear}년</span>
          <button
            onClick={() => setSelYear(y => Math.min(MAX_YEAR, y + 1))}
            disabled={selYear >= MAX_YEAR}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {MONTHS_KO.map((label, i) => {
            const m = i + 1;
            const active = m === selMonth && selYear === year;
            return (
              <button
                key={m}
                onClick={() => onConfirm(selYear, m)}
                className={`py-2.5 rounded-2xl text-sm font-bold transition-all ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/70'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
