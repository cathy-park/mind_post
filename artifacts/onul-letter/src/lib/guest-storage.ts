import { parseISO } from 'date-fns';
import { JournalEntry, EmotionType, WEEKDAYS, EMOTIONS } from '@/lib/constants';

const GUEST_KEY = 'onul_guest_entries';

export interface GuestEntry {
  id: string;
  date: string;
  emotion: EmotionType;
  shortAnswer: string;
  longAnswer?: string;
  photo?: string;
  createdAt: string;
}

export function getGuestEntries(): GuestEntry[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addGuestEntry(entry: GuestEntry): void {
  const existing = getGuestEntries();
  existing.push(entry);
  localStorage.setItem(GUEST_KEY, JSON.stringify(existing));
}

export function upsertGuestEntry(entry: GuestEntry): void {
  const existing = getGuestEntries().filter((e) => e.id !== entry.id);
  existing.push(entry);
  localStorage.setItem(GUEST_KEY, JSON.stringify(existing));
}

export function deleteGuestEntry(id: string): void {
  const existing = getGuestEntries().filter((e) => e.id !== id);
  localStorage.setItem(GUEST_KEY, JSON.stringify(existing));
}

export function clearGuestEntries(): void {
  localStorage.removeItem(GUEST_KEY);
}

export function hasGuestEntries(): boolean {
  return getGuestEntries().length > 0;
}

export function guestToJournalEntry(g: GuestEntry): JournalEntry {
  return {
    id: g.id,
    date: g.date,
    weekday: WEEKDAYS[parseISO(g.date).getDay()],
    emotion: g.emotion,
    question: EMOTIONS[g.emotion]?.question ?? '',
    shortAnswer: g.shortAnswer,
    longAnswer: g.longAnswer,
    photo: g.photo,
    createdAt: g.createdAt,
    reflections: [],
  };
}
