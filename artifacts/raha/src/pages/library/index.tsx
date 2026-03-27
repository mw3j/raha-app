import { Link } from 'wouter';
import { BookOpen, Star, Users, Heart, Scale, Scroll, Compass, BookMarked, Landmark, Shield } from 'lucide-react';

const sections = [
  {
    id: 'pillars',
    title: 'الأركان الإسلامية',
    subtitle: 'أركان الإسلام والإيمان والإحسان',
    href: '/library/pillars',
    icon: '🕌',
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'names',
    title: 'أسماء الله الحسنى',
    subtitle: 'التسعة والتسعون اسماً لله العظيم',
    href: '/library/names',
    icon: '✨',
    gradient: 'from-amber-500 to-yellow-600',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'hadith',
    title: 'الأحاديث النبوية',
    subtitle: 'أحاديث مختارة من السنة النبوية الشريفة',
    href: '/library/hadith',
    icon: '📿',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'duas',
    title: 'الأدعية الشاملة',
    subtitle: 'أدعية ونبوية لكل الأوقات والمناسبات',
    href: '/library/duas',
    icon: '🤲',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    border: 'border-violet-200 dark:border-violet-800',
  },
  {
    id: 'seerah',
    title: 'السيرة النبوية',
    subtitle: 'حياة النبي محمد ﷺ وسيرته العطرة',
    href: '/library/seerah',
    icon: '🌟',
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-50 dark:bg-rose-950/30',
    border: 'border-rose-200 dark:border-rose-800',
  },
  {
    id: 'stories',
    title: 'قصص القرآن',
    subtitle: 'قصص الأنبياء والأمم من القرآن الكريم',
    href: '/library/stories',
    icon: '📖',
    gradient: 'from-orange-500 to-amber-600',
    bg: 'bg-orange-50 dark:bg-orange-950/30',
    border: 'border-orange-200 dark:border-orange-800',
  },
  {
    id: 'fiqh',
    title: 'الفقه الإسلامي',
    subtitle: 'أحكام الشريعة والمذاهب الفقهية',
    href: '/library/fiqh',
    icon: '⚖️',
    gradient: 'from-slate-600 to-gray-700',
    bg: 'bg-slate-50 dark:bg-slate-950/30',
    border: 'border-slate-200 dark:border-slate-800',
  },
  {
    id: 'tafsir',
    title: 'التفسير',
    subtitle: 'تفسير آيات القرآن الكريم',
    href: '/library/tafsir',
    icon: '📚',
    gradient: 'from-cyan-500 to-sky-600',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'halal-haram',
    title: 'الحلال والحرام',
    subtitle: 'أحكام الحلال والحرام في الفقه الإسلامي',
    href: '/library/halal-haram',
    icon: '⚖️',
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-50 dark:bg-green-950/30',
    border: 'border-green-200 dark:border-green-800',
  },
  {
    id: 'creed',
    title: 'العقيدة الإسلامية',
    subtitle: 'التوحيد والإيمان وأصول العقيدة',
    href: '/library/creed',
    icon: '💎',
    gradient: 'from-indigo-500 to-blue-600',
    bg: 'bg-indigo-50 dark:bg-indigo-950/30',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
];

export default function Library() {
  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/30 mx-auto mb-4">
          <span className="text-3xl">📚</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground">المكتبة الإسلامية</h1>
        <p className="text-muted-foreground text-sm mt-1">اختر من المحتوى الإسلامي الشامل</p>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-2 gap-3">
        {sections.map((section) => (
          <Link key={section.id} href={section.href}>
            <div className={`rounded-2xl border ${section.border} ${section.bg} p-4 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${section.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                <span className="text-xl">{section.icon}</span>
              </div>
              <h3 className="font-bold text-sm text-foreground leading-tight">{section.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-tight line-clamp-2">{section.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Adhkar Quick Link */}
      <Link href="/adhkar">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-sm">
              <span className="text-xl">📿</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">الأذكار</h3>
              <p className="text-xs text-muted-foreground">أذكار الصباح والمساء وأذكار النوم</p>
            </div>
            <div className="mr-auto text-muted-foreground">←</div>
          </div>
        </div>
      </Link>

      {/* Tasbih Quick Link */}
      <Link href="/tasbih">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 cursor-pointer hover:bg-primary/10 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-500 to-purple-600 flex items-center justify-center shadow-sm">
              <span className="text-xl">📿</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-foreground">التسبيح</h3>
              <p className="text-xs text-muted-foreground">مسبحة رقمية للتسبيح والذكر</p>
            </div>
            <div className="mr-auto text-muted-foreground">←</div>
          </div>
        </div>
      </Link>
    </div>
  );
}
