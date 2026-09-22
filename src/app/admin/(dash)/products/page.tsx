"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ImageIcon,
  Package,
  PackageOpen,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import { apiGet, apiSend, apiUpload } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ---------------------------------- типи --------------------------------- */

interface AdminProduct {
  id: number;
  slug: string;
  nameUk: string;
  nameEn: string;
  shortUk: string;
  shortEn: string;
  descriptionUk: string;
  descriptionEn: string;
  specs: string;
  productFaq: string;
  bulkTiers: string;
  portionUk: string;
  portionEn: string;
  cats: string;
  price: number;
  oldPrice: number | null;
  image: string;
  badge: string | null;
  rating: number;
  reviewsCount: number;
  kcal: number | null;
  weight: number | null;
  isActive: boolean;
  sort: number;
}

interface AdminCategory {
  id: number;
  slug: string;
  nameUk: string;
  nameEn: string;
  sort: number;
  isActive: boolean;
}

/** Пара характеристик товару (Product.specs — JSON-рядок масиву таких). */
interface SpecPair {
  labelUk: string;
  valueUk: string;
  labelEn: string;
  valueEn: string;
}

/** Пара Q/A FAQ товару (Product.productFaq — JSON-рядок масиву таких). */
interface FaqPair {
  qUk: string;
  aUk: string;
  qEn: string;
  aEn: string;
}

/** Оптові рівні ціни (Product.bulkTiers — JSON-рядок [{minQty, price}]). */
interface BulkTierPair {
  minQty: string;
  price: string;
}

interface ProductForm {
  slug: string;
  nameUk: string;
  nameEn: string;
  shortUk: string;
  shortEn: string;
  descriptionUk: string;
  descriptionEn: string;
  specsUk: string;
  specsEn: string;
  faqItems: FaqPair[];
  bulkTiers: BulkTierPair[];
  portionUk: string;
  portionEn: string;
  catList: string[];
  price: string;
  oldPrice: string;
  image: string;
  badge: string;
  rating: string;
  reviewsCount: string;
  kcal: string;
  weight: string;
  isActive: boolean;
  sort: string;
}

const EMPTY_FORM: ProductForm = {
  slug: "",
  nameUk: "",
  nameEn: "",
  shortUk: "",
  shortEn: "",
  descriptionUk: "",
  descriptionEn: "",
  specsUk: "",
  specsEn: "",
  faqItems: [],
  bulkTiers: [],
  portionUk: "",
  portionEn: "",
  catList: [],
  price: "",
  oldPrice: "",
  image: "",
  badge: "",
  rating: "4.9",
  reviewsCount: "0",
  kcal: "",
  weight: "",
  isActive: true,
  sort: "0",
};

const BADGE_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "Без бейджа" },
  { value: "hit", label: "ХІТ" },
  { value: "new", label: "NEW" },
  { value: "premium", label: "ПРЕМІУМ" },
  { value: "deal", label: "Вигідно (-15%)" },
];

const BADGE_STYLES: Record<string, string> = {
  hit: "border-amber-500/40 bg-amber-500/15 text-amber-500",
  new: "border-emerald-500/40 bg-emerald-500/15 text-emerald-500",
  premium: "border-orange-500/40 bg-orange-500/15 text-orange-500",
  deal: "border-red-500/40 bg-red-500/15 text-red-400",
};

const BADGE_LABELS: Record<string, string> = {
  hit: "ХІТ",
  new: "NEW",
  premium: "ПРЕМІУМ",
  deal: "-15%",
};

const SLUG_RE = /^[a-z0-9-]+$/;

/** Число з БД (SQLite REAL дає 4.900000095367432) → акуратний рядок для форми. */
const numStr = (n: number) => String(Math.round(n * 100) / 100);

/* ---------------- specs / productFaq (JSON-рядки ⇆ текст форми) ---------- */

