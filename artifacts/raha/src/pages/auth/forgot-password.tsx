import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button, Input, Label } from '@/components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const base = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';
      const res = await fetch(`${base}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'حدث خطأ، يرجى المحاولة مجدداً');
        return;
      }
      setSuccess(true);
    } catch {
      setError('حدث خطأ في الاتصال بالخادم، يرجى المحاولة مجدداً');
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
            <Mail className="w-10 h-10 text-white" />
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
            {!success ? (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-bold text-foreground">نسيت كلمة المرور؟</h2>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور
                  </p>
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
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email" type="email" required value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="text-left h-12 rounded-xl bg-secondary/50 border-border/50 mt-1"
                      dir="ltr" autoComplete="email"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full text-base h-12 rounded-xl mt-2 shadow-lg shadow-primary/30 font-bold"
                    isLoading={loading}
                  >
                    إرسال رابط إعادة التعيين
                  </Button>
                </form>

                <p className="text-center mt-6 text-sm text-muted-foreground">
                  تذكرت كلمة المرور؟{' '}
                  <Link href="/login" className="text-primary font-bold hover:underline">تسجيل الدخول</Link>
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                <div className="flex justify-center mb-5">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-3">تم الإرسال!</h2>

                <div className="bg-secondary/50 rounded-2xl p-5 mb-6 text-right border border-border/50 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Mail className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground mb-1">تحقق من بريدك الإلكتروني</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        أرسلنا رابط إعادة التعيين إلى <span className="font-medium text-foreground" dir="ltr">{email}</span>
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-border/50 pt-3 space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2"><span className="text-yellow-500">⚠️</span> الرابط صالح لمدة ساعة واحدة فقط</p>
                    <p className="flex items-center gap-2"><span>📁</span> تحقق من مجلد البريد العشوائي إذا لم تجد الرسالة</p>
                    <p className="flex items-center gap-2"><span>🔁</span> يمكنك طلب رابط جديد إذا انتهت صلاحيته</p>
                  </div>
                </div>

                <Link href="/login">
                  <button className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-border bg-card hover:bg-secondary/50 transition-all font-bold text-sm">
                    <ArrowRight className="w-4 h-4" />
                    العودة لتسجيل الدخول
                  </button>
                </Link>

                <button
                  onClick={() => { setSuccess(false); setEmail(''); }}
                  className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                >
                  إرسال إلى بريد إلكتروني آخر
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
