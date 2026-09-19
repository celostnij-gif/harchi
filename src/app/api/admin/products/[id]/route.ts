import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import {
  fail,
  isRecordNotFound,
  isUniqueConflict,
  ok,
  parseRouteId,
  PRODUCT_FAQ_RULE,
  SPECS_RULE,
  validateJsonStringArray,
} from "@/lib/admin-api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

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

/** GET /api/admin/products/[id] — один товар. */
export async function GET(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    const product = await db.product.findUnique({ where: { id } });
    if (!product) return fail("not_found", 404);
    return ok(product);
  } catch (e) {
    console.error("GET /api/admin/products/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PUT /api/admin/products/[id] — повне оновлення. */
export async function PUT(req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

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
    const product = await db.product.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/");
    return ok(product);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PUT /api/admin/products/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PATCH /api/admin/products/[id] — часткове оновлення. */
export async function PATCH(req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_json", 400);
  }

  const parsed = productPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const product = await db.product.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/");
    return ok(product);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PATCH /api/admin/products/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** DELETE /api/admin/products/[id] — жорстке видалення. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    await db.product.delete({ where: { id } });
    revalidatePath("/");
    return ok({ deleted: true, id });
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    console.error("DELETE /api/admin/products/[id] error:", e);
    return fail("server_error", 500);
  }
}
