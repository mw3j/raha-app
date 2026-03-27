import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Button, Input, Label } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const token = new URLSearchParams(window.location.search).get('token') || '';

  useEffect(() => {
    if (!token) {
      setVerifying(false);
      setTokenValid(false);
      return;
    }
    const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
    fetch(`${base}/api/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        setTokenValid(data.valid);
        if (data.email) setUserEmail(data.email);
      })
      .catch(() => setTokenValid(false))
      .finally(() => setVerifying(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('كلمة المرور وتأكيدها غير متطابقتين');
      return;
    }
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      const res = await fetch(`${base}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'حدث خطأ، يرجى المحاولة مجدداً');
        return;
      }
      setSuccess(true);
      setTimeout(() => setLocation('/login'), 3000);
    } catch {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden -mt-20 -mx-4">
      <div className="relative flex-shrink-0 flex flex-col items-center justify-center" style={{ height: '40vh' }}>
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/images/raha-bg.png)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-background/90" />
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 flex flex-col items-center"
        >
          <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
            <Lock className="w-10 h-10 text-white" />
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
        className="flex-1 bg-background rounded-t-[2.5rem] shadow-2xl shadow-black/20 px-6 pt-8 pb-12 -mt-10 relative z-10 border-t border-border/20"
      >
        <div className="max-w-sm mx-auto">
          <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />

          <AnimatePresence mode="wait">
            {verifying ? (
              <motion.div key="verifying" className="text-center py-12" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">جارٍ التحقق من الرابط...</p>
              </motion.div>
            ) : !tokenValid ? (
              <motion.div key="invalid" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">رابط غير صالح</h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  هذا الرابط غير صالح أو انتهت صلاحيته. يرجى طلب رابط جديد.
                </p>
                <Link href="/forgot-password">
                  <Button className="w-full h-12 rounded-xl font-bold">طلب رابط جديد</Button>
                </Link>
                <p className="text-center mt-4 text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary font-bold hover:underline">العودة لتسجيل الدخول</Link>
                </p>
              </motion.div>
            ) : success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">تم بنجاح!</h2>
                <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                  تم تغيير كلمة المرور بنجاح. سيتم توجيهك لصفحة تسجيل الدخول...
                </p>
                <Link href="/login">
                  <Button className="w-full h-12 rounded-xl font-bold">تسجيل الدخول</Button>
                </Link>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-foreground">إعادة تعيين كلمة المرور</h2>
                  {userEmail && (
                    <p className="text-muted-foreground mt-2 text-sm">
                      <span className="font-medium text-foreground" dir="ltr">{userEmail}</span>
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-destructive/10 text-destructive text-sm p-3 rounded-xl mb-4 text-center font-bold border border-destructive/20"
                  >
                    {error}
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword" type={showPass ? 'text' : 'password'} required
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="6 أحرف على الأقل"
                        className="text-left h-12 rounded-xl bg-secondary/50 border-border/50 pl-10"
                        dir="ltr" autoComplete="new-password" minLength={6}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword" type={showConfirm ? 'text' : 'password'} required
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="text-left h-12 rounded-xl bg-secondary/50 border-border/50 pl-10"
                        dir="ltr" autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-base h-12 rounded-xl mt-2 shadow-lg shadow-primary/30 font-bold"
                    isLoading={loading}
                  >
                    تغيير كلمة المرور
                  </Button>
                </form>

                <p className="text-center mt-5 text-sm text-muted-foreground">
                  <Link href="/login" className="text-primary font-bold hover:underline">العودة لتسجيل الدخول</Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
