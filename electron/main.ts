import {
  app,
  BrowserWindow,
  desktopCapturer,
  ipcMain,
  session,
} from "electron";
import fs from "fs";
import os from "os";
import path from "path";

import { registerIpcHandlers } from "./ipc";
import store from "./store";

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

function loadEnvFile() {
  const candidates = [
    path.join(process.cwd(), ".env"),
    path.join(__dirname, "..", ".env"),
    path.join(process.resourcesPath || "", ".env"),
  ];
  for (const envPath of candidates) {
    try {
      const content = fs.readFileSync(envPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq > 0) {
          const key = trimmed.substring(0, eq).trim();
          const val = trimmed
            .substring(eq + 1)
            .trim()
            .replace(/^["']|["']$/g, "");
          if (!process.env[key]) process.env[key] = val;
        }
      }
      return;
    } catch {
      // try next candidate
    }
  }
}

loadEnvFile();

let cachedErpUrl: URL | null = null;

function getErpUrl(): URL {
  if (!cachedErpUrl) {
    const raw = process.env.VITE_ERP_URL || "https://stage.livro.systems";
    cachedErpUrl = new URL(raw.replace(/\/+$/, ""));
  }
  return cachedErpUrl;
}

// ---------------------------------------------------------------------------
// Window management
// ---------------------------------------------------------------------------

let mainWindow: BrowserWindow | null = null;
let loginWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    backgroundColor: "#0b0b14",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
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

  mainWindow.webContents.on("did-finish-load", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

function isGuestSession(cookieStr: string): boolean {
  return /user_id=Guest/i.test(cookieStr) || /sid=Guest/i.test(cookieStr);
}

async function captureLoginSessionCookies(ses: Electron.Session) {
  try {
    const erpOrigin = getErpUrl().origin;
    const cookies = await ses.cookies.get({ url: erpOrigin });
    if (cookies.length === 0) return;

    const sidCookie = cookies.find((c) => c.name === "sid");
    if (!sidCookie || sidCookie.value === "Guest") return;

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
  } catch {
    // cookie read can fail transiently
  }
}

// ---------------------------------------------------------------------------
// Auth IPC
// ---------------------------------------------------------------------------

const LOGIN_CSS = `
  .navbar, .web-sidebar, .page-head,
  .container.page-body > div > .page-head {
    display: none !important;
  }
  body {
    border: 1px solid #1e1e2e !important;
    box-sizing: border-box !important;
  }
`;

const TITLEBAR_JS = `
  if (!document.getElementById('clockify-titlebar')) {
    const bar = document.createElement('div');
    bar.id = 'clockify-titlebar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:36px;background:#0b0b14;display:flex;align-items:center;justify-content:space-between;padding:0 12px;-webkit-app-region:drag;z-index:99999;border-bottom:1px solid #1e1e2e;';
    const title = document.createElement('span');
    title.textContent = 'Sign in \\u2014 Clockify';
    title.style.cssText = 'color:#9090b0;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;';
    const close = document.createElement('button');
    close.innerHTML = '\\u2715';
    close.style.cssText = '-webkit-app-region:no-drag;background:none;border:none;color:#9090b0;font-size:16px;cursor:pointer;padding:4px 8px;border-radius:4px;';
    close.onmouseover = () => close.style.background='#e81123';
    close.onmouseout = () => close.style.background='none';
    close.onclick = () => window.close();
    bar.appendChild(title);
    bar.appendChild(close);
    document.body.prepend(bar);
    document.body.style.paddingTop = '36px';
  }
`;

function registerAuthHandlers() {
  ipcMain.handle("auth:get-session", () => {
    return store.get("sessionCookie");
  });

  ipcMain.handle("auth:open-login", () => {
    if (loginWindow && !loginWindow.isDestroyed()) {
      loginWindow.focus();
      return;
    }

    const erpOrigin = getErpUrl().origin;
    const loginPartition = "persist:login";
    const loginSes = session.fromPartition(loginPartition);

    loginWindow = new BrowserWindow({
      width: 900,
      height: 700,
      title: "Sign in — Clockify",
      parent: mainWindow || undefined,
      modal: false,
      frame: false,
      backgroundColor: "#0b0b14",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        partition: loginPartition,
      },
    });

    loginWindow.loadURL(erpOrigin);

    const injectUI = () => {
      loginWindow?.webContents.insertCSS(LOGIN_CSS);
      loginWindow?.webContents.executeJavaScript(TITLEBAR_JS).catch(() => {});
    };

    loginWindow.webContents.on("did-finish-load", injectUI);
    loginWindow.webContents.on("did-navigate", injectUI);

    loginSes.cookies.on("changed", (_event, _cookie, _cause, removed) => {
      if (!removed) captureLoginSessionCookies(loginSes);
    });

    loginWindow.on("closed", () => {
      loginWindow = null;
    });
  });

  ipcMain.handle("auth:set-session", (_event, cookieValue: string) => {
    if (typeof cookieValue !== "string") return false;
    store.set("sessionCookie", cookieValue);
    mainWindow?.webContents.send("auth:changed", cookieValue);
    return true;
  });

  ipcMain.handle("auth:logout", async () => {
    store.set("sessionCookie", null);
    try {
      const loginSes = session.fromPartition("persist:login");
      const erpOrigin = getErpUrl().origin;
      const cookies = await loginSes.cookies.get({ url: erpOrigin });
      for (const cookie of cookies) {
        await loginSes.cookies.remove(
          `${erpOrigin}${cookie.path || "/"}`,
          cookie.name
        );
      }
    } catch {
      // ignore
    }
    mainWindow?.webContents.send("auth:changed", null);
    return true;
  });

  ipcMain.handle(
    "auth:api-call",
    async (_event, urlPath: string, options?: Record<string, unknown>) => {
      if (typeof urlPath !== "string") {
        return { ok: false, status: 0, data: null, error: "Invalid path" };
      }

      const erpOrigin = getErpUrl().origin;

      // Only allow relative API paths or URLs on the same ERP origin
      let url: string;
      if (urlPath.startsWith("http")) {
        try {
          const parsed = new URL(urlPath);
          if (parsed.origin !== erpOrigin) {
            return {
              ok: false,
              status: 0,
              data: null,
              error: "Disallowed origin",
            };
          }
          url = urlPath;
        } catch {
          return { ok: false, status: 0, data: null, error: "Invalid URL" };
        }
      } else {
        if (!urlPath.startsWith("/")) {
          return {
            ok: false,
            status: 0,
            data: null,
            error: "Path must start with /",
          };
        }
        url = `${erpOrigin}${urlPath}`;
      }

      const sessionCookie = store.get("sessionCookie");
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options?.headers as Record<string, string>) || {}),
      };

      if (sessionCookie) {
        headers["Cookie"] = sessionCookie;
      }

      try {
        const response = await fetch(url, {
          method: (options?.method as string) || "GET",
          headers,
          body: options?.body ? JSON.stringify(options.body) : undefined,
        });

        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          store.set("sessionCookie", setCookieHeader);
        }

        const data = await response.json().catch(() => null);
        return { ok: response.ok, status: response.status, data };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return { ok: false, status: 0, data: null, error: message };
      }
    }
  );
}

