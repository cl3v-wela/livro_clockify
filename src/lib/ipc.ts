import type { Project, TimeEntry } from "@/types";

export interface ApiResponse<T = unknown> {
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
  apiCall: (
    path: string,
    options?: Record<string, unknown>
  ) => Promise<ApiResponse>;
  onAuthChange: (callback: (session: string | null) => void) => () => void;
  takeScreenshot: (label: string) => Promise<string | null>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

const api = window.electronAPI;

// --- Data ---

export const getEntries = (): Promise<TimeEntry[]> => api.getEntries();
export const createEntry = (entry: TimeEntry): Promise<TimeEntry> =>
  api.createEntry(entry);
export const updateEntry = (entry: TimeEntry): Promise<TimeEntry> =>
  api.updateEntry(entry);
export const deleteEntry = (id: string): Promise<string> => api.deleteEntry(id);
export const getProjects = (): Promise<Project[]> => api.getProjects();
export const createProject = (project: Project): Promise<Project> =>
  api.createProject(project);

// --- Window ---

export const windowMinimize = (): void => api.windowMinimize();
export const windowMaximize = (): void => api.windowMaximize();
export const windowClose = (): void => api.windowClose();
export const windowIsMaximized = (): Promise<boolean> =>
  api.windowIsMaximized();
export const onMaximizedChange = (
  cb: (maximized: boolean) => void
): (() => void) => api.onMaximizedChange(cb);

// --- Auth ---

export const getSession = (): Promise<string | null> => api.getSession();
export const openLogin = (): Promise<void> => api.openLogin();
export const logout = (): Promise<boolean> => api.logout();
export const onAuthChange = (
  cb: (session: string | null) => void
): (() => void) => api.onAuthChange(cb);

// --- Screenshot ---

export const takeScreenshot = (label: string): Promise<string | null> =>
  api.takeScreenshot(label);
