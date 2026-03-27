import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, Search, X } from 'lucide-react';
import { quranStories, storyCategories, type QuranStory } from '@/data/stories';
import { cn } from '@/lib/utils';

export default function StoriesPage() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selected, setSelected] = useState<QuranStory | null>(null);

  const filtered = useMemo(() =>
    quranStories.filter(s => {
      const matchCat = activeCategory === 'all' || s.category === activeCategory;
      const matchSearch = !search || s.title.includes(search) || s.summary.includes(search);
      return matchCat && matchSearch;
    }), [search, activeCategory]);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">قصص القرآن</h1>
          <p className="text-xs text-muted-foreground">قصص الأنبياء والأمم من القرآن الكريم</p>
        </div>
      </div>

      <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-4 text-center">
        <p className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed">
          «نَحْنُ نَقُصُّ عَلَيْكَ أَحْسَنَ الْقَصَصِ» — سورة يوسف: 3
        </p>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ابحث في القصص..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pr-10 pl-4 py-3 rounded-xl border border-border bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {storyCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeCategory === cat.id
                ? 'bg-orange-600 text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((story) => (
          <button
            key={story.id}
            onClick={() => setSelected(story)}
            className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center shadow flex-shrink-0">
                <span className="text-2xl">{story.icon}</span>
              </div>
              <div className="flex-1 text-right">
                <h3 className="font-bold text-sm">{story.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{story.summary}</p>
              </div>
            </div>
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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-orange-400 to-amber-500 flex items-center justify-center shadow">
                  <span className="text-2xl">{selected.icon}</span>
                </div>
                <h2 className="font-bold text-lg">{selected.title}</h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{selected.summary}</p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">أحداث القصة</p>
                {selected.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-500 flex-shrink-0 mt-0.5">◆</span>
                    <span className="text-foreground/80">{d}</span>
                  </div>
                ))}
              </div>

              {selected.verses.length > 0 && (
                <div className="rounded-2xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 p-3 space-y-2">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-300">📖 من القرآن الكريم</p>
                  {selected.verses.map((v, i) => (
                    <p key={i} className="text-sm text-foreground/80 leading-relaxed">{v}</p>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">الدروس والعبر</p>
                {selected.lessons.map((l, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-500 flex-shrink-0">💡</span>
                    <span className="text-foreground/80">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
