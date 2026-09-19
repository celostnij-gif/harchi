import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const orderSchema = z.object({
  name: z.string().trim().min(2, "Вкажіть ім'я").max(120),
  phone: z
    .string()
    .trim()
    .min(9, "Вкажіть коректний телефон")
    .max(24)
    .regex(/^[0-9+\-\s()]+$/, "Некоректний номер"),
  delivery: z.string().trim().min(2).max(60),
  city: z.string().trim().max(120).optional().nullable(),
  address: z.string().trim().max(200).optional().nullable(),
  comment: z.string().trim().max(500).optional().nullable(),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().positive(),
        qty: z.number().int().min(1).max(99),
      })
    )
    .min(1, "Кошик порожній"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = orderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "Перевірте правильність заповнення полів",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const total = data.items.reduce((s, i) => s + i.price * i.qty, 0);

    const order = await db.order.create({
      data: {
        name: data.name,
        phone: data.phone,
        delivery: data.delivery,
        city: data.city || null,
        address: data.address || null,
        comment: data.comment || null,
        items: JSON.stringify(data.items),
        total,
      },
    });

    return NextResponse.json({
      ok: true,
      orderId: order.publicId,
      total,
    });
  } catch (e) {
    console.error("Order error:", e);
    return NextResponse.json(
      { ok: false, error: "Не вдалося оформити замовлення. Спробуйте ще раз." },
      { status: 500 }
    );
  }
}
