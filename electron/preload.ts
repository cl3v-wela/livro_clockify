import { contextBridge, ipcRenderer } from "electron";

const ALLOWED_SEND_CHANNELS = [
  "window:minimize",
  "window:maximize",
  "window:close",
] as const;

const ALLOWED_INVOKE_CHANNELS = [
  "entries:get",
  "entries:create",
  "entries:update",
  "entries:delete",
  "projects:get",
  "projects:create",
  "window:isMaximized",
  "auth:get-session",
  "auth:open-login",
  "auth:logout",
  "auth:api-call",
  "screenshot:capture",
] as const;

const ALLOWED_RECEIVE_CHANNELS = [
  "window:maximized-change",
  "auth:changed",
] as const;

type SendChannel = (typeof ALLOWED_SEND_CHANNELS)[number];
type InvokeChannel = (typeof ALLOWED_INVOKE_CHANNELS)[number];
type ReceiveChannel = (typeof ALLOWED_RECEIVE_CHANNELS)[number];

function safeSend(channel: SendChannel) {
  ipcRenderer.send(channel);
}

function safeInvoke(channel: InvokeChannel, ...args: unknown[]) {
  return ipcRenderer.invoke(channel, ...args);
}

function safeOn(
  channel: ReceiveChannel,
  handler: (...args: unknown[]) => void
) {
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld("electronAPI", {
  getEntries: () => safeInvoke("entries:get"),
  createEntry: (entry: unknown) => safeInvoke("entries:create", entry),
  updateEntry: (entry: unknown) => safeInvoke("entries:update", entry),
  deleteEntry: (id: string) => safeInvoke("entries:delete", id),
  getProjects: () => safeInvoke("projects:get"),
  createProject: (project: unknown) => safeInvoke("projects:create", project),

  windowMinimize: () => safeSend("window:minimize"),
  windowMaximize: () => safeSend("window:maximize"),
  windowClose: () => safeSend("window:close"),
  windowIsMaximized: () => safeInvoke("window:isMaximized"),
  onMaximizedChange: (callback: (maximized: boolean) => void) => {
    const handler = (_event: unknown, maximized: boolean) =>
      callback(maximized);
    return safeOn(
      "window:maximized-change",
      handler as (...args: unknown[]) => void
    );
  },

  getSession: () => safeInvoke("auth:get-session"),
  openLogin: () => safeInvoke("auth:open-login"),
  logout: () => safeInvoke("auth:logout"),
  apiCall: (path: string, options?: unknown) =>
    safeInvoke("auth:api-call", path, options),
  onAuthChange: (callback: (session: string | null) => void) => {
    const handler = (_event: unknown, session: string | null) =>
      callback(session);
    return safeOn("auth:changed", handler as (...args: unknown[]) => void);
  },

  takeScreenshot: (label: string) => safeInvoke("screenshot:capture", label),
});
