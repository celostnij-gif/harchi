"use client";

import { motion } from "framer-motion";
import { Flame, ArrowDownWideNarrow } from "lucide-react";
import { Button } from "@/components/ui/button";
import Embers from "./Embers";
import Steam from "./Steam";
import { useLang } from "./LangProvider";

export default function CtaBanner() {
  const { t } = useLang();
  return (
    <section className="relative px-4 sm:px-6 pb-20 sm:pb-28">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="cta-panel relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] border border-amber-500/25 px-6 py-16 sm:px-16 sm:py-20 text-center"
      >
        {/* backdrop */}
        <div className="absolute inset-0 bg-noise" />
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 size-[440px] rounded-full bg-amber-600/20 blur-[120px]" />
        <Embers count={12} />
        <Steam className="absolute left-[16%] bottom-10 w-28 h-24" puffs={2} />
        <Steam className="absolute right-[16%] bottom-10 w-28 h-24" puffs={2} />

        <div className="relative">
          <Flame className="mx-auto size-12 text-amber-500 animate-float" />
          <h2 className="font-display mt-5 text-3xl sm:text-5xl font-black uppercase tracking-tight">
            {t.cta.h2a}
            <span className="text-gradient-flame">{t.cta.h2b}</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t.cta.p}
          </p>
          <Button
            asChild
            size="lg"
            className="mt-8 h-14 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 text-base font-bold px-9 pulse-glow transition-transform hover:scale-[1.03] active:scale-95"
          >
            <a href="#catalog">
              <ArrowDownWideNarrow className="mr-2 size-5" />
              {t.cta.button}
            </a>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}
