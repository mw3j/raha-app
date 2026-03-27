import React, { useState, useEffect, useRef } from 'react';
import { useGetPrayerTimes } from '@workspace/api-client-react';
import { format } from 'date-fns';
import { MapPin, Compass, Bell, BellRing, Play, Pause, Music, Navigation, Sparkles, Settings, Volume2, VolumeX, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, Button, Badge } from '@/components/ui';
import { useLocation } from 'wouter';
import { PRAYER_NAMES, formatTimeAr } from '@/lib/utils';
import { schedulePrayerNotifications, savePrayerTimes } from '@/lib/prayer-notifications';

const ADHANS = [
  { id: 'afasy', name: 'مشاري راشد العفاسي', location: 'الكويت', url: 'https://www.islamcan.com/audio/adhan/azan1.mp3' },
  { id: 'makkah', name: 'أذان الحرمين', location: 'مكة المكرمة', url: 'https://www.islamcan.com/audio/adhan/azan2.mp3' },
  { id: 'madinah', name: 'أذان المدينة', location: 'المدينة المنورة', url: 'https://www.islamcan.com/audio/adhan/azan3.mp3' },
  { id: 'turkey', name: 'الأذان التركي', location: 'إسطنبول', url: 'https://www.islamcan.com/audio/adhan/azan4.mp3' },
  { id: 'egypt', name: 'الأذان المصري', location: 'القاهرة', url: 'https://www.islamcan.com/audio/adhan/azan5.mp3' },
];

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const ALL_PRAYER_KEYS = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'];

function loadPrayerSettings() {
  try {
    const raw = localStorage.getItem('raha_prayer_settings');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    notifEnabled: false,
    adhanId: 'afasy',
    fajrAdhanId: 'afasy',
    useFajrSpecial: false,
    perPrayer: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  };
}

function savePrayerSettings(settings: any) {
  localStorage.setItem('raha_prayer_settings', JSON.stringify(settings));
}

