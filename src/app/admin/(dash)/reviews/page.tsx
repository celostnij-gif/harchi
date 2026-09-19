"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  MessageSquareQuote,
  Package,
  Pencil,
  Plus,
  Star,
  Trash2,
} from "lucide-react";
import { apiGet, apiSend } from "@/lib/admin-client";
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

interface AdminReview {
  id: number;
  author: string;
  roleUk: string;
  roleEn: string;
  textUk: string;
  textEn: string;
  rating: number;
  productSlug: string | null;
  /** Назва товару з API (join за productSlug → Product.nameUk). */
  productName?: string | null;
  isActive: boolean;
  sort: number;
}

interface ReviewForm {
  author: string;
  roleUk: string;
  roleEn: string;
  textUk: string;
  textEn: string;
  rating: string;
  isActive: boolean;
  sort: string;
}

const EMPTY_FORM: ReviewForm = {
  author: "",
  roleUk: "",
  roleEn: "",
  textUk: "",
  textEn: "",
  rating: "5",
  isActive: true,
  sort: "0",
};

function formFromReview(r: AdminReview): ReviewForm {
  return {
    author: r.author,
    roleUk: r.roleUk,
    roleEn: r.roleEn,
    textUk: r.textUk,
    textEn: r.textEn,
    rating: String(r.rating),
    isActive: r.isActive,
    sort: String(r.sort),
  };
}

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "server_error";
  if (msg === "unauthorized") return "Сесія закінчилась, увійдіть знову";
  return `Помилка: ${msg}`;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`Рейтинг ${value} з 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "size-3.5",
            i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          )}
        />
      ))}
    </span>
  );
}

/* -------------------------------- сторінка ------------------------------- */

export default function AdminReviewsPage() {
  const [items, setItems] = useState<AdminReview[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminReview | null>(null);
  const [form, setForm] = useState<ReviewForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setItems(await apiGet<AdminReview[]>("/api/admin/reviews"));
    } catch (e) {
      setItems([]);
      toast.error(errText(e));
    }
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
  }, []);

  const set = <K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (r: AdminReview) => {
    setEditing(r);
    setForm(formFromReview(r));
    setFormError(null);
    setOpen(true);
  };

  const validate = (): string | null => {
    if (!form.author.trim()) return "Імʼя автора обовʼязкове";
    if (!form.textUk.trim()) return "Текст відгуку (UK) обовʼязковий";
    const rating = Number(form.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return "Рейтинг — ціле число від 1 до 5";
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
    const payload = {
      author: form.author.trim(),
      roleUk: form.roleUk.trim(),
      roleEn: form.roleEn.trim(),
      textUk: form.textUk.trim(),
      textEn: form.textEn.trim(),
      rating: Number(form.rating),
      isActive: form.isActive,
      sort: Number(form.sort.trim() || "0"),
    };
    try {
      if (editing) {
        await apiSend(`/api/admin/reviews/${editing.id}`, "PUT", payload);
        toast.success("Відгук оновлено");
      } else {
        await apiSend("/api/admin/reviews", "POST", payload);
        toast.success("Відгук додано");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (r: AdminReview, v: boolean) => {
    try {
      await apiSend(`/api/admin/reviews/${r.id}`, "PATCH", { isActive: v });
      setItems((prev) =>
        prev ? prev.map((x) => (x.id === r.id ? { ...x, isActive: v } : x)) : prev
      );
      toast.success(v ? "Відгук показується на сайті" : "Відгук приховано");
    } catch (e) {
      toast.error(errText(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend(`/api/admin/reviews/${deleteTarget.id}`, "DELETE");
      toast.success(`Відгук від «${deleteTarget.author}» видалено`);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Відгуки
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Стрічка соцдоказів на головній сторінці
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 self-start sm:self-auto">
          <Plus className="size-4" /> Додати відгук
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MessageSquareQuote className="size-4 text-accent-strong" />
            Список відгуків
            {items && (
              <span className="text-sm font-normal text-muted-foreground">
                · {items.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Неактивні відгуки не показуються на сайті, але лишаються тут
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items === null ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <MessageSquareQuote className="size-7 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium">Відгуків ще немає</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Додайте перший відгук — він зʼявиться у стрічці на сайті
                </p>
              </div>
              <Button onClick={openCreate} variant="outline" size="sm">
                <Plus className="size-4" /> Додати відгук
              </Button>
            </div>
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-32">Автор</TableHead>
                    <TableHead className="hidden md:table-cell">Роль (UK)</TableHead>
                    <TableHead className="min-w-52">Текст</TableHead>
                    <TableHead className="hidden lg:table-cell">Товар</TableHead>
                    <TableHead>Оцінка</TableHead>
                    <TableHead>Активний</TableHead>
                    <TableHead className="hidden lg:table-cell">Sort</TableHead>
                    <TableHead className="w-20 text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.author}</TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {r.roleUk || "—"}
                      </TableCell>
                      <TableCell>
                        <p className="max-w-72 truncate text-sm text-muted-foreground">
                          {r.textUk}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {r.productSlug ? (
                          <Badge
                            variant="outline"
                            className="max-w-52 gap-1 rounded-full border-amber-500/40 bg-amber-500/10 text-amber-500"
                            title={r.productName ?? r.productSlug}
                          >
                            <Package className="size-3 shrink-0" />
                            <span className="truncate">
                              Товар: {r.productName ?? r.productSlug}
                            </span>
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stars value={r.rating} />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={r.isActive}
                          onCheckedChange={(v) => void toggleActive(r, v)}
                          aria-label={`Активність відгуку ${r.author}`}
                        />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {r.sort}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(r)}
                            aria-label={`Редагувати відгук ${r.author}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-400 hover:text-red-400"
                            onClick={() => setDeleteTarget(r)}
                            aria-label={`Видалити відгук ${r.author}`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --------------------------- діалог відгуку --------------------------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Редагувати відгук від «${editing.author}»` : "Новий відгук"}
            </DialogTitle>
            <DialogDescription>
              Відгук зʼявиться у стрічці соцдоказів на головній.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-author">
                  Автор <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="r-author"
                  value={form.author}
                  onChange={(e) => set("author", e.target.value)}
                  placeholder="Оксана"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Оцінка</Label>
                <Select value={form.rating} onValueChange={(v) => set("rating", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="1-5" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {n === 1 ? "зірка" : n < 5 ? "зірки" : "зірок"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="r-roleUk">Роль (UK)</Label>
                <Input
                  id="r-roleUk"
                  value={form.roleUk}
                  onChange={(e) => set("roleUk", e.target.value)}
                  placeholder="дружина військового"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-roleEn">Роль (EN)</Label>
                <Input
                  id="r-roleEn"
                  value={form.roleEn}
                  onChange={(e) => set("roleEn", e.target.value)}
                  placeholder="soldier's wife"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="r-textUk">
                Текст (UK) <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="r-textUk"
                rows={4}
                value={form.textUk}
                onChange={(e) => set("textUk", e.target.value)}
                placeholder="Брала чоловіку військовому…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-textEn">Текст (EN)</Label>
              <Textarea
                id="r-textEn"
                rows={4}
                value={form.textEn}
                onChange={(e) => set("textEn", e.target.value)}
                placeholder="I bought it for my husband…"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                <Label htmlFor="r-active" className="cursor-pointer">
                  Активний
                </Label>
                <Switch
                  id="r-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => set("isActive", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="r-sort">Порядок (sort)</Label>
                <Input
                  id="r-sort"
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
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Скасувати
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Збереження…" : editing ? "Зберегти зміни" : "Додати відгук"}
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
            <AlertDialogTitle>Видалити відгук?</AlertDialogTitle>
            <AlertDialogDescription>
              Відгук від «{deleteTarget?.author}» буде видалено назавжди. Цю дію
              неможливо скасувати.
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
