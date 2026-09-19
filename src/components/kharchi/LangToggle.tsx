"use client";

import { motion } from "framer-motion";
import { Languages } from "lucide-react";
import { useLang } from "./LangProvider";
import type { Lang } from "@/lib/i18n";

const OPTIONS: { id: Lang; label: string }[] = [
  { id: "uk", label: "УКР" },
  { id: "en", label: "EN" },
];

export default function LangToggle() {
  const { lang, setLang } = useLang();

  return (
    <div
      role="group"
      aria-label="Мова / Language"
      className="flex items-center gap-0.5 rounded-full border border-border bg-card/40 backdrop-blur p-1"
    >
      <Languages
        className="size-3.5 mx-1 text-muted-foreground shrink-0"
        aria-hidden
      />
      {OPTIONS.map((o) => {
        const active = lang === o.id;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setLang(o.id)}
            aria-pressed={active}
            className={`relative rounded-full px-2.5 py-1.5 text-[11px] font-bold tracking-wide transition-colors ${
              active
                ? "text-stone-950"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              />
            )}
            <span className="relative z-10">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
