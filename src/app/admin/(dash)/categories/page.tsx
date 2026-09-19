"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FolderTree, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/admin-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface AdminCategory {
  id: number;
  slug: string;
  nameUk: string;
  nameEn: string;
  sort: number;
  isActive: boolean;
}

interface CategoryForm {
  slug: string;
  nameUk: string;
  nameEn: string;
  sort: string;
  isActive: boolean;
}

const EMPTY_FORM: CategoryForm = {
  slug: "",
  nameUk: "",
  nameEn: "",
  sort: "0",
  isActive: true,
};

const SLUG_RE = /^[a-z0-9-]+$/;

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "server_error";
  if (msg === "conflict") return "Конфлікт: категорія з таким slug уже існує";
  if (msg === "unauthorized") return "Сесія закінчилась, увійдіть знову";
  return `Помилка: ${msg}`;
}

/* -------------------------------- сторінка ------------------------------- */

export default function AdminCategoriesPage() {
  const [items, setItems] = useState<AdminCategory[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<CategoryForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setItems(await apiGet<AdminCategory[]>("/api/admin/categories"));
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

  const set = <K extends keyof CategoryForm>(key: K, value: CategoryForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (c: AdminCategory) => {
    setEditing(c);
    setForm({
      slug: c.slug,
      nameUk: c.nameUk,
      nameEn: c.nameEn,
      sort: String(c.sort),
      isActive: c.isActive,
    });
    setFormError(null);
    setOpen(true);
  };

  const validate = (): string | null => {
    if (!form.slug.trim()) return "Slug обовʼязковий";
    if (!SLUG_RE.test(form.slug.trim()))
      return "Slug — лише малі латинські літери, цифри та дефіси (a-z0-9-)";
    if (!form.nameUk.trim()) return "Назва (UK) обовʼязкова";
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
      slug: form.slug.trim(),
      nameUk: form.nameUk.trim(),
      nameEn: form.nameEn.trim(),
      sort: Number(form.sort.trim() || "0"),
      isActive: form.isActive,
    };
    try {
      if (editing) {
        await apiSend(`/api/admin/categories/${editing.id}`, "PUT", payload);
        toast.success("Категорію оновлено");
      } else {
        await apiSend("/api/admin/categories", "POST", payload);
        toast.success("Категорію створено");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: AdminCategory, v: boolean) => {
    try {
      await apiSend(`/api/admin/categories/${c.id}`, "PATCH", { isActive: v });
      setItems((prev) =>
        prev ? prev.map((x) => (x.id === c.id ? { ...x, isActive: v } : x)) : prev
      );
      toast.success(v ? `«${c.nameUk}» показується` : `«${c.nameUk}» приховано`);
    } catch (e) {
      toast.error(errText(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend(`/api/admin/categories/${deleteTarget.id}`, "DELETE");
      toast.success(`Категорію «${deleteTarget.nameUk}» видалено`);
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
            Категорії
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Фільтри-пілюлі в каталозі та групи товарів
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 self-start sm:self-auto">
          <Plus className="size-4" /> Додати категорію
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <FolderTree className="size-4 text-accent-strong" />
            Список категорій
            {items && (
              <span className="text-sm font-normal text-muted-foreground">
                · {items.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Не видаляйте категорію, якщо вона ще призначена товарам — спершу
            приберіть її з товарів
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items === null ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <FolderOpen className="size-7 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium">Категорій ще немає</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Створіть першу категорію — вона зʼявиться у фільтрах каталогу
                </p>
              </div>
              <Button onClick={openCreate} variant="outline" size="sm">
                <Plus className="size-4" /> Додати категорію
              </Button>
            </div>
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-40">Slug</TableHead>
                    <TableHead>Назва (UK)</TableHead>
                    <TableHead className="hidden sm:table-cell">Назва (EN)</TableHead>
                    <TableHead className="w-16">Sort</TableHead>
                    <TableHead>Активна</TableHead>
                    <TableHead className="w-20 text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs">
                          {c.slug}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">{c.nameUk}</TableCell>
                      <TableCell className="hidden text-muted-foreground sm:table-cell">
                        {c.nameEn || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{c.sort}</TableCell>
                      <TableCell>
                        <Switch
                          checked={c.isActive}
                          onCheckedChange={(v) => void toggleActive(c, v)}
                          aria-label={`Активність категорії ${c.nameUk}`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(c)}
                            aria-label={`Редагувати ${c.nameUk}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-400 hover:text-red-400"
                            onClick={() => setDeleteTarget(c)}
                            aria-label={`Видалити ${c.nameUk}`}
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

      {/* ------------------------- діалог категорії ------------------------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editing ? `Редагувати: ${editing.nameUk}` : "Нова категорія"}
            </DialogTitle>
            <DialogDescription>
              Slug використовується в полі «категорії» кожного товару (CSV).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="c-slug">
                Slug <span className="text-red-400">*</span>
              </Label>
              <Input
                id="c-slug"
                value={form.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder="pershi"
              />
              <p className="text-[11px] text-muted-foreground">a-z, 0-9, дефіси</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-nameUk">
                  Назва (UK) <span className="text-red-400">*</span>
                </Label>
                <Input
                  id="c-nameUk"
                  value={form.nameUk}
                  onChange={(e) => set("nameUk", e.target.value)}
                  placeholder="Перші страви"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c-nameEn">Назва (EN)</Label>
                <Input
                  id="c-nameEn"
                  value={form.nameEn}
                  onChange={(e) => set("nameEn", e.target.value)}
                  placeholder="Soups"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="c-sort">Порядок (sort)</Label>
                <Input
                  id="c-sort"
                  type="number"
                  step="1"
                  value={form.sort}
                  onChange={(e) => set("sort", e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                <Label htmlFor="c-active" className="cursor-pointer">
                  Активна
                </Label>
                <Switch
                  id="c-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => set("isActive", v)}
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
              {saving ? "Збереження…" : editing ? "Зберегти зміни" : "Створити"}
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
            <AlertDialogTitle>Видалити категорію?</AlertDialogTitle>
            <AlertDialogDescription>
              Категорію «{deleteTarget?.nameUk}» буде видалено назавжди.{" "}
              <span className="font-medium text-amber-500">
                Якщо цей slug ще призначений товарам (поле «категорії»), вони
                втратять цю групу
              </span>{" "}
              — спершу приберіть категорію з товарів.
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
              {deleting ? "Видалення…" : "Все одно видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
