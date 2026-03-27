import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Search, X } from 'lucide-react';
import { hadiths, hadithCategories, type Hadith } from '@/data/hadith';
import { cn } from '@/lib/utils';

export default function HadithPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState<Hadith | null>(null);

  const filtered = useMemo(() =>
    hadiths.filter(h => {
      const matchCat = activeCategory === 'all' || h.category === activeCategory;
      const matchSearch = !search || h.text.includes(search) || h.narrator.includes(search) || h.source.includes(search);
      return matchCat && matchSearch;
    }), [search, activeCategory]);

  const gradeColor = (grade: string) => {
    if (grade === 'صحيح') return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (grade === 'حسن') return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400';
    return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">الأحاديث النبوية</h1>
          <p className="text-xs text-muted-foreground">أحاديث مختارة من السنة الشريفة</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث في الأحاديث..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {hadithCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} حديث</p>

      <div className="space-y-3">
        {filtered.map((hadith) => (
          <button
            key={hadith.id}
            onClick={() => setSelected(hadith)}
            className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn('text-xs px-2 py-0.5 rounded-lg font-semibold', gradeColor(hadith.grade))}>
                {hadith.grade}
              </span>
              <span className="text-xs text-muted-foreground">{hadith.source}</span>
            </div>
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">«{hadith.text}»</p>
            <p className="text-xs text-muted-foreground mt-2">— {hadith.narrator}</p>
          </button>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-background rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed header */}
            <div className="flex-shrink-0 relative flex justify-center items-center pt-4 pb-2 px-6 border-b border-border/30">
              <div className="w-12 h-1 rounded-full bg-muted" />
              <button onClick={() => setSelected(null)} className="absolute left-4 top-3 p-2 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-8 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className={cn('text-xs px-3 py-1 rounded-lg font-semibold', gradeColor(selected.grade))}>
                  {selected.grade}
                </span>
                <span className="text-xs text-muted-foreground">{selected.source}</span>
              </div>

              <div className="rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-4">
                <p className="text-base font-semibold leading-relaxed text-foreground">«{selected.text}»</p>
                <p className="text-sm text-muted-foreground mt-2">رواه: {selected.narrator}</p>
              </div>

              {selected.explanation && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">الشرح</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selected.explanation}</p>
                </div>
              )}

              {selected.benefits && selected.benefits.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">الفوائد</p>
                  {selected.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-500 flex-shrink-0">◆</span>
                      <span className="text-foreground/80">{b}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