/** Парсинг одного рядка "Назва = Значення" (розділювач " = "). */
function parseSpecLine(line: string): { label: string; value: string } {
  const idx = line.indexOf(" = ");
  if (idx === -1) return { label: line.trim(), value: "" };
  return {
    label: line.slice(0, idx).trim(),
    value: line.slice(idx + 3).trim(),
  };
}

function splitSpecLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l !== "");
}

/**
 * Збірка Product.specs (JSON-рядок) з двох текстар: UK та EN рядки
 * зіплені за індексом. Обидва порожні → "[]".
 */
function buildSpecsJson(ukRaw: string, enRaw: string): string {
  const ukLines = splitSpecLines(ukRaw);
  const enLines = splitSpecLines(enRaw);
  if (ukLines.length === 0 && enLines.length === 0) return "[]";
  const len = Math.max(ukLines.length, enLines.length);
  const out: SpecPair[] = [];
  for (let i = 0; i < len; i++) {
    const uk = ukLines[i] !== undefined ? parseSpecLine(ukLines[i]) : { label: "", value: "" };
    const en = enLines[i] !== undefined ? parseSpecLine(enLines[i]) : { label: "", value: "" };
    out.push({
      labelUk: uk.label,
      valueUk: uk.value,
      labelEn: en.label,
      valueEn: en.value,
    });
  }
  return JSON.stringify(out);
}

/** Product.specs (JSON-рядок) → текст для UK/EN текстар ("label = value" пострічково). */
function specsToFormText(specsRaw: string, lang: "uk" | "en"): string {
  try {
    const parsed: unknown = JSON.parse(specsRaw || "[]");
    if (!Array.isArray(parsed)) return "";
    const lines: string[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const o = entry as Record<string, unknown>;
      const label = String(o[lang === "uk" ? "labelUk" : "labelEn"] ?? "");
      const value = String(o[lang === "uk" ? "valueUk" : "valueEn"] ?? "");
      if (!label && !value) continue;
      lines.push(value ? `${label} = ${value}` : label);
    }
    return lines.join("\n");
  } catch {
    return "";
  }
}

