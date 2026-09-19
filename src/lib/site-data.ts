import { cache } from "react";
import { db } from "@/lib/db";
import { deepMerge } from "./deep-merge";
import {
  STRINGS,
  KITS,
  type UIStrings,
  type Lang,
  type Kit,
} from "./i18n";
import {
  PRODUCTS,
  REVIEWS,
  FAQ,
  type Product as UiProduct,
  type Category as UiCategorySlug,
  type ProductSpec,
  type ProductFaqItem,
} from "./products";
import type { Product as DbProduct } from "@prisma/client";

/* ---------- типи ---------- */

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends (infer U)[]
    ? U[]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};

export type StringOverrides = Record<Lang, Record<string, unknown>>;

export interface UiReview {
  name: string;
  role: string;
  text: string;
  rating: number;
  roleEn?: string;
  textEn?: string;
}

export interface UiFaq {
  q: string;
  a: string;
  qEn?: string;
  aEn?: string;
}

export interface UiCategory {
  id: string;
  label: string;
  labelEn?: string;
}

export interface SiteData {
  /** override-и текстів: { uk: { hero: {...} }, en: {...} } */
  overrides: StringOverrides;
  /** видимість секцій: { hero: true, faq: false, ... } */
  visibility: Record<string, boolean>;
  /** фонове зображення hero (з контенту hero.bgImage) */
  heroBg?: string;
  /** набори ПХД (заміна KITS, якщо задані в адмінці) */
  kits?: Kit[];
  products: UiProduct[];
  categories: UiCategory[];
  reviews: UiReview[];
  faq: UiFaq[];
}

/* ---------- утиліти ---------- */

/** Deep-merge перенесено у src/lib/deep-merge.ts; re-export для сумісності. */
export { deepMerge };

/** Defensiv JSON.parse масиву з рядка (specs/productFaq у БД — JSON-рядки). */
export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** Мапінг Product з БД → UI-тип Product (спільний для головної та сторінки товару). */
export function mapDbProduct(p: DbProduct): UiProduct {
  return {
    id: p.slug,
    name: p.nameUk,
    short: p.shortUk,
    price: p.price,
    oldPrice: p.oldPrice ?? undefined,
    img: p.image,
    cats: (p.cats ? p.cats.split(",").filter(Boolean) : []) as UiCategorySlug[],
    badge: mapBadge(p.badge),
    rating: p.rating,
    reviews: p.reviewsCount,
    portion: p.portionUk,
    nameEn: p.nameEn || undefined,
    shortEn: p.shortEn || undefined,
    portionEn: p.portionEn || undefined,
    descriptionUk: p.descriptionUk || undefined,
    descriptionEn: p.descriptionEn || undefined,
    kcal: p.kcal ?? undefined,
    weight: p.weight ?? undefined,
    specs: parseJsonArray<ProductSpec>(p.specs),
    productFaq: parseJsonArray<ProductFaqItem>(p.productFaq),
  };
}

/** DB badge ("hit"|"new"|"premium"|"deal" або UK-лейбли після пересіву) → UI badge */
function mapBadge(b: string | null): UiProduct["badge"] | undefined {
  switch (b) {
    case "hit":
    case "ХІТ":
      return "ХІТ";
    case "new":
    case "NEW":
      return "NEW";
    case "premium":
    case "ПРЕМІУМ":
      return "ПРЕМІУМ";
    case "deal":
    case "-15%":
      return "-15%";
    default:
      return undefined;
  }
}

/* ---------- читання з БД (з fallback на константи) ---------- */

export const getSiteData = cache(async function getSiteData(): Promise<SiteData> {
  const [sections, dbProducts, dbReviews, dbFaq, dbCats] = await Promise.all([
    db.sectionContent.findMany(),
    db.product.findMany({
      where: { isActive: true },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    }),
    db.review.findMany({
      where: { isActive: true },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    }),
    db.faqItem.findMany({
      where: { isActive: true },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    }),
    db.category.findMany({
      where: { isActive: true },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    }),
  ]);

  /* --- текстові override-и --- */
  const overrides: StringOverrides = { uk: {}, en: {} };
  const visibility: Record<string, boolean> = {};
  let heroBg: string | undefined;
  let kits: Kit[] | undefined;

  for (const s of sections) {
    visibility[s.key] = s.visible;
    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(s.data || "{}");
    } catch {
      parsed = {};
    }
    for (const lang of ["uk", "en"] as Lang[]) {
      const part = parsed[lang];
      if (part && typeof part === "object") {
        overrides[lang][s.key] = part;
      }
    }
    // спільні (не мовні) поля
    if (s.key === "hero") {
      const uk = parsed.uk as Record<string, unknown> | undefined;
      const en = parsed.en as Record<string, unknown> | undefined;
      const bg = (uk?.bgImage ?? en?.bgImage) as string | undefined;
      if (bg) heroBg = bg;
    }
    if (s.key === "kits" && Array.isArray(parsed.kits)) {
      kits = parsed.kits as Kit[];
    }
  }

  /* --- категорії (fallback CATEGORIES без "all" додається на клієнті) --- */
  const categories: UiCategory[] = dbCats.length
    ? dbCats.map((c) => ({
        id: c.slug,
        label: c.nameUk,
        labelEn: c.nameEn || undefined,
      }))
    : [];

  /* --- товари --- */
  const products: UiProduct[] = dbProducts.length
    ? dbProducts.map(mapDbProduct)
    : PRODUCTS;

  /* --- відгуки --- */
  const reviews: UiReview[] = dbReviews.length
    ? dbReviews.map((r) => ({
        name: r.author,
        role: r.roleUk,
        text: r.textUk,
        rating: r.rating,
        roleEn: r.roleEn || undefined,
        textEn: r.textEn || undefined,
      }))
    : REVIEWS;

  /* --- FAQ --- */
  const faq: UiFaq[] = dbFaq.length
    ? dbFaq.map((f) => ({
        q: f.qUk,
        a: f.aUk,
        qEn: f.qEn || undefined,
        aEn: f.aEn || undefined,
      }))
    : FAQ;

  return {
    overrides,
    visibility,
    heroBg,
    kits: kits ?? KITS,
    products,
    categories,
    reviews,
    faq,
  };
});
