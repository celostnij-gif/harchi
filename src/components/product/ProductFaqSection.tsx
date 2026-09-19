"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLang } from "@/components/kharchi/LangProvider";
import type { Product, ProductFaqItem } from "@/lib/products";
import SectionTitle from "./SectionTitle";

/** Загальні Q/A, якщо productFaq у БД порожній */
const GENERAL_FAQ: ProductFaqItem[] = [
  {
    qUk: "Як приготувати цю страву?",
    aUk: "Відкрийте пакет, залийте вміст 350–400 мл окропу, перемішайте й зачекайте 8–10 хвилин. Їсти можна прямо з пакета — посуд не потрібен.",
    qEn: "How do I cook this meal?",
    aEn: "Open the pouch, pour in 350–400 ml of boiling water, stir and wait 8–10 minutes. You can eat right out of the pouch — no dishes needed.",
  },
  {
    qUk: "Скільки зберігається без холодильника?",
    aUk: "До 12 місяців у сухому місці за кімнатної температури. Сублімат витримує і мороз, і спеку — ідеально для походів та ПХД.",
    qEn: "How long does it keep without a fridge?",
    aEn: "Up to 12 months in a dry place at room temperature. Freeze-dried meals withstand frost and heat — perfect for hikes and field rations.",
  },
  {
    qUk: "Як працює доставка?",
    aUk: "Відправляємо Новою Поштою та Укрпоштою по всій Україні, є самовивіз. Замовлення оформлюється за 2 хвилини — менеджер зв'яжеться для підтвердження.",
    qEn: "How does delivery work?",
    aEn: "We ship via Nova Poshta and Ukrposhta across Ukraine, plus pickup. Ordering takes 2 minutes — our manager will call you to confirm.",
  },
];

/** Секція «Питання про товар»: productFaq з БД або загальні Q/A */
export default function ProductFaqSection({ product }: { product: Product }) {
  const { lang, t } = useLang();
  const list = product.productFaq?.length ? product.productFaq : GENERAL_FAQ;
  const data = list.map((f) => ({
    q: lang === "en" ? f.qEn ?? f.qUk : f.qUk,
    a: lang === "en" ? f.aEn ?? f.aUk : f.aUk,
  }));

  return (
    <section id="faq" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionTitle title={t.productPage.faq} />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="mt-8"
        >
          <Accordion type="single" collapsible className="space-y-3">
            {data.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="card-glass rounded-2xl border px-5 transition-colors data-[state=open]:border-amber-500/30"
              >
                <AccordionTrigger className="py-5 text-left text-[15px] font-semibold hover:no-underline hover:text-accent-strong sm:text-base">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
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
