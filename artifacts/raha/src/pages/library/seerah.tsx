import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, X, User, MapPin } from 'lucide-react';
import { seerahPhases, type SeerahEvent } from '@/data/seerah';
import { cn } from '@/lib/utils';

const phaseColors: Record<string, string> = {
  mecca: 'from-amber-400 to-orange-500',
  migration: 'from-blue-400 to-indigo-500',
  medina: 'from-emerald-400 to-teal-500',
  expansion: 'from-violet-400 to-purple-500',
};

export default function SeerahPage() {
  const [, navigate] = useLocation();
  const [currentPhaseId, setCurrentPhaseId] = useState(seerahPhases[0]?.id ?? '');
  const [selected, setSelected] = useState<SeerahEvent | null>(null);

  const currentPhase = seerahPhases.find(p => p.id === currentPhaseId);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">السيرة النبوية</h1>
          <p className="text-xs text-muted-foreground">حياة النبي محمد ﷺ وأحداث البعثة</p>
        </div>
      </div>

      <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 p-4 text-center">
        <p className="text-sm text-rose-800 dark:text-rose-200 leading-relaxed">
          «لَقَدْ كَانَ لَكُمْ فِي رَسُولِ اللَّهِ أُسْوَةٌ حَسَنَةٌ» — الأحزاب: 21
        </p>
      </div>

      {/* Phase tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {seerahPhases.map((phase) => (
          <button
            key={phase.id}
            onClick={() => setCurrentPhaseId(phase.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              currentPhaseId === phase.id
                ? 'bg-rose-600 text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{phase.icon}</span>
            {phase.title}
          </button>
        ))}
      </div>

      {/* Phase Info */}
      {currentPhase && (
        <>
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shadow', phaseColors[currentPhase.id] || 'from-gray-400 to-gray-500')}>
                <span className="text-xl">{currentPhase.icon}</span>
              </div>
              <div>
                <h2 className="font-bold text-base">{currentPhase.title}</h2>
                <p className="text-xs text-muted-foreground">{currentPhase.period}</p>
              </div>
            </div>
          </div>

          {/* Events */}
          <div className="space-y-3">
            {currentPhase.events.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelected(event)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                    <span className="text-xl">{event.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-sm">{event.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{event.year}</p>
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
                <div>
                  <h2 className="font-bold text-lg">{selected.title}</h2>
                  <p className="text-xs text-muted-foreground">{selected.year}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">أحداث رئيسية</p>
                {selected.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-rose-500 flex-shrink-0 mt-0.5">•</span>
                    <span className="text-foreground/80">{d}</span>
                  </div>
                ))}
              </div>

              {selected.people && selected.people.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  {selected.people.map((p, i) => (
                    <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded-lg text-foreground/70">{p}</span>
                  ))}
                </div>
              )}

              {selected.places && selected.places.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  {selected.places.map((p, i) => (
                    <span key={i} className="text-xs bg-secondary px-2 py-0.5 rounded-lg text-foreground/70">{p}</span>
                  ))}
                </div>
              )}

              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/30 p-3 border border-rose-200 dark:border-rose-800">
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-300 mb-1.5">💡 الدروس والعبر</p>
                {selected.lessons.map((l, i) => (
                  <p key={i} className="text-xs text-foreground/70 mb-1">• {l}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
