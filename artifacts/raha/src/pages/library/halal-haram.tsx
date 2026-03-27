import { useState } from 'react';
import { useLocation } from 'wouter';
import { ArrowRight, X } from 'lucide-react';
import { halalHaramCategories, statusConfig, type HalalHaramItem } from '@/data/halal-haram';
import { cn } from '@/lib/utils';

export default function HalalHaramPage() {
  const [, navigate] = useLocation();
  const [activeCategory, setActiveCategory] = useState(halalHaramCategories[0].id);
  const [selected, setSelected] = useState<HalalHaramItem | null>(null);

  const currentCategory = halalHaramCategories.find(c => c.id === activeCategory);

  return (
    <div className="space-y-4 py-4">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/library')} className="p-2 rounded-xl hover:bg-secondary transition-colors">
          <ArrowRight className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">الحلال والحرام</h1>
          <p className="text-xs text-muted-foreground">أحكام الحلال والحرام في الشريعة</p>
        </div>
      </div>

      <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-4 text-center">
        <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">
          «الحلال بيّن والحرام بيّن وبينهما أمور مشتبهات» — متفق عليه
        </p>
      </div>

      {/* Status Legend */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(statusConfig).map(([key, val]) => (
          <div key={key} className="flex items-center gap-1.5 text-xs">
            <span>{val.icon}</span>
            <span className="text-foreground/70">{val.label}</span>
          </div>
        ))}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {halalHaramCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              'flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors',
              activeCategory === cat.id
                ? 'bg-green-600 text-white shadow'
                : 'bg-secondary text-muted-foreground hover:text-foreground'
            )}
          >
            <span>{cat.icon}</span>
            {cat.title}
          </button>
        ))}
      </div>

      {/* Category Items */}
      {currentCategory && (
        <div className="space-y-3">
          {currentCategory.items.map((item) => {
            const statusInfo = statusConfig[item.status];
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full rounded-2xl border border-border bg-card p-4 text-right hover:border-green-400 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{statusInfo.icon}</span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-lg font-semibold',
                      item.status === 'halal' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      item.status === 'haram' ? 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400' :
                      item.status === 'makruh' ? 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400' :
                      'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
                    )}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.icon && <span className="text-lg">{item.icon}</span>}
                    <h3 className="font-bold text-sm">{item.title}</h3>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-right line-clamp-2">{item.description}</p>
              </button>
            );
          })}
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
            <div className="flex items-center gap-3">
              {selected.icon && <span className="text-3xl">{selected.icon}</span>}
              <div>
                <h2 className="font-bold text-lg">{selected.title}</h2>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-lg font-semibold',
                  selected.status === 'halal' ? 'text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30' :
                  selected.status === 'haram' ? 'text-red-700 bg-red-100 dark:bg-red-900/30' :
                  'text-orange-700 bg-orange-100 dark:bg-orange-900/30'
                )}>
                  {statusConfig[selected.status].label}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed">{selected.description}</p>

            {selected.evidence && (
              <div className="rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">📖 الدليل الشرعي</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{selected.evidence}</p>
              </div>
            )}

            {selected.details && selected.details.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">تفاصيل إضافية</p>
                {selected.details.map((d, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 flex-shrink-0">•</span>
                    <span className="text-foreground/80">{d}</span>
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
