import React, { useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, BookOpen, Clock, User as UserIcon, Moon, Sun, Shield, Library } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const [theme, setTheme] = React.useState<'light' | 'dark'>('light');
  const { user } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem('raha_theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setTheme('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('raha_theme', newTheme);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-panel border-b-0 rounded-b-3xl">
      <div className="max-w-md mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-emerald-400 flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-white font-bold text-xl">ر</span>
          </div>
          <h1 className="text-xl font-bold text-primary">راحة</h1>
        </div>

        <div className="flex items-center gap-1">
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Link
              href="/admin"
              className="p-2.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
            >
              <Shield className="w-5 h-5" />
            </Link>
          )}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full hover:bg-secondary text-muted-foreground hover:text-primary transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { icon: Home, label: 'الرئيسية', path: '/' },
    { icon: BookOpen, label: 'القرآن', path: '/quran' },
    { icon: Library, label: 'المكتبة', path: '/library' },
    { icon: Clock, label: 'الصلاة', path: '/prayer' },
    { icon: UserIcon, label: 'حسابي', path: '/profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-panel border-t-0 rounded-t-3xl pb-safe">
      <div className="max-w-md mx-auto px-2 h-20 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            location === item.path || (item.path !== '/' && location.startsWith(item.path));
          return (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                'flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300',
                isActive ? 'text-primary scale-110' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div
                className={cn(
                  'p-2 rounded-xl transition-all duration-300',
                  isActive ? 'bg-primary/10' : 'bg-transparent'
                )}
              >
                <item.icon className={cn('w-5 h-5', isActive ? 'fill-primary/20' : '')} />
              </div>
              <span className="text-[9px] font-bold mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground flex justify-center">
      <div className="w-full max-w-md relative pb-24 pt-20 shadow-2xl shadow-black/5 min-h-screen bg-background sm:border-x sm:border-border/40">
        <Header />
        <main className="px-4 min-h-full">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
