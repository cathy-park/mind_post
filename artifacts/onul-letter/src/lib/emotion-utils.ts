import { EMOTIONS, EmotionType } from './constants';

const FALLBACK = {
  emoji: '📝',
  colorClass: 'bg-muted text-muted-foreground',
  question: '',
};

function loadCustomEmotions(): { name: string; emoji: string; colorClass: string }[] {
  try { return JSON.parse(localStorage.getItem('onul_custom_emotions') ?? '[]'); }
  catch { return []; }
}

export function resolveEmotion(emotion: string): { emoji: string; colorClass: string; question: string } {
  const builtin = EMOTIONS[emotion as EmotionType];
  if (builtin) return builtin;

  const custom = loadCustomEmotions().find(e => e.name === emotion);
  if (custom) return {
    emoji: custom.emoji,
    colorClass: custom.colorClass,
    question: `오늘 ${custom.name}을(를) 느꼈던 순간을 적어볼까요?`,
  };

  return FALLBACK;
}
