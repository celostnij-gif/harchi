"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Download,
  Eye,
  PackageOpen,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { apiGet, apiSend } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* ---------- локальні типи та хелпери (спільні файли не створюємо) ---------- */

const STATUS_KEYS = [
  "new",
  "confirmed",
  "cooking",
  "shipping",
  "done",
  "canceled",
] as const;

type OrderStatus = (typeof STATUS_KEYS)[number];
type StatusFilter = OrderStatus | "all";

const isStatusKey = (v: string | null | undefined): v is OrderStatus =>
  !!v && (STATUS_KEYS as readonly string[]).includes(v);

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface Order {
  id: string;
  publicId: string;
  name: string;
  phone: string;
  delivery: string;
  city: string | null;
  address: string | null;
  comment: string | null;
  items: string;
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  byStatus: Record<OrderStatus, number>;
}

const STATUS_META: Record<
  OrderStatus,
  { label: string; badge: string; dot: string }
> = {
  new: {
    label: "Новий",
    badge: "bg-amber-500/10 text-amber-500 border-amber-500/40",
    dot: "bg-amber-500",
  },
  confirmed: {
    label: "Підтверджено",
    badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/40",
    dot: "bg-emerald-500",
  },
  cooking: {
    label: "Готується",
    badge: "bg-orange-500/10 text-orange-500 border-orange-500/40",
    dot: "bg-orange-500",
  },
  shipping: {
    label: "В дорозі",
    badge: "bg-stone-500/15 text-foreground border-stone-500/40",
    dot: "bg-stone-400",
  },
  done: {
    label: "Виконано",
    badge: "bg-emerald-500 text-white border-transparent",
    dot: "bg-emerald-500",
  },
  canceled: {
    label: "Скасовано",
    badge: "bg-red-500/10 text-red-500 border-red-500/40",
    dot: "bg-red-500",
  },
};

const statusMeta = (s: string) =>
  STATUS_META[s as OrderStatus] ?? STATUS_META.new;

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Усі" },
  { key: "new", label: "Нові" },
  { key: "confirmed", label: "Підтверджені" },
  { key: "cooking", label: "Готується" },
  { key: "shipping", label: "В дорозі" },
  { key: "done", label: "Виконані" },
  { key: "canceled", label: "Скасовані" },
];

const money = (n: number) =>
  new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(n);

function fmtDate(iso: string, withYear = false) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  const day = `${p(d.getDate())}.${p(d.getMonth() + 1)}`;
  const time = `${p(d.getHours())}:${p(d.getMinutes())}`;
  return withYear ? `${day}.${d.getFullYear()}, ${time}` : `${day} ${time}`;
}

/** Defensive-парсинг items (JSON-рядок [{id,name,price,qty}] з POST /api/orders). */
function parseItems(raw: string): OrderItem[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((it) => {
      const o = (it ?? {}) as Record<string, unknown>;
      return {
        id: typeof o.id === "string" ? o.id : "",
        name: typeof o.name === "string" && o.name ? o.name : "Товар",
        price:
          typeof o.price === "number" && Number.isFinite(o.price) ? o.price : 0,
        qty:
          typeof o.qty === "number" && Number.isFinite(o.qty) && o.qty > 0
            ? Math.round(o.qty)
            : 1,
      };
    });
  } catch {
    return [];
  }
}

const itemsCount = (o: Order) =>
  parseItems(o.items).reduce((s, i) => s + i.qty, 0);

/* ---------- локальні підкомпоненти ---------- */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-0.5 break-words font-medium">{children}</div>
    </div>
  );
}

