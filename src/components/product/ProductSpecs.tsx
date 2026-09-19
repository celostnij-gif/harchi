"use client";

import { motion } from "framer-motion";
import { Flame, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import { useLang } from "@/components/kharchi/LangProvider";
import { productByLang } from "@/lib/i18n";
import type { Product, ProductSpec } from "@/lib/products";
import SectionTitle from "./SectionTitle";

/** Секція «Характеристики»: таблиця з БД або авто-фолбек з відомих полів */
export default function ProductSpecs({
  product,
  categoryLabel,
  categoryLabelEn,
}: {
  product: Product;
  categoryLabel: string;
  categoryLabelEn?: string;
}) {
  const { lang, t } = useLang();
  const l10n = productByLang(product, lang);
  const cat = lang === "en" ? categoryLabelEn || categoryLabel : categoryLabel;

  const fallback: ProductSpec[] = [
    {
      labelUk: "Порція",
      valueUk: l10n.portion,
      labelEn: "Serving",
      valueEn: l10n.portion,
    },
    ...(product.kcal
      ? [
          {
            labelUk: "Калорійність",
            valueUk: `${product.kcal} ккал`,
            labelEn: "Calories",
            valueEn: `${product.kcal} kcal`,
          },
        ]
      : []),
    ...(product.weight
      ? [
          {
            labelUk: "Вага пакета",
            valueUk: `${product.weight} г`,
            labelEn: "Package weight",
            valueEn: `${product.weight} g`,
          },
        ]
      : []),
    {
      labelUk: "Час приготування",
      valueUk: "10 хвилин",
      labelEn: "Cooking time",
      valueEn: "10 minutes",
    },
    {
      labelUk: "Термін зберігання",
      valueUk: "12 місяців",
      labelEn: "Shelf life",
      valueEn: "12 months",
    },
    {
      labelUk: "Категорія",
      valueUk: cat,
      labelEn: "Category",
      valueEn: cat,
    },
  ];

  const rows = product.specs?.length ? product.specs : fallback;

  const iconFor = (label: string): LucideIcon => {
    const l = label.toLowerCase();
    if (l.includes("час") || l.includes("готув") || l.includes("time") || l.includes("cooking"))
      return Timer;
    if (l.includes("калор") || l.includes("calor") || l.includes("ккал") || l.includes("kcal"))
      return Flame;
    return ShieldCheck;
  };

  return (
    <section id="specs" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle title={t.productPage.specs} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="card-glass mt-8 overflow-hidden rounded-3xl border-border/40"
        >
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row, i) => {
                const label = lang === "en" ? row.labelEn ?? row.labelUk : row.labelUk;
                const value = lang === "en" ? row.valueEn ?? row.valueUk : row.valueUk;
                const Icon = iconFor(lang === "en" ? row.labelEn ?? row.labelUk : row.labelUk);
                return (
                  <tr
                    key={`${i}-${label}`}
                    className={`border-b border-border/40 transition-colors last:border-b-0 ${
                      i % 2 === 1 ? "bg-muted/30" : "bg-transparent"
                    }`}
                  >
                    <th
                      scope="row"
                      className="flex items-center gap-2.5 px-5 py-4 text-left font-medium text-foreground/85"
                    >
                      <Icon className="size-4 shrink-0 text-amber-500" aria-hidden />
                      {label}
                    </th>
                    <td className="px-5 py-4 text-right text-muted-foreground">{value}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
