import { useState } from "react";
import { TitleBar } from "./components/TitleBar";
import { Sidebar } from "./components/Sidebar";
import { TimerView } from "./components/Timer";
import { HistoryView } from "./components/History";
import { ReportsView } from "./components/Reports";
import { useEntries } from "./hooks/useEntries";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { View } from "./types";

export default function App() {
  const [activeView, setActiveView] = useState<View>("timer");
  const { entries, projects, loading, addEntry, removeEntry } = useEntries();

  if (loading) {
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
        <div className="flex flex-1 overflow-hidden">
          <Sidebar activeView={activeView} onViewChange={setActiveView} />
          <main className="custom-scrollbar flex-1 overflow-y-auto bg-background p-8">
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
      </div>
    </TooltipProvider>
  );
}
