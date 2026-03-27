import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import { madhabs, fiqhChapters, type Madhab } from '@/data/fiqh';
import { cn } from '@/lib/utils';

type TabType = 'madhabs' | 'chapters' | 'contemporary';

export default function FiqhPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('madhabs');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedMadhab, setSelectedMadhab] = useState<Madhab | null>(null);
  const [activeChapter, setActiveChapter] = useState(fiqhChapters[0].id);

  const currentChapter = fiqhChapters.find(c => c.id === activeChapter);

  const madhabColors: Record<string, string> = {
    hanafi: 'from-blue-500 to-indigo-600',
    maliki: 'from-emerald-500 to-teal-600',
    shafi: 'from-amber-500 to-orange-600',
    hanbali: 'from-green-500 to-emerald-600',
  };

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">الفقه الإسلامي</h1>
          <p className="text-xs text-muted-foreground">المذاهب الفقهية وأبواب الفقه</p>
        </div>
      </div>

      <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 p-4 text-center">
        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          «وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ» — البينة: 5
        </p>
      </div>

      {/* Tab Selector */}
      <div className="flex gap-2">
        {[
          { id: 'madhabs' as TabType, label: 'المذاهب', icon: '🏛️' },
          { id: 'chapters' as TabType, label: 'أبواب الفقه', icon: '📚' },
          { id: 'contemporary' as TabType, label: 'مسائل معاصرة', icon: '💻' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setExpanded(null); }}
            className={cn(
              'flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-xs font-semibold transition-colors',
              activeTab === tab.id
                ? 'bg-slate-700 text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span className="text-base mb-0.5">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Madhabs Tab */}
      {activeTab === 'madhabs' && (
        <div className="space-y-3">
          {madhabs.map((madhab) => (
            <button
              key={madhab.id}
              onClick={() => setSelectedMadhab(madhab)}
              className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-slate-400 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn('w-12 h-12 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow flex-shrink-0', madhabColors[madhab.id])}>
                  <span className="text-2xl">{madhab.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-base">المذهب {madhab.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{madhab.founder}</p>
                  <p className="text-xs text-muted-foreground">{madhab.region}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Chapters Tab */}
      {activeTab === 'chapters' && (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fiqhChapters.filter(c => c.id !== 'contemporary').map((chapter) => (
              <button
                key={chapter.id}
                onClick={() => { setActiveChapter(chapter.id); setExpanded(null); }}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
                  activeChapter === chapter.id
                    ? 'bg-slate-700 text-white shadow'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                <span>{chapter.icon}</span>
                {chapter.title}
              </button>
            ))}
          </div>

          {currentChapter && (
            <div className="space-y-3">
              {currentChapter.topics.map((topic) => (
                <div key={topic.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <button
                    className="w-full p-4 flex items-center justify-between text-right"
                    onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
                  >
                    <div className="flex items-center gap-2">
                      {expanded === topic.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 text-right">
                      <h3 className="font-bold text-sm">{topic.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{topic.description}</p>
                    </div>
                  </button>
                  {expanded === topic.id && (
                    <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                      {topic.rulings.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-slate-500 flex-shrink-0">•</span>
                          <span className="text-foreground/80">{r}</span>
                        </div>
                      ))}
                      {topic.evidence && (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-950/30 p-3 mt-2">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">📖 الدليل</p>
                          <p className="text-sm text-foreground/70">{topic.evidence}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Contemporary Tab */}
      {activeTab === 'contemporary' && (
        <div className="space-y-3">
          {fiqhChapters.find(c => c.id === 'contemporary')?.topics.map((topic) => (
            <div key={topic.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button
                className="w-full p-4 flex items-center justify-between text-right"
                onClick={() => setExpanded(expanded === topic.id ? null : topic.id)}
              >
                <div className="flex items-center gap-2">
                  {expanded === topic.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 text-right">
                  <h3 className="font-bold text-sm">{topic.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{topic.description}</p>
                </div>
              </button>
              {expanded === topic.id && (
                <div className="px-4 pb-4 border-t border-border pt-3 space-y-2">
                  {topic.rulings.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-slate-500 flex-shrink-0">•</span>
                      <span className="text-foreground/80">{r}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Madhab Detail Modal */}
      {selectedMadhab && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedMadhab(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md bg-background rounded-t-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Fixed header */}
            <div className="flex-shrink-0 relative flex justify-center items-center pt-4 pb-2 px-6 border-b border-border/30">
              <div className="w-12 h-1 rounded-full bg-muted" />
              <button onClick={() => setSelectedMadhab(null)} className="absolute left-4 top-3 p-2 rounded-xl hover:bg-secondary">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 pb-8 pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn('w-14 h-14 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow', madhabColors[selectedMadhab.id])}>
                  <span className="text-3xl">{selectedMadhab.icon}</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">المذهب {selectedMadhab.name}</h2>
                  <p className="text-xs text-muted-foreground">{selectedMadhab.founder}</p>
                  <p className="text-xs text-muted-foreground">توفي {selectedMadhab.died}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/30 p-3 text-sm text-foreground/80 leading-relaxed">
                {selectedMadhab.description}
              </div>

              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">الانتشار: {selectedMadhab.region}</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">المميزات</p>
                {selectedMadhab.characteristics.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-slate-500 flex-shrink-0">◆</span>
                    <span className="text-foreground/80">{c}</span>
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
