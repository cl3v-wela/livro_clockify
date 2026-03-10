import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Button
      variant="ghost"
      className="h-9 w-full justify-center gap-2.5 px-0 text-[13px] font-medium text-muted-foreground md:justify-start md:px-3"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? (
        <Sun size={16} className="shrink-0" />
      ) : (
        <Moon size={16} className="shrink-0" />
      )}
      <span className="hidden md:inline">
        {isDark ? "Light Mode" : "Dark Mode"}
      </span>
    </Button>
  );
}
