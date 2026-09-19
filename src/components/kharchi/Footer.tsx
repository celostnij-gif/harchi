"use client";

import { Flame, Facebook, Mail, Globe } from "lucide-react";
import { useLang } from "./LangProvider";

const LINK_HREFS = ["#catalog", "#how", "#reviews", "#faq"];

export default function Footer() {
  const { t } = useLang();
  return (
    <footer className="relative mt-auto border-t border-border/60 bg-card/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-10 justify-between">
          {/* Brand */}
          <a href="#top" className="flex items-center gap-2.5 w-fit">
            <span className="grid place-items-center size-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600">
              <Flame className="size-5.5 text-stone-950" strokeWidth={2.5} />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display font-bold text-lg tracking-wide">
                ХАРЧІ
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-primary/90">
                {t.hero.h1b}
              </span>
            </span>
          </a>

          {/* Nav */}
          <nav aria-label="Футер навігація" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {t.footer.links.map((label, i) => (
              <a key={LINK_HREFS[i]} href={LINK_HREFS[i]} className="hover:text-accent-strong transition-colors">
                {label}
              </a>
            ))}
          </nav>

          {/* Socials */}
          <div className="flex items-center gap-3">
            <a
              href="https://harchifood.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Сайт harchifood.com"
              className="grid place-items-center size-10 rounded-full border border-border bg-card/40 text-muted-foreground hover:text-accent-strong hover:border-primary/40 transition-colors"
            >
              <Globe className="size-4.5" />
            </a>
            <a
              href="https://www.facebook.com/harchifood"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook @harchifood"
              className="grid place-items-center size-10 rounded-full border border-border bg-card/40 text-muted-foreground hover:text-accent-strong hover:border-primary/40 transition-colors"
            >
              <Facebook className="size-4.5" />
            </a>
            <a
              href="mailto:info@harchifood.com"
              aria-label="Пошта"
              className="grid place-items-center size-10 rounded-full border border-border bg-card/40 text-muted-foreground hover:text-accent-strong hover:border-primary/40 transition-colors"
            >
              <Mail className="size-4.5" />
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-t border-border/50 pt-6 text-xs text-muted-foreground/70">
          <p>{t.footer.rights}</p>
          <p>
            {t.footer.concept}{" "}
            <a
              href="https://harchifood.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/90 underline decoration-dotted underline-offset-2 hover:text-primary"
            >
              harchifood.com
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
