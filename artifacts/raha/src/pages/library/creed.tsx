import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, X } from 'lucide-react';
import { creedSections, type CreedTopic } from '@/data/creed';
import { cn } from '@/lib/utils';

const sectionColors: Record<string, string> = {
  tawheed: 'from-indigo-400 to-violet-500',
  prophethood: 'from-emerald-400 to-teal-500',
  afterlife: 'from-amber-400 to-orange-500',
  pillars: 'from-blue-400 to-cyan-500',
  innovations: 'from-red-400 to-rose-500',
};

export default function CreedPage() {
  const [, navigate] = useLocation();
  const [currentSectionId, setCurrentSectionId] = useState(creedSections[0]?.id ?? '');
  const [selected, setSelected] = useState<CreedTopic | null>(null);

  const currentSection = creedSections.find(s => s.id === currentSectionId);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">العقيدة الإسلامية</h1>
          <p className="text-xs text-muted-foreground">أسس العقيدة الإسلامية الصحيحة</p>
        </div>
      </div>

      <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-4 text-center">
        <p className="text-sm text-indigo-800 dark:text-indigo-200 leading-relaxed">
          «وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ» – البينة: 5
        </p>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {creedSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setCurrentSectionId(section.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              currentSectionId === section.id
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{section.icon}</span>
            {section.title}
          </button>
        ))}
      </div>

      {currentSection && (
        <>
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow', sectionColors[currentSection.id] || 'from-gray-400 to-gray-500')}>
                <span className="text-xl">{currentSection.icon}</span>
              </div>
              <div>
                <h2 className="font-bold">{currentSection.title}</h2>
                <p className="text-xs text-muted-foreground">{currentSection.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {currentSection.topics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelected(topic)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{topic.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{topic.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{topic.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </>
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
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">{selected.icon}</span>
                </div>
                <h2 className="font-bold text-lg">{selected.title}</h2>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">التفاصيل</p>
                {selected.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-indigo-500 flex-shrink-0 mt-0.5">◆</span>
                    <span className="text-foreground/80">{d}</span>
                  </div>
                ))}
              </div>

              {selected.evidence && (
                <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 p-3 border border-indigo-200 dark:border-indigo-800">
                  <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">📖 الدليل</p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selected.evidence}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
