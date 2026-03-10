import { memo, useMemo } from "react";
import { BarChart3, History, LogOut, Timer, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import type { UserInfo, View } from "@/types";

interface SidebarProps {
  activeView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  userInfo?: UserInfo | null;
}

const NAV_ITEMS: { view: View; label: string; icon: typeof Timer }[] = [
  { view: "timer", label: "Timer", icon: Timer },
  { view: "history", label: "History", icon: History },
  { view: "reports", label: "Reports", icon: BarChart3 },
] as const;

export const Sidebar = memo(function Sidebar({
  activeView,
  onViewChange,
  onLogout,
  userInfo,
}: SidebarProps) {
  const avatarUrl = useMemo(() => {
    if (!userInfo?.avatar) return null;
    const base = (
      import.meta.env.VITE_ERP_URL || "https://stage.livro.systems"
    ).replace(/\/+$/, "");
    return `${base}${userInfo.avatar}`;
  }, [userInfo?.avatar]);

  return (
    <aside className="flex w-14 min-w-14 flex-col border-r border-border bg-sidebar-background pt-5 select-none md:w-[200px] md:min-w-[200px]">
      <div className="flex items-center gap-2.5 px-3 pb-7 md:px-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-purple-500 text-white">
          <Timer size={18} strokeWidth={2.5} />
        </div>
        <span className="hidden text-[15px] font-bold tracking-tight text-foreground md:block">
          Clockify
        </span>
      </div>

      <nav className="flex flex-col gap-0.5 px-1.5 md:px-2.5">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => (
          <Tooltip key={view}>
            <TooltipTrigger asChild>
              <Button
                variant={activeView === view ? "secondary" : "ghost"}
                className={cn(
                  "relative h-9 w-full justify-center gap-2.5 px-0 text-[13px] font-medium md:justify-start md:px-3",
                  activeView === view
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground"
                )}
                onClick={() => onViewChange(view)}
              >
                {activeView === view && (
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-sm bg-primary" />
                )}
                <Icon size={16} className="shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="md:hidden">
              {label}
            </TooltipContent>
          </Tooltip>
        ))}
      </nav>

      <div className="mt-auto px-1.5 pb-4 md:px-2.5">
        <Separator className="mb-3" />
        {userInfo && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mb-2 flex cursor-default items-center justify-center gap-2.5 rounded-lg px-1.5 py-2 md:justify-start md:px-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={userInfo.fullName}
                    className="size-8 shrink-0 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <User size={16} />
                  </div>
                )}
                <div className="hidden min-w-0 flex-col md:flex">
                  <span className="truncate text-[13px] font-semibold leading-tight text-foreground">
                    {userInfo.fullName}
                  </span>
                  <span className="truncate text-[11px] leading-tight text-muted-foreground">
                    {userInfo.email}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="md:hidden">
              <p className="font-semibold">{userInfo.fullName}</p>
              <p className="text-xs text-muted-foreground">{userInfo.email}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="h-9 w-full justify-center gap-2.5 px-0 text-[13px] font-medium text-muted-foreground hover:text-destructive md:justify-start md:px-3"
              onClick={onLogout}
            >
              <LogOut size={16} className="shrink-0" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" className="md:hidden">
            Sign Out
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
});
