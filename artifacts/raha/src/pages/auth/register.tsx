import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useRegister } from '@workspace/api-client-react';
import { useAuth } from '@/hooks/use-auth';
import { Button, Input, Label } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Info } from 'lucide-react';
import { API_BASE } from '@/lib/api';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const [socialMsg, setSocialMsg] = useState('');
  const [fbLoading, setFbLoading] = useState(false);

  useEffect(() => {
    if (!socialMsg) return;
    const t = setTimeout(() => setSocialMsg(''), 5000);
    return () => clearTimeout(t);
  }, [socialMsg]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/google/start`;
  };

  const handleFacebookLogin = async () => {
    setFbLoading(true);
    setError('');
    try {
      const appId = '1659916948758146';
      await new Promise<void>((resolve) => {
        if ((window as any).FB) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
      (window as any).FB.init({ appId, cookie: true, xfbml: false, version: 'v19.0' });
      const authResponse = await new Promise<any>((resolve, reject) => {
        (window as any).FB.login((resp: any) => {
          if (resp.authResponse) resolve(resp.authResponse);
          else reject(new Error('cancelled'));
        }, { scope: 'email', auth_type: 'rerequest' });
      });
      const res = await fetch(`${API_BASE}/api/auth/facebook/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken: authResponse.accessToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.token) throw new Error(data.message || 'فشل');
      login(data.token);
      setLocation('/');
    } catch (err: any) {
      if (err?.message === 'cancelled') setSocialMsg('تم إلغاء تسجيل الدخول');
      else setSocialMsg(err?.message || 'فشل تسجيل الدخول بـ Facebook — حاول مجدداً');
    } finally {
      setFbLoading(false);
    }
  };

  const mutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
        setLocation('/');
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || 'فشل إنشاء الحساب. تأكد من البيانات.');
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({ data: { name, email, password } });
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden -mt-20 -mx-4">

      {/* Full-bleed Hero with background image */}
      <div className="relative flex-shrink-0 flex flex-col items-center justify-center" style={{ height: '45vh' }}>

        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/images/raha-bg.png)' }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-background/90" />

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10"
        >
          <img
            src="/images/raha-logo.png"
            alt="RAHA - راحة"
            className="w-52 h-52 object-contain drop-shadow-2xl"
          />
        </motion.div>
      </div>

      {/* Form Card */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.25, ease: 'easeOut' }}
        className="flex-1 bg-background rounded-t-[2.5rem] shadow-2xl shadow-black/20 px-6 pt-8 pb-12 -mt-10 relative z-10 border-t border-border/20"
      >
        <div className="max-w-sm mx-auto">

          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

          <div className="mb-5 text-center">
            <h2 className="text-2xl font-bold text-foreground">حساب جديد</h2>
            <p className="text-muted-foreground mt-1 text-sm">انضم إلى مجتمع راحة الإسلامي</p>
          </div>

          <AnimatePresence>
            {socialMsg && (
              <motion.div
                key="social-msg"
                initial={{ opacity: 0, y: -10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="flex items-start gap-2.5 bg-primary/10 border border-primary/25 text-primary rounded-2xl px-4 py-3 mb-4 text-sm font-medium"
              >
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{socialMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Social Login */}
          <div className="space-y-3 mb-5">
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl border-2 border-border bg-card hover:bg-secondary/50 transition-all font-bold text-sm shadow-sm"
            >
              <GoogleIcon />
              <span>متابعة مع Google</span>
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleFacebookLogin}
              disabled={fbLoading}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl bg-[#1877F2] hover:bg-[#166FE5] transition-all font-bold text-sm text-white shadow-md disabled:opacity-70"
            >
              <FacebookIcon />
              <span>{fbLoading ? 'جارٍ التحميل...' : 'متابعة مع Facebook'}</span>
            </motion.button>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium px-1">أو بالبريد الإلكتروني</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-5 text-center font-bold border border-destructive/20"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">الاسم الكامل</Label>
              <Input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="محمد أحمد"
                className="h-12 rounded-xl bg-secondary/50 border-border/50 mt-1"
              />
            </div>
            <div>
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="text-left h-12 rounded-xl bg-secondary/50 border-border/50 mt-1"
                dir="ltr"
              />
            </div>
            <div>
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="text-left h-12 rounded-xl bg-secondary/50 border-border/50 pl-10"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full text-base h-12 rounded-xl mt-2 shadow-lg shadow-primary/30 font-bold"
              isLoading={mutation.isPending}
            >
              إنشاء حساب
            </Button>
          </form>

          <p className="text-center mt-6 text-sm text-muted-foreground">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-primary font-bold hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
