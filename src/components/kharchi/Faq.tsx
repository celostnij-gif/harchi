"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { FAQ } from "@/lib/products";
import { FAQ_EN } from "@/lib/i18n";
import type { UiFaq } from "@/lib/site-data";
import { useLang } from "./LangProvider";

export default function Faq({ faq }: { faq?: UiFaq[] }) {
  const { lang, t } = useLang();
  const list: UiFaq[] = faq?.length ? faq : FAQ;
  const data = list.map((f, i) =>
    lang === "en"
      ? { q: f.qEn ?? FAQ_EN[i]?.q ?? f.q, a: f.aEn ?? FAQ_EN[i]?.a ?? f.a }
      : { q: f.q, a: f.a }
  );
  return (
    <section id="faq" className="relative py-20 sm:py-28 scroll-mt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t.faq.label}
          </span>
          <h2 className="font-display mt-3 text-3xl sm:text-5xl font-extrabold uppercase tracking-tight">
            {t.faq.h2a}
            <span className="text-gradient-flame">{t.faq.h2b}</span>
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="mt-10"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {data.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="card-glass rounded-2xl border px-5 data-[state=open]:border-amber-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left text-[15px] sm:text-base font-semibold hover:no-underline hover:text-accent-strong py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-[15px] leading-relaxed text-muted-foreground pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
