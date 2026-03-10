import { useState, useEffect } from "react";
import { Minus, Square, X, Copy } from "lucide-react";
import {
  windowMinimize,
  windowMaximize,
  windowClose,
  windowIsMaximized,
  onMaximizedChange,
} from "../lib/ipc";

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    windowIsMaximized().then(setMaximized);
    const cleanup = onMaximizedChange(setMaximized);
    return cleanup;
  }, []);

  return (
    <div className="flex h-9 shrink-0 select-none items-center justify-between border-b border-border bg-sidebar-background">
      <div
        className="flex h-full flex-1 items-center pl-4"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <span className="text-xs font-semibold tracking-wide text-muted-foreground">
          Clockify
        </span>
      </div>
      <div
        className="flex h-full"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <button
          className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={windowMinimize}
          aria-label="Minimize"
        >
          <Minus size={14} strokeWidth={2} />
        </button>
        <button
          className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          onClick={windowMaximize}
          aria-label="Maximize"
        >
          {maximized ? (
            <Copy size={12} strokeWidth={2} />
          ) : (
            <Square size={12} strokeWidth={2} />
          )}
        </button>
        <button
          className="flex h-full w-11 items-center justify-center text-muted-foreground transition-colors hover:bg-destructive hover:text-white"
          onClick={windowClose}
          aria-label="Close"
        >
          <X size={14} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
