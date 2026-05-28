import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { MobileContainer } from '@/components/layout/mobile-container';
import { BottomNav } from '@/components/layout/bottom-nav';
import { MascotGuide, PoseMascot } from '@/components/mascot-card';
import { EntryCard } from '@/components/entry-card';
import { EntryDetailModal } from '@/components/entry-detail-modal';
import { useArchiveLetters, useTimeLetters, ArchiveItem } from '@/hooks/use-journal';
import { JournalEntry } from '@/lib/constants';
import { Calendar, Sparkles, Clock } from 'lucide-react';

type TabId = 'home' | 'weekly' | 'monthly' | 'yearly';

const TABS: { id: TabId; label: string }[] = [
  { id: 'home',    label: '홈' },
  { id: 'weekly',  label: '매주' },
  { id: 'monthly', label: '매달' },
  { id: 'yearly',  label: '매년' },
];

const TAB_CONFIG: Record<
  Exclude<TabId, 'home'>,
  { icon: React.ReactNode; sectionLabel: string; emptyText: string; cardLabelFn: (item: ArchiveItem) => string }
> = {
  weekly: {
    icon: <Clock className="w-3.5 h-3.5 text-accent" />,
    sectionLabel: '매주',
    emptyText: '아직 일주일 전 기록이 없어요',
    cardLabelFn: (item) => `${item.label} · ${format(parseISO(item.dateStr), 'M월 d일')}`,
  },
  monthly: {
    icon: <span className="w-2 h-2 rounded-full bg-secondary block flex-shrink-0" />,
    sectionLabel: '매달',
    emptyText: '아직 한 달 전 기록이 없어요',
    cardLabelFn: (item) => `${item.label} · ${format(parseISO(item.dateStr), 'yyyy년 M월 d일')}`,
  },
  yearly: {
    icon: <Sparkles className="w-3.5 h-3.5 text-primary" />,
    sectionLabel: '매년',
    emptyText: '아직 1년 전 기록이 없어요',
    cardLabelFn: (item) => `${item.label} · ${format(parseISO(item.dateStr), 'yyyy년 M월 d일')}`,
  },
};

interface HomeCardProps {
  icon: React.ReactNode;
  label: string;
  badge?: string;
  highlight?: boolean;
  entry: JournalEntry | null;
  cardLabel: string;
  delay: number;
  onOpen: (e: JournalEntry) => void;
}

function HomeCard({ icon, label, badge, highlight, entry, cardLabel, delay, onOpen }: HomeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="font-bold text-foreground text-sm">{label}</h3>
        {badge && (
          <span className="ml-auto text-xs bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      {entry ? (
        <EntryCard entry={entry} onClick={() => onOpen(entry)} highlight={highlight} label={cardLabel} />
      ) : (
        <div className="p-5 rounded-xl border border-dashed border-border/50 bg-muted/15 text-center space-y-1.5">
          <Calendar className="w-6 h-6 text-muted-foreground/30 mx-auto" />
          <p className="text-sm text-muted-foreground/60">{label}의 기억이 아직 없어요</p>
          <p className="text-xs text-muted-foreground/40">꾸준히 기록하면 편지가 도착해요 ✉️</p>
        </div>
      )}
    </motion.div>
  );
}

