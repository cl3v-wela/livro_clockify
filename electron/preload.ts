import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getEntries: () => ipcRenderer.invoke("entries:get"),
  createEntry: (entry: any) => ipcRenderer.invoke("entries:create", entry),
  updateEntry: (entry: any) => ipcRenderer.invoke("entries:update", entry),
  deleteEntry: (id: string) => ipcRenderer.invoke("entries:delete", id),
  getProjects: () => ipcRenderer.invoke("projects:get"),
  createProject: (project: any) =>
    ipcRenderer.invoke("projects:create", project),

  windowMinimize: () => ipcRenderer.send("window:minimize"),
  windowMaximize: () => ipcRenderer.send("window:maximize"),
  windowClose: () => ipcRenderer.send("window:close"),
  windowIsMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  onMaximizedChange: (callback: (maximized: boolean) => void) => {
    const handler = (_event: any, maximized: boolean) => callback(maximized);
    ipcRenderer.on("window:maximized-change", handler);
    return () => ipcRenderer.removeListener("window:maximized-change", handler);
  },
});
