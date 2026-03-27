export type ThemeId = 'emerald' | 'blue' | 'red' | 'purple' | 'green' | 'gold';

export interface Theme {
  id: ThemeId;
  name: string;
  nameAr: string;
  primary: string;
  secondary: string;
  emoji: string;
}

export const THEMES: Theme[] = [
  { id: 'emerald', name: 'Emerald',  nameAr: 'الزمردي الإسلامي', primary: '#1a7a4a', secondary: '#c9a227', emoji: '🌿' },
  { id: 'blue',    name: 'Royal Blue', nameAr: 'الأزرق الملكي',   primary: '#1E40AF', secondary: '#F59E0B', emoji: '🔵' },
  { id: 'red',     name: 'Red',        nameAr: 'الأحمر الفاخر',   primary: '#DC2626', secondary: '#F97316', emoji: '🔴' },
  { id: 'purple',  name: 'Purple',     nameAr: 'البنفسجي الملكي', primary: '#7C3AED', secondary: '#EC4899', emoji: '💜' },
  { id: 'green',   name: 'Green',      nameAr: 'الأخضر الطبيعي',  primary: '#059669', secondary: '#84CC16', emoji: '🌱' },
  { id: 'gold',    name: 'Gold',       nameAr: 'الذهبي الفاخر',   primary: '#B8860B', secondary: '#FFD700', emoji: '✨' },
];

export function getStoredTheme(): ThemeId {
  return (localStorage.getItem('raha_color_theme') as ThemeId) || 'emerald';
}

export function applyTheme(themeId: ThemeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('raha_color_theme', themeId);
}

export function initTheme() {
  const theme = getStoredTheme();
  applyTheme(theme);
  const darkPref = localStorage.getItem('raha_theme');
  if (darkPref === 'dark') {
    document.documentElement.classList.add('dark');
  } else if (darkPref === 'light') {
    document.documentElement.classList.remove('dark');
  }
}
