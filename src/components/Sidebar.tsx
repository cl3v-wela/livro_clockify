import { Timer, History, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { View } from "../types";

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
}

const navItems: { view: View; label: string; icon: typeof Timer }[] = [
  { view: "timer", label: "Timer", icon: Timer },
  { view: "history", label: "History", icon: History },
  { view: "reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  return (
    <aside className="flex w-[200px] min-w-[200px] flex-col border-r border-border bg-sidebar-background pt-5 select-none">
      <div className="flex items-center gap-2.5 px-5 pb-7">
        <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-white">
          <Timer size={18} strokeWidth={2.5} />
        </div>
        <span className="text-[15px] font-bold tracking-tight text-foreground">
          Clockify
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-2.5">
        {navItems.map(({ view, label, icon: Icon }) => (
          <Button
            key={view}
            variant={activeView === view ? "secondary" : "ghost"}
            className={cn(
              "relative h-9 w-full justify-start gap-2.5 px-3 text-[13px] font-medium",
              activeView === view
                ? "bg-primary/15 text-primary font-semibold"
                : "text-muted-foreground"
            )}
            onClick={() => onViewChange(view)}
          >
            {activeView === view && (
              <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-sm bg-primary" />
            )}
            <Icon size={16} />
            <span>{label}</span>
          </Button>
        ))}
      </nav>

      <div className="mt-auto px-5 pb-4">
        <Separator className="mb-3" />
        <p className="text-[11px] text-muted-foreground">Clockify v1.0.0</p>
      </div>
    </aside>
  );
}
