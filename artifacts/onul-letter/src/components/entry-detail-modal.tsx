import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Pencil, Trash2, Camera, Loader2, ChevronLeft, Send, MessageCircle, Mic } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { JournalEntry, EMOTIONS, EmotionType } from '@/lib/constants';
import { resolveEmotion } from '@/lib/emotion-utils';
import { PoseMascot } from '@/components/mascot-card';
import { useUpdateEntry, useDeleteEntry, useAddReflection, useDeleteReflection, useUpdateReflection } from '@/hooks/use-journal';
import { useSupabaseAuth } from '@/hooks/use-supabase-auth';
import { toast } from '@/hooks/use-toast';

interface Props {
  entry: JournalEntry;
  onClose: () => void;
  showMascotFooter?: boolean;
}

type Screen = 'view' | 'edit' | 'confirm-delete';

export function EntryDetailModal({ entry: initialEntry, onClose, showMascotFooter }: Props) {
  const [screen, setScreen] = useState<Screen>('view');
  const [entry, setEntry] = useState(initialEntry);

  // Edit fields
  const [date, setDate] = useState(initialEntry.date);
  const [emotion, setEmotion] = useState<EmotionType>(initialEntry.emotion);
  const [shortAnswer, setShortAnswer] = useState(initialEntry.shortAnswer);
  const [longAnswer, setLongAnswer] = useState(initialEntry.longAnswer ?? '');
  const [photo, setPhoto] = useState<string | undefined>(initialEntry.photo);
  const [audio, setAudio] = useState<string | undefined>(initialEntry.audio);

  // Reflection
  const [reflectionText, setReflectionText] = useState('');
  const [editingReflectionId, setEditingReflectionId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: updateEntry, isPending: isSaving } = useUpdateEntry();
  const { mutateAsync: deleteEntry, isPending: isDeleting } = useDeleteEntry();
  const { mutateAsync: addReflection, isPending: isAddingReflection } = useAddReflection();
  const { mutateAsync: deleteReflection } = useDeleteReflection();
  const { mutateAsync: updateReflection, isPending: isUpdatingReflection } = useUpdateReflection();

  const { isAuthenticated, login } = useSupabaseAuth();
  const reflections = entry.reflections ?? [];

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAudio(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) { toast({ title: '로그인이 필요해요', description: '기록을 수정하려면 로그인이 필요해요' }); await login(); return; }
    const updated = await updateEntry({
      ...entry,
      date,
      emotion,
      question: resolveEmotion(emotion).question || entry.question,
      shortAnswer: shortAnswer.trim(),
      longAnswer: longAnswer.trim() || undefined,
      photo,
      audio,
    });
    setEntry(updated);
    setScreen('view');
  };

  const handleDelete = async () => {
    if (!isAuthenticated) { toast({ title: '로그인이 필요해요', description: '기록을 삭제하려면 로그인이 필요해요' }); await login(); return; }
    await deleteEntry(entry.id);
    onClose();
  };

  const handleAddReflection = async () => {
    if (!reflectionText.trim()) return;
    if (!isAuthenticated) { toast({ title: '로그인이 필요해요', description: '댓글을 남기려면 로그인이 필요해요' }); await login(); return; }
    const updated = await addReflection({ entryId: entry.id, content: reflectionText });
    setEntry(updated);
    setReflectionText('');
  };

  const handleDeleteReflection = async (reflectionId: string) => {
    const updated = await deleteReflection({ entryId: entry.id, reflectionId });
    setEntry(updated);
  };

  const startEditReflection = (id: string, content: string) => {
    setEditingReflectionId(id);
    setEditingContent(content);
  };

  const cancelEditReflection = () => {
    setEditingReflectionId(null);
    setEditingContent('');
  };

  const handleUpdateReflection = async (reflectionId: string) => {
    if (!editingContent.trim()) return;
    const updated = await updateReflection({ entryId: entry.id, reflectionId, content: editingContent });
    setEntry(updated);
    cancelEditReflection();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col justify-end bg-black/40 backdrop-blur-sm"
      style={{ paddingBottom: 'max(3.5rem, calc(env(safe-area-inset-bottom, 0px) + 3.5rem))' }}
      onClick={e => e.target === e.currentTarget && screen === 'view' && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="bg-background w-full max-h-[88dvh] rounded-t-3xl flex flex-col shadow-2xl overflow-hidden"
      >
        {/* ── DELETE CONFIRM ─────────────────────────────────────────────── */}
        <AnimatePresence>
          {screen === 'confirm-delete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-background/97 flex flex-col items-center justify-center p-8 text-center gap-6 rounded-t-3xl"
            >
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <Trash2 className="w-7 h-7 text-destructive" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-xl text-foreground">이 기록을 삭제할까요?</h3>
                <p className="text-muted-foreground text-sm">삭제하면 되돌릴 수 없어요.</p>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={() => setScreen('view')} className="flex-1 py-3.5 rounded-2xl bg-muted font-bold text-foreground">취소</button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3.5 rounded-2xl bg-destructive text-white font-bold flex items-center justify-center gap-2"
                >
                  {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : '삭제'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/40 flex-shrink-0">
          {screen === 'edit' ? (
            <button onClick={() => setScreen('view')} className="flex items-center gap-1 text-sm font-semibold text-muted-foreground">
              <ChevronLeft className="w-4 h-4" /> 취소
            </button>
          ) : (
            <div>
              <p className="text-xs text-muted-foreground font-semibold tracking-widest uppercase">기록</p>
              <p className="font-bold text-foreground text-sm mt-0.5">
                {format(parseISO(entry.date), 'yyyy년 M월 d일')} ({entry.weekday}요일)
                {entry.createdAt && (
                  <span className="font-normal text-muted-foreground ml-1.5">
                    {format(parseISO(entry.createdAt), 'HH:mm')}
                  </span>
                )}
              </p>
            </div>
          )}

          {screen === 'edit' ? (
            <button
              onClick={handleSave}
              disabled={shortAnswer.trim().length === 0 || isSaving}
              className="px-4 py-2 bg-primary text-white rounded-full text-sm font-bold disabled:opacity-40 flex items-center gap-1.5"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : '수정 완료'}
            </button>
          ) : (
            <button onClick={onClose} className="p-2 bg-muted rounded-full"><X className="w-5 h-5" /></button>
          )}
        </div>

        {/* ── CONTENT ────────────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 px-5 pt-5 pb-20 space-y-5">
          <AnimatePresence mode="wait">

            {/* VIEW */}
            {screen === 'view' && (
              <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm ${resolveEmotion(entry.emotion).colorClass}`}>
                  {resolveEmotion(entry.emotion).emoji} {entry.emotion}
                </span>

                <div>
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">그날의 질문</p>
                  <h2 className="font-bold text-xl text-foreground leading-snug">{entry.question}</h2>
                </div>

                <div>
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">그날의 대답</p>
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{entry.shortAnswer}</p>
                </div>

                {entry.longAnswer && (
                  <div className="pt-4 border-t border-border/40">
                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase mb-2">더 남긴 이야기</p>
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{entry.longAnswer}</p>
                  </div>
                )}

                {entry.photo && (
                  <img src={entry.photo} alt="그날의 사진" className="w-full rounded-2xl border border-border mt-3" />
                )}

                {entry.audio && (
                  <div className="w-full rounded-2xl border border-border p-3 bg-card mt-3">
                    <audio controls src={entry.audio} className="w-full" />
                  </div>
                )}

                {/* 포스트 sign-off for time letter */}
                {showMascotFooter && (
                  <div className="flex items-center gap-3 pt-3 border-t border-border/30">
                    <PoseMascot type="post" pose="open_letter" size="sm" />
                    <p className="text-xs text-muted-foreground italic">소중히 배달했어요 💌</p>
                  </div>
                )}

                {/* ── Reflection section ──────────────────────────────────── */}
                <div className="pt-4 border-t border-border/40 space-y-4">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-muted-foreground/60" />
                    <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">과거의 나에게</p>
                    {reflections.length > 0 && (
                      <span className="ml-auto text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">{reflections.length}개</span>
                    )}
                  </div>

                  {/* Existing reflections */}
                  {reflections.length > 0 && (
                    <div className="space-y-3">
                      {reflections.map(r => (
                        <motion.div
                          key={r.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-[#f5f0ff] dark:bg-purple-950/20 border border-[#e4d8ff] dark:border-purple-900/30 rounded-2xl px-4 py-3 space-y-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-muted-foreground/60">
                              {format(parseISO(r.createdAt), 'yyyy년 M월 d일 HH:mm')} · 과거의 나에게
                            </p>
                            {editingReflectionId !== r.id && (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button
                                  onClick={() => startEditReflection(r.id, r.content)}
                                  className="p-1.5 text-muted-foreground/50 hover:text-foreground transition-colors rounded-lg hover:bg-muted/60"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReflection(r.id)}
                                  className="p-1.5 text-muted-foreground/50 hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {editingReflectionId === r.id ? (
                            <div className="space-y-2 pt-1">
                              <textarea
                                value={editingContent}
                                onChange={e => setEditingContent(e.target.value)}
                                inputMode="text"
                                rows={3}
                                autoFocus
                                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={cancelEditReflection}
                                  className="flex-1 py-2 rounded-xl bg-muted text-foreground text-xs font-bold"
                                >
                                  취소
                                </button>
                                <button
                                  onClick={() => handleUpdateReflection(r.id)}
                                  disabled={!editingContent.trim() || isUpdatingReflection}
                                  className="flex-1 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-40 flex items-center justify-center gap-1"
                                >
                                  {isUpdatingReflection ? <Loader2 className="w-3 h-3 animate-spin" /> : '저장'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{r.content}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Add reflection input */}
                  <div className="flex items-end gap-2">
                    <textarea
                      value={reflectionText}
                      onChange={e => setReflectionText(e.target.value)}
                      placeholder="지금의 내가 그때의 나에게…"
                      inputMode="text"
                      rows={2}
                      className="flex-1 bg-card border border-card-border rounded-2xl px-4 py-3 text-sm text-foreground dark:text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                    />
                    <button
                      onClick={handleAddReflection}
                      disabled={!reflectionText.trim() || isAddingReflection}
                      className="p-3 bg-primary text-white rounded-2xl disabled:opacity-30 flex-shrink-0 flex items-center justify-center"
                    >
                      {isAddingReflection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* EDIT */}
            {screen === 'edit' && (
              <motion.div key="edit" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">날짜 선택</p>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full bg-card border border-card-border rounded-2xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">감정 선택</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(EMOTIONS) as EmotionType[]).map(e => (
                      <button
                        key={e}
                        onClick={() => setEmotion(e)}
                        className={`flex flex-col items-center py-3 rounded-2xl border-2 text-xs font-bold transition-all ${emotion === e ? 'border-primary bg-primary/10 text-primary' : 'border-transparent bg-muted/60 text-muted-foreground'}`}
                      >
                        <span className="text-xl mb-1">{EMOTIONS[e].emoji}</span>{e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">짧은 기록</p>
                  <textarea
                    value={shortAnswer}
                    onChange={e => setShortAnswer(e.target.value)}
                    inputMode="text"
                    className="w-full bg-card border border-card-border rounded-2xl p-4 min-h-[90px] text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">더 남긴 이야기 (선택)</p>
                  <textarea
                    value={longAnswer}
                    onChange={e => setLongAnswer(e.target.value)}
                    placeholder="자유롭게 더 적어주세요"
                    inputMode="text"
                    className="w-full bg-card border border-card-border rounded-2xl p-4 min-h-[100px] text-foreground dark:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none text-sm placeholder:text-muted-foreground"
                  />
                </div>

                <div className="space-y-3">
                  <p className="text-xs font-bold text-muted-foreground tracking-widest uppercase">미디어 첨부</p>

                  <input type="file" accept="image/*" className="hidden" ref={fileRef} onChange={handlePhotoUpload} />
                  <input type="file" accept="audio/*" className="hidden" ref={audioRef} onChange={handleAudioUpload} />

                  {/* 사진 */}
                  {photo ? (
                    <div className="relative rounded-2xl overflow-hidden border border-border">
                      <img src={photo} alt="사진" className="w-full object-cover" />
                      <button onClick={() => setPhoto(undefined)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full"><X className="w-4 h-4" /></button>
                    </div>
                  ) : null}

                  {/* 음원 */}
                  {audio ? (
                    <div className="rounded-2xl border border-border p-3 bg-muted/40 flex items-center gap-2">
                      <audio controls src={audio} className="w-full" />
                      <button onClick={() => setAudio(undefined)} className="bg-black/10 hover:bg-black/20 dark:bg-white/10 text-foreground p-1.5 rounded-full flex-shrink-0 transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  ) : null}

                  {/* 미첨부 시 버튼 */}
                  {(!photo || !audio) && (
                    <div className="flex gap-2">
                      {!photo && (
                        <button
                          onClick={() => fileRef.current?.click()}
                          className="flex-1 py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground text-sm hover:bg-muted/30 transition-colors"
                        >
                          <Camera className="w-5 h-5" /> 사진 추가
                        </button>
                      )}
                      {!audio && (
                        <button
                          onClick={() => audioRef.current?.click()}
                          className="flex-1 py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground text-sm hover:bg-muted/30 transition-colors"
                        >
                          <Mic className="w-5 h-5" /> 음원 추가
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── ACTION BAR ─────────────────────────────────────────────────── */}
        {screen === 'view' && (
          <div className="flex gap-3 px-5 pt-4 pb-6 border-t border-border/30 flex-shrink-0">
            <button
              onClick={() => setScreen('edit')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-muted text-foreground font-bold text-sm"
            >
              <Pencil className="w-4 h-4" /> 수정하기
            </button>
            <button
              onClick={() => setScreen('confirm-delete')}
              className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-destructive/10 text-destructive font-bold text-sm"
            >
              <Trash2 className="w-4 h-4" /> 삭제
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
