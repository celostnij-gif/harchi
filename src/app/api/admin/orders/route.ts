import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import {
  ORDER_STATUSES,
  clampInt,
  fail,
  ok,
  type OrderStatus,
} from "@/lib/admin-api";

export const runtime = "nodejs";

/**
 * GET /api/admin/orders — список замовлень.
 * ?status=new,done (кома-список або один) | ?q= (publicId/name/phone) | ?limit= (default 100).
 * Сортування: createdAt desc.
 */
export async function GET(req: Request) {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const url = new URL(req.url);
    const q = (url.searchParams.get("q") || "").trim();
    const statusParam = (url.searchParams.get("status") || "").trim();
    const limit = clampInt(url.searchParams.get("limit"), 100, 1, 500);

    const validStatuses = ORDER_STATUSES as readonly string[];
    const statusList = statusParam
      ? statusParam
          .split(",")
          .map((s) => s.trim())
          .filter((s): s is OrderStatus => validStatuses.includes(s))
      : [];

    // ?status= задано, але жоден зі статусів не валідний → порожній результат.
    if (statusParam && statusList.length === 0) return ok([]);

    const where: Prisma.OrderWhereInput = {
      ...(statusList.length > 0 ? { status: { in: statusList } } : {}),
      ...(q
        ? {
            OR: [
              { publicId: { contains: q } },
              { name: { contains: q } },
              { phone: { contains: q } },
            ],
          }
        : {}),
    };

    const orders = await db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return ok(orders);
  } catch (e) {
    console.error("GET /api/admin/orders error:", e);
    return fail("server_error", 500);
  }
}

/**
 * POST заборонено: замовлення створює публічний сайт (POST /api/orders).
 */
export async function POST() {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);
  return fail("method_not_allowed", 405);
}
