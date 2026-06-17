export type EmotionType =
  | '행복' | '평온' | '보통' | '스트레스' | '우울' | '복잡함'
  | '화남' | '슬픔' | '피곤함' | '불안' | '짜증' | '외로움'
  | '감사' | '설렘' | '뿌듯함' | '혼란스러움' | '아픔';

export const EMOTIONS: Record<EmotionType, { emoji: string; question: string; colorClass: string }> = {
  // ── Primary (row 1 – shown first) ──────────────────────────────────────
  '행복':     { emoji: '😊', question: '오늘 무엇이 당신을 웃게 만들었나요?',              colorClass: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  '평온':     { emoji: '😌', question: '오늘 가장 조용했던 순간은 언제였나요?',            colorClass: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  '감사':     { emoji: '🥹', question: '오늘 감사했던 순간은 언제였나요?',                 colorClass: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  '설렘':     { emoji: '🥰', question: '오늘 무엇이 당신을 설레게 했나요?',               colorClass: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  '뿌듯함':   { emoji: '😤', question: '오늘 스스로를 칭찬해주고 싶은 순간은 언제였나요?', colorClass: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  '보통':     { emoji: '😐', question: '오늘 하루에서 가장 기억에 남는 순간은 언제였나요?', colorClass: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300' },

  // ── Challenging ──────────────────────────────────────────────────────────
  '스트레스': { emoji: '🤯', question: '오늘 가장 힘들었던 순간은 언제였나요?',            colorClass: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  '우울':     { emoji: '😔', question: '오늘 가장 마음이 무거웠던 순간은 언제였나요?',     colorClass: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  '복잡함':   { emoji: '🌀', question: '어떤 생각이 가장 오래 남아 있었나요?',             colorClass: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  '화남':     { emoji: '😡', question: '오늘 무엇이 당신을 화나게 만들었나요?',            colorClass: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
  '슬픔':     { emoji: '😢', question: '오늘 가장 슬펐던 순간은 어느 때였나요?',           colorClass: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
  '피곤함':   { emoji: '😴', question: '오늘 무엇이 당신을 가장 지치게 했나요?',           colorClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-300' },
  '불안':     { emoji: '😰', question: '오늘 무엇이 가장 걱정됐나요?',                    colorClass: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  '짜증':     { emoji: '😤', question: '오늘 짜증이 났던 순간을 떠올려보세요.',            colorClass: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' },
  '외로움':   { emoji: '🥺', question: '오늘 혼자라고 느꼈던 순간이 있었나요?',            colorClass: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  '혼란스러움': { emoji: '😵', question: '오늘 가장 혼란스러웠던 생각은 무엇인가요?',     colorClass: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' },
  '아픔':     { emoji: '🤕', question: '오늘 어떤 아픔이 있었나요? 몸인가요, 마음인가요?', colorClass: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
};

// Primary emotions shown upfront; extended shown when "더 보기" is tapped
export const PRIMARY_EMOTIONS: EmotionType[] = ['행복', '평온', '감사', '설렘', '뿌듯함', '보통'];
export const EXTENDED_EMOTIONS: EmotionType[] = ['스트레스', '우울', '복잡함', '화남', '슬픔', '피곤함', '불안', '짜증', '외로움', '혼란스러움', '아픔'];

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export interface Reflection {
  id: string;
  content: string;
  createdAt: string; // ISO string
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  weekday: string;
  emotion: EmotionType;
  question: string;
  shortAnswer: string;
  longAnswer?: string;
  photo?: string; // base64
  audio?: string; // base64
  createdAt: string; // ISO
  reflections?: Reflection[];
}

export interface AppSettings {
  notifications: boolean;
  darkMode: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // "HH:MM" 24h
}

export const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  darkMode: false,
  reminderEnabled: false,
  reminderTime: '21:00',
};
