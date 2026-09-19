"use client";

import { motion } from "framer-motion";
import { Droplets, Timer, UtensilsCrossed } from "lucide-react";
import Steam from "./Steam";
import { useLang } from "./LangProvider";

export default function HowItWorks() {
  const { t } = useLang();
  const STEPS = [
    { icon: Droplets, num: "01", ...t.how.steps[0] },
    { icon: Timer, num: "02", ...t.how.steps[1] },
    { icon: UtensilsCrossed, num: "03", ...t.how.steps[2] },
  ];

  return (
    <section id="how" className="relative py-20 sm:py-28 scroll-mt-20 overflow-hidden">
      <div className="pointer-events-none absolute right-[-120px] top-1/3 size-[420px] rounded-full bg-amber-600/10 blur-[120px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t.how.label}
          </span>
          <h2 className="font-display mt-3 text-3xl sm:text-5xl font-extrabold uppercase tracking-tight">
            {t.how.h2a}
            <span className="text-gradient-flame">{t.how.h2b}</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, num, title, text }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="group relative"
            >
              <div className="card-glass relative h-full rounded-3xl p-7 overflow-hidden transition-all duration-500 hover:border-amber-500/30 hover:shadow-[0_20px_60px_-15px_rgba(234,88,12,0.3)]">
                {/* big ghost number */}
                <span className="font-display absolute -right-2 -top-6 text-[7rem] font-black leading-none text-foreground/[0.05] select-none group-hover:text-primary/15 transition-colors duration-500">
                  {num}
                </span>
                <Steam className="absolute left-8 top-7 w-24 h-20 opacity-0 group-hover:opacity-100 transition-opacity duration-700" puffs={2} />
                <div className="relative">
                  <div className="grid place-items-center size-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/25 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                    <Icon className="size-7" />
                  </div>
                  <h3 className="font-display mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </div>
              </div>
              {/* connector */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 h-px w-6 bg-gradient-to-r from-amber-500/60 to-transparent" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
