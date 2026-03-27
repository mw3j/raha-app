import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Search, X } from 'lucide-react';
import { tafsirEntries, tafsirScholars, tafsirCategories, type TafsirEntry } from '@/data/tafsir';
import { cn } from '@/lib/utils';

export default function TafsirPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeView, setActiveView] = useState<'verses' | 'scholars'>('verses');
  const [selected, setSelected] = useState<TafsirEntry | null>(null);

  const filtered = useMemo(() =>
    tafsirEntries.filter(t => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory;
      const matchSearch = !search || t.surahName.includes(search) || t.verseText.includes(search) || t.shortTafsir.includes(search);
      return matchCat && matchSearch;
    }), [search, activeCategory]);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">التفسير</h1>
          <p className="text-xs text-muted-foreground">تفسير آيات القرآن الكريم</p>
        </div>
      </div>

      <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 p-4 text-center">
        <p className="text-sm text-cyan-800 dark:text-cyan-200 leading-relaxed">
          «كِتَابٌ أَنزَلْنَاهُ إِلَيْكَ مُبَارَكٌ لِّيَدَّبَّرُوا آيَاتِهِ» — ص: 29
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('verses')}
          className={cn('flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors', activeView === 'verses' ? 'bg-cyan-600 text-white' : 'bg-secondary text-muted-foreground')}
        >
          📖 الآيات والتفسير
        </button>
        <button
          onClick={() => setActiveView('scholars')}
          className={cn('flex-1 py-2 px-4 rounded-xl text-sm font-semibold transition-colors', activeView === 'scholars' ? 'bg-cyan-600 text-white' : 'bg-secondary text-muted-foreground')}
        >
          👤 المفسرون
        </button>
      </div>

      {activeView === 'verses' && (
        <>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث في الآيات..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir="rtl"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {tafsirCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  activeCategory === cat.id ? 'bg-cyan-600 text-white shadow' : 'bg-secondary text-muted-foreground'
                )}
              >
                <span>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {filtered.map((entry) => (
              <button
                key={entry.id}
                onClick={() => setSelected(entry)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-lg font-semibold', entry.type === 'makki' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' : 'text-blue-700 bg-blue-100 dark:bg-blue-900/30')}>
                    {entry.type === 'makki' ? 'مكية' : 'مدنية'}
                  </span>
                  <span className="font-semibold text-sm text-cyan-600 dark:text-cyan-400">
                    {entry.surahName} — {entry.verseNumber}
                  </span>
                </div>
                <p className="text-base leading-relaxed text-foreground font-semibold line-clamp-2">{entry.verseText}</p>
                <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{entry.shortTafsir}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {activeView === 'scholars' && (
        <div className="space-y-3">
          {tafsirScholars.map((scholar) => (
            <div key={scholar.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center shadow">
                  <span className="text-xl">👤</span>
                </div>
                <div>
                  <h3 className="font-bold text-base">{scholar.name}</h3>
                  <p className="text-xs text-muted-foreground">توفي {scholar.died}</p>
                </div>
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-2">{scholar.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 px-2 py-0.5 rounded-lg font-semibold">{scholar.method}</span>
                <span className="text-xs text-muted-foreground">📚 {scholar.bookName}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
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
              <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-400">{selected.surahName} — الآية {selected.verseNumber}</p>
              <span className={cn('text-xs px-2 py-0.5 rounded-lg font-semibold mt-1 inline-block', selected.type === 'makki' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' : 'text-blue-700 bg-blue-100 dark:bg-blue-900/30')}>
                {selected.type === 'makki' ? 'مكية' : 'مدنية'}
              </span>
            </div>

            <div className="rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800 p-4 text-center">
              <p className="text-lg font-semibold leading-relaxed">{selected.verseText}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">التفسير المختصر</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{selected.shortTafsir}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">التفسير التفصيلي</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{selected.fullTafsir}</p>
            </div>

            {selected.benefits.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">الفوائد</p>
                {selected.benefits.map((b, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-cyan-500 flex-shrink-0">◆</span>
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
