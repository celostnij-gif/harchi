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
} from "@/lib/admin-api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

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
    .transform((v) => (v === "" ? null : v)),
  isActive: z.boolean().default(true),
  sort: z.number().int().default(0),
});

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

/** GET /api/admin/reviews/[id] — один відгук. */
export async function GET(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    const review = await db.review.findUnique({ where: { id } });
    if (!review) return fail("not_found", 404);
    return ok(review);
  } catch (e) {
    console.error("GET /api/admin/reviews/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PUT /api/admin/reviews/[id] — повне оновлення. */
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

  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const review = await db.review.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/");
    return ok(review);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PUT /api/admin/reviews/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PATCH /api/admin/reviews/[id] — часткове оновлення. */
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

  const parsed = reviewPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const review = await db.review.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/");
    return ok(review);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PATCH /api/admin/reviews/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** DELETE /api/admin/reviews/[id] — жорстке видалення. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    await db.review.delete({ where: { id } });
    revalidatePath("/");
    return ok({ deleted: true, id });
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    console.error("DELETE /api/admin/reviews/[id] error:", e);
    return fail("server_error", 500);
  }
}
