"use client";

import { motion } from "framer-motion";
import { useLang } from "@/components/kharchi/LangProvider";
import { productByLang } from "@/lib/i18n";
import type { Product } from "@/lib/products";
import SectionTitle from "./SectionTitle";

/** Стандартні абзаци-фолбек, якщо опис у БД порожній */
const FALLBACK_EXTRA = {
  uk: [
    "Сублимація — це м'яке заморожування з вакуумним висушуванням: страва втрачає до 95% ваги, але зберігає до 98% смаку, аромату та вітамінів. У пакеті — лише натуральні інгредієнти, без консервантів та підсилювачів смаку.",
    "Приготування займає близько 10 хвилин: залийте вміст 350–400 мл окропу, перемішайте — і гаряча домашня страва готова. Їсти можна прямо з пакета, посуд не потрібен.",
  ],
  en: [
    "Freeze-drying is gentle freezing combined with vacuum drying: the meal loses up to 95% of its weight but keeps up to 98% of taste, aroma and vitamins. Inside the pack — only natural ingredients, no preservatives or flavor enhancers.",
    "Cooking takes about 10 minutes: pour in 350–400 ml of boiling water, stir — and a hot homemade meal is ready. You can eat right out of the pouch, no dishes needed.",
  ],
};

/** Секція «Опис»: descriptionUk/En по-абзацно, з авто-фолбеком */
export default function ProductDescription({ product }: { product: Product }) {
  const { lang, t } = useLang();
  const l10n = productByLang(product, lang);

  const raw = (lang === "en" ? product.descriptionEn : product.descriptionUk) ?? "";
  const paragraphs = raw.trim()
    ? raw
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [l10n.short, ...FALLBACK_EXTRA[lang]];

  return (
    <section id="description" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle title={t.productPage.description} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mx-auto mt-8 max-w-3xl space-y-5"
        >
          {paragraphs.map((p, i) => (
            <p
              key={i}
              className={`leading-relaxed ${
                i === 0 ? "text-lg text-foreground/90" : "text-base text-muted-foreground"
              }`}
            >
              {p}
            </p>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