function ArchiveList({
  items,
  tabId,
  onOpen,
}: {
  items: ArchiveItem[];
  tabId: Exclude<TabId, 'home'>;
  onOpen: (e: JournalEntry) => void;
}) {
  const cfg = TAB_CONFIG[tabId];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center space-y-4">
        <PoseMascot type="post" pose="empty" size="md" />
        <p className="font-bold text-foreground">{cfg.emptyText}</p>
        <p className="text-sm text-muted-foreground">매일 기록하면 쌓여요 ✉️</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item, i) => (
        <motion.div
          key={item.dateStr}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="space-y-2"
        >
          <div className="flex items-center gap-2">
            {cfg.icon}
            <span className="text-xs font-bold text-muted-foreground">{cfg.cardLabelFn(item)}</span>
          </div>
          <EntryCard
            entry={item.entry}
            onClick={() => onOpen(item.entry)}
            label={item.label}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function TimeLetter() {
  const { data: archive } = useArchiveLetters();
  const { data: letters } = useTimeLetters();
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [tab, setTab] = useState<TabId>('home');
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekly  = archive?.weekly  ?? [];
  const monthly = archive?.monthly ?? [];
  const yearly  = archive?.yearly  ?? [];

  const hasAny = !!(letters?.lastWeek || letters?.lastMonth || letters?.lastYear);

  return (
    <MobileContainer>
      <div className="flex flex-col h-full">

        {/* ── FIXED header ── */}
        <div className="flex-shrink-0 bg-background px-5 pt-10 pb-4 border-b border-border/20 space-y-4">
          <h1 className="text-2xl font-bold text-foreground">편지함</h1>

          {/* Tab chips */}
          <div className="flex gap-2">
            {TABS.map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); scrollRef.current?.scrollTo({ top: 0, behavior: 'instant' }); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold transition-all ${
                  tab === t.id
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Mascot guide */}
          <MascotGuide
            type="post"
            pose={hasAny ? 'delivery' : 'idle'}
            message={hasAny ? '과거의 당신에게서 편지가 도착했어요' : '아직 배달할 편지가 없어요'}
            sub={hasAny ? '꾹 눌러서 열어보세요 💌' : '매일 기록하면 편지가 쌓여요'}
            size="lg"
          />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border/40" />
            <p className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">보관된 편지</p>
            <div className="flex-1 h-px bg-border/40" />
          </div>
        </div>

        {/* ── SCROLLABLE content ── */}
        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto px-5 pt-5"
          style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              {/* 홈 탭 */}
              {tab === 'home' && (
                <div className="space-y-8">
                  {/* 지난주 오늘 */}
                  <HomeCard
                    icon={<Clock className="w-4 h-4 text-accent" />}
                    label="지난주 오늘"
                    entry={letters?.lastWeek ?? null}
                    cardLabel="일주일 전"
                    delay={0.06}
                    onOpen={setSelectedEntry}
                  />
                  {/* 지난달 오늘 */}
                  <HomeCard
                    icon={<span className="w-2 h-2 rounded-full bg-secondary block flex-shrink-0" />}
                    label="지난달 오늘"
                    entry={letters?.lastMonth ?? null}
                    cardLabel="한 달 전 오늘"
                    delay={0.12}
                    onOpen={setSelectedEntry}
                  />
                  {/* 지난해 오늘 */}
                  <HomeCard
                    icon={<Sparkles className="w-4 h-4 text-primary" />}
                    label="지난해 오늘"
                    badge="가장 먼 기억"
                    highlight
                    entry={letters?.lastYear ?? null}
                    cardLabel="1년 전 오늘"
                    delay={0.18}
                    onOpen={setSelectedEntry}
                  />
                </div>
              )}

              {/* 매주 탭 */}
              {tab === 'weekly' && (
                <ArchiveList items={weekly} tabId="weekly" onOpen={setSelectedEntry} />
              )}

              {/* 매달 탭 */}
              {tab === 'monthly' && (
                <ArchiveList items={monthly} tabId="monthly" onOpen={setSelectedEntry} />
              )}

              {/* 매년 탭 */}
              {tab === 'yearly' && (
                <ArchiveList items={yearly} tabId="yearly" onOpen={setSelectedEntry} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <BottomNav />

      <AnimatePresence>
        {selectedEntry && (
          <EntryDetailModal
            key={selectedEntry.id}
            entry={selectedEntry}
            onClose={() => setSelectedEntry(null)}
            showMascotFooter
          />
        )}
      </AnimatePresence>
    </MobileContainer>
  );
}
