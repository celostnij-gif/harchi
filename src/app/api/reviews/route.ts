import { z } from "zod";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

/**
 * ПУБЛІЧНЕ API відгуків про товар (БЕЗ адмін-гварда).
 * Контракт (Task 6.1): { ok, data } | { ok:false, error, details? }.
 * GET  ?slug=<productSlug> → активні відгуки товару, createdAt desc.
 * POST { slug, author, rating, text } → створення одразу активним (модерація
 * приховуванням/видаленням через /admin/reviews).
 */
export const runtime = "nodejs";

interface PublicReview {
  id: number;
  author: string;
  rating: number;
  text: string;
  createdAt: Date;
}

/** Публічна форма відгуку в відповідях API (text = textUk). */
function toPublic(r: {
  id: number;
  author: string;
  rating: number;
  textUk: string;
  createdAt: Date;
}): PublicReview {
  return {
    id: r.id,
    author: r.author,
    rating: r.rating,
    text: r.textUk,
    createdAt: r.createdAt,
  };
}

const publicReviewSelect = {
  id: true,
  author: true,
  rating: true,
  textUk: true,
  createdAt: true,
} as const;

/** GET /api/reviews?slug=<productSlug> — активні відгуки товару (новіші спершу). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").trim();

  if (!slug) {
    return NextResponse.json(
      { ok: false, error: "validation", details: "slug_required" },
      { status: 400 }
    );
  }

  try {
    const reviews = await db.review.findMany({
      where: { isActive: true, productSlug: slug },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: publicReviewSelect,
    });
    return NextResponse.json({ ok: true, data: reviews.map(toPublic) });
  } catch (e) {
    console.error("GET /api/reviews error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}

const createSchema = z.object({
  slug: z.string().trim().min(1, "slug_required").max(200),
  author: z.string().trim().min(2, "author_2_40").max(40, "author_2_40"),
  rating: z
    .number()
    .int("rating_int_1_5")
    .min(1, "rating_1_5")
    .max(5, "rating_1_5"),
  text: z.string().trim().min(5, "text_5_500").max(500, "text_5_500"),
});

/** POST /api/reviews — залишити відгук про товар (одразу активний, sort=1000). */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "validation",
        details: parsed.error.issues.map(
          (i) => `${i.path.join(".") || "body"}: ${i.message}`
        ),
      },
      { status: 400 }
    );
  }

  const { slug, author, rating, text } = parsed.data;

  try {
    const product = await db.product.findUnique({
      where: { slug },
      select: { id: true, isActive: true },
    });
    if (!product || !product.isActive) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }

    const review = await db.review.create({
      data: {
        author,
        textUk: text,
        rating,
        productSlug: slug,
        isActive: true,
        sort: 1000,
      },
      select: publicReviewSelect,
    });

    revalidatePath(`/product/${slug}`);
    return NextResponse.json(
      { ok: true, data: toPublic(review) },
      { status: 201 }
    );
  } catch (e) {
    console.error("POST /api/reviews error:", e);
    return NextResponse.json(
      { ok: false, error: "server_error" },
      { status: 500 }
    );
  }
}
