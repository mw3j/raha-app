import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronLeft } from 'lucide-react';
import { useLocation } from 'wouter';

const DHIKR_OPTIONS = [
  { id: 'subhan', arabic: 'سُبْحَانَ اللَّهِ', meaning: 'Glory to Allah', target: 33 },
  { id: 'alhamd', arabic: 'الْحَمْدُ لِلَّهِ', meaning: 'Praise to Allah', target: 33 },
  { id: 'allahu', arabic: 'اللَّهُ أَكْبَرُ', meaning: 'Allah is the Greatest', target: 34 },
  { id: 'istighfar', arabic: 'أَسْتَغْفِرُ اللَّهَ', meaning: 'I seek forgiveness', target: 100 },
  { id: 'salat', arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ', meaning: 'Blessings upon the Prophet', target: 100 },
  { id: 'la-ilaha', arabic: 'لَا إِلَهَ إِلَّا اللَّهُ', meaning: 'There is no god but Allah', target: 100 },
];

export default function Tasbih() {
  const [, setLocation] = useLocation();
  const [selectedDhikr, setSelectedDhikr] = useState(DHIKR_OPTIONS[0]);
  const [count, setCount] = useState(0);
  const [sessions, setSessions] = useState(0);
  const [showPicker, setShowPicker] = useState(false);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`tasbih_${selectedDhikr.id}`);
    if (saved) setCount(parseInt(saved, 10));
    else setCount(0);
  }, [selectedDhikr]);

  const handleCount = useCallback(() => {
    setFlash(true);
    setTimeout(() => setFlash(false), 150);

    if ('vibrate' in navigator) navigator.vibrate(30);

    setCount(prev => {
      const next = prev + 1;
      localStorage.setItem(`tasbih_${selectedDhikr.id}`, String(next));
      if (next % selectedDhikr.target === 0) {
        setSessions(s => s + 1);
      }
      return next;
    });
  }, [selectedDhikr]);

  const handleReset = () => {
    setCount(0);
    setSessions(0);
    localStorage.removeItem(`tasbih_${selectedDhikr.id}`);
  };

  const progress = (count % selectedDhikr.target) / selectedDhikr.target;
  const completedRounds = Math.floor(count / selectedDhikr.target);
  const remaining = selectedDhikr.target - (count % selectedDhikr.target);

  const circumference = 2 * Math.PI * 110;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col min-h-[80vh] animate-in fade-in duration-500 pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pt-2">
        <button onClick={() => setLocation('/adhkar')} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">المسبحة الإلكترونية</h2>
      </div>

      {/* Dhikr Selector */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full p-4 bg-card rounded-2xl border border-border mb-4 text-center shadow-sm"
      >
        <p className="font-quran text-2xl text-primary mb-1">{selectedDhikr.arabic}</p>
        <p className="text-xs text-muted-foreground">الهدف: {selectedDhikr.target} • اضغط للتغيير</p>
      </button>

      {showPicker && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl overflow-hidden mb-4 shadow-lg"
        >
          {DHIKR_OPTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => { setSelectedDhikr(d); setShowPicker(false); setSessions(0); }}
              className={`w-full px-5 py-3.5 text-right border-b border-border/50 last:border-0 transition-colors ${selectedDhikr.id === d.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}`}
            >
              <p className="font-quran text-xl">{d.arabic}</p>
              <p className="text-xs text-muted-foreground mt-0.5">الهدف: {d.target}</p>
            </button>
          ))}
        </motion.div>
      )}

      {/* Circular Counter */}
      <div className="flex-1 flex flex-col items-center justify-center py-4">
        <div className="relative">
          <svg width="260" height="260" className="rotate-[-90deg]">
            <circle cx="130" cy="130" r="110" fill="none" stroke="currentColor" strokeWidth="12" className="text-secondary" />
            <motion.circle
              cx="130" cy="130" r="110"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={count}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-bold text-foreground"
              >
                {count % selectedDhikr.target === 0 && count > 0 ? selectedDhikr.target : count % selectedDhikr.target}
              </motion.span>
            </AnimatePresence>
            <span className="text-sm text-muted-foreground mt-1">من {selectedDhikr.target}</span>
            {completedRounds > 0 && (
              <span className="text-xs text-primary font-bold mt-2 bg-primary/10 px-3 py-1 rounded-full">
                {completedRounds} × {selectedDhikr.target} = {count}
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          {remaining === selectedDhikr.target ? `ابدأ التسبيح` : `${remaining} متبقٍ`}
        </p>
      </div>

      {/* Big Tap Button */}
      <motion.button
        onClick={handleCount}
        whileTap={{ scale: 0.93 }}
        animate={{ backgroundColor: flash ? 'var(--primary)' : 'var(--primary)' }}
        className={`w-full py-7 rounded-[2rem] text-primary-foreground text-2xl font-bold shadow-xl shadow-primary/30 mb-4 transition-all ${flash ? 'brightness-125' : ''} bg-primary`}
      >
        <span className="font-quran text-3xl">{selectedDhikr.arabic}</span>
      </motion.button>

      {/* Stats Row */}
      <div className="flex gap-3">
        <div className="flex-1 bg-card rounded-2xl p-4 text-center border border-border">
          <p className="text-3xl font-bold text-primary">{count}</p>
          <p className="text-xs text-muted-foreground mt-1">إجمالي</p>
        </div>
        <div className="flex-1 bg-card rounded-2xl p-4 text-center border border-border">
          <p className="text-3xl font-bold text-gold">{completedRounds}</p>
          <p className="text-xs text-muted-foreground mt-1">جولات مكتملة</p>
        </div>
        <button onClick={handleReset} className="flex-1 bg-secondary/80 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 hover:bg-secondary transition-colors">
          <RotateCcw className="w-6 h-6 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">إعادة</span>
        </button>
      </div>
    </div>
  );
}
