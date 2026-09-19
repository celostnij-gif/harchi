"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CATEGORIES, PRODUCTS, type Category, type Product } from "@/lib/products";
import { CATEGORY_EN } from "@/lib/i18n";
import type { UiCategory } from "@/lib/site-data";
import ProductCard from "./ProductCard";
import { useLang } from "./LangProvider";

export default function Catalog({
  products,
  categories,
}: {
  products?: Product[];
  categories?: UiCategory[];
}) {
  const [cat, setCat] = useState<string>("all");
  const { lang, t } = useLang();

  const list: Product[] = products?.length ? products : PRODUCTS;
  const cats: UiCategory[] = categories?.length ? categories : CATEGORIES;

  const catLabel = (c: UiCategory) => {
    if (lang !== "en") return c.label;
    return c.labelEn ?? CATEGORY_EN[c.id] ?? c.label;
  };

  const filtered = useMemo(
    () => (cat === "all" ? list : list.filter((p) => p.cats.includes(cat as Category))),
    [cat, list]
  );

  return (
    <section id="catalog" className="relative py-20 sm:py-28 scroll-mt-20">
      {/* ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-orange-700/10 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t.catalog.label}
          </span>
          <h2 className="font-display mt-3 text-3xl sm:text-5xl font-extrabold uppercase tracking-tight">
            {t.catalog.h2a}
            <span className="text-gradient-flame">{t.catalog.h2b}</span>
            {" "}
            {lang === "uk" ? "порцію" : "portion"}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t.catalog.p}
          </p>
        </motion.div>

        {/* Category pills */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {cats.map((c) => {
            const active = cat === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                aria-pressed={active}
                className={`relative rounded-full px-4 sm:px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
                  active
                    ? "text-stone-950"
                    : "text-muted-foreground hover:text-foreground border border-border bg-card/40 hover:bg-accent/60"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="cat-pill"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-orange-600/30"
                  />
                )}
                <span className="relative z-10">{catLabel(c)}</span>
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <motion.div layout className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
