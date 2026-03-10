import type { TimeEntry, Project } from "../types";

interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  error?: string;
}

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

  getSession: () => Promise<string | null>;
  openLogin: () => Promise<void>;
  logout: () => Promise<boolean>;
  apiCall: (path: string, options?: any) => Promise<ApiResponse>;
  onAuthChange: (callback: (session: string | null) => void) => () => void;
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

export function getSession() {
  return api.getSession();
}
export function openLogin() {
  return api.openLogin();
}
export function logout() {
  return api.logout();
}
export function onAuthChange(cb: (session: string | null) => void) {
  return api.onAuthChange(cb);
}
