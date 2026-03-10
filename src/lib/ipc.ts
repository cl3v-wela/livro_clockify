import type { TimeEntry, Project } from "../types";

interface ElectronAPI {
  getEntries: () => Promise<TimeEntry[]>;
  createEntry: (entry: TimeEntry) => Promise<TimeEntry>;
  updateEntry: (entry: TimeEntry) => Promise<TimeEntry>;
  deleteEntry: (id: string) => Promise<string>;
  getProjects: () => Promise<Project[]>;
  createProject: (project: Project) => Promise<Project>;

  windowMinimize: () => void;
  windowMaximize: () => void;
  windowClose: () => void;
  windowIsMaximized: () => Promise<boolean>;
  onMaximizedChange: (callback: (maximized: boolean) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const api = window.electronAPI;

export async function getEntries(): Promise<TimeEntry[]> {
  return api.getEntries();
}

export async function createEntry(entry: TimeEntry): Promise<TimeEntry> {
  return api.createEntry(entry);
}

export async function updateEntry(entry: TimeEntry): Promise<TimeEntry> {
  return api.updateEntry(entry);
}

export async function deleteEntry(id: string): Promise<string> {
  return api.deleteEntry(id);
}

export async function getProjects(): Promise<Project[]> {
  return api.getProjects();
}

export async function createProject(project: Project): Promise<Project> {
  return api.createProject(project);
}

export function windowMinimize() {
  api.windowMinimize();
}
export function windowMaximize() {
  api.windowMaximize();
}
export function windowClose() {
  api.windowClose();
}
export function windowIsMaximized() {
  return api.windowIsMaximized();
}
export function onMaximizedChange(cb: (maximized: boolean) => void) {
  return api.onMaximizedChange(cb);
}
