import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, ChevronLeft, AlertCircle } from 'lucide-react';
import { useLocation } from 'wouter';

const MECCA = { lat: 21.4225, lng: 39.8262 };

function calcQiblaDeg(userLat: number, userLng: number): number {
  const lat1 = (userLat * Math.PI) / 180;
  const lat2 = (MECCA.lat * Math.PI) / 180;
  const dLng = ((MECCA.lng - userLng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export default function Qibla() {
  const [, setLocation] = useLocation();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [qiblaDeg, setQiblaDeg] = useState<number | null>(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [hasCompass, setHasCompass] = useState(false);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setQiblaDeg(calcQiblaDeg(latitude, longitude));
          setLoading(false);
        },
        () => {
          setError('تعذّر الحصول على موقعك. يرجى السماح بالوصول للموقع.');
          setLoading(false);
        }
      );
    } else {
      setError('متصفحك لا يدعم تحديد الموقع.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      setHasCompass(true);
      // iOS: webkitCompassHeading, Android: 360 - alpha
      const heading = (e as any).webkitCompassHeading ?? (e.alpha !== null ? 360 - e.alpha : 0);
      setCompassHeading(heading);
    };

    const requestPermission = async () => {
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        try {
          const perm = await (DeviceOrientationEvent as any).requestPermission();
          if (perm === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation, true);
          }
        } catch {}
      } else {
        window.addEventListener('deviceorientation', handleOrientation, true);
        window.addEventListener('deviceorientationabsolute', handleOrientation, true);
      }
    };

    requestPermission();
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true);
      window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
    };
  }, []);

  const needleRotation = qiblaDeg !== null ? qiblaDeg - compassHeading : 0;
  const isAccurate = hasCompass;

  return (
    <div className="flex flex-col items-center animate-in fade-in duration-500 pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pt-2 w-full">
        <button onClick={() => setLocation('/prayer')} className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold">اتجاه القبلة</h2>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">جارٍ تحديد موقعك...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <AlertCircle className="w-16 h-16 text-destructive/50 mb-4" />
          <p className="text-destructive font-bold">{error}</p>
        </div>
      ) : (
        <>
          {/* Compass */}
          <div className="relative w-72 h-72 mb-8">
            {/* Outer ring */}
            <div className="absolute inset-0 rounded-full border-4 border-border bg-card shadow-2xl overflow-hidden">
              {/* Compass marks */}
              {['ش', 'شرق', 'ج', 'غرب'].map((label, i) => (
                <span
                  key={label}
                  className="absolute text-xs font-bold text-muted-foreground"
                  style={{
                    top: i === 0 ? '8px' : i === 2 ? 'auto' : '50%',
                    bottom: i === 2 ? '8px' : 'auto',
                    left: i === 3 ? '8px' : i === 1 ? 'auto' : '50%',
                    right: i === 1 ? '8px' : 'auto',
                    transform: i === 0 || i === 2 ? 'translateX(-50%)' : 'translateY(-50%)',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Rotating compass ring */}
            <motion.div
              className="absolute inset-4 rounded-full"
              animate={{ rotate: -compassHeading }}
              transition={{ type: 'spring', stiffness: 60, damping: 20 }}
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-red-500 rounded-full" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-6 bg-muted-foreground/40 rounded-full" />
            </motion.div>

            {/* Qibla needle */}
            {qiblaDeg !== null && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ rotate: needleRotation }}
                transition={{ type: 'spring', stiffness: 80, damping: 20 }}
              >
                <div className="relative h-56 w-6 flex flex-col items-center">
                  <div className="w-6 h-28 bg-gradient-to-b from-primary to-primary/70 rounded-t-full shadow-md shadow-primary/40" />
                  <div className="w-6 h-28 bg-secondary/60 rounded-b-full" />
                  <div className="absolute top-[108px] w-5 h-5 rounded-full bg-white border-2 border-primary shadow" />
                </div>
              </motion.div>
            )}

            {/* Kaaba icon in center */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-10 h-10 bg-card rounded-full flex items-center justify-center text-2xl shadow border border-border">
                🕋
              </div>
            </div>
          </div>

          {/* Info cards */}
          <div className="w-full space-y-3 px-2">
            <div className="bg-card rounded-2xl p-4 flex items-center gap-4 border border-border shadow-sm">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Navigation className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">اتجاه القبلة</p>
                <p className="font-bold text-xl">{qiblaDeg?.toFixed(1)}° شمالاً</p>
              </div>
            </div>

            {userLocation && (
              <div className="bg-card rounded-2xl p-4 flex items-center gap-4 border border-border shadow-sm">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">موقعك الحالي</p>
                  <p className="font-mono text-sm">{userLocation.lat.toFixed(4)}°N, {userLocation.lng.toFixed(4)}°E</p>
                </div>
              </div>
            )}

            {!isAccurate && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 flex gap-3 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  البوصلة غير متاحة. الاتجاه محسوب جغرافياً فقط. للدقة العالية يُنصح باستخدام جهاز يحتوي على بوصلة.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
