import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button, Card, Badge } from '@/components/ui';
import { LogOut, Settings, Bell, Book, Heart, Shield, Camera, User as UserIcon, Sparkles, BellRing, Pencil, X, Check, Lock, Mail, Eye, EyeOff, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useUpdateProfile, useChangePassword } from '@workspace/api-client-react';

function getRealStats() {
  const today = new Date().toISOString().slice(0, 10);
  let adhkarDone = 0;
  try {
    const val = localStorage.getItem(`raha_adhkar_total_${today}`);
    if (val) adhkarDone = parseInt(val, 10);
  } catch {}

  let tasbihTotal = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tasbih_')) {
        tasbihTotal += parseInt(localStorage.getItem(key) || '0', 10);
      }
    }
  } catch {}

  return { adhkarDone, tasbihTotal };
}

type Panel = 'none' | 'edit-info' | 'change-password';

export default function Profile() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [stats, setStats] = useState({ adhkarDone: 0, tasbihTotal: 0 });
  const [notifStatus, setNotifStatus] = useState<NotificationPermission | 'unsupported'>('default');
  const [panel, setPanel] = useState<Panel>('none');
  const [toast, setToast] = useState<string | null>(null);

  // Edit info form
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [infoError, setInfoError] = useState('');

  // Change password form
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwError, setPwError] = useState('');

  useEffect(() => {
    setStats(getRealStats());
    if ('Notification' in window) {
      setNotifStatus(Notification.permission);
    } else {
      setNotifStatus('unsupported');
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const openEditInfo = () => {
    if (user) {
      setEditName(user.name);
      setEditEmail(user.email);
      setInfoError('');
    }
    setPanel('edit-info');
  };

  const openChangePw = () => {
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    setPwError('');
    setPanel('change-password');
  };

  const getToken = () => localStorage.getItem('raha_token') || '';

  const updateProfile = useUpdateProfile({
    request: { headers: { Authorization: `Bearer ${getToken()}` } },
    mutation: {
      onSuccess: (data) => {
        setUploadingAvatar(false);
        if (panel === 'edit-info') {
          setPanel('none');
          showToast('تم تحديث المعلومات بنجاح ✅');
          setTimeout(() => window.location.reload(), 1200);
        } else {
          showToast('تم تحديث الصورة ✅');
          setTimeout(() => window.location.reload(), 1000);
        }
      },
      onError: () => {
        setUploadingAvatar(false);
        setInfoError('حدث خطأ، يرجى المحاولة مجدداً');
      },
    },
  });

  const changePassword = useChangePassword({
    request: { headers: { Authorization: `Bearer ${getToken()}` } },
    mutation: {
      onSuccess: () => {
        setPanel('none');
        setCurrentPw('');
        setNewPw('');
        setConfirmPw('');
        showToast('تم تغيير كلمة المرور بنجاح ✅');
      },
      onError: (err: any) => {
        const msg = err?.response?.data?.message || 'كلمة المرور الحالية غير صحيحة';
        setPwError(msg);
      },
    },
  });

  const handleSaveInfo = () => {
    setInfoError('');
    if (!editName.trim()) { setInfoError('الاسم مطلوب'); return; }
    if (!editEmail.trim() || !editEmail.includes('@')) { setInfoError('البريد الإلكتروني غير صحيح'); return; }
    updateProfile.mutate({ data: { name: editName.trim(), email: editEmail.trim() } });
  };

  const handleSavePw = () => {
    setPwError('');
    if (!currentPw) { setPwError('أدخل كلمة المرور الحالية'); return; }
    if (newPw.length < 6) { setPwError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل'); return; }
    if (newPw !== confirmPw) { setPwError('كلمة المرور الجديدة غير متطابقة'); return; }
    changePassword.mutate({ data: { currentPassword: currentPw, newPassword: newPw } });
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 400;
        let { width, height } = img;
        if (width > height) {
          if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
        } else {
          if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Canvas not supported')); return; }
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('يرجى اختيار صورة صالحة'); return; }
    try {
      setUploadingAvatar(true);
      const compressed = await compressImage(file);
      setAvatarPreview(compressed);
      updateProfile.mutate({ data: { avatar: compressed } });
    } catch {
      setUploadingAvatar(false);
      alert('فشل في معالجة الصورة، حاول مجدداً');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-in fade-in space-y-6">
        <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center text-primary mb-2">
          <UserIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold">سجل دخولك أولاً</h2>
        <p className="text-muted-foreground">يرجى تسجيل الدخول للوصول إلى ملفك الشخصي ومتابعة تقدمك</p>
        <Button size="lg" className="w-full max-w-xs mt-4" onClick={() => setLocation('/login')}>
          تسجيل الدخول
        </Button>
      </div>
    );
  }

  const avatarSrc = avatarPreview || user.avatar;
  const roleName = user.role === 'superadmin' ? 'سوبر أدمن' : user.role === 'admin' ? 'مشرف' : 'مستخدم';

  return (
    <div className="space-y-5 pb-8 animate-in slide-in-from-bottom-4 duration-500 relative">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary text-white px-5 py-3 rounded-2xl shadow-xl text-sm font-bold animate-in fade-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      {/* Avatar + Name */}
      <div className="text-center py-6">
        <div className="relative w-28 h-28 mx-auto mb-4">
          {avatarSrc ? (
            <img src={avatarSrc} alt={user.name} className="w-28 h-28 rounded-full object-cover border-4 border-background shadow-xl shadow-primary/20" />
          ) : (
            <div className="w-28 h-28 bg-gradient-to-tr from-primary to-emerald-400 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl shadow-primary/30 border-4 border-background">
              {user.name.charAt(0)}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAvatar}
            className="absolute bottom-0 left-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg border-2 border-background hover:bg-primary/90 transition-colors"
          >
            {uploadingAvatar ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <p className="text-muted-foreground mt-1 text-sm" dir="ltr">{user.email}</p>
        <div className="mt-3 flex justify-center gap-2 flex-wrap">
          <Badge variant="gold" className="px-3 py-1 text-sm">{roleName}</Badge>
          <Badge variant="secondary" className="px-3 py-1 text-sm">عضو منذ {format(new Date(user.createdAt), 'yyyy')}</Badge>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 text-center hover:border-primary transition-colors cursor-pointer group" onClick={() => setLocation('/adhkar')}>
          <Book className="w-8 h-8 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2" />
          <h4 className="font-bold text-lg">{stats.adhkarDone}</h4>
          <p className="text-xs text-muted-foreground">ذكر اليوم</p>
        </Card>
        <Card className="p-4 text-center hover:border-primary transition-colors cursor-pointer group" onClick={() => setLocation('/tasbih')}>
          <Sparkles className="w-8 h-8 mx-auto text-muted-foreground group-hover:text-emerald-500 transition-colors mb-2" />
          <h4 className="font-bold text-lg">{stats.tasbihTotal}</h4>
          <p className="text-xs text-muted-foreground">تسبيحة إجمالية</p>
        </Card>
      </div>

      {/* Edit Info Panel */}
      {panel === 'edit-info' && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-lg">تعديل المعلومات</h3>
            <button onClick={() => setPanel('none')} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-muted-foreground block mb-1.5">الاسم</label>
              <div className="relative">
                <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  placeholder="أدخل اسمك"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-right"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground block mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="أدخل بريدك الإلكتروني"
                  dir="ltr"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-left"
                />
              </div>
            </div>
          </div>

          {infoError && <p className="text-sm text-destructive text-center font-medium">{infoError}</p>}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setPanel('none')}>إلغاء</Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSaveInfo}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              حفظ
            </Button>
          </div>
        </div>
      )}

      {/* Change Password Panel */}
      {panel === 'change-password' && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-lg">تغيير كلمة المرور</h3>
            <button onClick={() => setPanel('none')} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-muted-foreground block mb-1.5">كلمة المرور الحالية</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showCurrentPw ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => setCurrentPw(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pr-10 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-left"
                />
                <button type="button" onClick={() => setShowCurrentPw(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground block mb-1.5">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type={showNewPw ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => setNewPw(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pr-10 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-left"
                />
                <button type="button" onClick={() => setShowNewPw(v => !v)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-muted-foreground block mb-1.5">تأكيد كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full bg-secondary border border-border rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors text-left"
                />
              </div>
            </div>
          </div>

          {pwError && <p className="text-sm text-destructive text-center font-medium">{pwError}</p>}

          {newPw && confirmPw && newPw === confirmPw && (
            <p className="text-sm text-primary text-center font-medium">كلمة المرور متطابقة ✅</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setPanel('none')}>إلغاء</Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSavePw}
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
              تغيير
            </Button>
          </div>
        </div>
      )}

      {/* Actions List */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">

        <button
          onClick={openEditInfo}
          className="w-full flex items-center gap-4 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-right"
        >
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Pencil className="w-5 h-5" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="font-bold text-base">تعديل المعلومات الشخصية</h4>
            <p className="text-xs text-muted-foreground">الاسم والبريد الإلكتروني</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
        </button>

        <button
          onClick={openChangePw}
          className="w-full flex items-center gap-4 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-right"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="font-bold text-base">تغيير كلمة المرور</h4>
            <p className="text-xs text-muted-foreground">تحديث كلمة المرور الخاصة بك</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
        </button>

        {(user.role === 'admin' || user.role === 'superadmin') && (
          <button
            onClick={() => setLocation('/admin')}
            className="w-full flex items-center gap-4 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-right text-primary"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex-1 text-right">
              <h4 className="font-bold text-base">لوحة التحكم</h4>
              <p className="text-xs text-primary/70 font-normal">إدارة المستخدمين والمنشورات</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
          </button>
        )}

        <button
          onClick={() => setLocation('/favorites')}
          className="w-full flex items-center gap-4 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-right"
        >
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
            <Heart className="w-5 h-5" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="font-bold text-base">المفضلة</h4>
            <p className="text-xs text-muted-foreground">المنشورات المحفوظة</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
        </button>

        <button
          onClick={() => setLocation('/adhkar')}
          className="w-full flex items-center gap-4 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-right"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
            <Book className="w-5 h-5" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="font-bold text-base">الأذكار</h4>
            <p className="text-xs text-muted-foreground">أذكاري اليومية</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
        </button>

        <button
          onClick={() => setLocation('/settings')}
          className="w-full flex items-center gap-4 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-right"
        >
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
            <Settings className="w-5 h-5" />
          </div>
          <div className="flex-1 text-right">
            <h4 className="font-bold text-base">الإعدادات</h4>
            <p className="text-xs text-muted-foreground">المظهر والإشعارات والتفضيلات</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
        </button>

        <button
          className="w-full flex items-center gap-4 p-4 border-b border-border/50 hover:bg-secondary/50 transition-colors text-right"
          onClick={async () => {
            if (notifStatus === 'unsupported') { alert('المتصفح لا يدعم الإشعارات'); return; }
            if (notifStatus === 'granted') { alert('الإشعارات مفعّلة بالفعل ✅'); return; }
            if (notifStatus === 'denied') { alert('الإشعارات محظورة. يرجى السماح بها من إعدادات المتصفح'); return; }
            const perm = await Notification.requestPermission();
            setNotifStatus(perm);
            if (perm === 'granted') showToast('تم تفعيل الإشعارات ✅');
          }}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${notifStatus === 'granted' ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'}`}>
            {notifStatus === 'granted' ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div className="flex-1 text-right">
            <h4 className="font-bold text-base">الإشعارات</h4>
            <p className="text-xs text-muted-foreground">{notifStatus === 'granted' ? 'مفعّلة ✅' : notifStatus === 'denied' ? 'محظورة ❌' : 'اضغط للتفعيل'}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground rotate-180" />
        </button>

        <button
          onClick={() => { logout(); setLocation('/login'); }}
          className="w-full flex items-center gap-4 p-4 hover:bg-destructive/5 transition-colors text-right text-destructive"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <h4 className="font-bold flex-1 text-base">تسجيل الخروج</h4>
          <ChevronRight className="w-4 h-4 text-destructive/50 rotate-180" />
        </button>
      </div>
    </div>
  );
}
