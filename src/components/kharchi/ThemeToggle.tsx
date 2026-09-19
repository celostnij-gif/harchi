"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useLang } from "./LangProvider";

const THEME_COLORS = {
  dark: "#0b0908",
  light: "#f8f2e7",
} as const;

const emptySubscribe = () => () => {};
/** Hydration-safe `mounted` flag without setState-in-effect */
function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const { t } = useLang();

  // Keep browser UI color in sync with the active theme
  useEffect(() => {
    if (!mounted) return;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute(
      "content",
      resolvedTheme === "light" ? THEME_COLORS.light : THEME_COLORS.dark
    );
  }, [resolvedTheme, mounted]);

  const isDark = resolvedTheme !== "light";

  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        mounted
          ? isDark
            ? t.theme.toLight
            : t.theme.toDark
          : t.langToggle
      }
      aria-pressed={mounted ? !isDark : undefined}
      title={mounted && !isDark ? "Темна тема" : "Світла тема"}
      className="relative grid place-items-center size-11 rounded-full border border-border bg-card/40 backdrop-blur hover:bg-accent/70 hover:border-primary/40 transition-colors focus-visible:outline-2 focus-visible:outline-primary/60"
    >
      {/* sun / moon swap animation */}
      <AnimatePresence mode="wait" initial={false}>
        {mounted ? (
          isDark ? (
            <motion.span
              key="moon"
              initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="grid place-items-center"
            >
              <Moon className="size-5 text-amber-300" />
            </motion.span>
          ) : (
            <motion.span
              key="sun"
              initial={{ rotate: 90, scale: 0.4, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="grid place-items-center"
            >
              <Sun className="size-5 text-orange-600" />
            </motion.span>
          )
        ) : (
          <span key="placeholder" className="grid place-items-center">
            <Moon className="size-5 opacity-0" />
          </span>
        )}
      </AnimatePresence>
    </button>
  );
}
