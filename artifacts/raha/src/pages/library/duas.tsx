import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Search, X, Copy, Check } from 'lucide-react';
import { duas, duaCategories, type Dua } from '@/data/duas';
import { cn } from '@/lib/utils';

export default function DuasPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState<Dua | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = useMemo(() =>
    duas.filter(d => {
      const matchCat = activeCategory === 'all' || d.category === activeCategory;
      const matchSearch = !search || d.title.includes(search) || d.arabic.includes(search) || d.meaning.includes(search);
      return matchCat && matchSearch;
    }), [search, activeCategory]);

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">الأدعية الشاملة</h1>
          <p className="text-xs text-muted-foreground">أدعية لكل الأوقات والمناسبات</p>
        </div>
      </div>

      <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-4 text-center">
        <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed">
          «ادْعُوا رَبَّكُمْ تَضَرُّعًا وَخُفْيَةً» — الأعراف: 55
        </p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث في الأدعية..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {duaCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeCategory === cat.id
                ? 'bg-violet-600 text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((dua) => (
          <button
            key={dua.id}
            onClick={() => setSelected(dua)}
            className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{dua.source}</span>
              <div className="flex items-center gap-1">
                {dua.icon && <span className="text-sm">{dua.icon}</span>}
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">{dua.title}</span>
              </div>
            </div>
            <p className="text-base font-semibold text-foreground leading-relaxed line-clamp-2">{dua.arabic}</p>
            {dua.timing && (
              <p className="text-xs text-muted-foreground mt-1.5">⏱ {dua.timing}</p>
            )}
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
                <button
                  onClick={() => handleCopy(selected.arabic)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'تم النسخ' : 'نسخ'}
                </button>
                <h3 className="font-bold text-base">{selected.title}</h3>
              </div>

              <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 p-4 text-center">
                <p className="text-base font-semibold leading-relaxed text-foreground">{selected.arabic}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">المعنى</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{selected.meaning}</p>
              </div>

              {selected.timing && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>⏱</span>
                  <span>{selected.timing}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>📚</span>
                <span>{selected.source}</span>
              </div>

              {selected.benefits && selected.benefits.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">الفوائد</p>
                  {selected.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-violet-500 flex-shrink-0">✦</span>
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
