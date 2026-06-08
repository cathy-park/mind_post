import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import Record from "@/pages/record";
import Archive from "@/pages/archive";
import TimeLetter from "@/pages/time-letter";
import Calendar from "@/pages/calendar";
import Settings from "@/pages/settings";
import NotFound from "@/pages/not-found";
import { GuestProvider, useGuest } from "@/lib/guest-context";
import { queryClient } from "@/lib/query-client";
import { useSupabaseAuth } from "@/hooks/use-supabase-auth";
import { Loader2 } from "lucide-react";

function InitSettings() {
  useEffect(() => {
    const data = localStorage.getItem('onul-settings');
    if (data) {
      const settings = JSON.parse(data);
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      }
    }
  }, []);
  return null;
}

function SyncOverlay() {
  const { isSyncing } = useSupabaseAuth();
  
  if (!isSyncing) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
      <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
      <h2 className="text-xl font-bold mb-2">동기화 진행 중...</h2>
      <p className="text-muted-foreground text-center px-4">임시로 작성하신 기록들을 안전하게 클라우드에 저장하고 있습니다.<br/>잠시만 기다려주세요.</p>
    </div>
  );
}

function GuestNavigator() {
  const { initialPath, clearInitialPath } = useGuest();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (initialPath) {
      setLocation(initialPath);
      clearInitialPath();
    }
  }, [initialPath, setLocation, clearInitialPath]);

  return null;
}

function Router() {
  return (
    <>
      <GuestNavigator />
      <Switch>
        <Route path="/" component={Archive} />
        <Route path="/home" component={Home} />
        <Route path="/record" component={Record} />
        <Route path="/time-letter" component={TimeLetter} />
        <Route path="/calendar" component={Calendar} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <InitSettings />
      <GuestProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
            <SyncOverlay />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </GuestProvider>
    </QueryClientProvider>
  );
}

export default App;
