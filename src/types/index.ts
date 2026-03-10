export interface TimeEntry {
  id: string;
  description: string;
  project: string;
  startTime: string;
  endTime: string | null;
  duration: number;
}

export interface Project {
  name: string;
  color: string;
}

export type View = "timer" | "history" | "reports";
