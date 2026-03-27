import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'wouter';
import { useGetSurah } from '@workspace/api-client-react';
import { ChevronRight, Play, Pause, Languages, Volume2, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';

const RECITERS = [
  { id: 'ar.alafasy', name: 'مشاري العفاسي' },
  { id: 'ar.abdulbasitmurattal', name: 'عبدالباسط المرتل' },
  { id: 'ar.hudhaify', name: 'علي الحذيفي' },
  { id: 'ar.minshawi', name: 'محمد صديق المنشاوي' },
];

function getAudioUrl(reciterId: string, globalVerseNumber: number) {
  return `https://cdn.islamic.network/quran/audio/128/${reciterId}/${globalVerseNumber}.mp3`;
}

export default function SurahView() {
  const { id } = useParams<{ id: string }>();
  const surahNumber = parseInt(id || '1', 10);

  const { data: surah, isLoading } = useGetSurah(surahNumber);

  const [showTranslation, setShowTranslation] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [tafsirData, setTafsirData] = useState<Record<number, string>>({});
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [showReciterPicker, setShowReciterPicker] = useState(false);
  const [selectedReciter, setSelectedReciter] = useState(RECITERS[0]);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowTafsir(false);
    setTafsirData({});
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [surahNumber]);

  const loadTafsir = useCallback(async () => {
    if (Object.keys(tafsirData).length > 0) return;
    setTafsirLoading(true);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.muyassar`);
      const json = await res.json();
      if (json.code === 200) {
        const map: Record<number, string> = {};
        for (const ayah of json.data.ayahs) {
          map[ayah.numberInSurah] = ayah.text;
        }
        setTafsirData(map);
      }
    } catch {
    } finally {
      setTafsirLoading(false);
    }
  }, [surahNumber, tafsirData]);

  const toggleTafsir = () => {
    const next = !showTafsir;
    setShowTafsir(next);
    if (next) loadTafsir();
  };

  const playVerse = (globalVerseNumber: number, index: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (playingVerse === globalVerseNumber) {
      setPlayingVerse(null);
      return;
    }
    const audio = new Audio(getAudioUrl(selectedReciter.id, globalVerseNumber));
    audioRef.current = audio;
    audio.play().catch(() => {});
    setPlayingVerse(globalVerseNumber);

    audio.onended = () => {
      if (isAutoPlay && surah && index + 1 < surah.verses.length) {
        const nextVerse = surah.verses[index + 1];
        setTimeout(() => playVerse(nextVerse.number, index + 1), 300);
      } else {
        setPlayingVerse(null);
      }
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!surah) return <div className="p-8 text-center">لم يتم العثور على السورة</div>;

  return (
    <div className="animate-in fade-in duration-500 pb-10">
      {/* Sticky Header */}
      <div className="sticky top-16 z-30 bg-background/95 backdrop-blur-md -mx-4 px-4 py-3 border-b border-border/50 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <Link href="/quran">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </Link>
          <div className="text-center">
            <h2 className="font-bold text-xl text-primary">{surah.name}</h2>
            <p className="text-xs text-muted-foreground">
              {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'} • {surah.numberOfAyahs} آية
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${showTafsir ? 'text-amber-600 bg-amber-500/10' : 'text-muted-foreground'}`}
              onClick={toggleTafsir}
              title="تفسير"
            >
              {tafsirLoading ? (
                <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-full ${showTranslation ? 'text-primary bg-primary/10' : 'text-muted-foreground'}`}
              onClick={() => setShowTranslation(!showTranslation)}
              title="ترجمة"
            >
              <Languages className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Reciter & Auto-play Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReciterPicker(!showReciterPicker)}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-full text-xs font-bold flex-1"
          >
            <Volume2 className="w-3.5 h-3.5 text-primary" />
            {selectedReciter.name}
          </button>
          <button
            onClick={() => setIsAutoPlay(!isAutoPlay)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isAutoPlay ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
          >
            تشغيل تلقائي
          </button>
        </div>

        {showReciterPicker && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 bg-card border border-border rounded-2xl overflow-hidden shadow-lg"
          >
            {RECITERS.map((r) => (
              <button
                key={r.id}
                onClick={() => { setSelectedReciter(r); setShowReciterPicker(false); audioRef.current?.pause(); setPlayingVerse(null); }}
                className={`w-full px-4 py-3 text-right text-sm font-bold border-b border-border/50 last:border-0 transition-colors ${selectedReciter.id === r.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}`}
              >
                {r.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Active modes indicator */}
        {(showTafsir || showTranslation) && (
          <div className="flex gap-2 mt-2">
            {showTafsir && (
              <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold">
                📖 التفسير الميسر
              </span>
            )}
            {showTranslation && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                🌍 الترجمة
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bismillah */}
      {surahNumber !== 1 && surahNumber !== 9 && (
        <div className="text-center py-8">
          <h3 className="font-quran text-3xl text-primary drop-shadow-sm">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </h3>
        </div>
      )}

      {/* Verses */}
      <div className="mt-4 space-y-4 px-1">
        {surah.verses.map((verse, i) => {
          const isPlaying = playingVerse === verse.number;
          return (
            <motion.div
              key={verse.numberInSurah}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.01 }}
              className={`rounded-2xl p-4 transition-all border ${isPlaying ? 'border-primary/40 bg-primary/5 shadow-md shadow-primary/10' : 'border-transparent bg-card hover:bg-secondary/30'}`}
            >
              {/* Verse Number & Play */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => playVerse(verse.number, i)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${isPlaying ? 'bg-primary text-primary-foreground animate-pulse' : 'bg-secondary text-primary hover:bg-primary/10'}`}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <div className="flex items-center justify-center w-9 h-9 rounded-full border-2 border-primary/30 text-primary font-bold text-sm">
                  {verse.numberInSurah}
                </div>
              </div>

              {/* Arabic Text */}
              <p className="font-quran text-3xl md:text-4xl leading-[2.2] text-foreground text-right" dir="rtl">
                {verse.text}
              </p>

              {/* Tafsir */}
              <AnimatePresence>
                {showTafsir && tafsirData[verse.numberInSurah] && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-800/30"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">📖</span>
                      <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed text-right" dir="rtl">
                        {tafsirData[verse.numberInSurah]}
                      </p>
                    </div>
                  </motion.div>
                )}
                {showTafsir && tafsirLoading && !tafsirData[verse.numberInSurah] && i === 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-3 pt-3 border-t border-border/50 text-center"
                  >
                    <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Translation */}
              <AnimatePresence>
                {showTranslation && verse.translation && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 pt-3 border-t border-border/50 text-sm text-muted-foreground leading-relaxed"
                    dir="ltr"
                    style={{ direction: 'ltr', textAlign: 'left' }}
                  >
                    {verse.translation}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="mt-12 flex justify-between px-4">
        {surahNumber > 1 && (
          <Link href={`/quran/${surahNumber - 1}`}>
            <Button variant="outline">السورة السابقة</Button>
          </Link>
        )}
        {surahNumber < 114 && (
          <Link href={`/quran/${surahNumber + 1}`} className="mr-auto">
            <Button variant="default">السورة التالية</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
