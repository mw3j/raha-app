import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Bed, Check, RotateCcw, Sparkles } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useLocation } from 'wouter';

const ADHKAR_DATA = {
  morning: [
    {
      id: 1,
      arabic: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      source: 'رواه مسلم',
      repeat: 1,
    },
    {
      id: 2,
      arabic: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ، أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ، أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ، وَأَبُوءُ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ',
      source: 'رواه البخاري — سيد الاستغفار',
      repeat: 1,
    },
    {
      id: 3,
      arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      source: 'رواه مسلم',
      repeat: 100,
    },
    {
      id: 4,
      arabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ الْعَفْوَ وَالْعَافِيَةَ فِي الدُّنْيَا وَالْآخِرَةِ',
      source: 'رواه أبو داود',
      repeat: 1,
    },
    {
      id: 5,
      arabic: 'اللَّهُمَّ عَافِنِي فِي بَدَنِي، اللَّهُمَّ عَافِنِي فِي سَمْعِي، اللَّهُمَّ عَافِنِي فِي بَصَرِي، لَا إِلَهَ إِلَّا أَنْتَ',
      source: 'رواه أبو داود',
      repeat: 3,
    },
    {
      id: 6,
      arabic: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
      source: 'رواه أبو داود والترمذي',
      repeat: 3,
    },
    {
      id: 7,
      arabic: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ ﷺ نَبِيًّا',
      source: 'رواه أبو داود والترمذي',
      repeat: 3,
    },
  ],
  evening: [
    {
      id: 1,
      arabic: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
      source: 'رواه مسلم',
      repeat: 1,
    },
    {
      id: 2,
      arabic: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
      source: 'رواه أبو داود',
      repeat: 1,
    },
    {
      id: 3,
      arabic: 'اللَّهُمَّ إِنِّي أَمْسَيْتُ أُشْهِدُكَ وَأُشْهِدُ حَمَلَةَ عَرْشِكَ، وَمَلَائِكَتَكَ وَجَمِيعَ خَلْقِكَ، أَنَّكَ أَنْتَ اللَّهُ لَا إِلَهَ إِلَّا أَنْتَ وَحْدَكَ لَا شَرِيكَ لَكَ، وَأَنَّ مُحَمَّدًا عَبْدُكَ وَرَسُولُكَ',
      source: 'رواه أبو داود',
      repeat: 4,
    },
    {
      id: 4,
      arabic: 'اللَّهُمَّ مَا أَمْسَى بِي مِنْ نِعْمَةٍ أَوْ بِأَحَدٍ مِنْ خَلْقِكَ فَمِنْكَ وَحْدَكَ لَا شَرِيكَ لَكَ، فَلَكَ الْحَمْدُ وَلَكَ الشُّكْرُ',
      source: 'رواه أبو داود',
      repeat: 1,
    },
    {
      id: 5,
      arabic: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
      source: 'رواه مسلم',
      repeat: 3,
    },
  ],
  sleep: [
    {
      id: 1,
      arabic: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا',
      source: 'رواه البخاري',
      repeat: 1,
    },
    {
      id: 2,
      arabic: 'اللَّهُمَّ قِنِي عَذَابَكَ يَوْمَ تَبْعَثُ عِبَادَكَ',
      source: 'رواه أبو داود',
      repeat: 3,
    },
    {
      id: 3,
      arabic: 'اللَّهُمَّ بِاسْمِكَ أَحْيَا وَأَمُوتُ',
      source: 'رواه البخاري',
      repeat: 1,
    },
    {
      id: 4,
      arabic: 'سُبْحَانَكَ اللَّهُمَّ وَبِحَمْدِكَ، أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا أَنْتَ، أَسْتَغْفِرُكَ وَأَتُوبُ إِلَيْكَ',
      source: 'رواه النسائي والترمذي',
      repeat: 1,
    },
    {
      id: 5,
      arabic: 'سُبْحَانَ اللَّهِ',
      source: 'رواه البخاري ومسلم',
      repeat: 33,
    },
    {
      id: 6,
      arabic: 'الْحَمْدُ لِلَّهِ',
      source: 'رواه البخاري ومسلم',
      repeat: 33,
    },
    {
      id: 7,
      arabic: 'اللَّهُ أَكْبَرُ',
      source: 'رواه البخاري ومسلم',
      repeat: 34,
    },
  ],
};

type Section = 'morning' | 'evening' | 'sleep';