// ---------------------------------------------------------------------------
// Screenshot IPC
// ---------------------------------------------------------------------------

const SCREENSHOT_DIR = path.join(os.homedir(), "clockify-screenshots");
const SAFE_LABEL_RE = /^[a-zA-Z0-9_-]+$/;

function registerScreenshotHandler() {
  ipcMain.handle("screenshot:capture", async (_event, label: string) => {
    if (typeof label !== "string" || !SAFE_LABEL_RE.test(label)) {
      return null;
    }

    try {
      if (!fs.existsSync(SCREENSHOT_DIR)) {
        fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
      }

      const sources = await desktopCapturer.getSources({
        types: ["screen"],
        thumbnailSize: { width: 1920, height: 1080 },
      });

      if (sources.length === 0) return null;

      const png = sources[0].thumbnail.toPNG();
      const ts = new Date()
        .toISOString()
        .replace(/T/, "_")
        .replace(/:/g, "-")
        .replace(/\..+$/, "");
      const filename = `${label}-${ts}.png`;
      const filePath = path.join(SCREENSHOT_DIR, filename);

      // Verify resolved path stays within the screenshot directory
      if (!filePath.startsWith(SCREENSHOT_DIR)) return null;

      fs.writeFileSync(filePath, png);
      return filePath;
    } catch {
      return null;
    }
  });
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------

app.whenReady().then(() => {
  registerIpcHandlers();
  registerAuthHandlers();
  registerScreenshotHandler();
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
