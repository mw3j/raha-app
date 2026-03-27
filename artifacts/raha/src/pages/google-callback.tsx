import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { API_BASE } from '@/lib/api';

export default function GoogleCallback() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const errorParam = params.get('error');

    if (errorParam) {
      setError('تم إلغاء تسجيل الدخول');
      setTimeout(() => setLocation('/login'), 2000);
      return;
    }

    if (!accessToken) {
      setError('فشل الحصول على رمز الدخول');
      setTimeout(() => setLocation('/login'), 2000);
      return;
    }

    fetch(`${API_BASE}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.token) {
          login(data.token);
          setLocation('/');
        } else {
          throw new Error(data.message || 'فشل التحقق');
        }
      })
      .catch(() => {
        setError('فشل تسجيل الدخول عبر Google — حاول مجدداً');
        setTimeout(() => setLocation('/login'), 2500);
      });
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6">
      {error ? (
        <>
          <p className="text-destructive font-bold text-lg">{error}</p>
          <p className="text-muted-foreground text-sm">جارٍ إعادة التوجيه...</p>
        </>
      ) : (
        <>
          <svg className="animate-spin w-10 h-10 text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-foreground font-bold text-lg">جارٍ تسجيل الدخول عبر Google...</p>
        </>
      )}
    </div>
  );
}
