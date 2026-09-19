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

const categorySchema = z.object({
  slug: z.string().trim().min(1).max(120),
  nameUk: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).default(""),
  sort: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

const categoryPatchSchema = z.object({
  slug: z.string().trim().min(1).max(120).optional(),
  nameUk: z.string().trim().min(1).max(200).optional(),
  nameEn: z.string().trim().max(200).optional(),
  sort: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

/** GET /api/admin/categories/[id] — одна категорія. */
export async function GET(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    const category = await db.category.findUnique({ where: { id } });
    if (!category) return fail("not_found", 404);
    return ok(category);
  } catch (e) {
    console.error("GET /api/admin/categories/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PUT /api/admin/categories/[id] — повне оновлення. */
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

  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const category = await db.category.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/");
    return ok(category);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PUT /api/admin/categories/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PATCH /api/admin/categories/[id] — часткове оновлення. */
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

  const parsed = categoryPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const category = await db.category.update({
      where: { id },
      data: parsed.data,
    });
    revalidatePath("/");
    return ok(category);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PATCH /api/admin/categories/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** DELETE /api/admin/categories/[id] — жорстке видалення. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    await db.category.delete({ where: { id } });
    revalidatePath("/");
    return ok({ deleted: true, id });
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    console.error("DELETE /api/admin/categories/[id] error:", e);
    return fail("server_error", 500);
  }
}
