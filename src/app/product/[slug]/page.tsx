import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/kharchi/Navbar";
import Footer from "@/components/kharchi/Footer";
import CartDrawer from "@/components/kharchi/CartDrawer";
import ProductView from "@/components/product/ProductView";
import ProductDescription from "@/components/product/ProductDescription";
import ProductSpecs from "@/components/product/ProductSpecs";
import ProductFaqSection from "@/components/product/ProductFaqSection";
import ProductReviews, {
  type UiProductReview,
} from "@/components/product/ProductReviews";
import Recommendations from "@/components/product/Recommendations";
import { db } from "@/lib/db";
import { mapDbProduct } from "@/lib/site-data";
import { CATEGORIES } from "@/lib/products";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function findActiveProduct(slug: string) {
  return db.product.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findActiveProduct(slug).catch(() => null);
  if (!product) return { title: "Харчі — сторінку не знайдено" };

  const description =
    product.shortUk ||
    product.descriptionUk.slice(0, 160) ||
    "Сублімована страва «Харчі» — гаряча їжа там, де ти. Готово за 10 хвилин.";
  return {
    title: `${product.nameUk} — Харчі`,
    description,
    openGraph: {
      title: product.nameUk,
      description,
      images: [{ url: product.image }],
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await findActiveProduct(slug);
  if (!product) notFound();

  const cats = product.cats
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const primaryCat = cats[0] ?? "";

  const [dbReviews, dbCategory] = await Promise.all([
    db.review.findMany({
      where: { productSlug: slug, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    primaryCat ? db.category.findUnique({ where: { slug: primaryCat } }) : Promise.resolve(null),
  ]);

  /* Рекомендації: та сама перша категорія; якщо <2 — добираємо ХІТ/NEW */
  let recRows = primaryCat
    ? await db.product.findMany({
        where: {
          isActive: true,
          slug: { not: slug },
          cats: { contains: primaryCat },
        },
        orderBy: [{ sort: "asc" }, { id: "asc" }],
        take: 4,
      })
    : [];
  if (recRows.length < 2) {
    const extra = await db.product.findMany({
      where: {
        isActive: true,
        id: { notIn: [product.id, ...recRows.map((r) => r.id)] },
        // badge у БД може бути як EN-слагом, так і UK-лейблом (після пересіву)
        OR: [{ badge: "hit" }, { badge: "new" }, { badge: "ХІТ" }, { badge: "NEW" }],
      },
      orderBy: [{ sort: "asc" }, { id: "asc" }],
      take: 4 - recRows.length,
    });
    recRows = [...recRows, ...extra];
  }

  const uiProduct = mapDbProduct(product);
  const recommendations = recRows.map(mapDbProduct);

  const reviews: UiProductReview[] = dbReviews.map((r) => ({
    id: r.id,
    author: r.author,
    rating: r.rating,
    text: r.textUk,
    createdAt: r.createdAt.toISOString(),
  }));

  /* Лейбл категорії для breadcrumbs: БД → CATEGORIES фолбек */
  const categoryRow = dbCategory
    ? { label: dbCategory.nameUk, labelEn: dbCategory.nameEn || undefined }
    : (() => {
        const def = CATEGORIES.find((c) => c.id === primaryCat);
        return { label: def?.label ?? "", labelEn: def?.labelEn ?? undefined };
      })();

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;
  const reviewCount = reviews.length || product.reviewsCount;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.nameUk,
    image: product.image.startsWith("http")
      ? product.image
      : `https://harchifood.com${product.image}`,
    description: product.shortUk || product.descriptionUk || undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "UAH",
      availability: "https://schema.org/InStock",
    },
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(avgRating.toFixed(1)),
            reviewCount,
          },
        }
      : {}),
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <ProductView
          product={uiProduct}
          categoryLabel={categoryRow.label}
          categoryLabelEn={categoryRow.labelEn}
          reviewsCount={reviewCount}
        />
        <ProductDescription product={uiProduct} />
        <ProductSpecs
          product={uiProduct}
          categoryLabel={categoryRow.label}
          categoryLabelEn={categoryRow.labelEn}
        />
        <ProductFaqSection product={uiProduct} />
        <ProductReviews
          slug={slug}
          productRating={product.rating}
          productReviewsCount={product.reviewsCount}
          initialReviews={reviews}
        />
        <Recommendations products={recommendations} />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
