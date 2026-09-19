"use client";

import ProductCard from "@/components/kharchi/ProductCard";
import { useLang } from "@/components/kharchi/LangProvider";
import type { Product } from "@/lib/products";
import SectionTitle from "./SectionTitle";

/** Секція «З цим часто беруть»: сітка з існуючого ProductCard */
export default function Recommendations({ products }: { products: Product[] }) {
  const { t } = useLang();
  if (!products.length) return null;

  return (
    <section id="recommendations" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle title={t.productPage.recommendations} />
        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