export default function Prayer() {
  const [, navigate] = useLocation();
  const [location, setLocation] = useState({ lat: 21.4225, lng: 39.8262 });
  const [locName, setLocName] = useState('مكة المكرمة');
  const [loadingLoc, setLoadingLoc] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAdhanPicker, setShowAdhanPicker] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [settings, setSettings] = useState(loadPrayerSettings);

  const selectedAdhan = ADHANS.find(a => a.id === settings.adhanId) || ADHANS[0];
  const fajrAdhan = ADHANS.find(a => a.id === settings.fajrAdhanId) || ADHANS[0];

  const { data: times, isLoading } = useGetPrayerTimes({
    latitude: location.lat,
    longitude: location.lng,
    date: format(new Date(), 'yyyy-MM-dd'),
  });

  const updateSettings = (patch: any) => {
    setSettings((prev: any) => {
      const next = { ...prev, ...patch };
      savePrayerSettings(next);
      return next;
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('raha_location');
    if (saved) {
      try {
        const { lat, lng, name } = JSON.parse(saved);
        setLocation({ lat, lng });
        setLocName(name);
        setLoadingLoc(false);
      } catch {}
    }
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setLocation({ lat, lng });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`);
            const geo = await res.json();
            const name = geo.address?.city || geo.address?.town || geo.address?.state || 'موقعي الحالي';
            setLocName(name);
            localStorage.setItem('raha_location', JSON.stringify({ lat, lng, name }));
          } catch {
            setLocName('موقعي الحالي');
            localStorage.setItem('raha_location', JSON.stringify({ lat, lng, name: 'موقعي الحالي' }));
          }
          setLoadingLoc(false);
        },
        () => { setLoadingLoc(false); },
        { timeout: 8000 }
      );
    } else {
      setLoadingLoc(false);
    }
  }, []);

  useEffect(() => {
    const adhanObj = ADHANS.find(a => a.id === settings.adhanId) || ADHANS[0];
    audioRef.current = new Audio(adhanObj.url);
    audioRef.current.onended = () => setIsPlaying(false);
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [settings.adhanId]);

  // Save times to localStorage and schedule notifications via global singleton
  useEffect(() => {
    if (!times) return;
    const timesMap = times as Record<string, string>;
    savePrayerTimes(timesMap);
    schedulePrayerNotifications(timesMap, settings);
    // Note: we do NOT return a cleanup — timers live at module level and persist across navigation
  }, [times, settings]);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('متصفحك لا يدعم الإشعارات');
      return;
    }
    if (Notification.permission === 'granted') {
      updateSettings({ notifEnabled: !settings.notifEnabled });
    } else if (Notification.permission === 'denied') {
      alert('تم حظر الإشعارات. يرجى السماح بالإشعارات من إعدادات المتصفح ثم المحاولة مجدداً.');
    } else {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        updateSettings({ notifEnabled: true });
      } else {
        alert('لم يتم السماح بالإشعارات. يمكنك تفعيلها لاحقاً من إعدادات المتصفح.');
      }
    }
  };

  const getNextPrayer = () => {
    if (!times) return null;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    for (const p of ALL_PRAYER_KEYS) {
      const timeStr = times[p as keyof typeof times] as string;
      if (!timeStr) continue;
      const [h, m] = timeStr.split(':').map(Number);
      if (h * 60 + m > currentMinutes) return { name: p, time: timeStr };
    }
    return { name: 'fajr', time: times.fajr };
  };

  const nextPrayer = getNextPrayer();

  const handleGetLocation = () => {
    setLoadingLoc(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          setLocation({ lat, lng });
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`);
            const geo = await res.json();
            const name = geo.address?.city || geo.address?.town || geo.address?.state || 'موقعي الحالي';
            setLocName(name);
            localStorage.setItem('raha_location', JSON.stringify({ lat, lng, name }));
          } catch {
            setLocName('موقعي الحالي');
          }
          setLoadingLoc(false);
        },
        () => {
          setLoadingLoc(false);
          alert('فشل في تحديد الموقع. يرجى السماح بالوصول للموقع من إعدادات المتصفح.');
        }
      );
    } else {
      setLoadingLoc(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-primary to-emerald-900 rounded-[2rem] p-6 text-white shadow-xl shadow-primary/20 relative overflow-hidden -mx-2 mt-2">
        <div className="absolute top-0 right-0 w-full h-full opacity-20 bg-[url('/images/islamic-pattern.png')] bg-cover mix-blend-overlay" />
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <MapPin className="w-5 h-5 text-yellow-400" />
                {loadingLoc ? 'جاري تحديد موقعك...' : locName}
              </h2>
            </div>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                title={settings.notifEnabled ? 'إيقاف إشعارات الصلاة' : 'تفعيل إشعارات الصلاة'}
                className={`rounded-full ${settings.notifEnabled ? 'text-yellow-400 hover:bg-white/20' : 'text-white/60 hover:bg-white/20'}`}
                onClick={handleEnableNotifications}
              >
                {settings.notifEnabled ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20 rounded-full"
                onClick={handleGetLocation}
              >
                <Compass className={`w-6 h-6 ${loadingLoc ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : nextPrayer ? (
            <div className="text-center py-4 bg-black/20 rounded-2xl backdrop-blur-sm border border-white/10">
              <p className="text-emerald-100 font-medium mb-1">الصلاة القادمة</p>
              <h3 className="text-4xl font-bold text-yellow-400 mb-2">{PRAYER_NAMES[nextPrayer.name]}</h3>
              <p className="text-3xl font-mono tracking-wider">{formatTimeAr(nextPrayer.time)}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Adhan Player */}
      <Card className="p-5 bg-gradient-to-r from-card to-secondary/30 border-none shadow-md">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Music className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base">مشغّل الأذان</h3>
            <p className="text-xs text-muted-foreground">استمع إلى الأذان</p>
          </div>
          <button
            onClick={() => setShowSettings(v => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors bg-secondary/60 rounded-xl px-3 py-2"
          >
            <Settings className="w-3.5 h-3.5" />
            إعدادات
            {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Adhan Picker */}
        <button
          onClick={() => setShowAdhanPicker(!showAdhanPicker)}
          className="w-full flex items-center justify-between p-3 bg-secondary/60 rounded-xl mb-4 hover:bg-secondary transition-colors"
        >
          <div className="text-right">
            <p className="font-bold text-sm">{selectedAdhan.name}</p>
            <p className="text-xs text-muted-foreground">{selectedAdhan.location}</p>
          </div>
          <Badge variant="outline" className="text-xs">{showAdhanPicker ? '▲' : '▼'} اختيار</Badge>
        </button>

        {showAdhanPicker && (
          <div className="space-y-2 mb-4 animate-in slide-in-from-top-2 duration-200">
            {ADHANS.map((adhan) => (
              <button
                key={adhan.id}
                onClick={() => { updateSettings({ adhanId: adhan.id }); setShowAdhanPicker(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-colors ${
                  settings.adhanId === adhan.id ? 'bg-primary text-primary-foreground' : 'bg-secondary/50 hover:bg-secondary'
                }`}
              >
                <span className="font-bold text-sm">{adhan.name}</span>
                <span className={`text-xs ${settings.adhanId === adhan.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{adhan.location}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={toggleAudio}
          className={`w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-base transition-all ${
            isPlaying ? 'bg-red-500/10 text-red-500 border border-red-200' : 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
          }`}
        >
          {isPlaying ? <><Pause className="w-5 h-5" />إيقاف الأذان</> : <><Play className="w-5 h-5" />تشغيل الأذان</>}
        </button>

        {isPlaying && (
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 bg-primary rounded-full animate-pulse"
                style={{ height: `${12 + Math.sin(i * 1.2) * 8}px`, animationDelay: `${i * 0.15}s`, animationDuration: '0.8s' }} />
            ))}
            <span className="text-xs text-primary font-bold mr-2">يُبَثُّ الآن...</span>
          </div>
        )}

        {/* Advanced Settings Panel */}
        {showSettings && (
          <div className="mt-4 pt-4 border-t border-border/50 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <h4 className="font-bold text-sm text-foreground">إعدادات الإشعارات والأذان</h4>

            {/* Master notification toggle */}
            <div className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl">
              <div className="flex items-center gap-2">
                {settings.notifEnabled ? <BellRing className="w-4 h-4 text-primary" /> : <Bell className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-medium">إشعارات الصلاة</span>
              </div>
              <button
                onClick={handleEnableNotifications}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.notifEnabled ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.notifEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {/* Per-prayer toggles */}
            {settings.notifEnabled && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">تفعيل الإشعار لكل صلاة:</p>
                {PRAYER_KEYS.map((key) => (
                  <div key={key} className="flex items-center justify-between p-2.5 bg-secondary/30 rounded-xl">
                    <span className="text-sm font-medium">{PRAYER_NAMES[key]}</span>
                    <button
                      onClick={() => updateSettings({ perPrayer: { ...settings.perPrayer, [key]: !settings.perPrayer[key] } })}
                      className={`relative w-10 h-5 rounded-full transition-colors ${settings.perPrayer[key] ? 'bg-primary' : 'bg-border'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.perPrayer[key] ? 'right-0.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Fajr special adhan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl">
                <div>
                  <p className="text-sm font-medium">أذان الفجر مختلف</p>
                  <p className="text-xs text-muted-foreground">اختر أذاناً مخصصاً لصلاة الفجر</p>
                </div>
                <button
                  onClick={() => updateSettings({ useFajrSpecial: !settings.useFajrSpecial })}
                  className={`relative w-10 h-5 rounded-full transition-colors ${settings.useFajrSpecial ? 'bg-primary' : 'bg-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.useFajrSpecial ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              {settings.useFajrSpecial && (
                <div className="space-y-1.5 pr-2">
                  <p className="text-xs text-muted-foreground">أذان الفجر:</p>
                  {ADHANS.map((adhan) => (
                    <button
                      key={adhan.id}
                      onClick={() => updateSettings({ fajrAdhanId: adhan.id })}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-sm transition-colors ${
                        settings.fajrAdhanId === adhan.id ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-secondary/40 hover:bg-secondary/70'
                      }`}
                    >
                      <span className="font-medium">{adhan.name}</span>
                      <span className="text-xs opacity-70">{adhan.location}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sound indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-xl p-3">
              {settings.notifEnabled ? (
                <><Volume2 className="w-4 h-4 text-primary flex-shrink-0" /><span>سيتم تشغيل الأذان تلقائياً عند وقت كل صلاة</span></>
              ) : (
                <><VolumeX className="w-4 h-4 flex-shrink-0" /><span>فعّل الإشعارات لتشغيل الأذان تلقائياً عند وقت الصلاة</span></>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/qibla')}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Navigation className="w-7 h-7" />
          <span className="font-bold text-sm">بوصلة القبلة</span>
          <span className="text-white/70 text-xs">اتجاه مكة المكرمة</span>
        </button>
        <button
          onClick={() => navigate('/tasbih')}
          className="bg-gradient-to-br from-violet-500 to-purple-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-md shadow-violet-200 dark:shadow-violet-900/30 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <Sparkles className="w-7 h-7" />
          <span className="font-bold text-sm">المسبحة الإلكترونية</span>
          <span className="text-white/70 text-xs">عداد الأذكار</span>
        </button>
      </div>

      {/* Prayer Times List */}
      <div>
        <h3 className="font-bold text-lg mb-4 px-2">أوقات الصلاة</h3>
        <div className="space-y-3">
          {isLoading
            ? Array(6).fill(0).map((_, i) => <Card key={i} className="h-16 animate-pulse bg-muted" />)
            : ALL_PRAYER_KEYS.map((key) => {
                const timeStr = times?.[key as keyof typeof times] as string;
                const isNext = nextPrayer?.name === key;
                const hasNotif = settings.notifEnabled && settings.perPrayer[key];
                const isPrayerKey = PRAYER_KEYS.includes(key);

                return (
                  <Card
                    key={key}
                    className={`p-4 flex items-center justify-between border-0 transition-all ${
                      isNext ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-[1.02]' : 'bg-card hover:bg-secondary/50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isNext ? 'bg-white/20' : 'bg-secondary'}`}>
                        {hasNotif && isPrayerKey
                          ? <BellRing className={`w-5 h-5 ${isNext ? '' : 'text-primary'}`} />
                          : <Bell className={`w-5 h-5 ${isNext ? 'opacity-80' : 'opacity-40'}`} />}
                      </div>
                      <div>
                        <span className="font-bold text-lg block">{PRAYER_NAMES[key]}</span>
                        {isPrayerKey && settings.notifEnabled && (
                          <span className={`text-xs ${isNext ? 'text-yellow-200' : 'text-muted-foreground'}`}>
                            {settings.perPrayer[key] ? 'إشعار مفعّل' : 'إشعار معطّل'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`font-bold font-mono text-xl ${isNext ? 'text-yellow-400' : 'text-primary'}`}>
                      {formatTimeAr(timeStr)}
                    </span>
                  </Card>
                );
              })}
        </div>
      </div>
    </div>
  );
}
