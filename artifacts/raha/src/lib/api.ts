// Detects if running inside a Capacitor native app (Android/iOS)
const isNative = typeof window !== 'undefined' &&
  (window.location.protocol === 'capacitor:' ||
   window.location.protocol === 'ionic:' ||
   (window as any).Capacitor?.isNativePlatform?.());

// Production API URL — used when running as native Android/iOS app
const PRODUCTION_API = 'https://islamic-hub-aura--procardezo.replit.app';

// When native: use absolute production URL. When web: use relative URL (same origin).
export const API_BASE = isNative ? PRODUCTION_API : '';

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem('raha_token');
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export function getApiBase(): string {
  return API_BASE;
}
