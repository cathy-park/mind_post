import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Image, X, Loader2, ChevronDown, ChevronUp, AlertCircle, LogIn, Cloud, Plus, Pencil, Trash2 } from 'lucide-react';
import { MobileContainer } from '@/components/layout/mobile-container';
import { BottomNav } from '@/components/layout/bottom-nav';
import { MascotGuide, PoseMascot } from '@/components/mascot-card';
import { useAddEntry } from '@/hooks/use-journal';
import { EMOTIONS, EmotionType, PRIMARY_EMOTIONS, EXTENDED_EMOTIONS } from '@/lib/constants';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { useCustomEmotions, CustomEmotion } from '@/hooks/use-custom-emotions';
import { AddEmotionSheet } from '@/components/add-emotion-sheet';

const MOA_STATIC_MESSAGES: Record<string, { sub?: string }> = {
  chosen:  { sub: '한 문장으로도 충분해요' },
  writing: { sub: '오늘의 마음을 꾹 눌러 담아드릴게요' },
  ready:   { sub: '아래 버튼을 눌러주세요' },
};

// ── Photo picker bottom sheet ────────────────────────────────────────────────
function PhotoPickerSheet({
  onGallery,
  onCamera,
  onClose,
}: {
  onGallery: () => void;
  onCamera: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.38)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', bounce: 0.15, duration: 0.38 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-card rounded-t-3xl pt-5 px-5 shadow-2xl space-y-2"
        style={{ paddingBottom: 'max(2.5rem, calc(env(safe-area-inset-bottom, 0px) + 1.5rem))' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <p className="text-xs font-bold tracking-widest uppercase text-center text-muted-foreground mb-3">사진 추가</p>

        <button
          onClick={onGallery}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-muted/60 hover:bg-muted active:bg-muted transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Image className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">앨범에서 선택</p>
            <p className="text-xs text-muted-foreground mt-0.5">갤러리에서 사진을 골라요</p>
          </div>
        </button>

        <button
          onClick={onCamera}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl bg-muted/60 hover:bg-muted active:bg-muted transition-colors text-left"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Camera className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-bold text-foreground">카메라로 촬영</p>
            <p className="text-xs text-muted-foreground mt-0.5">지금 바로 찍어서 추가해요</p>
          </div>
        </button>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-muted-foreground"
        >
          취소
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function Record() {
  const [, setLocation] = useLocation();
  const { mutateAsync: addEntry, isPending } = useAddEntry();
  const { isAuthenticated, login, nickname } = useSupabaseAuth();

  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [shortAnswer, setShortAnswer] = useState('');
  const [longAnswer, setLongAnswer] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);
  const [savedAsGuest, setSavedAsGuest] = useState(false);
  const [showExtended, setShowExtended] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingEmotion, setEditingEmotion] = useState<CustomEmotion | null>(null);

  const customEmotions = useCustomEmotions();

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const today = new Date();

  const moaStep = !selectedEmotion ? 'idle'
    : shortAnswer.trim().length === 0 ? 'chosen'
    : shortAnswer.trim().length < 10  ? 'writing'
    : 'ready';

  const moaPose = moaStep === 'idle' ? 'entry' : moaStep === 'ready' ? 'success' : 'prompt';

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!selectedEmotion || shortAnswer.trim().length === 0) return;
    setSaveError(null);
    const isGuest = !isAuthenticated;
    setSavedAsGuest(isGuest);
    const builtinData = EMOTIONS[selectedEmotion as EmotionType];
    const question = builtinData?.question ?? `오늘 ${selectedEmotion}을(를) 느꼈던 순간을 적어볼까요?`;
    if (!builtinData) customEmotions.incrementUsage(selectedEmotion);
    try {
      await addEntry({
        date: format(today, 'yyyy-MM-dd'),
        emotion: selectedEmotion as EmotionType,
        question,
        shortAnswer: shortAnswer.trim(),
        longAnswer: longAnswer.trim() || undefined,
        photo,
      });
      setIsSuccess(true);
      if (!isGuest) {
        setTimeout(() => setLocation('/'), 2800);
      }
    } catch (err) {
      console.error('Save entry error:', err);
      setSaveError('저장 중 문제가 생겼어요. 다시 시도해 주세요.');
    }
  };

  // ── Guest success screen ─────────────────────────────────────────────────
  if (isSuccess && savedAsGuest) {
    return (
      <MobileContainer>
        <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-7">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-amber-200 rounded-full blur-2xl opacity-50 scale-125" />
            <PoseMascot type="moa" pose="success" size="xl" float />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">모아</p>
            <h2 className="font-bold text-2xl text-foreground leading-snug">이 기록은 이 기기에<br />임시로 보관됐어요</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">로그인하면 안전하게 저장되고<br />다른 기기에서도 다시 만날 수 있어요 🌿</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="w-full space-y-2.5">
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-foreground text-background font-bold text-sm shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              Google로 로그인하기
            </button>
            <button
              onClick={() => setLocation('/')}
              className="w-full py-3 rounded-2xl text-muted-foreground text-sm font-semibold hover:bg-muted/40 transition-colors"
            >
              홈으로 돌아가기
            </button>
          </motion.div>
        </div>
        <BottomNav />
      </MobileContainer>
    );
  }

  // ── Authenticated success screen ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <MobileContainer>
        <div className="h-full flex flex-col items-center justify-center p-8 text-center gap-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-purple-200 rounded-full blur-2xl opacity-50 scale-125" />
            <PoseMascot type="post" pose="sent" size="xl" float />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-2">
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-muted-foreground">포스트</p>
            <h2 className="font-bold text-2xl text-foreground leading-snug">오늘의 마음이<br />안전하게 담겼어요!</h2>
            <p className="text-muted-foreground text-sm">미래의 당신에게 소중히 전달해드릴게요 💌</p>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30"
                animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }} />
            ))}
          </motion.div>
        </div>
        <BottomNav />
      </MobileContainer>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <MobileContainer>
      <div className="flex flex-col h-full">
        <div className="flex-shrink-0 bg-background px-5 pt-10 pb-4 border-b border-border/20">
          <h1 className="text-2xl font-bold text-foreground">기록</h1>
          <p className="text-sm text-muted-foreground mt-1">{format(today, 'yyyy년 M월 d일')}</p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 space-y-6"
          style={{ paddingBottom: 'max(6rem, calc(env(safe-area-inset-bottom, 0px) + 4rem))' }}>

        {/* 모아 guide */}
        <MascotGuide
          type="moa"
          pose={moaPose}
          message={
            moaStep === 'idle' ? (
              <span>
                {nickname && (
                  <span style={{ color: '#e07080', fontWeight: 700 }}>{nickname}</span>
                )}
                {nickname ? '님, ' : ''}오늘 하루, 어떤 감정의 색이었나요?
              </span>
            ) : moaStep === 'chosen' ? '그 순간을 짧게라도 남겨줄래요?'
              : moaStep === 'writing' ? '잘 쓰고 있어요, 조금만 더요!'
              : '다 담겼어요. 저장할 준비가 됐어요 🌸'
          }
          sub={
            moaStep === 'idle'
              ? '모아에게 감정을 하나 알려주세요'
              : MOA_STATIC_MESSAGES[moaStep]?.sub
          }
          size="md"
          messageKey={moaStep}
        />

        {/* ── Emotion grid ───────────────────────────────────────────── */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase pl-1">감정 선택</p>
          <div className="grid grid-cols-3 gap-2">
            {PRIMARY_EMOTIONS.map((emotion) => (
              <EmotionButton key={emotion} emotion={emotion} selected={selectedEmotion === emotion} onSelect={setSelectedEmotion} />
            ))}
          </div>
          <button
            onClick={() => setShowExtended(v => !v)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-muted/50 text-muted-foreground text-xs font-semibold"
          >
            {showExtended ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showExtended ? '감정 접기' : '감정 더 보기'}
          </button>
          <AnimatePresence>
            {showExtended && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-3 gap-2 overflow-hidden"
              >
                {EXTENDED_EMOTIONS.map((emotion) => (
                  <EmotionButton key={emotion} emotion={emotion} selected={selectedEmotion === emotion} onSelect={setSelectedEmotion} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── 나만의 감정 ────────────────────────────────────── */}
          {customEmotions.emotions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pl-0.5">
                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">나만의 감정</p>
                <button
                  onClick={() => setEditMode(v => !v)}
                  className="flex items-center gap-1 text-xs font-semibold text-primary px-2.5 py-1 rounded-full bg-primary/10"
                >
                  {editMode ? <>완료</> : <><Pencil className="w-3 h-3" /> 편집</>}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {customEmotions.emotions.map(ce => (
                  <CustomEmotionButton
                    key={ce.id}
                    emotion={ce}
                    selected={selectedEmotion === ce.name}
                    editMode={editMode}
                    onSelect={() => { if (!editMode) setSelectedEmotion(ce.name); }}
                    onEdit={() => { setEditingEmotion(ce); setShowAddSheet(true); }}
                    onDelete={() => {
                      if (selectedEmotion === ce.name) setSelectedEmotion(null);
                      customEmotions.remove(ce.id);
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* + 감정 추가 버튼 */}
          <button
            onClick={() => { setEditingEmotion(null); setShowAddSheet(true); }}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl border-2 border-dashed border-border text-muted-foreground text-xs font-semibold hover:bg-muted/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> 감정 추가
          </button>
        </div>

        {/* ── Question + answer ──────────────────────────────────────── */}
        <AnimatePresence>
          {selectedEmotion && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Short answer */}
              <div className="space-y-3">
                <h2 className="font-bold text-xl text-foreground leading-snug">
                  {EMOTIONS[selectedEmotion as EmotionType]?.question
                    ?? `오늘 ${selectedEmotion}을(를) 느꼈던 순간을 적어볼까요?`}
                </h2>
                <textarea
                  value={shortAnswer}
                  onChange={e => setShortAnswer(e.target.value)}
                  placeholder="짧게라도 좋아요. 한 문장으로 남겨보세요."
                  inputMode="text"
                  className="w-full bg-card border border-card-border rounded-2xl p-4 min-h-[100px] text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-sm placeholder:text-muted-foreground"
                />
              </div>

              {/* Optional section */}
              <div className="space-y-3">
                <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase pl-1">선택 사항</p>
                <textarea
                  value={longAnswer}
                  onChange={e => setLongAnswer(e.target.value)}
                  placeholder="마음속 깊은 이야기를 자유롭게 적어주세요."
                  inputMode="text"
                  className="w-full bg-card border border-card-border rounded-2xl p-4 min-h-[120px] text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-sm placeholder:text-muted-foreground"
                />

                {/* Hidden file inputs */}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={galleryRef}
                  onChange={handlePhotoFile}
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={cameraRef}
                  onChange={handlePhotoFile}
                />

                {/* Photo display / picker trigger */}
                {photo ? (
                  <div className="relative rounded-2xl overflow-hidden border border-border">
                    <img src={photo} alt="Uploaded" className="w-full object-cover max-h-56" />
                    <button
                      onClick={() => setPhoto(undefined)}
                      className="absolute top-2 right-2 bg-black/55 text-white p-1.5 rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowPhotoOptions(true)}
                    className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground text-sm hover:bg-muted/30 transition-colors"
                  >
                    <Camera className="w-5 h-5" /> 사진 추가하기
                  </button>
                )}
              </div>

              {/* Error message */}
              <AnimatePresence>
                {saveError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 rounded-2xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
                    <p className="text-sm text-red-600 dark:text-red-400">{saveError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Guest mode indicator */}
              {!isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 px-4 py-3.5 rounded-2xl"
                  style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)' }}
                >
                  <Cloud className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">현재 로그인하지 않은 상태예요</p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-500/70 mt-0.5">기록은 이 기기에 임시 저장돼요</p>
                  </div>
                </motion.div>
              )}

              {/* Save button */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                disabled={shortAnswer.trim().length === 0 || isPending}
                className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  shortAnswer.trim().length > 0 && !isPending
                    ? 'bg-foreground text-background shadow-lg'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
                }`}
              >
                {isPending
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> 저장 중...</>
                  : '마음 남기기'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>{/* scrollable content */}
      </div>{/* flex col h-full */}

      <BottomNav />

      {/* Photo picker sheet */}
      <AnimatePresence>
        {showPhotoOptions && (
          <PhotoPickerSheet
            onGallery={() => { setShowPhotoOptions(false); setTimeout(() => galleryRef.current?.click(), 100); }}
            onCamera={() => { setShowPhotoOptions(false); setTimeout(() => cameraRef.current?.click(), 100); }}
            onClose={() => setShowPhotoOptions(false)}
          />
        )}
      </AnimatePresence>

      {/* Add / Edit emotion sheet */}
      <AnimatePresence>
        {showAddSheet && (
          <AddEmotionSheet
            initial={editingEmotion ?? undefined}
            existingNames={customEmotions.emotions.map(e => e.name)}
            onSave={data => {
              if (editingEmotion) {
                customEmotions.edit(editingEmotion.id, data);
              } else {
                customEmotions.add(data);
              }
              setEditingEmotion(null);
            }}
            onClose={() => { setShowAddSheet(false); setEditingEmotion(null); }}
          />
        )}
      </AnimatePresence>
    </MobileContainer>
  );
}

function EmotionButton({ emotion, selected, onSelect }: { emotion: EmotionType; selected: boolean; onSelect: (e: EmotionType) => void }) {
  const data = EMOTIONS[emotion];
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => onSelect(emotion)}
      className={`flex flex-col items-center py-3 rounded-xl border transition-all ${
        selected ? 'border-primary bg-primary/10' : 'border-card-border bg-card'
      }`}
    >
      <span className="text-xl mb-1">{data.emoji}</span>
      <span className={`text-[11px] font-bold ${selected ? 'text-primary' : 'text-muted-foreground'}`}>{emotion}</span>
    </motion.button>
  );
}

function CustomEmotionButton({
  emotion, selected, editMode, onSelect, onEdit, onDelete,
}: {
  emotion: CustomEmotion;
  selected: boolean;
  editMode: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: editMode ? 1 : 0.92 }}
        onClick={onSelect}
        className={`w-full flex flex-col items-center py-3 rounded-xl border transition-all ${
          selected && !editMode ? 'border-primary bg-primary/10' : 'border-card-border bg-card'
        }`}
      >
        <span className="text-xl mb-1">{emotion.emoji}</span>
        <span className={`text-[11px] font-bold ${selected && !editMode ? 'text-primary' : 'text-muted-foreground'}`}>
          {emotion.name}
        </span>
      </motion.button>

      {/* Edit-mode overlay */}
      <AnimatePresence>
        {editMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 rounded-xl flex items-center justify-center gap-2 bg-black/30 backdrop-blur-[1px]"
          >
            <button
              onClick={onEdit}
              className="p-1.5 rounded-full bg-white/90 text-gray-700 shadow"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-full bg-red-500 text-white shadow"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
