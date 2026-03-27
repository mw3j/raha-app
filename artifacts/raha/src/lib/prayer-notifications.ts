const PRAYER_NAMES: Record<string, string> = {
  fajr: 'الفجر', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء',
};

const ADHANS_MAP: Record<string, string> = {
  afasy:   'https://www.islamcan.com/audio/adhan/azan1.mp3',
  makkah:  'https://www.islamcan.com/audio/adhan/azan2.mp3',
  madinah: 'https://www.islamcan.com/audio/adhan/azan3.mp3',
  turkey:  'https://www.islamcan.com/audio/adhan/azan4.mp3',
  egypt:   'https://www.islamcan.com/audio/adhan/azan5.mp3',
};

const PRAYER_KEYS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

let activeTimers: ReturnType<typeof setTimeout>[] = [];

export function clearPrayerTimers() {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
}

export function schedulePrayerNotifications(times: Record<string, string>, settings: any) {
  clearPrayerTimers();

  if (!settings?.notifEnabled) return;
  if (typeof window === 'undefined') return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const now = new Date();

  PRAYER_KEYS.forEach((key) => {
    if (!settings.perPrayer?.[key]) return;
    const timeStr = times[key];
    if (!timeStr) return;

    const [h, m] = timeStr.split(':').map(Number);
    const prayerTime = new Date();
    prayerTime.setHours(h, m, 0, 0);
    const diff = prayerTime.getTime() - now.getTime();

    if (diff > 0 && diff < 86_400_000) {
      const t = setTimeout(() => {
        try {
          new Notification(`حان وقت صلاة ${PRAYER_NAMES[key]} 🕌`, {
            body: `الوقت: ${timeStr} — لا تفوّت صلاتك`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `prayer-${key}`,
            renotify: true,
            silent: true,
          } as NotificationOptions);
        } catch {}

        const adhanId =
          key === 'fajr' && settings.useFajrSpecial
            ? settings.fajrAdhanId
            : settings.adhanId;
        const url = ADHANS_MAP[adhanId] || ADHANS_MAP.afasy;
        const audio = new Audio(url);
        audio.play().catch(() => {});
      }, diff);

      activeTimers.push(t);
    }
  });
}

export function loadStoredPrayerTimes(): Record<string, string> | null {
  try {
    const raw = localStorage.getItem('raha_prayer_times_today');
    if (!raw) return null;
    const { date, times } = JSON.parse(raw);
    const today = new Date().toISOString().slice(0, 10);
    if (date !== today) return null;
    return times;
  } catch {
    return null;
  }
}

export function savePrayerTimes(times: Record<string, string>) {
  const today = new Date().toISOString().slice(0, 10);
  localStorage.setItem('raha_prayer_times_today', JSON.stringify({ date: today, times }));
}

export function loadPrayerSettings() {
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
