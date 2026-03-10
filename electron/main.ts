import { app, BrowserWindow, ipcMain, session } from "electron";
import path from "path";
import { registerIpcHandlers } from "./ipc";
import store from "./store";

let mainWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: "#0b0b14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.on("window:minimize", () => mainWindow?.minimize());
  ipcMain.on("window:maximize", () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });
  ipcMain.on("window:close", () => mainWindow?.close());
  ipcMain.handle("window:isMaximized", () => mainWindow?.isMaximized());

  mainWindow.on("maximize", () => {
    mainWindow?.webContents.send("window:maximized-change", true);
  });
  mainWindow.on("unmaximize", () => {
    mainWindow?.webContents.send("window:maximized-change", false);
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function registerAuthHandlers() {
  ipcMain.handle("auth:get-session", () => {
    return store.get("sessionCookie");
  });

  ipcMain.handle("auth:open-login", () => {
    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.focus();
      return;
    }

    loginWindow = new BrowserWindow({
      width: 900,
      height: 650,
      title: "Sign in — Clockify",
      parent: mainWindow || undefined,
      modal: false,
      backgroundColor: "#ffffff",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    loginWindow.loadURL("http://localhost:8007/");

    loginWindow.webContents.on("did-navigate", async () => {
      await captureSessionCookies();
    });

    loginWindow.webContents.on("did-navigate-in-page", async () => {
      await captureSessionCookies();
    });

    loginWindow.on("closed", () => {
      loginWindow = null;
    });
  });

  function isGuestSession(cookieStr: string): boolean {
    return /user_id=Guest/i.test(cookieStr) || /sid=Guest/i.test(cookieStr);
  }

  async function captureSessionCookies() {
    try {
      const cookies = await session.defaultSession.cookies.get({
        url: "http://localhost:8007",
      });
      if (cookies.length > 0) {
        const cookieStr = cookies.map((c) => `${c.name}=${c.value}`).join("; ");

        if (isGuestSession(cookieStr)) return;

        const existing = store.get("sessionCookie");
        if (cookieStr !== existing) {
          store.set("sessionCookie", cookieStr);
          mainWindow?.webContents.send("auth:changed", cookieStr);

          if (loginWindow && !loginWindow.isDestroyed()) {
            loginWindow.close();
            loginWindow = null;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  session.defaultSession.cookies.on(
    "changed",
    (_event, cookie, _cause, removed) => {
      if (cookie.domain?.includes("localhost") && !removed) {
        captureSessionCookies();
      }
    }
  );

  ipcMain.handle("auth:set-session", (_event, cookieValue: string) => {
    store.set("sessionCookie", cookieValue);
    mainWindow?.webContents.send("auth:changed", cookieValue);
    return true;
  });

  ipcMain.handle("auth:logout", async () => {
    store.set("sessionCookie", null);
    try {
      const cookies = await session.defaultSession.cookies.get({
        url: "http://localhost:8007",
      });
      for (const cookie of cookies) {
        const url = `http${cookie.secure ? "s" : ""}://localhost:8007${
          cookie.path || "/"
        }`;
        await session.defaultSession.cookies.remove(url, cookie.name);
      }
    } catch {
      // ignore
    }
    mainWindow?.webContents.send("auth:changed", null);
    return true;
  });

  ipcMain.handle(
    "auth:api-call",
    async (_event, urlPath: string, options: any) => {
      const sessionCookie = store.get("sessionCookie");
      const url = urlPath.startsWith("http")
        ? urlPath
        : `http://localhost:8007${urlPath}`;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      };

      if (sessionCookie) {
        headers["Cookie"] = sessionCookie;
      }

      try {
        const response = await fetch(url, {
          method: options?.method || "GET",
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          store.set("sessionCookie", setCookieHeader);
        }

        const data = await response.json().catch(() => null);
        return { ok: response.ok, status: response.status, data };
      } catch (err: any) {
        return { ok: false, status: 0, data: null, error: err.message };
      }
    }
  );
}

app.whenReady().then(() => {
  registerIpcHandlers();
  registerAuthHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
