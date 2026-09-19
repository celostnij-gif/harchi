import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdminApi } from "@/lib/admin-guard";
import { csvCell, fail, parseOrderItems } from "@/lib/admin-api";

export const runtime = "nodejs";

/**
 * GET /api/admin/orders/export — CSV-експорт замовлень.
 * BOM (\uFEFF) + роздільник ";" + UTF-8. Content-Disposition: attachment.
 */
export async function GET() {
  const authed = await requireAdminApi();
  if (!authed) return fail("unauthorized", 401);

  try {
    const orders = await db.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    const header = [
      "publicId",
      "дата",
      "статус",
      "імʼя",
      "телефон",
      "доставка",
      "місто",
      "адреса",
      "коментар",
      "позиції",
      "сума",
    ];

    const rows = orders.map((o) => [
      o.publicId,
      o.createdAt.toISOString(),
      o.status,
      o.name,
      o.phone,
      o.delivery,
      o.city ?? "",
      o.address ?? "",
      o.comment ?? "",
      parseOrderItems(o.items)
        .map((it) => `${it.name} x${it.qty}`)
        .join(" | "),
      String(o.total),
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map(csvCell).join(";"))
      .join("\r\n");

    return new NextResponse("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="orders.csv"',
      },
    });
  } catch (e) {
    console.error("GET /api/admin/orders/export error:", e);
    return fail("server_error", 500);
  }
}
