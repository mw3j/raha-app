import React, { useState, useEffect } from 'react';
import { Moon, Sun, Bell, BellOff, MapPin, Trash2, ChevronLeft, Volume2, Palette, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui';
import { motion } from 'framer-motion';
import { THEMES, type ThemeId, getStoredTheme, applyTheme } from '@/lib/theme';
import { useLocation } from 'wouter';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-secondary'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'right-1' : 'right-7'}`} />
    </button>
  );
}

export default function Settings() {
  const [, navigate] = useLocation();
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [savedLocation, setSavedLocation] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('raha_font_size') || 'medium');
  const [activeTheme, setActiveTheme] = useState<ThemeId>(() => getStoredTheme());
  const version = '1.0.0';

  useEffect(() => {
    if ('Notification' in window) setNotifEnabled(Notification.permission === 'granted');
    const loc = localStorage.getItem('raha_location');
    if (loc) {
      try { setSavedLocation(JSON.parse(loc).name); } catch {}
    }
  }, []);

  const toggleDark = (v: boolean) => {
    setDarkMode(v);
    document.documentElement.classList.toggle('dark', v);
    localStorage.setItem('raha_theme', v ? 'dark' : 'light');
  };

  const toggleNotif = async (v: boolean) => {
    if (!('Notification' in window)) return;
    if (v) {
      const perm = await Notification.requestPermission();
      setNotifEnabled(perm === 'granted');
    } else {
      setNotifEnabled(false);
    }
  };

  const clearLocation = () => {
    localStorage.removeItem('raha_location');
    setSavedLocation(null);
  };

  const clearFavorites = () => {
    if (confirm('هل تريد حذف جميع المنشورات المحفوظة؟')) {
      localStorage.removeItem('raha_saved_posts');
      window.dispatchEvent(new Event('raha_saved_changed'));
      alert('تم حذف المفضلة ✅');
    }
  };

  const clearAdhkar = () => {
    if (confirm('هل تريد إعادة تعيين تقدم الأذكار؟')) {
      Object.keys(localStorage).filter(k => k.startsWith('raha_adhkar')).forEach(k => localStorage.removeItem(k));
      alert('تم إعادة تعيين الأذكار ✅');
    }
  };

  const changeFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem('raha_font_size', size);
    const root = document.documentElement;
    if (size === 'small') root.style.fontSize = '14px';
    else if (size === 'large') root.style.fontSize = '18px';
    else root.style.fontSize = '16px';
  };

  const changeTheme = (themeId: ThemeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center gap-3 pt-2">
        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-primary" />
        </div>
        <h1 className="text-xl font-bold">الإعدادات</h1>
      </div>

      {/* لون التطبيق */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">لون التطبيق</p>
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold text-sm">اختر ثيم التطبيق</p>
              <p className="text-xs text-muted-foreground">الثيم المختار: {THEMES.find(t => t.id === activeTheme)?.nameAr}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map(theme => (
              <button
                key={theme.id}
                onClick={() => changeTheme(theme.id)}
                className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  activeTheme === theme.id
                    ? 'border-primary bg-primary/10 scale-105 shadow-md'
                    : 'border-border hover:border-primary/40 hover:scale-[1.02]'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full shadow-md"
                  style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})` }}
                />
                <span className="text-xs font-bold leading-tight text-center">{theme.nameAr}</span>
                {activeTheme === theme.id && (
                  <div className="absolute top-1 left-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* المظهر */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">المظهر</p>
        <Card className="overflow-hidden divide-y divide-border/50">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-amber-500" />}
              <div>
                <p className="font-bold text-sm">الوضع الليلي</p>
                <p className="text-xs text-muted-foreground">{darkMode ? 'مفعّل' : 'غير مفعّل'}</p>
              </div>
            </div>
            <Toggle checked={darkMode} onChange={toggleDark} />
          </div>

          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Volume2 className="w-5 h-5 text-primary" />
              <p className="font-bold text-sm">حجم الخط</p>
            </div>
            <div className="flex gap-2">
              {[{ val: 'small', label: 'صغير' }, { val: 'medium', label: 'متوسط' }, { val: 'large', label: 'كبير' }].map(s => (
                <button
                  key={s.val}
                  onClick={() => changeFontSize(s.val)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${fontSize === s.val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* الإشعارات */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">الإشعارات</p>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {notifEnabled ? <Bell className="w-5 h-5 text-primary" /> : <BellOff className="w-5 h-5 text-muted-foreground" />}
              <div>
                <p className="font-bold text-sm">إشعارات الصلاة</p>
                <p className="text-xs text-muted-foreground">{notifEnabled ? 'ستصل إشعارات عند كل صلاة' : 'اضغط للتفعيل'}</p>
              </div>
            </div>
            <Toggle checked={notifEnabled} onChange={toggleNotif} />
          </div>
        </Card>
      </div>

      {/* الموقع */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">الموقع</p>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold text-sm">الموقع المحفوظ</p>
                <p className="text-xs text-muted-foreground">{savedLocation || 'لم يتم التحديد بعد'}</p>
              </div>
            </div>
            {savedLocation && (
              <button onClick={clearLocation} className="text-xs text-red-500 font-bold hover:underline">
                حذف
              </button>
            )}
          </div>
        </Card>
      </div>

      {/* البيانات */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">البيانات</p>
        <Card className="overflow-hidden divide-y divide-border/50">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={clearFavorites}
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-right"
          >
            <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-red-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">حذف المفضلة</p>
              <p className="text-xs text-muted-foreground">مسح جميع المنشورات المحفوظة</p>
            </div>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={clearAdhkar}
            className="w-full flex items-center gap-3 p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-right"
          >
            <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Trash2 className="w-4 h-4 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">إعادة تعيين الأذكار</p>
              <p className="text-xs text-muted-foreground">مسح سجل الأذكار اليومية</p>
            </div>
          </motion.button>
        </Card>
      </div>

      {/* الدعم والتواصل */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">الدعم</p>
        <Card className="overflow-hidden">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/support')}
            className="w-full flex items-center gap-3 p-4 hover:bg-primary/5 transition-colors text-right"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">تواصل معنا</p>
              <p className="text-xs text-muted-foreground">مشكلة، اقتراح، أو استفسار</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        </Card>
      </div>

      {/* حول التطبيق */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 px-1">حول التطبيق</p>
        <Card className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">الإصدار</span>
            <span className="font-bold">{version}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">التطبيق</span>
            <span className="font-bold">راحة RAHA</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">البيانات الدينية</span>
            <span className="font-bold text-primary">موثّقة من مصادر معتمدة</span>
          </div>
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/50">
            🌙 تطبيق إسلامي شامل — القرآن، الصلاة، الأذكار، القبلة
          </p>
        </Card>
      </div>
    </div>
  );
}
