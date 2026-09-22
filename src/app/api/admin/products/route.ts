import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import {
  fail,
  isUniqueConflict,
  ok,
  BULK_TIERS_RULE,
  PRODUCT_FAQ_RULE,
  SPECS_RULE,
  validateJsonStringArray,
} from "@/lib/admin-api";

export const runtime = "nodejs";

/** JSON-РЯДОК масиву оптових рівнів [{minQty, price}]. */
const bulkTiersField = z
  .string()
  .max(20_000)
  .superRefine((val, ctx) => {
    const err = validateJsonStringArray(val, BULK_TIERS_RULE);
    if (err)
      ctx.addIssue({ code: "custom", message: `bulkTiers.${err} (валідний JSON-масив обʼєктів {minQty, price})` });
  });

/** JSON-РЯДОК масиву характеристик [{labelUk,valueUk,labelEn,valueEn}]. */
const specsField = z
  .string()
  .max(100_000)
  .superRefine((val, ctx) => {
    const err = validateJsonStringArray(val, SPECS_RULE);
    if (err)
      ctx.addIssue({ code: "custom", message: `specs.${err} (валідний JSON-масив обʼєктів {labelUk,valueUk,labelEn,valueEn})` });
  });

/** JSON-РЯДОК масиву FAQ товару [{qUk,aUk,qEn,aEn}]. */
const productFaqField = z
  .string()
  .max(100_000)
  .superRefine((val, ctx) => {
    const err = validateJsonStringArray(val, PRODUCT_FAQ_RULE);
    if (err)
      ctx.addIssue({ code: "custom", message: `productFaq.${err} (валідний JSON-масив обʼєктів {qUk,aUk,qEn,aEn})` });
  });

/** Повна форма товару (POST / PUT). */
const productSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  nameUk: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).default(""),
  shortUk: z.string().trim().max(500).default(""),
  shortEn: z.string().trim().max(500).default(""),
  descriptionUk: z.string().trim().max(5000).default(""),
  descriptionEn: z.string().trim().max(5000).default(""),
  specs: specsField.default("[]"),
  productFaq: productFaqField.default("[]"),
  bulkTiers: bulkTiersField.default("[]"),
  portionUk: z.string().trim().max(200).default(""),
  portionEn: z.string().trim().max(200).default(""),
  cats: z.string().trim().max(500).default(""),
  price: z.number().min(0),
  oldPrice: z.number().min(0).nullable().default(null),
  image: z.string().trim().min(1).max(500),
  badge: z.enum(["hit", "new", "premium", "deal"]).nullable().default(null),
  rating: z.number().min(0).max(5).default(4.9),
  reviewsCount: z.number().int().min(0).default(0),
  kcal: z.number().int().min(1).nullable().default(null),
  weight: z.number().int().min(1).nullable().default(null),
  isActive: z.boolean().default(true),
  sort: z.number().int().default(0),
});

/** Часткова форма (PATCH): усі поля опціональні, дефолти не підставляються. */
const productPatchSchema = z.object({
  slug: z.string().trim().min(1).max(120).optional(),
  nameUk: z.string().trim().min(1).max(200).optional(),
  nameEn: z.string().trim().max(200).optional(),
  shortUk: z.string().trim().max(500).optional(),
  shortEn: z.string().trim().max(500).optional(),
  descriptionUk: z.string().trim().max(5000).optional(),
  descriptionEn: z.string().trim().max(5000).optional(),
  specs: specsField.optional(),
  productFaq: productFaqField.optional(),
  bulkTiers: bulkTiersField.optional(),
  portionUk: z.string().trim().max(200).optional(),
  portionEn: z.string().trim().max(200).optional(),
  cats: z.string().trim().max(500).optional(),
  price: z.number().min(0).optional(),
  oldPrice: z.number().min(0).nullable().optional(),
  image: z.string().trim().min(1).max(500).optional(),
  badge: z.enum(["hit", "new", "premium", "deal"]).nullable().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().int().min(0).optional(),
  kcal: z.number().int().min(1).nullable().optional(),
  weight: z.number().int().min(1).nullable().optional(),
  isActive: z.boolean().optional(),
  sort: z.number().int().optional(),
});

/** GET /api/admin/products — список (?all=1 → включно з неактивними; ?q= пошук). */
export async function GET(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const url = new URL(req.url);
    const all = url.searchParams.get("all") === "1";
    const q = (url.searchParams.get("q") || "").trim();

    const where: Prisma.ProductWhereInput = {
      ...(all ? {} : { isActive: true }),
      ...(q
        ? {
            OR: [
              { nameUk: { contains: q } },
              { nameEn: { contains: q } },
              { slug: { contains: q } },
            ],
          }
        : {}),
    };

    const products = await db.product.findMany({
      where,
      orderBy: [{ sort: "asc" }, { id: "asc" }],
    });
    return ok(products);
  } catch (e) {
    console.error("GET /api/admin/products error:", e);
    return fail("server_error", 500);
  }
}

/** POST /api/admin/products — створення товару. */
export async function POST(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_json", 400);
  }

  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const product = await db.product.create({ data: parsed.data });
    revalidatePath("/");
    return ok(product, 201);
  } catch (e) {
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("POST /api/admin/products error:", e);
    return fail("server_error", 500);
  }
}
