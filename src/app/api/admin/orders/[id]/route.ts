import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { ORDER_STATUSES, fail, ok } from "@/lib/admin-api";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

const statusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
});

/** Шукаємо замовлення за id (cuid) або publicId — зручно для адмін-UI. */
async function findOrder(idOrPublicId: string) {
  return (
    (await db.order.findUnique({ where: { id: idOrPublicId } })) ??
    (await db.order.findUnique({ where: { publicId: idOrPublicId } }))
  );
}

/** GET /api/admin/orders/[id] — одне замовлення. */
export async function GET(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id } = await params;
  if (!id) return fail("bad_id", 400);

  try {
    const order = await findOrder(id);
    if (!order) return fail("not_found", 404);
    return ok(order);
  } catch (e) {
    console.error("GET /api/admin/orders/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** PATCH /api/admin/orders/[id] — зміна статусу {status}. */
export async function PATCH(req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id } = await params;
  if (!id) return fail("bad_id", 400);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_json", 400);
  }

  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) {
    return fail(
      `validation_error: status must be one of ${ORDER_STATUSES.join("|")}`,
      400
    );
  }

  try {
    const existing = await findOrder(id);
    if (!existing) return fail("not_found", 404);

    const order = await db.order.update({
      where: { id: existing.id },
      data: { status: parsed.data.status },
    });
    revalidatePath("/");
    return ok(order);
  } catch (e) {
    console.error("PATCH /api/admin/orders/[id] error:", e);
    return fail("server_error", 500);
  }
}

/** DELETE /api/admin/orders/[id] — жорстке видалення замовлення. */
export async function DELETE(_req: Request, { params }: Ctx) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  const { id } = await params;
  if (!id) return fail("bad_id", 400);

  try {
    const existing = await findOrder(id);
    if (!existing) return fail("not_found", 404);

    await db.order.delete({ where: { id: existing.id } });
    revalidatePath("/");
    return ok({ deleted: true, id: existing.id });
  } catch (e) {
    console.error("DELETE /api/admin/orders/[id] error:", e);
    return fail("server_error", 500);
  }
}
