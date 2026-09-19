import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import {
  ORDER_STATUSES,
  fail,
  ok,
  parseOrderItems,
  round2,
  type OrderStatus,
} from "@/lib/admin-api";

export const runtime = "nodejs";

/**
 * GET /api/admin/stats — агрегати для дашборда:
 * today {orders, revenue}, total {orders, revenue, avgCheck},
 * byStatus, topProducts (топ-5), recentOrders (останні 8).
 */
export async function GET() {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalAgg, todayAgg, statusGroups, orders] = await Promise.all([
      db.order.aggregate({
        _count: { _all: true },
        _sum: { total: true },
      }),
      db.order.aggregate({
        where: { createdAt: { gte: startOfToday } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      db.order.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      db.order.findMany({
        select: {
          id: true,
          publicId: true,
          name: true,
          total: true,
          status: true,
          createdAt: true,
          items: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const totalOrders = totalAgg._count._all;
    const totalRevenue = round2(totalAgg._sum.total ?? 0);

    const byStatus: Record<OrderStatus, number> = {
      new: 0,
      confirmed: 0,
      cooking: 0,
      shipping: 0,
      done: 0,
      canceled: 0,
    };
    const validStatuses = ORDER_STATUSES as readonly string[];
    for (const group of statusGroups) {
      if (validStatuses.includes(group.status)) {
        byStatus[group.status as OrderStatus] = group._count._all;
      }
    }

    // topProducts: defensive-парсинг items кожного замовлення → агрегат по name.
    const qtyByName = new Map<string, { name: string; qty: number; revenue: number }>();
    for (const order of orders) {
      for (const item of parseOrderItems(order.items)) {
        const agg = qtyByName.get(item.name) ?? {
          name: item.name,
          qty: 0,
          revenue: 0,
        };
        agg.qty += item.qty;
        agg.revenue = round2(agg.revenue + item.qty * item.price);
        qtyByName.set(item.name, agg);
      }
    }
    const topProducts = [...qtyByName.values()]
      .sort((a, b) => b.qty - a.qty || b.revenue - a.revenue)
      .slice(0, 5)
      .map((p) => ({ name: p.name, qty: p.qty, revenue: p.revenue }));

    const recentOrders = orders.slice(0, 8).map((o) => ({
      id: o.id,
      publicId: o.publicId,
      name: o.name,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
    }));

    return ok({
      today: {
        orders: todayAgg._count._all,
        revenue: round2(todayAgg._sum.total ?? 0),
      },
      total: {
        orders: totalOrders,
        revenue: totalRevenue,
        avgCheck: totalOrders > 0 ? round2(totalRevenue / totalOrders) : 0,
      },
      byStatus,
      topProducts,
      recentOrders,
    });
  } catch (e) {
    console.error("GET /api/admin/stats error:", e);
    return fail("server_error", 500);
  }
}
