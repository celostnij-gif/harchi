"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Flame, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart, cartCount } from "@/lib/cart-store";
import ThemeToggle from "./ThemeToggle";
import LangToggle from "./LangToggle";
import { useLang } from "./LangProvider";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 40));
  const items = useCart((s) => s.items);
  const setOpen = useCart((s) => s.setOpen);
  const count = cartCount(items);
  const { t } = useLang();

  const LINKS = [
    { href: "#catalog", label: t.nav.catalog },
    { href: "#kits", label: t.nav.kits },
    { href: "#how", label: t.nav.how },
    { href: "#reviews", label: t.nav.reviews },
    { href: "#faq", label: t.nav.faq },
  ];

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 inset-x-0 z-50"
    >
      <div
        className={`mx-auto max-w-7xl px-4 transition-all duration-500 ${
          scrolled ? "pt-2" : "pt-4"
        }`}
      >
        <nav
          aria-label="Головна навігація"
          className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-all duration-500 ${
            scrolled
              ? "bg-background/80 backdrop-blur-xl border border-border shadow-2xl shadow-black/25"
              : "bg-transparent border border-transparent"
          }`}
        >
          {/* Logo */}
          <a href="#top" className="flex items-center gap-2.5 group">
            <span className="relative grid place-items-center size-10 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-600 glow-warm group-hover:scale-105 transition-transform">
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

          {/* Desktop links */}
          <div className="hidden lg:flex items-center gap-1">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="px-3.5 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <LangToggle />
            <ThemeToggle />
            <Button
              onClick={() => setOpen(true)}
              className="relative rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 font-semibold shadow-lg shadow-orange-600/25 transition-all hover:scale-[1.03] active:scale-95 h-11 px-4 sm:px-5"
            >
              <ShoppingBag className="size-4.5 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">{t.nav.cart}</span>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  className="absolute -top-1.5 -right-1.5 grid place-items-center min-w-5.5 h-5.5 px-1 rounded-full bg-red-600 text-white text-xs font-bold border-2 border-background"
                >
                  {count}
                </motion.span>
              )}
            </Button>

            <button
              aria-label={t.nav.menu}
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden grid place-items-center size-11 rounded-full border border-border bg-card/40 backdrop-blur"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden mt-2 rounded-2xl bg-background/95 backdrop-blur-xl border border-border p-2 shadow-2xl"
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-foreground/85 hover:bg-accent/60"
              >
                {l.label}
              </a>
            ))}
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