function StatusSelect({
  order,
  disabled,
  onValueChange,
  className,
}: {
  order: Order;
  disabled: boolean;
  onValueChange: (v: string) => void;
  className?: string;
}) {
  const meta = statusMeta(order.status);
  return (
    <Select
      value={order.status}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        size="sm"
        aria-label="Змінити статус замовлення"
        className={cn("w-[150px] rounded-lg", className)}
      >
        <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_KEYS.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_META[s].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-9 w-44" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-xl" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

/* ---------- контент (useSearchParams вимагає Suspense-межі) ---------- */

function OrdersContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const statusParam = searchParams.get("status");
  const status: StatusFilter = isStatusKey(statusParam) ? statusParam : "all";

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [patchingId, setPatchingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Order | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = () => {
    setRefreshing(true);
    setTick((t) => t + 1);
  };

  const setFilter = (key: StatusFilter) => {
    router.replace(
      key === "all" ? "/admin/orders" : `/admin/orders?status=${key}`,
      { scroll: false }
    );
  };

  /* debounce пошуку 300 мс */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  /* список замовлень */
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const params = new URLSearchParams({ limit: "100" });
      if (status !== "all") params.set("status", status);
      if (debouncedQ) params.set("q", debouncedQ);
      try {
        const data = await apiGet<Order[]>(
          `/api/admin/orders?${params.toString()}`
        );
        if (!alive) return;
        setOrders(data);
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(e instanceof Error ? e.message : "Помилка завантаження");
      } finally {
        if (alive) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [status, debouncedQ, tick]);

  /* лічильники статусів для чіпів (некритичні) */
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await apiGet<Stats>("/api/admin/stats");
        if (alive) setStats(data);
      } catch {
        /* без лічильників чіпи працюють далі */
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, [tick]);

  const changeStatus = async (order: Order, next: string) => {
    if (next === order.status) return;
    setPatchingId(order.id);
    const snapshot = orders;
    setOrders((prev) =>
      prev
        ? prev.map((o) => (o.id === order.id ? { ...o, status: next } : o))
        : prev
    );
    setSelected((sel) =>
      sel && sel.id === order.id ? { ...sel, status: next } : sel
    );
    try {
      await apiSend(`/api/admin/orders/${order.id}`, "PATCH", { status: next });
      toast.success(
        `Замовлення …${order.publicId.slice(-6).toUpperCase()} → «${statusMeta(next).label}»`
      );
      setTick((t) => t + 1); // синхронізувати список + лічильники статусів
    } catch (e) {
      setOrders(snapshot);
      setSelected((sel) =>
        sel && snapshot ? (snapshot.find((o) => o.id === sel.id) ?? sel) : sel
      );
      toast.error("Не вдалося змінити статус", {
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setPatchingId(null);
    }
  };

  const list = orders ?? [];
  const isFiltered = status !== "all" || debouncedQ.length > 0;

  return (
    <div className="space-y-4">
      {/* Заголовок */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Замовлення
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            CRM: статуси, клієнти, позиції
            {orders ? ` · показано ${list.length}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/api/admin/orders/export" download>
              <Download className="size-4" /> Експорт CSV
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn(
                "size-4",
                (loading || refreshing) && "animate-spin"
              )}
            />
            Оновити
          </Button>
        </div>
      </div>

      {/* Пошук */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Пошук за ID, імʼям або телефоном…"
          className="rounded-xl pl-9"
          aria-label="Пошук замовлень"
        />
      </div>

      {/* Фільтр статусів */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = status === f.key;
          const count =
            f.key !== "all" && stats ? stats.byStatus[f.key] : undefined;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "border-border/70 bg-background/40 text-muted-foreground hover:border-amber-500/50 hover:text-foreground"
              )}
            >
              {f.label}
              {count !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs font-semibold tabular-nums",
                    active ? "bg-black/15" : "bg-foreground/10"
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Помилка (якщо даних немає взагалі) */}
      {error && !orders ? (
        <Card className="card-glass grid place-items-center gap-3 rounded-2xl py-10 text-center">
          <TriangleAlert className="size-10 text-red-500" />
          <p className="font-display text-lg font-semibold">
            Не вдалося завантажити замовлення
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={refresh} className="mt-1">
            <RefreshCw className="size-4" /> Спробувати ще раз
          </Button>
        </Card>
      ) : !orders ? (
        /* Скелетон першого завантаження */
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        /* Порожній стан */
        <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border/70 py-16 text-center">
          <PackageOpen className="size-10 text-muted-foreground/60" />
          <p className="font-display text-lg font-semibold">
            Замовлень немає
          </p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {isFiltered
              ? "Спробуйте змінити фільтр або пошуковий запит."
              : "Нові замовлення з сайту зʼявляться тут автоматично."}
          </p>
        </div>
      ) : (
        <>
          {/* Мобільні картки */}
          <div className="grid gap-3 md:hidden">
            {list.map((o) => {
              const meta = statusMeta(o.status);
              return (
                <div
                  key={o.id}
                  className="card-glass space-y-3 rounded-2xl p-4"
                  onClick={() => setSelected(o)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setSelected(o);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {o.publicId}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(o.createdAt)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{o.name}</p>
                    <p className="text-xs text-muted-foreground">{o.phone}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {o.city || "—"}
                    {o.address ? `, ${o.address}` : ""}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className={meta.badge}>
                      {meta.label}
                    </Badge>
                    <span className="font-display text-base font-bold">
                      {money(o.total)}
                    </span>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <StatusSelect
                      order={o}
                      disabled={patchingId === o.id}
                      onValueChange={(v) => void changeStatus(o, v)}
                      className="w-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Таблиця (desktop) */}
          <Card className="card-glass hidden rounded-2xl py-4 md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Клієнт</TableHead>
                  <TableHead>Доставка</TableHead>
                  <TableHead className="text-right">Позиції</TableHead>
                  <TableHead className="text-right">Сума</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((o) => {
                  const meta = statusMeta(o.status);
                  return (
                    <TableRow
                      key={o.id}
                      className="cursor-pointer"
                      onClick={() => setSelected(o)}
                    >
                      <TableCell className="max-w-[130px] truncate font-mono text-[11px] text-muted-foreground">
                        {o.publicId}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {fmtDate(o.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[170px] truncate font-medium">
                          {o.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {o.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[160px] truncate text-sm">
                          {o.city || "—"}
                        </div>
                        <div className="max-w-[160px] truncate text-xs text-muted-foreground">
                          {o.address || o.delivery}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {itemsCount(o)} шт.
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {money(o.total)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <StatusSelect
                          order={o}
                          disabled={patchingId === o.id}
                          onValueChange={(v) => void changeStatus(o, v)}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                          aria-label={`Деталі замовлення ${o.publicId}`}
                          onClick={() => setSelected(o)}
                        >
                          <Eye className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}

      {/* Діалог деталей */}
      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto rounded-2xl">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex flex-wrap items-center gap-2 font-mono text-base">
                  {selected.publicId}
                  <Badge
                    variant="outline"
                    className={statusMeta(selected.status).badge}
                  >
                    {statusMeta(selected.status).label}
                  </Badge>
                </DialogTitle>
                <DialogDescription>
                  Створено {fmtDate(selected.createdAt, true)}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Field label="Клієнт">{selected.name}</Field>
                <Field label="Телефон">
                  <a
                    href={`tel:${selected.phone}`}
                    className="text-accent-strong hover:underline"
                  >
                    {selected.phone}
                  </a>
                </Field>
                <Field label="Доставка">{selected.delivery}</Field>
                <Field label="Місто">{selected.city || "—"}</Field>
                <Field label="Адреса">{selected.address || "—"}</Field>
                <Field label="Оновлено">
                  {fmtDate(selected.updatedAt, true)}
                </Field>
              </div>

              <div className="rounded-xl border border-border/60 bg-background/40 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Позиції
                </p>
                {parseItems(selected.items).length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Немає даних про позиції
                  </p>
                ) : (
                  <ul className="mt-2 space-y-1.5">
                    {parseItems(selected.items).map((it, i) => (
                      <li
                        key={`${it.id}-${i}`}
                        className="flex items-baseline justify-between gap-3 text-sm"
                      >
                        <span className="min-w-0">
                          <span className="font-medium">{it.name}</span>
                          <span className="text-muted-foreground">
                            {" "}
                            × {it.qty}
                          </span>
                        </span>
                        <span className="shrink-0 tabular-nums">
                          {money(it.price * it.qty)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5 text-sm">
                  <span className="font-medium">Разом</span>
                  <span className="font-display text-base font-bold text-accent-strong">
                    {money(selected.total)}
                  </span>
                </div>
              </div>

              {selected.comment ? (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-500">
                    Коментар клієнта
                  </p>
                  <p className="mt-1 italic">{selected.comment}</p>
                </div>
              ) : null}

              <DialogFooter className="gap-2 sm:justify-between">
                <StatusSelect
                  order={selected}
                  disabled={patchingId === selected.id}
                  onValueChange={(v) => void changeStatus(selected, v)}
                />
                <Button variant="outline" onClick={() => setSelected(null)}>
                  Закрити
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- сторінка ---------- */

export default function OrdersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrdersContent />
    </Suspense>
  );
}
