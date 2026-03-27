import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Search, X } from 'lucide-react';
import { names99, nameCategories } from '@/data/names99';
import { cn } from '@/lib/utils';

export default function NamesPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<typeof names99[0] | null>(null);

  const filtered = useMemo(() =>
    names99.filter(n =>
      n.arabic.includes(search) ||
      n.meaning.includes(search) ||
      n.description.includes(search)
    ), [search]);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">أسماء الله الحسنى</h1>
          <p className="text-xs text-muted-foreground">99 اسماً من أسماء الله العظيمة</p>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 text-center">
        <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
          «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مَنْ أَحْصَاهَا دَخَلَ الجَنَّةَ» — متفق عليه
        </p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث عن اسم..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        {filtered.map((name) => (
          <button
            key={name.number}
            onClick={() => setSelected(name)}
            className="rounded-2xl bg-card border border-border p-3 text-center hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
          >
            <div className="text-xs text-muted-foreground font-mono mb-1">{name.number}</div>
            <div className="font-bold text-sm text-foreground">{name.arabic}</div>
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
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <span className="text-xs font-bold text-white">{selected.number}</span>
                </div>
                <h2 className="text-4xl font-bold text-amber-600 dark:text-amber-400 mb-1">{selected.arabic}</h2>
                <p className="text-sm text-muted-foreground">{selected.transliteration}</p>
              </div>

              <div className="rounded-2xl bg-secondary p-4 space-y-2">
                <p className="font-semibold text-sm text-foreground">{selected.meaning}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>
              </div>

              {selected.verse && (
                <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">📖 من القرآن</p>
                  <p className="text-sm text-foreground/80">{selected.verse}</p>
                </div>
              )}

              {selected.dua && (
                <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3">
                  <p className="text-xs font-semibold text-primary mb-1">🤲 دعاء</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selected.dua}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
