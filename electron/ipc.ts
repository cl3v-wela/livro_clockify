import { ipcMain } from "electron";
import store, { TimeEntry, Project } from "./store";

function validateSender(frame: Electron.WebFrameMain | null): boolean {
  if (!frame) return false;
  try {
    const url = new URL(frame.url);
    if (url.protocol === "file:") return true;
    if (process.env.VITE_DEV_SERVER_URL) {
      const devUrl = new URL(process.env.VITE_DEV_SERVER_URL);
      if (url.origin === devUrl.origin) return true;
    }
  } catch {
    // invalid URL
  }
  return false;
}

export function registerIpcHandlers() {
  ipcMain.handle("entries:get", (event) => {
    if (!validateSender(event.senderFrame)) return null;
    return store.get("entries");
  });

  ipcMain.handle("entries:create", (event, entry: TimeEntry) => {
    if (!validateSender(event.senderFrame)) return null;
    const entries = store.get("entries");
    entries.unshift(entry);
    store.set("entries", entries);
    return entry;
  });

  ipcMain.handle("entries:update", (event, updated: TimeEntry) => {
    if (!validateSender(event.senderFrame)) return null;
    const entries = store.get("entries");
    const index = entries.findIndex((e) => e.id === updated.id);
    if (index !== -1) {
      entries[index] = updated;
      store.set("entries", entries);
    }
    return updated;
  });

  ipcMain.handle("entries:delete", (event, id: string) => {
    if (!validateSender(event.senderFrame)) return null;
    const entries = store.get("entries").filter((e) => e.id !== id);
    store.set("entries", entries);
    return id;
  });

  ipcMain.handle("projects:get", (event) => {
    if (!validateSender(event.senderFrame)) return null;
    return store.get("projects");
  });

  ipcMain.handle("projects:create", (event, project: Project) => {
    if (!validateSender(event.senderFrame)) return null;
    const projects = store.get("projects");
    projects.push(project);
    store.set("projects", projects);
    return project;
  });
}
