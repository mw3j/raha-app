import React, { useState, useRef } from 'react';
import { useGetPosts } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Heart, Share2, Bookmark, BookOpen, Star, MessageCircle, Send, Trash2, ChevronDown, ChevronUp, PenSquare, ImagePlus, X } from 'lucide-react';
import { Input, Card } from '@/components/ui';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';

function getToken(): string { return localStorage.getItem('raha_token') || ''; }
function getLiked(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('raha_liked_posts') || '[]')); } catch { return new Set(); }
}
function getSaved(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('raha_saved_posts') || '[]')); } catch { return new Set(); }
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX_W = 1200, MAX_H = 900;
      let { width, height } = img;
      if (width > MAX_W || height > MAX_H) {
        const ratio = Math.min(MAX_W / width, MAX_H / height);
        width = Math.round(width * ratio); height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('فشل تحميل الصورة')); };
    img.src = url;
  });
}

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, '') + 'م';
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'ك';
  return String(n);
}

interface CommentType {
  id: number; content: string; userId: number;
  userName: string; userAvatar: string | null; createdAt: string;
}

function CommentsSection({ postId, currentUserId, onCountChange }: {
  postId: number; currentUserId?: number; onCountChange?: (count: number) => void;
}) {
  const [comments, setComments] = useState<CommentType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const [errMsg, setErrMsg] = useState('');

  const loadComments = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/posts/${postId}/comments`);
      const list = data.comments || [];
      setComments(list);
      setLoaded(true);
      onCountChange?.(list.length);
    } catch { } finally { setLoading(false); }
  };

  React.useEffect(() => { loadComments(); }, [postId]);

  const submit = async () => {
    if (!text.trim() || submitting) return;
    if (!getToken()) { setErrMsg('يجب تسجيل الدخول للتعليق'); return; }
    setSubmitting(true); setErrMsg('');
    try {
      const comment = await apiFetch(`/api/posts/${postId}/comments`, {
        method: 'POST', body: JSON.stringify({ content: text.trim() }),
      });
      const updated = [...comments, comment];
      setComments(updated); setText('');
      onCountChange?.(updated.length);
    } catch (e: any) {
      setErrMsg(e?.message || 'حدث خطأ، حاول مجدداً');
    } finally { setSubmitting(false); }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm('هل تريد حذف هذا التعليق؟')) return;
    try {
      await apiFetch(`/api/posts/${postId}/comments/${commentId}`, { method: 'DELETE' });
      const updated = comments.filter(c => c.id !== commentId);
      setComments(updated);
      onCountChange?.(updated.length);
    } catch { alert('فشل في حذف التعليق'); }
  };

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-3">
      {loading ? (
        <div className="flex justify-center py-3">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-xs text-muted-foreground py-2">كن أول من يعلّق 💬</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {comments.map(c => (
            <div key={c.id} className="flex gap-2 items-start">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {c.userName?.charAt(0) || '؟'}
              </div>
              <div className="flex-1 bg-secondary/50 rounded-xl px-3 py-2">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-bold">{c.userName}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: ar })}
                    </span>
                    {currentUserId === c.userId && (
                      <button onClick={() => deleteComment(c.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-relaxed" dir="rtl">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {errMsg && <p className="text-xs text-red-500 text-center">{errMsg}</p>}
      <div className="flex gap-2 items-center">
        <input
          value={text}
          onChange={e => { setText(e.target.value); setErrMsg(''); }}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder={getToken() ? 'أضف تعليقاً إسلامياً...' : 'سجّل دخولك للتعليق'}
          disabled={!getToken() || submitting}
          className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm outline-none border border-border/50 focus:border-primary transition-colors disabled:opacity-50"
          dir="rtl"
        />
        <motion.button whileTap={{ scale: 0.9 }} onClick={submit}
          disabled={!text.trim() || submitting || !getToken()}
          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40"
        >
          {submitting
            ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Send className="w-4 h-4" />}
        </motion.button>
      </div>
    </div>
  );
}

function CreatePostModal({ onClose, onCreated }: { onClose: () => void; onCreated: (post: any) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errMsg, setErrMsg] = useState('');
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErrMsg('يرجى اختيار صورة صحيحة'); return; }
    if (file.size > 10 * 1024 * 1024) { setErrMsg('حجم الصورة كبير جداً (10MB كحد أقصى)'); return; }
    setCompressing(true); setErrMsg('');
    try {
      const compressed = await compressImage(file);
      setImageData(compressed); setImagePreview(compressed);
    } catch { setErrMsg('فشل تحميل الصورة'); }
    finally { setCompressing(false); }
  };

  const submit = async () => {
    if (!title.trim() || !content.trim()) { setErrMsg('العنوان والمحتوى مطلوبان'); return; }
    setSubmitting(true); setErrMsg('');
    try {
      const post = await apiFetch('/api/posts', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim(), content: content.trim(), imageUrl: imageData }),
      });
      if (post.pendingReview) {
        alert('✅ تم إرسال منشورك للمراجعة وسيظهر بعد الموافقة عليه');
      }
      onCreated(post); onClose();
    } catch (e: any) {
      setErrMsg(e?.message || 'حدث خطأ، حاول مجدداً');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
        className="w-full max-w-lg bg-background rounded-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-5 border-b border-border/50 flex-shrink-0">
          <h2 className="text-lg font-bold">منشور جديد</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/70">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mx-5 mt-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 rounded-xl px-4 py-2.5 flex-shrink-0">
          <p className="text-xs text-emerald-700 dark:text-emerald-400 text-center font-medium">
            🕌 المنشورات للمحتوى الإسلامي فقط — يُمنع المحتوى غير اللائق
          </p>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="text-sm font-bold mb-1.5 block" dir="rtl">العنوان *</label>
            <input value={title} onChange={e => { setTitle(e.target.value); setErrMsg(''); }}
              placeholder="عنوان المنشور..." maxLength={200}
              className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary transition-colors"
              dir="rtl" />
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block" dir="rtl">المحتوى *</label>
            <textarea value={content} onChange={e => { setContent(e.target.value); setErrMsg(''); }}
              placeholder="اكتب منشورك الإسلامي هنا..." rows={5} maxLength={5000}
              className="w-full bg-secondary/50 rounded-xl px-4 py-3 text-sm outline-none border border-border/50 focus:border-primary transition-colors resize-none"
              dir="rtl" />
            <p className="text-xs text-muted-foreground text-left mt-1">{content.length}/5000</p>
          </div>
          <div>
            <label className="text-sm font-bold mb-1.5 block" dir="rtl">صورة (اختياري)</label>
            {imagePreview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={imagePreview} alt="preview" className="w-full max-h-60 object-cover" />
                <button onClick={() => { setImageData(null); setImagePreview(null); if (fileRef.current) fileRef.current.value = ''; }}
                  className="absolute top-2 left-2 w-7 h-7 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={compressing}
                className="w-full h-32 rounded-xl border-2 border-dashed border-border/60 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                {compressing
                  ? <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  : (<><ImagePlus className="w-7 h-7" /><span className="text-sm font-medium">انقر لإضافة صورة</span><span className="text-xs opacity-60">JPG, PNG, WebP — حتى 10MB</span></>)}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>
          {errMsg && (
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/30 rounded-xl px-4 py-3">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{errMsg}</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border/50 flex-shrink-0">
          <button onClick={submit} disabled={submitting || !title.trim() || !content.trim()}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-bold text-base disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Send className="w-5 h-5" />نشر المنشور</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const DAILY_VERSES = [
  { arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا', surah: 'الشرح: ٦', meaning: 'إن مع كل شدة فرجاً' },
  { arabic: 'وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ', surah: 'البقرة: ٢١٦', meaning: 'ربما تكره شيئاً وفيه خيرٌ لك' },
  { arabic: 'فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ', surah: 'التوبة: ١٢٠', meaning: 'الله لا يضيع أجر المحسنين' },
  { arabic: 'وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا', surah: 'الطلاق: ٢', meaning: 'تقوى الله تفتح أبواب الفرج' },
  { arabic: 'وَتَوَكَّلْ عَلَى اللَّهِ ۚ وَكَفَىٰ بِاللَّهِ وَكِيلًا', surah: 'النساء: ٨١', meaning: 'توكّل على الله فهو حسبك' },
  { arabic: 'وَلَذِكْرُ اللَّهِ أَكْبَرُ', surah: 'العنكبوت: ٤٥', meaning: 'ذكر الله أعظم العبادات' },
  { arabic: 'رَبِّ زِدْنِي عِلْمًا', surah: 'طه: ١١٤', meaning: 'اطلب من الله دائماً المزيد من العلم' },
];
const GREETINGS_BY_HOUR = [
  { range: [5, 12], text: 'صباح الخير', sub: 'أسعد الله صباحكم بالخير والبركة' },
  { range: [12, 17], text: 'مرحباً بك', sub: 'نسأل الله أن يبارك يومك' },
  { range: [17, 20], text: 'مساء الخير', sub: 'طاب مساؤكم بالطاعة والذكر' },
  { range: [20, 24], text: 'ليلة مباركة', sub: 'تقبّل الله منّا ومنكم صالح الأعمال' },
  { range: [0, 5], text: 'الليل جُنَّة العابدين', sub: 'ما أجمل الوقوف بين يدي الله في الأسحار' },
];
function getGreeting() {
  const h = new Date().getHours();
  return GREETINGS_BY_HOUR.find(g => h >= g.range[0] && h < g.range[1]) || GREETINGS_BY_HOUR[1];
}
function getDailyVerse() { return DAILY_VERSES[new Date().getDate() % DAILY_VERSES.length]; }

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [liked, setLiked] = useState<Set<string>>(getLiked);
  const [saved, setSaved] = useState<Set<string>>(getSaved);
  const [toast, setToast] = useState<{ msg: string; id: number } | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [localPosts, setLocalPosts] = useState<any[]>([]);
  // optimistic counters: pid → {likes, saves, shares, comments}
  const [counters, setCounters] = useState<Record<string, { likes?: number; saves?: number; shares?: number; comments?: number }>>({});
  const { user } = useAuth();

  const { data, isLoading, refetch } = useGetPosts({ page: 1, limit: 20 });

  const showToast = (msg: string) => {
    const id = Date.now();
    setToast({ msg, id });
    setTimeout(() => setToast(t => t?.id === id ? null : t), 2000);
  };

  const getCount = (pid: string, field: 'likes' | 'saves' | 'shares' | 'comments', post: any) => {
    if (counters[pid]?.[field] !== undefined) return counters[pid][field]!;
    if (field === 'likes') return post.likesCount ?? 0;
    if (field === 'saves') return post.savesCount ?? 0;
    if (field === 'shares') return post.sharesCount ?? 0;
    if (field === 'comments') return post.commentsCount ?? 0;
    return 0;
  };

  const patchCounter = (pid: string, field: 'likes' | 'saves' | 'shares' | 'comments', val: number) => {
    setCounters(prev => ({ ...prev, [pid]: { ...prev[pid], [field]: val } }));
  };

  const toggleLike = async (postId: string) => {
    const isLiked = liked.has(postId);
    const next = new Set(liked);
    const post = posts.find(p => String(p.id) === postId);
    const curLikes = getCount(postId, 'likes', post);

    // optimistic
    if (isLiked) { next.delete(postId); patchCounter(postId, 'likes', Math.max(0, curLikes - 1)); showToast('تم إلغاء الإعجاب'); }
    else { next.add(postId); patchCounter(postId, 'likes', curLikes + 1); showToast('❤️ تم الإعجاب'); }
    setLiked(next);
    localStorage.setItem('raha_liked_posts', JSON.stringify([...next]));

    if (getToken()) {
      try {
        const res = await apiFetch(`/api/posts/${postId}/like`, {
          method: 'POST',
          body: JSON.stringify({ action: isLiked ? 'unlike' : 'like' }),
        });
        patchCounter(postId, 'likes', res.likesCount);
      } catch { /* keep optimistic */ }
    }
  };

  const toggleSave = async (postId: string) => {
    const isSaved = saved.has(postId);
    const next = new Set(saved);
    const post = posts.find(p => String(p.id) === postId);
    const curSaves = getCount(postId, 'saves', post);

    if (isSaved) { next.delete(postId); patchCounter(postId, 'saves', Math.max(0, curSaves - 1)); showToast('تم إزالة الحفظ'); }
    else { next.add(postId); patchCounter(postId, 'saves', curSaves + 1); showToast('🔖 تم الحفظ'); }
    setSaved(next);
    localStorage.setItem('raha_saved_posts', JSON.stringify([...next]));
    window.dispatchEvent(new Event('raha_saved_changed'));

    if (getToken()) {
      try {
        const res = await apiFetch(`/api/posts/${postId}/save`, {
          method: 'POST',
          body: JSON.stringify({ action: isSaved ? 'unsave' : 'save' }),
        });
        patchCounter(postId, 'saves', res.savesCount);
      } catch { /* keep optimistic */ }
    }
  };

  const sharePost = async (postId: string, title: string, content: string) => {
    const post = posts.find(p => String(p.id) === postId);
    const curShares = getCount(postId, 'shares', post);
    patchCounter(postId, 'shares', curShares + 1);

    if (navigator.share) {
      await navigator.share({ title, text: content.slice(0, 200), url: window.location.href });
    } else {
      await navigator.clipboard.writeText(`${title}\n${content.slice(0, 200)}`);
      showToast('📋 تم نسخ المنشور');
    }

    try {
      const res = await apiFetch(`/api/posts/${postId}/share`, { method: 'POST' });
      patchCounter(postId, 'shares', res.sharesCount);
    } catch { /* keep optimistic */ }
  };

  const toggleComments = (postId: string) => {
    const next = new Set(openComments);
    if (next.has(postId)) next.delete(postId); else next.add(postId);
    setOpenComments(next);
  };

  const deletePost = async (postId: number) => {
    if (!confirm('هل تريد حذف هذا المنشور؟')) return;
    try {
      await apiFetch(`/api/posts/${postId}`, { method: 'DELETE' });
      setLocalPosts(prev => prev.filter(p => p.id !== postId));
      refetch();
      showToast('تم حذف المنشور');
    } catch { showToast('فشل في حذف المنشور'); }
  };

  const handlePostCreated = (post: any) => {
    if (!post.pendingReview) setLocalPosts(prev => [post, ...prev]);
    refetch();
  };

  const posts = [
    ...localPosts,
    ...(data?.posts?.filter(p => !localPosts.find(lp => lp.id === p.id)) || []),
  ].filter(post => {
    return !searchQuery || post.title.includes(searchQuery) || post.content.includes(searchQuery);
  });

  const greeting = getGreeting();
  const verse = getDailyVerse();
  const today = format(new Date(), 'EEEE، d MMMM yyyy', { locale: ar });

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id}
            initial={{ opacity: 0, y: 40, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-24 left-1/2 z-50 bg-foreground text-background text-sm font-bold px-5 py-2.5 rounded-2xl shadow-xl pointer-events-none"
          >{toast.msg}</motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Modal */}
      <AnimatePresence>
        {showCreate && <CreatePostModal onClose={() => setShowCreate(false)} onCreated={handlePostCreated} />}
      </AnimatePresence>

      {/* FAB — Floating Action Button */}
      <AnimatePresence>
        {user && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.88 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => setShowCreate(true)}
            className="fixed bottom-[84px] left-5 z-40 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-2xl shadow-primary/40 flex items-center justify-center"
            title="إنشاء منشور جديد"
          >
            <PenSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative -mx-2 mt-2 overflow-hidden">
        <div className="bg-gradient-to-br from-primary via-emerald-700 to-teal-800 rounded-[2rem] p-6 text-white shadow-xl shadow-primary/30">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-emerald-200 text-xs font-medium mb-1">{today}</p>
                <h2 className="text-2xl font-bold">{greeting.text}</h2>
                {user && <p className="text-emerald-200 text-sm mt-0.5">{user.name} 👋</p>}
              </div>
              <div className="w-12 h-12 bg-white/15 rounded-2xl flex items-center justify-center text-2xl backdrop-blur-sm">🌙</div>
            </div>
            <p className="text-emerald-100 text-sm">{greeting.sub}</p>
          </div>
        </div>
      </motion.div>

      {/* Daily Verse */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
        className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/20 border border-amber-200/60 dark:border-amber-800/30 rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold text-amber-700 dark:text-amber-400">آية اليوم</span>
        </div>
        <p className="font-quran text-2xl leading-[2] text-center mb-3" dir="rtl">{verse.arabic}</p>
        <div className="flex items-center justify-between">
          <span className="text-xs text-amber-600 dark:text-amber-500 font-medium">{verse.surah}</span>
          <span className="text-xs text-muted-foreground">{verse.meaning}</span>
        </div>
      </motion.div>

      {/* Search Bar */}
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur-sm py-2 -mx-4 px-4 space-y-2">
        <div className="relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input placeholder="ابحث عن المنشورات..." className="pr-12 bg-secondary/50 border-none shadow-inner"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>🕌</span><span>المجتمع الإسلامي — للمحتوى الديني فقط</span>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-5 pb-24">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => <div key={i} className="h-52 bg-secondary/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-bold">لا توجد منشورات بعد</p>
            <p className="text-sm mt-1 opacity-70">كن أول من ينشر محتوى إسلامياً</p>
            {user && (
              <button onClick={() => setShowCreate(true)}
                className="mt-4 bg-primary text-primary-foreground rounded-2xl px-6 py-2.5 font-bold text-sm">
                إنشاء منشور
              </button>
            )}
          </div>
        ) : posts.map((post, i) => {
          const pid = String(post.id);
          const isCommentsOpen = openComments.has(pid);
          const isAuthor = user?.id === post.authorId;
          const likesC = getCount(pid, 'likes', post);
          const savesC = getCount(pid, 'saves', post);
          const sharesC = getCount(pid, 'shares', post);
          const commentsC = getCount(pid, 'comments', post);

          return (
            <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Card className="overflow-hidden hover:shadow-xl transition-shadow border-none bg-card shadow-md">
                {post.imageUrl && (
                  <div className="w-full max-h-72 overflow-hidden">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
                <div className="p-5">
                  {/* Author + delete */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/20 to-emerald-400/20 flex items-center justify-center text-primary font-bold">
                        {post.authorName?.charAt(0) || '؟'}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm">{post.authorName}</h4>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(post.createdAt), 'd MMM yyyy', { locale: ar })}
                        </span>
                      </div>
                    </div>
                    {isAuthor && (
                      <button onClick={() => deletePost(post.id)} className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-bold mb-2 leading-snug">{post.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">{post.content}</p>

                  {/* Action buttons with counters */}
                  <div className="flex items-center gap-1 pt-3 border-t border-border/50">
                    {/* Like */}
                    <motion.button whileTap={{ scale: 0.82 }} onClick={() => toggleLike(pid)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${liked.has(pid) ? 'text-red-500 bg-red-50 dark:bg-red-950/30' : 'text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${liked.has(pid) ? 'fill-red-500' : ''}`} />
                      <span>{fmt(likesC)}</span>
                    </motion.button>

                    {/* Comments */}
                    <motion.button whileTap={{ scale: 0.82 }} onClick={() => toggleComments(pid)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${isCommentsOpen ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      <MessageCircle className={`w-3.5 h-3.5 ${isCommentsOpen ? 'fill-primary/20' : ''}`} />
                      <span>{fmt(commentsC)}</span>
                      {isCommentsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </motion.button>

                    {/* Share */}
                    <motion.button whileTap={{ scale: 0.82 }} onClick={() => sharePost(pid, post.title, post.content)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-secondary/80 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{fmt(sharesC)}</span>
                    </motion.button>

                    {/* Save */}
                    <motion.button whileTap={{ scale: 0.82 }} onClick={() => toggleSave(pid)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors mr-auto ${saved.has(pid) ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-muted-foreground hover:bg-secondary/80'}`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${saved.has(pid) ? 'fill-amber-500' : ''}`} />
                      <span>{fmt(savesC)}</span>
                    </motion.button>
                  </div>

                  {/* Comments Section */}
                  <AnimatePresence>
                    {isCommentsOpen && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                        <CommentsSection
                          postId={post.id}
                          currentUserId={user?.id}
                          onCountChange={count => patchCounter(pid, 'comments', count)}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