function ThikrCard({ thikr, onDone, isDone }: {
  thikr: typeof ADHKAR_DATA.morning[0];
  onDone: () => void;
  isDone: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-5 shadow-sm border transition-all ${isDone ? 'bg-primary/5 border-primary/20 opacity-60' : 'bg-card border-border'}`}
    >
      <p className="font-quran text-2xl leading-[2.2] text-right text-foreground mb-4" dir="rtl">
        {thikr.arabic}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">{thikr.repeat > 1 ? `${thikr.repeat}×` : '١×'}</Badge>
          <span className="text-xs text-muted-foreground">{thikr.source}</span>
        </div>
        <button
          onClick={onDone}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
            isDone ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary'
          }`}
        >
          <Check className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  );
}

const TODAY = new Date().toISOString().slice(0, 10);

function getStorageKey(section: Section) {
  return `raha_adhkar_${section}_${TODAY}`;
}

function loadDoneFromStorage(section: Section): Set<number> {
  try {
    const raw = localStorage.getItem(getStorageKey(section));
    if (raw) return new Set(JSON.parse(raw) as number[]);
  } catch {}
  return new Set();
}

function saveDoneToStorage(section: Section, done: Set<number>) {
  localStorage.setItem(getStorageKey(section), JSON.stringify([...done]));
  // Update daily completion count for profile stats
  const allSections: Section[] = ['morning', 'evening', 'sleep'];
  let total = 0;
  allSections.forEach((s) => {
    try {
      const raw = localStorage.getItem(getStorageKey(s));
      if (raw) total += (JSON.parse(raw) as number[]).length;
    } catch {}
  });
  localStorage.setItem(`raha_adhkar_total_${TODAY}`, String(total));
}

export default function Adhkar() {
  const [section, setSection] = useState<Section>('morning');
  const [done, setDone] = useState<Set<number>>(() => loadDoneFromStorage('morning'));
  const [, setLocation] = useLocation();

  const sections = {
    morning: { label: 'أذكار الصباح', icon: Sun, color: 'from-amber-400 to-yellow-300', data: ADHKAR_DATA.morning },
    evening: { label: 'أذكار المساء', icon: Moon, color: 'from-indigo-500 to-violet-400', data: ADHKAR_DATA.evening },
    sleep: { label: 'أذكار النوم', icon: Bed, color: 'from-slate-600 to-slate-500', data: ADHKAR_DATA.sleep },
  };

  const current = sections[section];
  const total = current.data.length;
  const completed = done.size;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleSectionChange = (s: Section) => {
    setSection(s);
    setDone(loadDoneFromStorage(s));
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-500 pb-10">
      {/* Header Banner */}
      <div className={`bg-gradient-to-r ${current.color} rounded-[2rem] p-5 text-white shadow-lg -mx-2 mt-2`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <current.icon className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">{current.label}</h2>
            <p className="text-white/80 text-sm">{completed} / {total} ذكر</p>
          </div>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <motion.div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2">
        {(Object.keys(sections) as Section[]).map((s) => {
          const Sec = sections[s];
          return (
            <button
              key={s}
              onClick={() => handleSectionChange(s)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl text-xs font-bold transition-all ${
                section === s ? 'bg-primary text-primary-foreground shadow-md' : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sec.icon className="w-5 h-5" />
              {s === 'morning' ? 'الصباح' : s === 'evening' ? 'المساء' : 'النوم'}
            </button>
          );
        })}
      </div>

      {/* Reset & Tasbih */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            const empty = new Set<number>();
            setDone(empty);
            saveDoneToStorage(section, empty);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-muted-foreground hover:text-foreground text-sm font-bold transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          إعادة تعيين
        </button>
        <button
          onClick={() => setLocation('/tasbih')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-bold transition-colors hover:bg-primary/20 mr-auto"
        >
          <Sparkles className="w-4 h-4" />
          المسبحة
        </button>
      </div>

      {/* Thikr Cards */}
      <div className="space-y-4">
        <AnimatePresence>
          {current.data.map((thikr) => (
            <ThikrCard
              key={`${section}-${thikr.id}`}
              thikr={thikr}
              isDone={done.has(thikr.id)}
              onDone={() => {
                const next = new Set(done);
                if (next.has(thikr.id)) next.delete(thikr.id);
                else next.add(thikr.id);
                setDone(next);
                saveDoneToStorage(section, next);
              }}
            />
          ))}
        </AnimatePresence>
      </div>

      {completed === total && total > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="text-5xl mb-3">🌟</div>
          <h3 className="text-xl font-bold text-primary">أحسنت!</h3>
          <p className="text-muted-foreground mt-1">اكتملت {current.label}</p>
        </motion.div>
      )}
    </div>
  );
}
