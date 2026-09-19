"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowDown, Timer, Mountain, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import Embers from "./Embers";
import Steam from "./Steam";
import { useLang } from "./LangProvider";

const easeOut = [0.22, 1, 0.36, 1] as const;

function FloatPack({
  src,
  alt,
  className,
  depth,
  rot,
  delay,
  mx,
  my,
  size,
}: {
  src: string;
  alt: string;
  className?: string;
  depth: number;
  rot: number;
  delay: number;
  mx: MotionValue<number>;
  my: MotionValue<number>;
  size: number;
}) {
  const x = useTransform(mx, (v) => v * depth);
  const y = useTransform(my, (v) => v * depth);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 1, ease: easeOut }}
      style={{ x, y }}
      className={`absolute hidden sm:block ${className}`}
    >
      <div
        className="animate-float"
        style={{ ["--float-rot" as string]: `${rot}deg`, animationDelay: `${delay * 1.3}s` }}
      >
        <img
          src={src}
          alt={alt}
          width={size}
          height={size}
          className="w-full h-auto drop-shadow-[0_24px_48px_rgba(0,0,0,0.65)]"
          draggable={false}
        />
      </div>
    </motion.div>
  );
}

export default function Hero({ heroBg }: { heroBg?: string }) {
  const { t } = useLang();
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    rawY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  return (
    <section
      id="top"
      ref={ref}
      onMouseMove={onMouseMove}
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-background"
    >
      {/* Background */}
      <div
        className="hero-photo absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg ?? "/hero-camp.png"})` }}
      />
      <div className="scrim-b absolute inset-0" />
      <div className="scrim-r absolute inset-0" />
      <div className="absolute inset-0 bg-noise" />
      <Embers />

      {/* Giant outline word */}
      <motion.span
        aria-hidden
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 1.4, ease: easeOut }}
        className="font-display text-stroke font-black uppercase select-none absolute -left-6 bottom-6 text-[24vw] leading-none tracking-tighter opacity-60 pointer-events-none"
      >
        Харчі
      </motion.span>

      {/* Floating product packs */}
      <FloatPack
        src="/products/harcho-xl.png"
        alt="Харчо грузинський XL"
        className="right-[6%] top-[16%] w-40 lg:w-56"
        size={224}
        depth={34}
        rot={6}
        delay={0.9}
        mx={mx}
        my={my}
      />
      <FloatPack
        src="/products/borshch-xl.png"
        alt="Борщ український XL"
        className="right-[24%] bottom-[12%] w-32 lg:w-44"
        size={176}
        depth={-22}
        rot={-8}
        delay={1.15}
        mx={mx}
        my={my}
      />
      <FloatPack
        src="/products/tomyam-xl.png"
        alt="Том Ям тайський XL"
        className="right-[38%] top-[12%] w-24 lg:w-36"
        size={144}
        depth={14}
        rot={10}
        delay={1.4}
        mx={mx}
        my={my}
      />

      {/* Steam above headline */}
      <Steam className="absolute left-[8%] top-[26%] w-40 h-32" puffs={3} />

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 pt-28 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.8, ease: easeOut }}
          className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs sm:text-sm text-accent-strong backdrop-blur"
        >
          <Flame className="size-4" />
          {t.hero.badge}
        </motion.div>

        <h1 className="font-display mt-6 font-black uppercase leading-[0.95] tracking-tight text-[clamp(2.6rem,8.5vw,7rem)]">
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.9, ease: easeOut }}
            className="block"
          >
            {t.hero.h1a}
          </motion.span>
          <motion.span
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.9, ease: easeOut }}
            className="block text-gradient-flame"
          >
            {t.hero.h1b}
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: easeOut }}
          className="mt-6 max-w-xl text-base sm:text-lg text-foreground/80"
        >
          {t.hero.p}{" "}
          <span className="text-accent-strong font-medium">
            {t.hero.pAccent}
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.8, ease: easeOut }}
          className="mt-9 flex flex-wrap items-center gap-4"
        >
          <Button
            asChild
            size="lg"
            className="h-14 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 text-base font-bold px-8 pulse-glow transition-transform hover:scale-[1.03] active:scale-95"
          >
            <a href="#catalog">{t.hero.cta}</a>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-14 rounded-full border-border bg-card/40 backdrop-blur hover:bg-accent/70 hover:text-foreground text-base"
          >
            <a href="#how">{t.hero.how}</a>
          </Button>
        </motion.div>

        {/* Trust chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-12 flex flex-wrap gap-3 text-sm text-foreground/80"
        >
          {[
            { icon: Timer, text: t.hero.chips[0] },
            { icon: Mountain, text: t.hero.chips[1] },
            { icon: Flame, text: t.hero.chips[2] },
          ].map(({ icon: Icon, text }) => (
            <span
              key={text}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card/40 px-4 py-2 backdrop-blur"
            >
              <Icon className="size-4 text-primary" />
              {text}
            </span>
          ))}
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.a
        href="#catalog"
        aria-label={t.nav.catalog}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 hidden md:grid place-items-center size-11 rounded-full border border-border bg-card/40 backdrop-blur text-foreground/70 hover:text-foreground"
      >
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
        >
          <ArrowDown className="size-5" />
        </motion.span>
      </motion.a>
    </section>
  );
}
