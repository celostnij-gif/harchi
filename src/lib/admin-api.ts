/**
 * Спільні утиліти адмін-API роутів (/api/admin/*).
 * Контракт відповідей: { ok: true, data } | { ok: false, error }.
 * Статуси: 200/201, 400, 401, 404, 409, 500.
 */
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/** Валідні статуси замовлення (порядок = життєвий цикл; canceled — окремо). */
export const ORDER_STATUSES = [
  "new",
  "confirmed",
  "cooking",
  "shipping",
  "done",
  "canceled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

/** [id] з URL → додатне ціле число або null (для автоінкрементних моделей). */
export function parseRouteId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Prisma P2002 — порушення унікальності (slug, filename тощо) → 409. */
export function isUniqueConflict(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

/** Prisma P2025 — запис не знайдено під час update/delete → 404. */
export function isRecordNotFound(e: unknown): boolean {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025"
  );
}

/** Екранування клітинки CSV з роздільником ";". */
export function csvCell(value: string): string {
  return /[";\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Числовий query-параметр із клампінгом у [min, max] та дефолтом. */
export function clampInt(
  raw: string | null,
  fallback: number,
  min: number,
  max: number
): number {
  // Number(null)/Number("") === 0, тому відсутній/порожній параметр ловимо явно.
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), min), max);
}

/** Округлення до 2 знаків (гроші). */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface ParsedOrderItem {
  name: string;
  qty: number;
  price: number;
}

/** Правило JSON-рядка-масиву для полів Product.specs / Product.productFaq. */
export interface JsonFieldRule {
  /** Ключі кожного обʼєкта масиву (усі — string). */
  keys: readonly string[];
  maxItems: number;
}

/** Product.specs — [{labelUk,valueUk,labelEn,valueEn}] як JSON-РЯДОК. */
export const SPECS_RULE: JsonFieldRule = {
  keys: ["labelUk", "valueUk", "labelEn", "valueEn"],
  maxItems: 60,
};

/** Product.productFaq — [{qUk,aUk,qEn,aEn}] як JSON-РЯДОК. */
export const PRODUCT_FAQ_RULE: JsonFieldRule = {
  keys: ["qUk", "aUk", "qEn", "aEn"],
  maxItems: 40,
};

/**
 * SAFE-парсинг поля товару, що зберігається як JSON-РЯДОК масиву пласких
 * обʼєктів. Повертає null якщо валідно, інакше — короткий код помилки
 * (`invalid_json`, `not_array`, `item_0.labelUk_must_be_string`, …).
 */
export function validateJsonStringArray(
  raw: string,
  rule: JsonFieldRule
): string | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "invalid_json";
  }
  if (!Array.isArray(parsed)) return "not_array";
  if (parsed.length > rule.maxItems) return `max_${rule.maxItems}_items`;
  for (let i = 0; i < parsed.length; i++) {
    const entry = parsed[i];
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return `item_${i}_not_object`;
    }
    const o = entry as Record<string, unknown>;
    for (const key of rule.keys) {
      const v = o[key];
      if (typeof v !== "string") return `item_${i}.${key}_must_be_string`;
      if (v.length > 500) return `item_${i}.${key}_too_long`;
    }
  }
  return null;
}

/**
 * DEFENSIVE-парсинг Order.items (JSON-рядок масиву [{id,name,price,qty}] —
 * форма, яку пише POST /api/orders). Ніколи не кидає: повертає [] при смітті.
 */
export function parseOrderItems(raw: string): ParsedOrderItem[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const out: ParsedOrderItem[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const o = entry as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : "";
      const qty =
        typeof o.qty === "number" && Number.isFinite(o.qty) ? o.qty : 0;
      const price =
        typeof o.price === "number" && Number.isFinite(o.price) ? o.price : 0;
      if (!name || qty <= 0) continue;
      out.push({ name, qty, price });
    }
    return out;
  } catch {
    // Битий JSON у items — не валимо статистику/експорт.
    return [];
  }
}
