"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Flame,
  Minus,
  Package,
  Plus,
  ShoppingCart,
  Snowflake,
  Star,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Steam from "@/components/kharchi/Steam";
import { useLang } from "@/components/kharchi/LangProvider";
import { useCart } from "@/lib/cart-store";
import { formatPrice, type Product } from "@/lib/products";
import { productByLang } from "@/lib/i18n";

const BADGE_STYLES: Record<string, string> = {
  "ХІТ": "bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950",
  NEW: "bg-gradient-to-r from-lime-400 to-emerald-500 text-stone-950",
  "ПРЕМІУМ": "bg-gradient-to-r from-yellow-300 to-amber-500 text-stone-950",
  "-15%": "bg-gradient-to-r from-red-500 to-rose-600 text-white",
};

/** Герой сторінки товару: breadcrumbs, фото з паром, ціна, додавання в кошик */
export default function ProductView({
  product,
  categoryLabel,
  categoryLabelEn,
  reviewsCount,
}: {
  product: Product;
  categoryLabel: string;
  categoryLabelEn?: string;
  reviewsCount: number;
}) {
  const { lang, t } = useLang();
  const l10n = productByLang(product, lang);
  const add = useCart((s) => s.add);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const save = product.oldPrice
    ? Math.max(0, Math.round(product.oldPrice - product.price))
    : 0;
  const catLabel = lang === "en" ? categoryLabelEn || categoryLabel : categoryLabel;

  const handleAdd = () => {
    for (let i = 0; i < qty; i += 1) {
      add({ id: product.id, name: l10n.name, price: product.price, img: product.img });
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 700);
    toast.success(t.productCard.added, {
      description: qty > 1 ? `${l10n.name} × ${qty}` : l10n.name,
      icon: "🍲",
    });
  };

  const chips: { icon: ReactNode; text: string }[] = [];
  if (product.kcal)
    chips.push({ icon: <Flame className="size-3.5" />, text: `${product.kcal} ${t.productPage.kcal}` });
  if (product.weight)
    chips.push({ icon: <Package className="size-3.5" />, text: `${product.weight} г · ${t.productPage.net}` });
  chips.push({ icon: <Timer className="size-3.5" />, text: t.productPage.ready });
  chips.push({ icon: <Snowflake className="size-3.5" />, text: t.productPage.shelf });

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-14 sm:pb-20">
      {/* ember glow */}
      <div className="pointer-events-none absolute -top-24 right-[-120px] size-[420px] rounded-full bg-orange-700/10 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="transition-colors hover:text-accent-strong">
            {t.productPage.home}
          </Link>
          <span aria-hidden className="text-muted-foreground/50">/</span>
          <Link href="/#catalog" className="transition-colors hover:text-accent-strong">
            {catLabel || t.productPage.category}
          </Link>
          <span aria-hidden className="text-muted-foreground/50">/</span>
          <span aria-current="page" className="max-w-[60vw] truncate font-medium text-foreground sm:max-w-xs">
            {l10n.name}
          </span>
        </nav>

        <div className="mt-8 grid items-center gap-10 lg:mt-12 lg:grid-cols-2 lg:gap-14">
          {/* Ліва колонка: фото */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="relative"
            >
              <div className="card-glass relative overflow-hidden rounded-3xl p-4 shadow-2xl shadow-orange-950/20 sm:p-6">
                {product.badge && (
                  <span
                    className={`absolute left-6 top-6 z-10 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${BADGE_STYLES[product.badge]}`}
                  >
                    {t.badge[product.badge] ?? product.badge}
                  </span>
                )}
                {product.oldPrice && (
                  <span className="absolute right-6 top-6 z-10 rounded-full bg-red-600/90 px-2.5 py-1 text-[11px] font-bold text-white">
                    {t.productCard.deal}
                  </span>
                )}
                <img
                  src={product.img}
                  alt={l10n.name}
                  className="w-full rounded-2xl object-cover"
                />
                <Steam className="absolute inset-x-0 bottom-0 h-28" puffs={3} />
              </div>
            </motion.div>
            <div className="pointer-events-none absolute -inset-10 -z-10 rounded-full bg-orange-600/15 blur-[110px]" />
          </motion.div>

          {/* Права колонка: інфо */}
          <motion.div
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {l10n.name}
            </h1>

            {/* рейтинг */}
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <div className="flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`size-4 ${
                      i < Math.round(product.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/40"
                    }`}
                  />
                ))}
              </div>
              <span className="font-display text-sm font-bold">{product.rating.toFixed(1)}</span>
              <a
                href="#reviews"
                className="text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-accent-strong hover:underline"
              >
                {reviewsCount || product.reviews} {t.productPage.reviewsCount}
              </a>
            </div>

            <p className="mt-4 max-w-xl leading-relaxed text-muted-foreground">{l10n.short}</p>

            {/* ціна */}
            <div className="mt-6 flex flex-wrap items-end gap-3">
              <span className="font-display text-4xl font-extrabold text-accent-strong sm:text-5xl">
                {formatPrice(product.price)}
              </span>
              {product.oldPrice && (
                <span className="pb-1 text-xl text-muted-foreground/70 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              {save > 0 && (
                <span className="mb-1 rounded-full bg-red-600/90 px-3 py-1 text-xs font-bold text-white">
                  {t.productPage.save}: {formatPrice(save)}
                </span>
              )}
            </div>

            {/* порція */}
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="size-4 shrink-0 text-amber-500" />
              <span>
                <span className="font-semibold text-foreground/85">{t.productPage.portion}:</span>{" "}
                {l10n.portion}
              </span>
            </div>

            {/* кількість + кошик */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/40 p-1">
                <button
                  type="button"
                  aria-label={t.cart.minus}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted"
                >
                  <Minus className="size-4" />
                </button>
                <span aria-live="polite" className="w-8 text-center font-display font-bold">
                  {qty}
                </span>
                <button
                  type="button"
                  aria-label={t.cart.plus}
                  onClick={() => setQty((q) => Math.min(20, q + 1))}
                  className="grid size-10 place-items-center rounded-full transition-colors hover:bg-muted"
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <Button
                onClick={handleAdd}
                size="lg"
                className={`h-14 min-w-[220px] flex-1 rounded-full text-base font-bold text-stone-950 transition-all duration-300 active:scale-[0.98] ${
                  justAdded
                    ? "bg-emerald-500 hover:bg-emerald-500"
                    : "bg-gradient-to-r from-amber-500 to-orange-600 shadow-lg shadow-orange-600/30 hover:from-amber-400 hover:to-orange-500"
                }`}
              >
                <ShoppingCart className="mr-2 size-5" strokeWidth={2.5} />
                {justAdded ? t.productCard.added : t.productPage.addToCart}
              </Button>
            </div>

            {/* швидкі факти */}
            <div className="mt-7 flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-foreground/85"
                >
                  <span className="text-amber-500">{c.icon}</span>
                  {c.text}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
