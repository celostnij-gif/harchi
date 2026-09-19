"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Plus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { formatPrice, type Product } from "@/lib/products";
import { productByLang } from "@/lib/i18n";
import { useLang } from "./LangProvider";

const BADGE_STYLES: Record<string, string> = {
  "ХІТ": "bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950",
  NEW: "bg-gradient-to-r from-lime-400 to-emerald-500 text-stone-950",
  "ПРЕМІУМ": "bg-gradient-to-r from-yellow-300 to-amber-500 text-stone-950",
  "-15%": "bg-gradient-to-r from-red-500 to-rose-600 text-white",
};

export default function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const { lang, t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const add = useCart((s) => s.add);
  const [justAdded, setJustAdded] = useState(false);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rx = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), {
    stiffness: 180,
    damping: 18,
  });
  const ry = useSpring(useTransform(rawX, [-0.5, 0.5], [-10, 10]), {
    stiffness: 180,
    damping: 18,
  });

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onMouseLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  const l10n = productByLang(product, lang);

  const handleAdd = () => {
    add({
      id: product.id,
      name: l10n.name,
      price: product.price,
      img: product.img,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 700);
    toast.success(t.productCard.added, {
      description: l10n.name,
      icon: "🍲",
    });
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      className="group [perspective:1000px]"
    >
      <motion.div
        ref={ref}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
        className="card-glass relative flex h-full flex-col rounded-3xl p-3 transition-shadow duration-500 hover:shadow-[0_20px_60px_-15px_rgba(234,88,12,0.35)] hover:border-amber-500/30"
      >
        {/* Image */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-muted/60 to-muted/20">
          {product.badge && (
            <span
              className={`absolute left-3 top-3 z-10 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${BADGE_STYLES[product.badge]}`}
            >
              {t.badge[product.badge] ?? product.badge}
            </span>
          )}
          {product.oldPrice && (
            <span className="absolute right-3 top-3 z-10 rounded-full bg-red-600/90 px-2.5 py-1 text-[11px] font-bold text-white">
              {t.productCard.deal}
            </span>
          )}
          <Link
            href={`/product/${product.id}`}
            aria-label={l10n.name}
            className="block outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 rounded-2xl"
          >
            <img
              src={product.img}
              alt={l10n.name}
              loading="lazy"
              className="aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.08] group-hover:-rotate-2"
            />
          </Link>
          {/* hover glow */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-orange-600/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col px-2 pt-4 pb-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Star className="size-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-foreground/85">
              {product.rating.toFixed(1)}
            </span>
            <span>({product.reviews})</span>
            <span className="ml-auto text-[11px] uppercase tracking-wide text-primary/80">
              {l10n.portion}
            </span>
          </div>

          <h3 className="mt-2 font-display text-[15px] font-semibold leading-snug">
            <Link
              href={`/product/${product.id}`}
              className="transition-colors duration-300 hover:text-accent-strong"
            >
              {l10n.name}
            </Link>
          </h3>
          <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
            {l10n.short}
          </p>

          <div className="mt-auto flex items-end justify-between gap-3 pt-4">
            <div className="flex flex-col">
              {product.oldPrice && (
                <span className="text-xs text-muted-foreground/70 line-through">
                  {formatPrice(product.oldPrice)}
                </span>
              )}
              <span className="font-display text-xl font-bold text-accent-strong">
                {formatPrice(product.price)}
              </span>
            </div>
            <Button
              onClick={handleAdd}
              size="icon"
              aria-label={t.productCard.addAria.replace("{name}", l10n.name)}
              className={`size-11 rounded-full text-stone-950 transition-all duration-300 active:scale-90 ${
                justAdded
                  ? "bg-emerald-500 scale-110"
                  : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 hover:scale-110 shadow-lg shadow-orange-600/30"
              }`}
            >
              <Plus
                className={`size-5 transition-transform duration-300 ${justAdded ? "rotate-90" : ""}`}
                strokeWidth={2.75}
              />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}
