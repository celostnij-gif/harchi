"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  ClipboardList,
  Download,
  FileText,
  PackageOpen,
  Plus,
  Receipt,
  RefreshCw,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import { apiGet } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Stats {
  today: { orders: number; revenue: number };
  total: { orders: number; revenue: number; avgCheck: number };
  byStatus: Record<OrderStatus, number>;
  topProducts: { name: string; qty: number; revenue: number }[];
  recentOrders: {
    id: string;
    publicId: string;
    name: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
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

const money = (n: number) =>
  new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "UAH",
    maximumFractionDigits: 0,
  }).format(n);

const num = (n: number) => new Intl.NumberFormat("uk-UA").format(n);

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}.${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- сторінка ---------- */

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedAt, setLoadedAt] = useState("");
  const [tick, setTick] = useState(0);

  const refresh = () => {
    setRefreshing(true);
    setTick((t) => t + 1);
  };

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await apiGet<Stats>("/api/admin/stats");
        if (!alive) return;
        setStats(data);
        setError(null);
        setLoadedAt(
          new Date().toLocaleTimeString("uk-UA", {
            hour: "2-digit",
            minute: "2-digit",
          })
        );
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "Помилка завантаження";
        setError(msg);
        toast.error("Не вдалося завантажити статистику", { description: msg });
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
  }, [tick]);

  const kpis = stats
    ? [
        {
          label: "Замовлення сьогодні",
          value: num(stats.today.orders),
          sub: `Виручка за добу: ${money(stats.today.revenue)}`,
          icon: ShoppingCart,
        },
        {
          label: "Всього замовлень",
          value: num(stats.total.orders),
          sub: "за весь час роботи магазину",
          icon: ClipboardList,
        },
        {
          label: "Виручка загалом",
          value: money(stats.total.revenue),
          sub: "сума всіх замовлень",
          icon: Banknote,
        },
        {
          label: "Середній чек",
          value: money(stats.total.avgCheck),
          sub: "в середньому за одне замовлення",
          icon: Receipt,
        },
      ]
    : [];

  const top = stats?.topProducts ?? [];
  const topMax = top.length > 0 ? top[0].qty : 0;

  return (
    <div className="space-y-5">
      {/* Заголовок */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Дашборд
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ключові метрики магазину «Харчі»
            {loadedAt ? ` · оновлено о ${loadedAt}` : ""}
          </p>
        </div>
        <Button onClick={refresh} disabled={refreshing} variant="outline">
          <RefreshCw
            className={cn(
              "size-4",
              (loading || refreshing) && "animate-spin"
            )}
          />
          Оновити
        </Button>
      </div>

      {error && !stats ? (
        <Card className="card-glass rounded-2xl py-8">
          <CardContent className="grid place-items-center gap-3 px-6 text-center">
            <TriangleAlert className="size-10 text-red-500" />
            <p className="font-display text-lg font-semibold">
              Не вдалося завантажити дані
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={refresh} className="mt-1">
              <RefreshCw className="size-4" /> Спробувати ще раз
            </Button>
          </CardContent>
        </Card>
      ) : !stats ? (
        /* Скелетон при першому завантаженні */
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-28 rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-5">
            <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
            <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
          </div>
        </div>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {kpis.map((k) => {
              const Icon = k.icon;
              return (
                <Card
                  key={k.label}
                  className="card-glass rounded-2xl gap-2 py-5"
                >
                  <CardContent className="flex items-start justify-between gap-3 px-5">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {k.label}
                      </p>
                      <p
                        className="mt-2 truncate font-display text-2xl font-bold sm:text-[28px]"
                        title={k.value}
                      >
                        {k.value}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        {k.sub}
                      </p>
                    </div>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
                      <Icon className="size-5" />
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Статуси */}
          <Card className="card-glass rounded-2xl gap-3 py-5">
            <CardHeader className="px-5">
              <CardTitle className="text-base">
                Замовлення за статусами
              </CardTitle>
              <CardDescription>
                клікніть чіп — відкриється CRM із фільтром
              </CardDescription>
            </CardHeader>
            <CardContent className="px-5">
              <div className="flex flex-wrap gap-2">
                {STATUS_KEYS.map((s) => (
                  <Link
                    key={s}
                    href={`/admin/orders?status=${s}`}
                    className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/40 px-3 py-1.5 text-sm font-medium transition-colors hover:border-amber-500/50 hover:bg-amber-500/10"
                  >
                    <span
                      className={cn("size-2 rounded-full", STATUS_META[s].dot)}
                    />
                    {STATUS_META[s].label}
                    <span className="rounded-full bg-foreground/10 px-1.5 text-xs font-semibold tabular-nums">
                      {stats.byStatus[s]}
                    </span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Топ товарів + останні замовлення */}
          <div className="grid gap-4 lg:grid-cols-5">
            <Card className="card-glass rounded-2xl gap-3 py-5 lg:col-span-2">
              <CardHeader className="px-5">
                <CardTitle className="text-base">Топ-5 товарів</CardTitle>
                <CardDescription>за кількістю проданих штук</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-5">
                {top.length === 0 ? (
                  <div className="grid place-items-center gap-2 py-8 text-center">
                    <PackageOpen className="size-8 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      Ще немає проданих товарів
                    </p>
                  </div>
                ) : (
                  top.map((p, i) => {
                    const pct =
                      topMax > 0 ? Math.max(6, Math.round((p.qty / topMax) * 100)) : 0;
                    return (
                      <div key={p.name} className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span className="font-display text-xs font-bold text-amber-500">
                              #{i + 1}
                            </span>
                            <span className="truncate font-medium">
                              {p.name}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                            {p.qty} шт · {money(p.revenue)}
                          </span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className="card-glass rounded-2xl gap-3 py-5 lg:col-span-3">
              <CardHeader className="px-5">
                <CardTitle className="text-base">Останні замовлення</CardTitle>
                <CardDescription>8 найсвіжіших заявок</CardDescription>
                <CardAction>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="text-amber-500 hover:text-amber-400"
                  >
                    <Link href="/admin/orders">
                      Усі замовлення <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardAction>
              </CardHeader>
              <CardContent className="px-2 sm:px-5">
                {stats.recentOrders.length === 0 ? (
                  <div className="grid place-items-center gap-2 py-10 text-center">
                    <PackageOpen className="size-8 text-muted-foreground/60" />
                    <p className="text-sm text-muted-foreground">
                      Замовлень поки немає
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Клієнт</TableHead>
                        <TableHead className="text-right">Сума</TableHead>
                        <TableHead>Статус</TableHead>
                        <TableHead className="text-right">Дата</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stats.recentOrders.map((o) => {
                        const meta = statusMeta(o.status);
                        return (
                          <TableRow key={o.id}>
                            <TableCell className="max-w-[120px] truncate font-mono text-[11px] text-muted-foreground">
                              {o.publicId}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate font-medium">
                              {o.name}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {money(o.total)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={meta.badge}>
                                {meta.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs text-muted-foreground">
                              {fmtDate(o.createdAt)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Швидкі дії */}
          <Card className="card-glass rounded-2xl gap-3 py-5">
            <CardHeader className="px-5">
              <CardTitle className="text-base">Швидкі дії</CardTitle>
              <CardDescription>
                найчастіші операції адміністратора
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 px-5 sm:grid-cols-3">
              <Button asChild variant="outline" className="justify-start">
                <a href="/api/admin/orders/export" download>
                  <Download className="size-4" /> Експорт замовлень CSV
                </a>
              </Button>
              <Button asChild variant="outline" className="justify-start">
                <Link href="/admin/content">
                  <FileText className="size-4" /> Контент секцій
                </Link>
              </Button>
              <Button
                asChild
                className="justify-start bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 shadow-lg shadow-orange-500/20 hover:from-amber-400 hover:to-orange-500"
              >
                <Link href="/admin/products">
                  <Plus className="size-4" /> Додати товар
                </Link>
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
