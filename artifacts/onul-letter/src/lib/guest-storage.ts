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
  photos?: string[];
  audio?: string;
  audios?: string[];
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

export function guestToJournalEntry(guest: GuestEntry): JournalEntry {
  return {
    id: guest.id,
    date: guest.date,
    weekday: WEEKDAYS[parseISO(guest.date).getDay()],
    emotion: guest.emotion,
    question: EMOTIONS[guest.emotion]?.question ?? '',
    shortAnswer: guest.shortAnswer,
    longAnswer: guest.longAnswer,
    photo: guest.photo,
    photos: guest.photos || (guest.photo ? [guest.photo] : []),
    audio: guest.audio,
    audios: guest.audios || (guest.audio ? [guest.audio] : []),
    createdAt: guest.createdAt,
    reflections: [],
  };
}
