"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { REVIEWS } from "@/lib/products";
import { REVIEWS_EN } from "@/lib/i18n";
import type { UiReview } from "@/lib/site-data";
import { useLang } from "./LangProvider";

function ReviewCard({
  r,
  index,
  lang,
}: {
  r: UiReview;
  index: number;
  lang: "uk" | "en";
}) {
  const en = REVIEWS_EN[index];
  const data =
    lang === "en"
      ? {
          name: en?.name ?? r.name,
          role: r.roleEn ?? en?.role ?? r.role,
          text: r.textEn ?? en?.text ?? r.text,
        }
      : r;
  return (
    <figure className="card-glass mx-3 w-[320px] sm:w-[400px] shrink-0 rounded-3xl p-6 transition-colors duration-300 hover:border-amber-500/30">
      <div className="flex gap-0.5">
        {Array.from({ length: r.rating }, (_, i) => (
          <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <blockquote className="mt-4 text-sm leading-relaxed text-foreground/80">
        «{data.text}»
      </blockquote>
      <figcaption className="mt-5 flex items-center gap-3">
        <span className="grid place-items-center size-10 rounded-full bg-gradient-to-br from-amber-500/30 to-orange-600/30 border border-amber-500/30 font-display font-bold text-accent-strong">
          {data.name[0]}
        </span>
        <span>
          <span className="block text-sm font-semibold">{data.name}</span>
          <span className="block text-xs text-muted-foreground/80">{data.role}</span>
        </span>
      </figcaption>
    </figure>
  );
}

export default function Reviews({ reviews }: { reviews?: UiReview[] }) {
  const { lang, t } = useLang();
  const list: UiReview[] = reviews?.length ? reviews : REVIEWS;
  const rowA = list.slice(0, 3);
  const rowB = list.slice(3);
  return (
    <section id="reviews" className="relative py-20 sm:py-28 scroll-mt-20 overflow-hidden">
      <div className="pointer-events-none absolute left-[-140px] top-1/4 size-[420px] rounded-full bg-orange-700/10 blur-[130px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          <span className="text-xs font-bold uppercase tracking-[0.3em] text-primary">
            {t.reviews.label}
          </span>
          <h2 className="font-display mt-3 text-3xl sm:text-5xl font-extrabold uppercase tracking-tight">
            {t.reviews.h2a}
            <span className="text-gradient-flame">{t.reviews.h2b}</span>
            {lang === "uk" ? " годують" : ""}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t.reviews.p}
          </p>
        </motion.div>
      </div>

      {/* marquee rows */}
      <div className="mt-12 space-y-6 mask-fade-x">
        <div className="marquee-paused overflow-hidden">
          <div className="marquee-track py-1">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
                {rowA.concat(rowA).map((r, i) => (
                  <ReviewCard key={`${half}-a-${i}`} r={r} index={i % rowA.length} lang={lang} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="marquee-paused overflow-hidden">
          <div className="marquee-track reverse py-1">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0" aria-hidden={half === 1}>
                {rowB.concat(rowB).map((r, i) => (
                  <ReviewCard key={`${half}-b-${i}`} r={r} index={(i % rowB.length) + rowA.length} lang={lang} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
