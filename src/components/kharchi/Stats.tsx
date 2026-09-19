"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useLang } from "./LangProvider";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 1600;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref}>
      {val.toLocaleString("uk-UA")}
      {suffix}
    </span>
  );
}

const STATS = [
  { value: 88, suffix: "+", label: "позицій у меню" },
  { value: 10, suffix: " хв", label: "і страва готова" },
  { value: 98, suffix: "%", label: "смаку зберігається" },
  { value: 2017, suffix: "", label: "року на ринку", plain: true },
];

export default function Stats() {
  const { t } = useLang();
  return (
    <section className="relative border-y border-border/60 bg-card/40 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.6 }}
            className="text-center"
          >
            <div className="font-display text-3xl sm:text-5xl font-extrabold text-gradient-flame">
              {s.plain ? s.value : <Counter to={s.value} suffix={s.suffix} />}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{t.stats[i]}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
