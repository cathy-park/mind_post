import { useState } from 'react';
import { Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { CustomEmotion } from '@/hooks/use-custom-emotions';

// ── 이모지 카테고리 ─────────────────────────────────────────────────────────

const EMOJI_CATEGORIES = [
  {
    label: '😊 얼굴',
    emojis: [
      // 기쁨/행복
      '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇',
      '🥰','😍','🤩','😘','😗','☺️','😚','😙','🥲',
      // 장난/재미
      '😋','😛','😜','🤪','😝','🤑','🤗','🫨','🤭','🫢','🫣','🤫',
      // 생각/중립
      '🤔','🫠','🤐','😶','😶‍🌫️','😑','😬','🙄','😏','🫤',
      // 놀람
      '😯','😦','😧','😮','😲','🥱',
      // 졸음/피곤
      '😴','🤤','😪','😵','😵‍💫',
      // 특별/개성
      '🤯','🤠','🥳','🥸','😎','🤓','🧐',
      // 슬픔/걱정
      '😕','😟','🙁','☹️','😮‍💨','😣','😖','😫','😩','🥺','😢','😭',
      // 아픔/불쾌
      '😤','😠','😡','🤬','😈','👿',
      '🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😰','😥','😓',
      // 특수
      '💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖',
    ],
  },
  {
    label: '🌸 자연',
    emojis: [
      '🌸','🌺','🌻','🌹','🌷','🌼','💐','🌿','🍀','🍁','🍂','🍃',
      '🌱','🌲','🌳','🌴','🪴','🍄','🌾','🌊','🌈','⭐','🌟','💫',
      '✨','🌙','☀️','⛅','🌤️','🌦️','🌧️','⛈️','🌩️','🌨️','❄️',
      '🌬️','🌀','🌫️','🔥','💧','🌍','🦋','🐝','🐞','🌺','🍒',
      '🍓','🍇','🍎','🍋','🌙','⚡','🌠','🎆','🎇','🎑',
    ],
  },
  {
    label: '💫 기타',
    emojis: [
      // 하트
      '❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','💕','💞',
      '💓','💗','💖','💘','💝','💟','❣️',
      // 손/제스처
      '👍','👎','👋','🤚','✋','🖐️','✌️','🤞','🤟','🤘','🤙',
      '💪','🙏','👏','🫶','🤝','🫱','🫲',
      // 음악/예술
      '🎶','🎵','🎸','🎹','🎺','🎻','🥁','🎤','🎧','🎨','🖌️',
      // 생활
      '📚','📖','✏️','📝','💡','🔍','🔑','🎁','🎊','🎉','🎈',
      '🏆','🥇','🥈','🎯','🎮','⚽','🏀','🎲','🎠',
      // 별/반짝
      '⭐','🌟','💫','✨','🌠','🎆','🎇',
    ],
  },
];

const COLOR_OPTIONS: { label: string; dot: string; value: string }[] = [
  { label: '핑크',   dot: 'bg-pink-400',   value: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' },
  { label: '보라',   dot: 'bg-purple-400', value: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  { label: '파랑',   dot: 'bg-blue-400',   value: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  { label: '초록',   dot: 'bg-green-400',  value: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
  { label: '노랑',   dot: 'bg-yellow-400', value: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
  { label: '주황',   dot: 'bg-orange-400', value: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  { label: '빨강',   dot: 'bg-red-400',    value: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  { label: '민트',   dot: 'bg-teal-400',   value: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' },
  { label: '남색',   dot: 'bg-indigo-400', value: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' },
  { label: '회색',   dot: 'bg-gray-400',   value: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300' },
];

interface Props {
  initial?: CustomEmotion;
  existingNames?: string[];
  onSave: (data: { name: string; emoji: string; colorClass: string }) => void;
  onClose: () => void;
}

export function AddEmotionSheet({ initial, existingNames = [], onSave, onClose }: Props) {
  const [emoji, setEmoji]      = useState(initial?.emoji ?? '😊');
  const [name, setName]        = useState(initial?.name ?? '');
  const [colorClass, setColor] = useState(initial?.colorClass ?? COLOR_OPTIONS[0].value);
  const [tab, setTab]          = useState(0);

  const trimmed = name.trim();
  const isDup   = !initial && existingNames.includes(trimmed);
  const canSave = trimmed.length > 0 && !isDup;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl pt-5 px-5 space-y-4 overflow-y-auto"
        style={{ maxHeight: '90vh', paddingBottom: 'calc(3.5rem + max(1.5rem, env(safe-area-inset-bottom, 0px) + 1rem))' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto" />
        <p className="text-sm font-bold text-center text-foreground">
          {initial ? '감정 수정' : '나만의 감정 추가'}
        </p>

        {/* 미리보기 */}
        <div className="flex justify-center">
          <div className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold ${colorClass}`}>
            <span>{emoji}</span>
            <span>{trimmed || '감정 이름'}</span>
          </div>
        </div>

        {/* 이모지 선택 */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">이모지</p>

          {/* 카테고리 탭 */}
          <div className="flex gap-1 bg-muted/40 rounded-2xl p-1">
            {EMOJI_CATEGORIES.map((cat, i) => (
              <button
                key={i}
                onClick={() => setTab(i)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  tab === i
                    ? 'bg-card shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* 이모지 그리드 */}
          <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto pr-0.5">
            {EMOJI_CATEGORIES[tab].emojis.map((e, idx) => (
              <button
                key={`${tab}-${idx}`}
                onClick={() => setEmoji(e)}
                className={`text-xl p-1.5 rounded-xl transition-all leading-none ${
                  emoji === e
                    ? 'bg-primary/15 ring-2 ring-primary scale-110'
                    : 'hover:bg-muted/60'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* 감정 이름 */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">감정 이름</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="예: 설레다, 뭉클함, 충만함…"
            maxLength={10}
            className="w-full bg-background border border-border rounded-2xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {isDup && <p className="text-xs text-red-500 pl-1">이미 있는 감정이에요</p>}
        </div>

        {/* 색상 선택 */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">색상</p>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map(opt => (
              <button
                key={opt.label}
                onClick={() => setColor(opt.value)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-semibold transition-all ${
                  colorClass === opt.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-muted/40 text-muted-foreground'
                }`}
              >
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${opt.dot}`} />
                {colorClass === opt.value && <Check className="w-3 h-3" />}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* 저장 / 취소 */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl bg-muted text-foreground text-sm font-bold"
          >
            취소
          </button>
          <button
            onClick={() => { if (canSave) { onSave({ name: trimmed, emoji, colorClass }); onClose(); } }}
            disabled={!canSave}
            className="flex-1 py-3 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40 transition-opacity"
          >
            {initial ? '수정 완료' : '추가하기'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
