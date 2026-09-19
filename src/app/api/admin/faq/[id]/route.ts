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

const faqSchema = z.object({
  qUk: z.string().trim().min(1).max(500),
  qEn: z.string().trim().max(500).default(""),
  aUk: z.string().trim().min(1).max(5000),
  aEn: z.string().trim().max(5000).default(""),
  isActive: z.boolean().default(true),
  sort: z.number().int().default(0),
});

const faqPatchSchema = z.object({
  qUk: z.string().trim().min(1).max(500).optional(),
  qEn: z.string().trim().max(500).optional(),
  aUk: z.string().trim().min(1).max(5000).optional(),
  aEn: z.string().trim().max(5000).optional(),
  isActive: z.boolean().optional(),
  sort: z.number().int().optional(),
});

/** GET /api/admin/faq/[id] — один пункт FAQ. */
export async function GET(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    const item = await db.faqItem.findUnique({ where: { id } });
    if (!item) return fail("not_found", 404);
    return ok(item);
  } catch (e) {
    console.error("GET /api/admin/faq/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PUT /api/admin/faq/[id] — повне оновлення. */
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

  const parsed = faqSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const item = await db.faqItem.update({ where: { id }, data: parsed.data });
    revalidatePath("/");
    return ok(item);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PUT /api/admin/faq/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PATCH /api/admin/faq/[id] — часткове оновлення. */
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

  const parsed = faqPatchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: ${parsed.error.issues.map((i) => `${i.path.join(".") || "body"}: ${i.message}`).join("; ")}`,
      400
    );
  }

  try {
    const item = await db.faqItem.update({ where: { id }, data: parsed.data });
    revalidatePath("/");
    return ok(item);
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    if (isUniqueConflict(e)) return fail("conflict", 409);
    console.error("PATCH /api/admin/faq/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** DELETE /api/admin/faq/[id] — жорстке видалення. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id: raw } = await params;
  const id = parseRouteId(raw);
  if (id === null) return fail("bad_id", 400);

  try {
    await db.faqItem.delete({ where: { id } });
    revalidatePath("/");
    return ok({ deleted: true, id });
  } catch (e) {
    if (isRecordNotFound(e)) return fail("not_found", 404);
    console.error("DELETE /api/admin/faq/[id] error:", e);
    return fail("server_error", 500);
  }
}
