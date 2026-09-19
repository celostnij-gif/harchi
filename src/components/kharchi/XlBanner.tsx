"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCTS } from "@/lib/products";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import Embers from "./Embers";
import { useLang } from "./LangProvider";
import { productByLang } from "@/lib/i18n";

export default function XlBanner() {
  const { t, lang } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const glowY = useTransform(scrollYProgress, [0, 1], [80, -80]);
  const add = useCart((s) => s.add);
  const featured = PRODUCTS.find((p) => p.id === "borshch-xl")!;
  const l10n = productByLang(featured, lang);

  const handleAdd = () => {
    add({
      id: featured.id,
      name: l10n.name,
      price: featured.price,
      img: featured.img,
    });
    toast.success(t.productCard.added, {
      description: l10n.name,
      icon: "🔥",
    });
  };

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-background py-20 sm:py-28"
    >
      {/* parallax glow */}
      <motion.div
        style={{ y: glowY }}
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 size-[560px] rounded-full bg-orange-600/15 blur-[160px]"
      />
      <Embers count={10} />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Image side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="relative order-2 lg:order-1"
        >
          {/* rotating dashed ring */}
          <div className="absolute inset-4 sm:inset-8 rounded-full border-2 border-dashed border-amber-500/25 animate-spin-slow" />
          <motion.div style={{ y: imgY }} className="relative z-10 mx-auto max-w-md">
            <img
              src="/xl-feature.png"
              alt={l10n.name}
              className="w-full rounded-full object-cover glow-warm"
            />
            {/* floating mini pack */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: -10 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="absolute -right-2 sm:-right-8 top-4 w-24 sm:w-32 animate-float"
              style={{ ["--float-rot" as string]: "8deg" }}
            >
              <img
                src="/products/borshch-xl.png"
                alt="Борщ український XL"
                className="w-full drop-shadow-2xl"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Text side */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="order-1 lg:order-2 text-center lg:text-left"
        >
          <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-sm font-bold text-stone-950">
            <Scale className="size-4" /> {t.xl.badge}
          </span>
          <h2 className="font-display mt-5 text-4xl sm:text-6xl font-black uppercase leading-[0.95] tracking-tight">
            Харчі <span className="text-gradient-flame">XL</span>
            <span className="mt-2 block text-2xl sm:text-3xl text-foreground/80 font-bold">
              {t.xl.h2sub}
            </span>
          </h2>
          <p className="mt-5 max-w-lg mx-auto lg:mx-0 text-muted-foreground leading-relaxed">
            {t.xl.p}
          </p>

          <div className="mt-8 flex flex-wrap justify-center lg:justify-start items-center gap-4">
            <Button
              size="lg"
              onClick={handleAdd}
              className="h-14 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 text-base font-bold px-8 pulse-glow transition-transform hover:scale-[1.03] active:scale-95"
            >
              {t.xl.cta.replace("{price}", String(featured.price))}
              <ArrowRight className="ml-2 size-5" />
            </Button>
            <a
              href="#catalog"
              className="text-sm font-medium text-foreground/75 underline decoration-amber-500/50 underline-offset-4 hover:text-foreground transition-colors"
            >
              {t.xl.link}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
