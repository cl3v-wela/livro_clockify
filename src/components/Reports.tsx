import { memo, useMemo } from "react";
import { CalendarDays, Clock, Layers, TrendingUp } from "lucide-react";
import { isThisWeek, isToday, parseISO } from "date-fns";

import { Card, CardContent } from "@/components/ui/card";

import type { Project, TimeEntry } from "@/types";

interface ReportsViewProps {
  entries: TimeEntry[];
  projects: Project[];
}

function formatHours(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0 && m === 0) return "0m";
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color: string;
}

const StatCard = memo(function StatCard({
  icon,
  value,
  label,
  color,
}: StatCardProps) {
  return (
    <Card className="gap-0 border-border py-0">
      <CardContent className="flex items-center gap-4 py-5">
        <div
          className="flex size-10 shrink-0 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight">{value}</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
});

export const ReportsView = memo(function ReportsView({
  entries,
  projects,
}: ReportsViewProps) {
  const stats = useMemo(() => {
    const todayEntries = entries.filter((e) => isToday(parseISO(e.startTime)));
    const weekEntries = entries.filter((e) =>
      isThisWeek(parseISO(e.startTime), { weekStartsOn: 1 })
    );

    const todaySeconds = todayEntries.reduce((s, e) => s + e.duration, 0);
    const weekSeconds = weekEntries.reduce((s, e) => s + e.duration, 0);
    const totalSeconds = entries.reduce((s, e) => s + e.duration, 0);

    const projectBreakdown = new Map<string, number>();
    for (const entry of entries) {
      const current = projectBreakdown.get(entry.project) || 0;
      projectBreakdown.set(entry.project, current + entry.duration);
    }

    return {
      todaySeconds,
      weekSeconds,
      totalSeconds,
      projectBreakdown,
      totalEntries: entries.length,
    };
  }, [entries]);

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">Reports</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Overview of your tracked time
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard
          icon={<Clock size={18} />}
          value={formatHours(stats.todaySeconds)}
          label="Today"
          color="#6c63ff"
        />
        <StatCard
          icon={<CalendarDays size={18} />}
          value={formatHours(stats.weekSeconds)}
          label="This Week"
          color="#43b581"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          value={formatHours(stats.totalSeconds)}
          label="All Time"
          color="#ef4565"
        />
        <StatCard
          icon={<Layers size={18} />}
          value={stats.totalEntries}
          label="Total Entries"
          color="#f5a623"
        />
      </div>

      {stats.projectBreakdown.size > 0 && (
        <Card className="border-border">
          <CardContent>
            <h3 className="mb-4 text-[13px] font-semibold text-muted-foreground">
              Time by Project
            </h3>
            <div className="flex flex-col gap-4">
              {Array.from(stats.projectBreakdown.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([projectName, seconds]) => {
                  const project = projects.find((p) => p.name === projectName);
                  const pct =
                    stats.totalSeconds > 0
                      ? (seconds / stats.totalSeconds) * 100
                      : 0;
                  const color = project?.color || "#888";

                  return (
                    <div key={projectName} className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="flex-1 text-[13px] font-medium">
                          {projectName}
                        </span>
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          {Math.round(pct)}%
                        </span>
                        <span className="min-w-[50px] text-right text-xs font-bold tabular-nums text-muted-foreground">
                          {formatHours(seconds)}
                        </span>
                      </div>
                      <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
});
