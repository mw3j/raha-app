import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, X } from 'lucide-react';
import { islamPillars, imanPillars, ihsanContent } from '@/data/pillars';
import { cn } from '@/lib/utils';

type PillarItem = typeof islamPillars[0];

export default function PillarsPage() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<'islam' | 'iman' | 'ihsan'>('islam');
  const [selected, setSelected] = useState<PillarItem | null>(null);

  const tabs = [
    { id: 'islam' as const, label: 'أركان الإسلام', count: 5 },
    { id: 'iman' as const, label: 'أركان الإيمان', count: 6 },
    { id: 'ihsan' as const, label: 'الإحسان', count: 1 },
  ];

  const currentItems = activeTab === 'islam' ? islamPillars : activeTab === 'iman' ? imanPillars : [ihsanContent];

  return (
    <div className="space-y-4 py-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">الأركان الإسلامية</h1>
          <p className="text-xs text-muted-foreground">أركان الإسلام والإيمان والإحسان</p>
        </div>
      </div>

      {/* Intro */}
      <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
        <p className="text-sm text-emerald-800 dark:text-emerald-200 text-center leading-relaxed">
          قال النبي ﷺ: «بُني الإسلام على خمس» — وهذه هي الأسس التي يقوم عليها الدين الإسلامي
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
            <span className="mr-1 text-xs opacity-70">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="space-y-3">
        {currentItems.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setSelected(item)}
            className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow flex-shrink-0">
                <span className="text-2xl">{item.icon}</span>
              </div>
              <div className="flex-1 text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-mono">0{idx + 1}</span>
                  <h3 className="font-bold text-base">{item.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

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
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow flex-shrink-0">
                  <span className="text-3xl">{selected.icon}</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">{selected.title}</h2>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">التفاصيل</p>
                {selected.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0">◆</span>
                    <span className="text-foreground/80">{detail}</span>
                  </div>
                ))}
              </div>

              {selected.hadith && (
                <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4">
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 mb-2">📿 الحديث الشريف</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selected.hadith}</p>
                  {selected.hadithSource && (
                    <p className="text-xs text-muted-foreground mt-2">— {selected.hadithSource}</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
