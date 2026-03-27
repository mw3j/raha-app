import React, { useState } from 'react';
import { MessageCircle, Bug, Lightbulb, HelpCircle, MoreHorizontal, Send, CheckCircle, ChevronDown } from 'lucide-react';
import { Card, Button, Input } from '@/components/ui';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';

const TYPES = [
  { id: 'bug', label: 'مشكلة تقنية', icon: Bug, color: 'text-red-500 bg-red-50 dark:bg-red-950/30' },
  { id: 'suggestion', label: 'اقتراح تحسين', icon: Lightbulb, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' },
  { id: 'question', label: 'استفسار', icon: HelpCircle, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' },
  { id: 'other', label: 'أخرى', icon: MoreHorizontal, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/30' },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [type, setType] = useState('bug');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setError('يرجى تعبئة جميع الحقول');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiFetch('/api/support', {
        method: 'POST',
        body: JSON.stringify({ name, email, type, subject, message }),
      });
      setSent(true);
    } catch (err: any) {
      setError(err?.message || 'حدث خطأ. يرجى المحاولة مجدداً.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center animate-in fade-in duration-500">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <CheckCircle className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">تم الإرسال بنجاح</h2>
        <p className="text-muted-foreground mb-8 max-w-xs">
          شكراً لتواصلك معنا! سنراجع رسالتك ونرد عليك في أقرب وقت ممكن.
        </p>
        <Button onClick={() => { setSent(false); setSubject(''); setMessage(''); }} variant="outline">
          إرسال رسالة أخرى
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-emerald-700 rounded-[2rem] p-6 text-white -mx-2 mt-2 shadow-xl shadow-primary/20">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">تواصل معنا</h1>
            <p className="text-emerald-100 text-sm mt-0.5">نحن هنا لمساعدتك في أي وقت</p>
          </div>
        </div>
      </div>

      {/* Type Selector */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground mb-3 px-1">نوع الرسالة</p>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const Icon = t.icon;
            const isSelected = type === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-right ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${t.color}`}>
                  <Icon className="w-4.5 h-4.5 w-5 h-5" />
                </div>
                <span className={`font-semibold text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <Card className="p-5 space-y-4 border-none shadow-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">الاسم</label>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="اسمك"
                className="text-right"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">البريد الإلكتروني</label>
              <Input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="text-right"
                required
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">الموضوع</label>
            <Input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="موضوع رسالتك..."
              className="text-right"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">الرسالة</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="اشرح مشكلتك أو اقتراحك بالتفصيل..."
              className="w-full min-h-[130px] p-3 rounded-xl border border-input bg-background text-right text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              required
              dir="rtl"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Send className="w-5 h-5" />إرسال الرسالة</>
            )}
          </button>
        </form>
      </Card>

      {/* Info */}
      <div className="bg-secondary/50 rounded-2xl p-4 text-center">
        <p className="text-sm text-muted-foreground">
          نسعى للرد على جميع الرسائل خلال <span className="font-bold text-foreground">24 ساعة</span>
        </p>
      </div>
    </div>
  );
}
