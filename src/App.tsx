import { useCallback, useEffect, useState } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { HistoryView } from "@/components/History";
import { Login } from "@/components/Login";
import { ReportsView } from "@/components/Reports";
import { Sidebar } from "@/components/Sidebar";
import { TimerView } from "@/components/Timer";
import { TitleBar } from "@/components/TitleBar";
import { useEntries } from "@/hooks/useEntries";
import { getSession, logout as ipcLogout } from "@/lib/ipc";
import { parseUserFromCookie } from "@/types";

import type { UserInfo, View } from "@/types";

export default function App() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeView, setActiveView] = useState<View>("timer");
  const { entries, projects, loading, addEntry, removeEntry, reload } =
    useEntries();

  useEffect(() => {
    getSession().then((session) => {
      const isGuest = session && /user_id=Guest/i.test(session);
      setAuthenticated(!!session && !isGuest);
      if (session && !isGuest) {
        setUserInfo(parseUserFromCookie(session));
      }
    });
  }, []);

  const handleAuthenticated = useCallback(() => {
    getSession().then((session) => {
      if (session) setUserInfo(parseUserFromCookie(session));
    });
    setAuthenticated(true);
    reload();
  }, [reload]);

  const handleLogout = useCallback(async () => {
    await ipcLogout();
    setAuthenticated(false);
    setUserInfo(null);
  }, []);

  if (authenticated === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex h-screen flex-col">
        <TitleBar />
        {!authenticated ? (
          <Login onAuthenticated={handleAuthenticated} />
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center bg-background">
            <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1">
            <Sidebar
              activeView={activeView}
              onViewChange={setActiveView}
              onLogout={handleLogout}
              userInfo={userInfo}
            />
            <main className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto bg-background p-4 sm:p-6 md:p-8">
              {activeView === "timer" && (
                <TimerView projects={projects} onSave={addEntry} />
              )}
              {activeView === "history" && (
                <HistoryView
                  entries={entries}
                  projects={projects}
                  onDelete={removeEntry}
                />
              )}
              {activeView === "reports" && (
                <ReportsView entries={entries} projects={projects} />
              )}
            </main>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
