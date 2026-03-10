import { ipcMain } from "electron";
import store, { TimeEntry, Project } from "./store";

export function registerIpcHandlers() {
  ipcMain.handle("entries:get", () => {
    return store.get("entries");
  });

  ipcMain.handle("entries:create", (_event, entry: TimeEntry) => {
    const entries = store.get("entries");
    entries.unshift(entry);
    store.set("entries", entries);
    return entry;
  });

  ipcMain.handle("entries:update", (_event, updated: TimeEntry) => {
    const entries = store.get("entries");
    const index = entries.findIndex((e) => e.id === updated.id);
    if (index !== -1) {
      entries[index] = updated;
      store.set("entries", entries);
    }
    return updated;
  });

  ipcMain.handle("entries:delete", (_event, id: string) => {
    const entries = store.get("entries").filter((e) => e.id !== id);
    store.set("entries", entries);
    return id;
  });

  ipcMain.handle("projects:get", () => {
    return store.get("projects");
  });

  ipcMain.handle("projects:create", (_event, project: Project) => {
    const projects = store.get("projects");
    projects.push(project);
    store.set("projects", projects);
    return project;
  });
}
