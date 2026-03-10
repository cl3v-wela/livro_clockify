import { memo, useMemo } from "react";
import { Calendar, Clock } from "lucide-react";
import { format, isToday, isYesterday, parseISO } from "date-fns";

import { Separator } from "@/components/ui/separator";
import { TimeEntryRow } from "@/components/TimeEntryRow";

import type { Project, TimeEntry } from "@/types";

interface HistoryViewProps {
  entries: TimeEntry[];
  projects: Project[];
  onDelete: (id: string) => void;
}

function groupByDate(entries: TimeEntry[]): Map<string, TimeEntry[]> {
  const groups = new Map<string, TimeEntry[]>();
  for (const entry of entries) {
    const dateKey = format(parseISO(entry.startTime), "yyyy-MM-dd");
    const existing = groups.get(dateKey) || [];
    existing.push(entry);
    groups.set(dateKey, existing);
  }
  return groups;
}

function formatDateHeading(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEE, MMM d");
}

function totalDuration(entries: TimeEntry[]): string {
  const total = entries.reduce((sum, e) => sum + e.duration, 0);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export const HistoryView = memo(function HistoryView({
  entries,
  projects,
  onDelete,
}: HistoryViewProps) {
  const groups = useMemo(() => groupByDate(entries), [entries]);

  if (entries.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Clock size={28} strokeWidth={1.5} />
        </div>
        <h3 className="text-[15px] font-semibold text-muted-foreground">
          No time entries yet
        </h3>
        <p className="text-[13px] text-muted-foreground/70">
          Start the timer to track your first task
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <div className="mb-6">
        <h2 className="text-xl font-bold tracking-tight">History</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          {entries.length} entries
        </p>
      </div>

      {Array.from(groups.entries()).map(([dateKey, dayEntries]) => (
        <div key={dateKey} className="mb-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar size={13} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {formatDateHeading(dateKey)}
              </span>
            </div>
            <span className="text-xs font-bold tabular-nums text-primary">
              {totalDuration(dayEntries)}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            {dayEntries.map((entry) => (
              <TimeEntryRow
                key={entry.id}
                entry={entry}
                projects={projects}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
