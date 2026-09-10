"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const hint = isDark ? "切换为浅色" : "切换为深色";

  return (
    <button
      type="button"
      disabled={!mounted}
      aria-label={mounted ? hint : "主题"}
      title={mounted ? hint : "主题"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="cursor-pointer hover:text-ink disabled:cursor-wait disabled:text-muted/70"
    >
      主题
    </button>
  );
}
