import { useTodayEntry, useTimeLetters, useSettings } from './use-journal';
import { JournalEntry } from '@/lib/constants';

export type NotificationType = 'daily' | 'lastWeek' | 'lastMonth' | 'lastYear';

export interface AppNotification {
  id: NotificationType;
  icon: string;
  title: string;
  sub: string;
  entry?: JournalEntry;
}

export interface NotificationConditions {
  daily: boolean;
  lastWeek: boolean;
  lastMonth: boolean;
  lastYear: boolean;
}

interface UseNotificationsResult {
  active: AppNotification[];
  conditions: NotificationConditions;
  notificationsEnabled: boolean;
}

export function useNotifications(): UseNotificationsResult {
  const { data: settings } = useSettings();
  const { data: todayEntry } = useTodayEntry();
  const { data: timeLetters } = useTimeLetters();

  const notificationsEnabled = settings?.notifications ?? false;

  const now = new Date();
  const [rh, rm] = (settings?.reminderTime ?? '21:00').split(':').map(Number);
  const isPastReminderTime = now.getHours() * 60 + now.getMinutes() >= rh * 60 + rm;

  // Whether each notification's condition is met (regardless of enabled toggle)
  const conditions: NotificationConditions = {
    daily: !todayEntry && isPastReminderTime && (settings?.reminderEnabled ?? false),
    lastWeek: !!timeLetters?.lastWeek,
    lastMonth: !!timeLetters?.lastMonth,
    lastYear: !!timeLetters?.lastYear,
  };

  // Active = condition met AND notifications globally enabled
  const active: AppNotification[] = [];

  if (notificationsEnabled) {
    // Memory notifications — most significant first (year > month > week)
    if (conditions.lastYear && timeLetters?.lastYear) {
      active.push({
        id: 'lastYear',
        icon: '✉️',
        title: '작년 오늘의 편지가 도착했어요',
        sub: `1년 전 오늘, ${timeLetters.lastYear.emotion}의 하루였어요`,
        entry: timeLetters.lastYear,
      });
    }
    if (conditions.lastMonth && timeLetters?.lastMonth) {
      active.push({
        id: 'lastMonth',
        icon: '📅',
        title: '한 달 전 오늘의 편지가 도착했어요',
        sub: `한 달 전 오늘, ${timeLetters.lastMonth.emotion}의 마음이었어요`,
        entry: timeLetters.lastMonth,
      });
    }
    if (conditions.lastWeek && timeLetters?.lastWeek) {
      active.push({
        id: 'lastWeek',
        icon: '🔁',
        title: '지난주 오늘의 기록이 기다리고 있어요',
        sub: `일주일 전 오늘, ${timeLetters.lastWeek.emotion}의 하루를 보냈어요`,
        entry: timeLetters.lastWeek,
      });
    }
    // Daily reminder — show after memory letters
    if (conditions.daily) {
      active.push({
        id: 'daily',
        icon: '🌙',
        title: '오늘 기록이 아직 없어요',
        sub: '오늘의 마음을 남겨보세요',
      });
    }
  }

  return { active, conditions, notificationsEnabled };
}
