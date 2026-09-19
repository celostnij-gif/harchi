"use client";

import { motion } from "framer-motion";
import { BadgeCheck, Flame, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/lib/products";
import { KITS, money, type Kit } from "@/lib/i18n";
import { useLang } from "./LangProvider";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import Steam from "./Steam";

const easeOut = [0.22, 1, 0.36, 1] as const;

function KitCard({ kit, index }: { kit: Kit; index: number }) {
  const { lang, t } = useLang();
  const add = useCart((s) => s.add);
  const discount = Math.round((1 - kit.price / kit.oldPrice) * 100);
  const saved = kit.oldPrice - kit.price;
  const featured = index === 1;

  const handleAdd = () => {
    add({
      id: kit.id,
      name: kit.name[lang],
      price: kit.price,
      img: "/mre-kits.png",
    });
    toast.success(t.kits.added, {
      description: kit.name[lang],
      icon: "🪖",
    });
  };

  return (
    <motion.article
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay: index * 0.12, duration: 0.7, ease: easeOut }}
      className={`card-glass group relative rounded-3xl p-5 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_20px_60px_-15px_rgba(234,88,12,0.4)] ${
        featured ? "border-amber-500/40" : ""
      }`}
    >
      {featured && (
        <span className="absolute -top-3 left-5 z-10 rounded-full bg-gradient-to-r from-lime-400 to-emerald-500 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-950 shadow-lg">
          {lang === "uk" ? "найкращий вибір" : "best value"}
        </span>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold leading-tight">
            {kit.name[lang]}
          </h3>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {kit.tagline[lang]}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full bg-gradient-to-r ${kit.accent} px-2.5 py-1 text-xs font-black text-stone-950 shadow-md`}
        >
          −{discount}%
        </span>
      </div>

      {/* items */}
      <ul className="mt-4 space-y-1.5">
        {kit.items.map((item) => {
          const product = PRODUCTS.find((p) => p.id === item.productId);
          return (
            <li key={item.productId} className="flex items-center gap-2.5">
              {product && (
                <img
                  src={product.img}
                  alt={item[lang]}
                  loading="lazy"
                  className="size-8 shrink-0 rounded-lg border border-border object-cover"
                />
              )}
              <span className="text-[13px] text-foreground/85">{item[lang]}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1">
          {kit.items.length} {t.kits.items}
        </span>
        <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1">
          ≈ {kit.kcal.toLocaleString("uk-UA")} {t.kits.kcal}
        </span>
        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-semibold text-emerald-600 dark:text-emerald-400">
          {t.kits.save} {money(saved, lang)}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <span className="text-xs text-muted-foreground/70 line-through">
            {money(kit.oldPrice, lang)}
          </span>
          <div className="font-display text-2xl font-black text-accent-strong">
            {money(kit.price, lang)}
          </div>
        </div>
        <Button
          onClick={handleAdd}
          size="sm"
          className="h-11 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-5 text-[13px] font-bold text-stone-950 shadow-lg shadow-orange-600/30 transition-all hover:scale-[1.04] hover:from-amber-400 hover:to-orange-500 active:scale-95"
        >
          <ShoppingCart className="mr-1.5 size-4" />
          {t.kits.cta}
        </Button>
      </div>
    </motion.article>
  );
}

export default function KitsSection({ kits }: { kits?: Kit[] }) {
  const { t } = useLang();
  const list = kits?.length ? kits : KITS;

  return (
    <section id="kits" className="relative scroll-mt-20 overflow-hidden py-20 sm:py-28">
      {/* ambient glows */}
      <div className="pointer-events-none absolute right-[-120px] top-24 size-[420px] rounded-full bg-emerald-700/10 blur-[130px]" />
      <div className="pointer-events-none absolute left-[-140px] bottom-10 size-[420px] rounded-full bg-orange-700/10 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t.kits.label}
          </span>
          <h2 className="font-display mt-3 text-3xl font-extrabold uppercase tracking-tight sm:text-5xl">
            {t.kits.h2a}
            <span className="text-gradient-flame">{t.kits.h2b}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            {t.kits.p}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-sm font-bold text-accent-strong">
              <Sparkles className="size-4" />
              {t.kits.fromPrice}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-sm font-bold text-emerald-600 dark:text-emerald-400">
              <BadgeCheck className="size-4" />
              {t.kits.featurePoint1}
            </span>
          </div>
        </motion.div>

        <div className="mt-14 grid items-center gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
          {/* feature image side */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: easeOut }}
            className="relative order-2 lg:order-1"
          >
            {/* rotating dashed ring */}
            <div className="absolute inset-6 rounded-[2rem] border-2 border-dashed border-emerald-500/25 animate-spin-slow" />

            <div className="relative z-10 overflow-hidden rounded-[2rem] border border-border shadow-2xl">
              <img
                src="/mre-kits.png"
                alt={t.kits.imgAlt}
                loading="lazy"
                className="w-full object-cover transition-transform duration-700 hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              <Steam className="absolute bottom-6 left-[30%] w-28 h-24" puffs={2} />
            </div>

            {/* military dog tag */}
            <motion.div
              initial={{ opacity: 0, y: -16, rotate: -14 }}
              whileInView={{ opacity: 1, y: 0, rotate: -8 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, duration: 0.6, ease: easeOut }}
              className="absolute -left-3 top-6 z-20 sm:-left-5"
            >
              <div className="relative rounded-lg border border-stone-300/70 bg-gradient-to-br from-stone-200 to-stone-400 px-4 py-2.5 shadow-xl dark:border-stone-500/60 dark:from-stone-600 dark:to-stone-800">
                <span className="absolute left-1/2 top-1 size-2 -translate-x-1/2 rounded-full bg-background shadow-inner" />
                <span className="mt-1 block font-display text-[11px] font-black uppercase tracking-[0.18em] text-stone-800 dark:text-stone-200">
                  ПХД · 12 місяців
                </span>
              </div>
            </motion.div>

            {/* floating pack */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.55, duration: 0.8 }}
              className="absolute -bottom-6 -right-2 w-24 animate-float sm:-right-6 sm:w-32"
              style={{ ["--float-rot" as string]: "10deg" }}
            >
              <img
                src="/products/grechka-xl.png"
                alt="Гречка українська XL"
                className="w-full drop-shadow-2xl"
              />
            </motion.div>

            {/* feature points */}
            <div className="mt-16 lg:mt-8">
              <h3 className="font-display text-xl font-bold">{t.kits.featureTitle}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t.kits.featureText}
              </p>
              <ul className="mt-4 space-y-2">
                {[t.kits.featurePoint1, t.kits.featurePoint2, t.kits.featurePoint3].map(
                  (point) => (
                    <li key={point} className="flex items-center gap-2.5 text-sm">
                      <span className="grid size-5.5 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        <BadgeCheck className="size-3.5" />
                      </span>
                      {point}
                    </li>
                  )
                )}
              </ul>
            </div>
          </motion.div>

          {/* kits list */}
          <div className="order-1 space-y-5 lg:order-2">
            {list.map((kit, i) => (
              <KitCard key={kit.id} kit={kit} index={i} />
            ))}

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-muted-foreground"
            >
              <Flame className="size-3.5 text-primary" />
              {t.cart.note}
            </motion.p>
          </div>
        </div>
      </div>
    </section>
  );
}
