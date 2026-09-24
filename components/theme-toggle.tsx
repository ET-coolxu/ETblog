"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

/** 浅色 / 深色切换。挂载前不读主题，避免服务端和浏览器图标不一致。 */
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
      className="inline-flex cursor-pointer rounded p-1.5 text-muted hover:text-ink disabled:cursor-wait disabled:text-muted/70"
    >
      {mounted ? isDark ? <SunIcon /> : <MoonIcon /> : <span className="size-4.5" />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
      <circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M18 6l-1.6 1.6M7.6 16.4 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" aria-hidden>
      <path
        d="M16.5 14.2A6.2 6.2 0 0 1 9.8 7.5 6.2 6.2 0 1 0 16.5 14.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}
