import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { fail, isUniqueConflict, ok } from "@/lib/admin-api";

export const runtime = "nodejs";

/** Повна форма відгуку (POST / PUT). */
const reviewSchema = z.object({
  author: z.string().trim().min(1).max(120),
  roleUk: z.string().trim().max(120).default(""),
  roleEn: z.string().trim().max(120).default(""),
  textUk: z.string().trim().min(1).max(2000),
  textEn: z.string().trim().max(2000).default(""),
  rating: z.number().int().min(1).max(5).default(5),
  productSlug: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .default(null)
    // порожній рядок = «без товару» → зберігаємо null
    .transform((v) => (v === "" ? null : v)),
  isActive: z.boolean().default(true),
  sort: z.number().int().default(0),
});

/** Часткова форма (PATCH). */
const reviewPatchSchema = z.object({
  author: z.string().trim().min(1).max(120).optional(),
  roleUk: z.string().trim().max(120).optional(),
  roleEn: z.string().trim().max(120).optional(),
  textUk: z.string().trim().min(1).max(2000).optional(),
  textEn: z.string().trim().max(2000).optional(),
  rating: z.number().int().min(1).max(5).optional(),
  productSlug: z
    .string()
    .trim()
    .max(200)
    .nullable()
    .optional()
    .transform((v) => (v === "" ? null : v)),
  isActive: z.boolean().optional(),
  sort: z.number().int().optional(),
});

/**
 * GET /api/admin/reviews — усі відгуки (sort asc, id asc).
 * Кожен відгук збагачується productName (join за productSlug → Product.nameUk)
 * для бейджа «Товар: …» в адмінці.
 */
export async function GET() {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const [reviews, products] = await Promise.all([
      db.review.findMany({
        orderBy: [{ sort: "asc" }, { id: "asc" }],
      }),
      db.product.findMany({
        select: { slug: true, nameUk: true, nameEn: true },
      }),
    ]);

    const nameBySlug = new Map<string, string>();
    for (const p of products) {
      nameBySlug.set(p.slug, p.nameUk || p.nameEn);
    }

    const withProduct = reviews.map((r) => ({
      ...r,
      productName: r.productSlug
        ? (nameBySlug.get(r.productSlug) ?? null)
        : null,
    }));

    return ok(withProduct);
  } catch (e) {
    console.error("GET /api/admin/reviews error:", e);
    return fail("server_error", 500);
  }
}

/** POST /api/admin/reviews — створення відгуку. */
export async function POST(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_json", 400);
  }

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const review = await db.review.create({ data: parsed.data });
    revalidatePath("/");
    return ok(review, 201);
  } catch (e) {
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("POST /api/admin/reviews error:", e);
    return fail("server_error", 500);
  }
}
