import React, { useState } from 'react';
import { Link } from 'wouter';
import { useGetSurahs } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Search, Book } from 'lucide-react';
import { Input, Card } from '@/components/ui';

export default function Quran() {
  const { data: surahs, isLoading } = useGetSurahs();
  const [search, setSearch] = useState('');

  const filteredSurahs = surahs?.filter(s => 
    s.name.includes(search) || 
    s.englishName.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-primary to-emerald-800 -mx-4 -mt-4 p-8 pt-12 text-primary-foreground rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/images/islamic-pattern.png')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-quran mb-2">القرآن الكريم</h2>
          <p className="text-emerald-100 text-sm mb-6 opacity-90 font-medium">اقرأ وارتقِ، فإن منزلتك عند آخر آية تقرأها</p>
          
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-800" />
            <Input 
              placeholder="ابحث عن سورة..." 
              className="pr-12 bg-white/95 border-none text-emerald-950 placeholder:text-emerald-800/50 shadow-inner h-14 text-lg rounded-2xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="px-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Book className="w-5 h-5 text-primary" />
            الفهرس
          </h3>
          <span className="text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full font-bold">
            {filteredSurahs.length} سورة
          </span>
        </div>

        {isLoading ? (
           <div className="flex justify-center py-10">
             <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
           </div>
        ) : (
          <div className="grid gap-3 pb-6">
            {filteredSurahs.map((surah, i) => (
              <Link key={surah.number} href={`/quran/${surah.number}`} className="block">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.5) }}
                >
                  <Card className="p-4 flex items-center justify-between hover:border-primary hover:shadow-md transition-all group bg-gradient-to-l from-transparent hover:from-primary/5 cursor-pointer border-border/50">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 flex flex-col items-center justify-center rounded-xl bg-secondary/50 group-hover:bg-primary group-hover:text-primary-foreground transition-colors relative overflow-hidden">
                        <span className="font-bold">{surah.number}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{surah.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{surah.englishName} • {surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
                        {surah.numberOfAyahs} آية
                      </span>
                    </div>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
