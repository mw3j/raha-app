import React, { useState, useEffect } from 'react';
import { useGetPosts } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Bookmark, BookOpen, Heart, Share2, Trash2 } from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function getSavedIds(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem('raha_saved_posts') || '[]')); } catch { return new Set(); }
}

export default function Favorites() {
  const [savedIds, setSavedIds] = useState<Set<string>>(getSavedIds);
  const { data, isLoading } = useGetPosts({ page: 1, limit: 50 });

  useEffect(() => {
    const sync = () => setSavedIds(getSavedIds());
    window.addEventListener('raha_saved_changed', sync);
    return () => window.removeEventListener('raha_saved_changed', sync);
  }, []);

  const saved = (data?.posts || []).filter(p => savedIds.has(String(p.id)));

  const removeSaved = (id: string) => {
    const next = new Set(savedIds);
    next.delete(id);
    setSavedIds(next);
    localStorage.setItem('raha_saved_posts', JSON.stringify([...next]));
    window.dispatchEvent(new Event('raha_saved_changed'));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">المفضلة</h1>
          <p className="text-xs text-muted-foreground">{saved.length} منشور محفوظ</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-secondary/50 rounded-2xl animate-pulse" />)}
        </div>
      ) : saved.length === 0 ? (
        <div className="text-center py-24 text-muted-foreground">
          <Bookmark className="w-16 h-16 mx-auto mb-4 opacity-10" />
          <h3 className="text-lg font-bold mb-2">لا توجد منشورات محفوظة</h3>
          <p className="text-sm opacity-70">اضغط على أيقونة الحفظ في أي منشور لإضافته هنا</p>
        </div>
      ) : (
        <div className="space-y-4">
          {saved.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="overflow-hidden shadow-md border-none">
                {post.imageUrl && (
                  <div className="w-full h-44 overflow-hidden">
                    <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {post.authorName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{post.authorName}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(post.createdAt), 'd MMM yyyy', { locale: ar })}</p>
                      </div>
                    </div>
                    <Badge variant="gold">{post.category}</Badge>
                  </div>
                  <h3 className="font-bold mb-1">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.content}</p>
                  <div className="flex items-center gap-3 pt-2 border-t border-border/50">
                    <button
                      onClick={() => removeSaved(String(post.id))}
                      className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> إزالة
                    </button>
                    <button
                      onClick={() => {
                        if (navigator.share) navigator.share({ title: post.title, text: post.content });
                      }}
                      className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mr-auto"
                    >
                      <Share2 className="w-4 h-4" /> مشاركة
                    </button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
