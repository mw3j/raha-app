import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { API_BASE } from "@/lib/api";
import { schedulePrayerNotifications, loadStoredPrayerTimes, loadPrayerSettings } from "@/lib/prayer-notifications";

import Home from "@/pages/home";
import Quran from "@/pages/quran";
import SurahView from "@/pages/surah";
import Prayer from "@/pages/prayer";
import Adhkar from "@/pages/adhkar";
import Tasbih from "@/pages/tasbih";
import Qibla from "@/pages/qibla";
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";
import Profile from "@/pages/profile";
import Favorites from "@/pages/favorites";
import Settings from "@/pages/settings";
import SupportPage from "@/pages/support";
import AdminDashboard from "@/pages/admin/index";
import GoogleCallback from "@/pages/google-callback";
import NotFound from "@/pages/not-found";

// Library
import Library from "@/pages/library/index";
import PillarsPage from "@/pages/library/pillars";
import NamesPage from "@/pages/library/names";
import HadithPage from "@/pages/library/hadith";
import DuasPage from "@/pages/library/duas";
import SeerahPage from "@/pages/library/seerah";
import StoriesPage from "@/pages/library/stories";
import FiqhPage from "@/pages/library/fiqh";
import TafsirPage from "@/pages/library/tafsir";
import HalalHaramPage from "@/pages/library/halal-haram";
import CreedPage from "@/pages/library/creed";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PrayerNotificationInit() {
  useEffect(() => {
    const times = loadStoredPrayerTimes();
    const settings = loadPrayerSettings();
    if (times && settings.notifEnabled) {
      schedulePrayerNotifications(times, settings);
    }
  }, []);
  return null;
}

function GoogleTokenHandler() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const socialToken = params.get("google_token");
    const googleError = params.get("google_error");

    if (socialToken) {
      login(socialToken);
      window.history.replaceState({}, "", window.location.pathname);
      setLocation("/");
      return;
    }
    if (googleError) {
      window.history.replaceState({}, "", window.location.pathname);
      setLocation("/login");
      return;
    }

    const hash = window.location.hash.substring(1);
    if (hash) {
      const hashParams = new URLSearchParams(hash);
      const accessToken = hashParams.get("access_token");
      const hashError = hashParams.get("error");

      if (hashError) {
        window.history.replaceState({}, "", window.location.pathname);
        setLocation("/login");
        return;
      }

      if (accessToken) {
        window.history.replaceState({}, "", window.location.pathname);
        fetch(`${API_BASE}/api/auth/google`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.token) {
              login(data.token);
              setLocation("/");
            } else {
              setLocation("/login");
            }
          })
          .catch(() => setLocation("/login"));
      }
    }
  }, []);

  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/quran" component={Quran} />
      <Route path="/quran/:id" component={SurahView} />
      <Route path="/prayer" component={Prayer} />
      <Route path="/adhkar" component={Adhkar} />
      <Route path="/tasbih" component={Tasbih} />
      <Route path="/qibla" component={Qibla} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={Profile} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/settings" component={Settings} />
      <Route path="/support" component={SupportPage} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/google-callback" component={GoogleCallback} />
      <Route path="/comments">{() => <Redirect to="/" />}</Route>

      {/* Library Routes */}
      <Route path="/library" component={Library} />
      <Route path="/library/pillars" component={PillarsPage} />
      <Route path="/library/names" component={NamesPage} />
      <Route path="/library/hadith" component={HadithPage} />
      <Route path="/library/duas" component={DuasPage} />
      <Route path="/library/seerah" component={SeerahPage} />
      <Route path="/library/stories" component={StoriesPage} />
      <Route path="/library/fiqh" component={FiqhPage} />
      <Route path="/library/tafsir" component={TafsirPage} />
      <Route path="/library/halal-haram" component={HalalHaramPage} />
      <Route path="/library/creed" component={CreedPage} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <PrayerNotificationInit />
            <GoogleTokenHandler />
            <AppLayout>
              <Router />
            </AppLayout>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