/** Product.productFaq (JSON-рядок) → масив пар для форми (defensive). */
function faqToItems(raw: string): FaqPair[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    const out: FaqPair[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const o = entry as Record<string, unknown>;
      out.push({
        qUk: typeof o.qUk === "string" ? o.qUk : "",
        aUk: typeof o.aUk === "string" ? o.aUk : "",
        qEn: typeof o.qEn === "string" ? o.qEn : "",
        aEn: typeof o.aEn === "string" ? o.aEn : "",
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Збірка Product.productFaq (JSON-рядок): пари з порожніми qUk І aUk
 * пропускаються, поля тримаються.
 */
function buildFaqJson(items: FaqPair[]): string {
  const out = items
    .map((p) => ({
      qUk: p.qUk.trim(),
      aUk: p.aUk.trim(),
      qEn: p.qEn.trim(),
      aEn: p.aEn.trim(),
    }))
    .filter((p) => !(p.qUk === "" && p.aUk === ""));
  return JSON.stringify(out);
}

/** Product.bulkTiers (JSON-рядок [{minQty, price}]) → пари для форми (defensive). */
function bulkToItems(raw: string): BulkTierPair[] {
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) return [];
    const out: BulkTierPair[] = [];
    for (const entry of parsed) {
      if (typeof entry !== "object" || entry === null) continue;
      const o = entry as Record<string, unknown>;
      out.push({
        minQty: o.minQty === undefined || o.minQty === null ? "" : String(o.minQty),
        price: o.price === undefined || o.price === null ? "" : String(o.price),
      });
    }
    return out;
  } catch {
    return [];
  }
}

/**
 * Збірка Product.bulkTiers (JSON-рядок): пари з порожніми полями пропускаються,
 * решта — числами {minQty: int ≥ 2, price: > 0}; сортуємо за minQty.
 */
function buildBulkJson(items: BulkTierPair[]): string {
  const out = items
    .map((p) => ({ minQty: Number(p.minQty), price: Number(p.price) }))
    .filter((p) => p.minQty !== 0 || p.price !== 0)
    .map((p) => ({ minQty: Math.trunc(p.minQty), price: Math.round(p.price * 100) / 100 }))
    .filter((p) => Number.isInteger(p.minQty) && p.minQty >= 2 && p.price > 0)
    .sort((a, b) => a.minQty - b.minQty);
  return JSON.stringify(out);
}

/** Превʼю оптових рівнів для таблиці: "від 3 — 199 грн · від 6 — 189 грн". */
function bulkPreview(raw: string): string {
  const items = bulkToItems(raw).filter((p) => p.minQty !== "" && p.price !== "");
  if (!items.length) return "";
  return items.map((p) => `від ${p.minQty} — ${p.price} грн`).join(" · ");
}

function formFromProduct(p: AdminProduct): ProductForm {
  return {
    slug: p.slug,
    nameUk: p.nameUk,
    nameEn: p.nameEn,
    shortUk: p.shortUk,
    shortEn: p.shortEn,
    descriptionUk: p.descriptionUk ?? "",
    descriptionEn: p.descriptionEn ?? "",
    specsUk: specsToFormText(p.specs ?? "[]", "uk"),
    specsEn: specsToFormText(p.specs ?? "[]", "en"),
    faqItems: faqToItems(p.productFaq ?? "[]"),
    bulkTiers: bulkToItems(p.bulkTiers ?? "[]"),
    portionUk: p.portionUk,
    portionEn: p.portionEn,
    catList: p.cats ? p.cats.split(",").filter(Boolean) : [],
    price: numStr(p.price),
    oldPrice: p.oldPrice === null ? "" : numStr(p.oldPrice),
    image: p.image,
    badge: p.badge ?? "",
    rating: numStr(p.rating),
    reviewsCount: String(p.reviewsCount),
    kcal: p.kcal === null ? "" : String(p.kcal),
    weight: p.weight === null ? "" : String(p.weight),
    isActive: p.isActive,
    sort: String(p.sort),
  };
}

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "server_error";
  if (msg === "conflict") return "Конфлікт: запис із таким slug уже існує";
  if (msg === "unauthorized") return "Сесія закінчилась, увійдіть знову";
  return `Помилка: ${msg}`;
}

/* -------------------------------- сторінка ------------------------------- */

export default function AdminProductsPage() {
  const [items, setItems] = useState<AdminProduct[] | null>(null);
  const [cats, setCats] = useState<AdminCategory[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async (query: string) => {
    try {
      const url = `/api/admin/products?all=1${query ? `&q=${encodeURIComponent(query)}` : ""}`;
      const data = await apiGet<AdminProduct[]>(url);
      setItems(data);
    } catch (e) {
      setItems([]);
      toast.error(errText(e));
    }
  };

  // Пошук з debounce + початкове завантаження
  useEffect(() => {
    const t = setTimeout(() => {
      void load(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    (async () => {
      try {
        setCats(await apiGet<AdminCategory[]>("/api/admin/categories"));
      } catch {
        // не критично — чіпси категорій просто порожні
      }
    })();
  }, []);

  const set = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleCat = (slug: string) =>
    setForm((f) => ({
      ...f,
      catList: f.catList.includes(slug)
        ? f.catList.filter((s) => s !== slug)
        : [...f.catList, slug],
    }));

  /* ------------- FAQ товару: динамічний список пар Q/A ------------- */

  const setFaq = (idx: number, key: keyof FaqPair, value: string) =>
    setForm((f) => ({
      ...f,
      faqItems: f.faqItems.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    }));

  const addFaq = () =>
    setForm((f) => ({
      ...f,
      faqItems: [...f.faqItems, { qUk: "", aUk: "", qEn: "", aEn: "" }],
    }));

  const removeFaq = (idx: number) =>
    setForm((f) => ({
      ...f,
      faqItems: f.faqItems.filter((_, i) => i !== idx),
    }));

  /* ------------- Оптові рівні: динамічний список пар minQty/price ------------- */

  const setBulk = (idx: number, key: keyof BulkTierPair, value: string) =>
    setForm((f) => ({
      ...f,
      bulkTiers: f.bulkTiers.map((p, i) => (i === idx ? { ...p, [key]: value } : p)),
    }));

  const addBulk = () =>
    setForm((f) => ({
      ...f,
      bulkTiers: [...f.bulkTiers, { minQty: "", price: "" }],
    }));

  const removeBulk = (idx: number) =>
    setForm((f) => ({
      ...f,
      bulkTiers: f.bulkTiers.filter((_, i) => i !== idx),
    }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    setForm(formFromProduct(p));
    setFormError(null);
    setOpen(true);
  };

  const onUploadFile = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    try {
      const res = await apiUpload<{ url: string; filename: string; size: number }>(
        "/api/admin/upload",
        fd
      );
      set("image", res.url);
      toast.success(`Файл завантажено: ${res.filename}`);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setUploading(false);
    }
  };

  const validate = (): string | null => {
    if (!form.slug.trim()) return "Slug обовʼязковий";
    if (!SLUG_RE.test(form.slug.trim()))
      return "Slug — лише малі латинські літери, цифри та дефіси (a-z0-9-)";
    if (!form.nameUk.trim()) return "Назва (UK) обовʼязкова";
    const price = Number(form.price);
    if (form.price.trim() === "" || Number.isNaN(price) || price < 0)
      return "Ціна — число ≥ 0";
    if (form.oldPrice.trim() !== "") {
      const old = Number(form.oldPrice);
      if (Number.isNaN(old) || old < 0) return "Стара ціна — число ≥ 0";
    }
    if (!form.image.trim()) return "Зображення обовʼязкове (URL або файл)";
    for (const [i, b] of form.bulkTiers.entries()) {
      const qEmpty = b.minQty.trim() === "";
      const pEmpty = b.price.trim() === "";
      if (qEmpty && pEmpty) continue; // порожня пара — пропускається при збереженні
      if (qEmpty || pEmpty) return `Оптовий рівень #${i + 1}: заповни і кількість, і ціну`;
      const q = Number(b.minQty);
      const pr = Number(b.price);
      if (!Number.isInteger(q) || q < 2) return `Оптовий рівень #${i + 1}: кількість — ціле число ≥ 2`;
      if (!Number.isFinite(pr) || pr <= 0) return `Оптовий рівень #${i + 1}: ціна — число > 0`;
      if (pr >= Number(form.price)) return `Оптовий рівень #${i + 1}: оптова ціна має бути нижчою за роздрібну`;
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }
    setFormError(null);
    setSaving(true);
    const numOrNull = (v: string) => (v.trim() === "" ? null : Number(v.trim()));
    const payload = {
      slug: form.slug.trim(),
      nameUk: form.nameUk.trim(),
      nameEn: form.nameEn.trim(),
      shortUk: form.shortUk.trim(),
      shortEn: form.shortEn.trim(),
      descriptionUk: form.descriptionUk.trim(),
      descriptionEn: form.descriptionEn.trim(),
      specs: buildSpecsJson(form.specsUk, form.specsEn),
      productFaq: buildFaqJson(form.faqItems),
      bulkTiers: buildBulkJson(form.bulkTiers),
      portionUk: form.portionUk.trim(),
      portionEn: form.portionEn.trim(),
      cats: form.catList.join(","),
      price: Number(form.price.trim()),
      oldPrice: numOrNull(form.oldPrice),
      image: form.image.trim(),
      badge: form.badge === "" ? null : form.badge,
      rating: form.rating.trim() === "" ? 4.9 : Number(form.rating.trim()),
      reviewsCount: Number(form.reviewsCount.trim() || "0"),
      kcal: numOrNull(form.kcal),
      weight: numOrNull(form.weight),
      isActive: form.isActive,
      sort: Number(form.sort.trim() || "0"),
    };
    try {
      if (editing) {
        await apiSend(`/api/admin/products/${editing.id}`, "PUT", payload);
        toast.success("Товар оновлено");
      } else {
        await apiSend("/api/admin/products", "POST", payload);
        toast.success("Товар створено");
      }
      setOpen(false);
      await load(q);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (p: AdminProduct, v: boolean) => {
    try {
      await apiSend(`/api/admin/products/${p.id}`, "PATCH", { isActive: v });
      setItems((prev) =>
        prev ? prev.map((x) => (x.id === p.id ? { ...x, isActive: v } : x)) : prev
      );
      toast.success(
        v ? `«${p.nameUk}» показується на сайті` : `«${p.nameUk}» приховано`
      );
    } catch (e) {
      toast.error(errText(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend(`/api/admin/products/${deleteTarget.id}`, "DELETE");
      toast.success(`Товар «${deleteTarget.nameUk}» видалено`);
      setDeleteTarget(null);
      await load(q);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setDeleting(false);
    }
  };

  const catName = (slug: string) =>
    cats.find((c) => c.slug === slug)?.nameUk ?? slug;

  /* --------------------------------- рендер -------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Товари
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Каталог меню на сайті: назви, ціни, категорії, бейджі
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-none">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Пошук товару…"
              className="pl-9"
              aria-label="Пошук товарів"
            />
          </div>
          <Button onClick={openCreate} className="shrink-0">
            <Plus className="size-4" /> Додати товар
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="size-4 text-accent-strong" />
            Каталог
            {items && (
              <span className="text-sm font-normal text-muted-foreground">
                · {items.length} поз.
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Перемикач «Активний» ховає товар з сайту без видалення
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items === null ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-12 rounded-lg" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-12 rounded-full" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <PackageOpen className="size-7 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium">
                  {q ? "Нічого не знайдено" : "Товарів ще немає"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {q
                    ? `За запитом «${q}» товарів немає — спробуйте інший запит`
                    : "Додайте перший товар — він одразу зʼявиться в меню на сайті"}
                </p>
              </div>
              {!q && (
                <Button onClick={openCreate} variant="outline" size="sm">
                  <Plus className="size-4" /> Додати товар
                </Button>
              )}
            </div>
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Фото</TableHead>
                    <TableHead className="min-w-52">Назва</TableHead>
                    <TableHead className="hidden md:table-cell">Категорії</TableHead>
                    <TableHead>Ціна</TableHead>
                    <TableHead className="hidden sm:table-cell">Бейдж</TableHead>
                    <TableHead>Активний</TableHead>
                    <TableHead className="hidden lg:table-cell">Sort</TableHead>
                    <TableHead className="w-20 text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((p) => {
                    const catSlugs = p.cats ? p.cats.split(",").filter(Boolean) : [];
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.nameUk}
                              className="size-12 rounded-lg border border-border/60 object-cover"
                            />
                          ) : (
                            <span className="grid size-12 place-items-center rounded-lg bg-muted">
                              <ImageIcon className="size-5 text-muted-foreground" />
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium leading-tight">{p.nameUk}</div>
                          {p.nameEn && (
                            <div className="text-xs text-muted-foreground">
                              {p.nameEn}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex max-w-56 flex-wrap gap-1">
                            {catSlugs.length === 0 ? (
                              <span className="text-xs text-muted-foreground">—</span>
                            ) : (
                              catSlugs.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground"
                                  title={catName(s)}
                                >
                                  {catName(s)}
                                </span>
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap font-semibold">
                            {p.price} грн
                          </div>
                          {p.oldPrice !== null && (
                            <div className="text-xs text-muted-foreground line-through">
                              {p.oldPrice} грн
                            </div>
                          )}
                          {bulkPreview(p.bulkTiers ?? "[]") && (
                            <div
                              className="mt-1 max-w-44 whitespace-normal text-[11px] leading-tight text-emerald-600 dark:text-emerald-400"
                              title={bulkPreview(p.bulkTiers ?? "[]")}
                            >
                              {bulkPreview(p.bulkTiers ?? "[]")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {p.badge ? (
                            <Badge
                              variant="outline"
                              className={cn("rounded-full", BADGE_STYLES[p.badge])}
                            >
                              {BADGE_LABELS[p.badge] ?? p.badge}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={p.isActive}
                            onCheckedChange={(v) => void toggleActive(p, v)}
                            aria-label={`Активність товару ${p.nameUk}`}
                          />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground lg:table-cell">
                          {p.sort}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => openEdit(p)}
                              aria-label={`Редагувати ${p.nameUk}`}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-red-400 hover:text-red-400"
                              onClick={() => setDeleteTarget(p)}
                              aria-label={`Видалити ${p.nameUk}`}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --------------------------- діалог товару --------------------------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Редагувати: ${editing.nameUk}` : "Новий товар"}
            </DialogTitle>
            <DialogDescription>
              Після збереження товар одразу зʼявляється на сайті.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-slug">
                  Slug <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="p-slug"
                  value={form.slug}
                  onChange={(e) => set("slug", e.target.value)}
                  placeholder="borshch-xl"
                />
                <p className="text-[11px] text-muted-foreground">
                  a-z, 0-9, дефіси. Використовується в URL та ідентифікаторах.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-badge">Бейдж</Label>
                <Select
                  value={form.badge || "none"}
                  onValueChange={(v) => set("badge", v === "none" ? "" : v)}
                >
                  <SelectTrigger id="p-badge" className="w-full">
                    <SelectValue placeholder="Оберіть бейдж" />
                  </SelectTrigger>
                  <SelectContent>
                    {BADGE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-nameUk">
                  Назва (UK) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="p-nameUk"
                  value={form.nameUk}
                  onChange={(e) => set("nameUk", e.target.value)}
                  placeholder="Борщ український"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-nameEn">Назва (EN)</Label>
                <Input
                  id="p-nameEn"
                  value={form.nameEn}
                  onChange={(e) => set("nameEn", e.target.value)}
                  placeholder="Ukrainian borsch"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-shortUk">Короткий опис (UK)</Label>
                <Textarea
                  id="p-shortUk"
                  value={form.shortUk}
                  onChange={(e) => set("shortUk", e.target.value)}
                  rows={2}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-shortEn">Короткий опис (EN)</Label>
                <Textarea
                  id="p-shortEn"
                  value={form.shortEn}
                  onChange={(e) => set("shortEn", e.target.value)}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-descriptionUk">Опис (UK)</Label>
                <Textarea
                  id="p-descriptionUk"
                  rows={5}
                  value={form.descriptionUk}
                  onChange={(e) => set("descriptionUk", e.target.value)}
                  placeholder="Повний опис товару українською…"
                />
                <p className="text-[11px] text-muted-foreground">
                  Якщо порожньо — на сторінці товару показуватиметься
                  автозгенерований опис.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-descriptionEn">Опис (EN)</Label>
                <Textarea
                  id="p-descriptionEn"
                  rows={5}
                  value={form.descriptionEn}
                  onChange={(e) => set("descriptionEn", e.target.value)}
                  placeholder="Full product description in English…"
                />
                <p className="text-[11px] text-muted-foreground">
                  Порожньо → автозгенерований дефолт на сторінці товару.
                </p>
              </div>
            </div>

            {/* ------------------------ характеристики ------------------------ */}
            <div className="space-y-2 rounded-xl border border-border/60 p-3">
              <Label>Характеристики</Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="p-specsUk" className="text-xs">
                    Характеристики (UK)
                  </Label>
                  <Textarea
                    id="p-specsUk"
                    rows={6}
                    value={form.specsUk}
                    onChange={(e) => set("specsUk", e.target.value)}
                    placeholder={"Вага готової страви = 500 г\nЧас приготування = 10 хвилин"}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-specsEn" className="text-xs">
                    Характеристики (EN)
                  </Label>
                  <Textarea
                    id="p-specsEn"
                    rows={6}
                    value={form.specsEn}
                    onChange={(e) => set("specsEn", e.target.value)}
                    placeholder={"Prepared weight = 500 g\nCooking time = 10 minutes"}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Формат: «Назва = Значення», кожна характеристика з нового рядка.
                UK- та EN-рядки зіплються за порядком. Якщо обидва поля порожні —
                на сторінці товару показуватимуться автозгенеровані дефолти.
              </p>
            </div>

            {/* ------------------------- FAQ товару -------------------------- */}
            <div className="space-y-2 rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <Label>FAQ товару</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFaq}
                >
                  <Plus className="size-4" /> Додати питання
                </Button>
              </div>
              {form.faqItems.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Питань немає. Якщо порожньо — на сторінці товару
                  показуватимуться автозгенеровані дефолти.
                </p>
              ) : (
                <div className="space-y-3">
                  {form.faqItems.map((pair, idx) => (
                    <div
                      key={idx}
                      className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          Питання {idx + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-red-400 hover:text-red-400"
                          onClick={() => removeFaq(idx)}
                          aria-label={`Видалити питання ${idx + 1}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input
                          value={pair.qUk}
                          onChange={(e) => setFaq(idx, "qUk", e.target.value)}
                          placeholder="Питання (UK)"
                          aria-label={`Питання ${idx + 1} (UK)`}
                        />
                        <Input
                          value={pair.qEn}
                          onChange={(e) => setFaq(idx, "qEn", e.target.value)}
                          placeholder="Question (EN)"
                          aria-label={`Питання ${idx + 1} (EN)`}
                        />
                        <Textarea
                          rows={2}
                          value={pair.aUk}
                          onChange={(e) => setFaq(idx, "aUk", e.target.value)}
                          placeholder="Відповідь (UK)"
                          aria-label={`Відповідь ${idx + 1} (UK)`}
                        />
                        <Textarea
                          rows={2}
                          value={pair.aEn}
                          onChange={(e) => setFaq(idx, "aEn", e.target.value)}
                          placeholder="Answer (EN)"
                          aria-label={`Відповідь ${idx + 1} (EN)`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Пари з порожніми питанням і відповіддю (UK) не зберігаються.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-portionUk">Порція (UK)</Label>
                <Input
                  id="p-portionUk"
                  value={form.portionUk}
                  onChange={(e) => set("portionUk", e.target.value)}
                  placeholder="250 г готової страви"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-portionEn">Порція (EN)</Label>
                <Input
                  id="p-portionEn"
                  value={form.portionEn}
                  onChange={(e) => set("portionEn", e.target.value)}
                  placeholder="250 g ready meal"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Категорії</Label>
              {cats.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Категорій ще немає — створіть їх на сторінці «Категорії».
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {cats.map((c) => {
                    const active = form.catList.includes(c.slug);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCat(c.slug)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-amber-500/50 bg-amber-500/15 text-accent-strong"
                            : "border-border text-muted-foreground hover:bg-muted"
                        )}
                      >
                        {c.nameUk}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="space-y-2 rounded-xl border border-border/60 p-3">
              <div className="flex items-center justify-between">
                <Label>Оптові скидки (від кількості)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addBulk}
                >
                  <Plus className="size-4" /> Додати рівень
                </Button>
              </div>
              {form.bulkTiers.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">
                  Рівнів немає — товар продається за роздрібною ціною.
                  Додай рівень «від N шт. — ціна», як на harchifood.com
                  (напр. від 3 шт. — 199 грн).
                </p>
              ) : (
                <div className="space-y-2">
                  {form.bulkTiers.map((tier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 p-2"
                    >
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Від
                      </span>
                      <Input
                        type="number"
                        min="2"
                        step="1"
                        value={tier.minQty}
                        onChange={(e) => setBulk(idx, "minQty", e.target.value)}
                        placeholder="3"
                        className="w-20"
                        aria-label={`Оптовий рівень ${idx + 1}: кількість від`}
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">
                        шт. —
                      </span>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={tier.price}
                        onChange={(e) => setBulk(idx, "price", e.target.value)}
                        placeholder="199"
                        className="w-24"
                        aria-label={`Оптовий рівень ${idx + 1}: ціна за шт.`}
                      />
                      <span className="shrink-0 text-xs text-muted-foreground">
                        грн
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="ml-auto size-7 shrink-0 text-red-400 hover:text-red-400"
                        onClick={() => removeBulk(idx)}
                        aria-label={`Видалити оптовий рівень ${idx + 1}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">
                Порожні рядки не зберігаються. Оптова ціна має бути нижчою за
                роздрібну.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="p-price">
                  Ціна, грн <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="p-price"
                  type="number"
                  min="0"
                  step="1"
                  value={form.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="199"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-oldPrice">Стара ціна (закреслена)</Label>
                <Input
                  id="p-oldPrice"
                  type="number"
                  min="0"
                  step="1"
                  value={form.oldPrice}
                  onChange={(e) => set("oldPrice", e.target.value)}
                  placeholder="235"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-image">
                Зображення <span className="text-red-400">*</span>
              </Label>
              <div className="flex items-start gap-3">
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Превʼю зображення товару"
                    className="size-16 shrink-0 rounded-lg border border-border/60 object-cover"
                  />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-muted/50">
                    <ImageIcon className="size-6 text-muted-foreground" />
                  </span>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    id="p-image"
                    value={form.image}
                    onChange={(e) => set("image", e.target.value)}
                    placeholder="/products/borshch.png або https://…"
                  />
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void onUploadFile(f);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload className="size-4" />
                    {uploading ? "Завантаження…" : "Завантажити файл"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor="p-rating">Рейтинг (0-5)</Label>
                <Input
                  id="p-rating"
                  type="number"
                  min="0"
                  max="5"
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => set("rating", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-reviewsCount">К-сть відгуків</Label>
                <Input
                  id="p-reviewsCount"
                  type="number"
                  min="0"
                  step="1"
                  value={form.reviewsCount}
                  onChange={(e) => set("reviewsCount", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-kcal">ккал</Label>
                <Input
                  id="p-kcal"
                  type="number"
                  min="0"
                  step="1"
                  value={form.kcal}
                  onChange={(e) => set("kcal", e.target.value)}
                  placeholder="420"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-weight">Вага, г</Label>
                <Input
                  id="p-weight"
                  type="number"
                  min="0"
                  step="1"
                  value={form.weight}
                  onChange={(e) => set("weight", e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                <Label htmlFor="p-active" className="cursor-pointer">
                  Активний (показувати на сайті)
                </Label>
                <Switch
                  id="p-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => set("isActive", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-sort">Порядок (sort)</Label>
                <Input
                  id="p-sort"
                  type="number"
                  step="1"
                  value={form.sort}
                  onChange={(e) => set("sort", e.target.value)}
                />
              </div>
            </div>

            {formError && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-500">
                {formError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Скасувати
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Збереження…" : editing ? "Зберегти зміни" : "Створити товар"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---------------------- підтвердження видалення ---------------------- */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити товар?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.nameUk}» буде видалено назавжди. Цю дію неможливо
              скасувати.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? "Видалення…" : "Видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
