"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
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

interface AdminFaq {
  id: number;
  qUk: string;
  qEn: string;
  aUk: string;
  aEn: string;
  isActive: boolean;
  sort: number;
}

interface FaqForm {
  qUk: string;
  qEn: string;
  aUk: string;
  aEn: string;
  isActive: boolean;
  sort: string;
}

const EMPTY_FORM: FaqForm = {
  qUk: "",
  qEn: "",
  aUk: "",
  aEn: "",
  isActive: true,
  sort: "0",
};

function formFromFaq(f: AdminFaq): FaqForm {
  return {
    qUk: f.qUk,
    qEn: f.qEn,
    aUk: f.aUk,
    aEn: f.aEn,
    isActive: f.isActive,
    sort: String(f.sort),
  };
}

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "server_error";
  if (msg === "unauthorized") return "Сесія закінчилась, увійдіть знову";
  return `Помилка: ${msg}`;
}

/* -------------------------------- сторінка ------------------------------- */

export default function AdminFaqPage() {
  const [items, setItems] = useState<AdminFaq[] | null>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminFaq | null>(null);
  const [form, setForm] = useState<FaqForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminFaq | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    try {
      setItems(await apiGet<AdminFaq[]>("/api/admin/faq"));
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

  const set = <K extends keyof FaqForm>(key: K, value: FaqForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (item: AdminFaq) => {
    setEditing(item);
    setForm(formFromFaq(item));
    setFormError(null);
    setOpen(true);
  };

  const validate = (): string | null => {
    if (!form.qUk.trim()) return "Питання (UK) обовʼязкове";
    if (!form.aUk.trim()) return "Відповідь (UK) обовʼязкова";
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
      qUk: form.qUk.trim(),
      qEn: form.qEn.trim(),
      aUk: form.aUk.trim(),
      aEn: form.aEn.trim(),
      isActive: form.isActive,
      sort: Number(form.sort.trim() || "0"),
    };
    try {
      if (editing) {
        await apiSend(`/api/admin/faq/${editing.id}`, "PUT", payload);
        toast.success("Питання оновлено");
      } else {
        await apiSend("/api/admin/faq", "POST", payload);
        toast.success("Питання додано");
      }
      setOpen(false);
      await load();
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (item: AdminFaq, v: boolean) => {
    try {
      await apiSend(`/api/admin/faq/${item.id}`, "PATCH", { isActive: v });
      setItems((prev) =>
        prev ? prev.map((x) => (x.id === item.id ? { ...x, isActive: v } : x)) : prev
      );
      toast.success(v ? "Питання показується на сайті" : "Питання приховано");
    } catch (e) {
      toast.error(errText(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend(`/api/admin/faq/${deleteTarget.id}`, "DELETE");
      toast.success("Питання видалено");
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
            FAQ
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Питання та відповіді в акордеоні на головній
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 self-start sm:self-auto">
          <Plus className="size-4" /> Додати питання
        </Button>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="size-4 text-accent-strong" />
            Список питань
            {items && (
              <span className="text-sm font-normal text-muted-foreground">
                · {items.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Порядок відповідає полю sort — менше значення вище в акордеоні
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
                <HelpCircle className="size-7 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium">Питань ще немає</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Додайте перше питання — воно зʼявиться в FAQ-блоці на сайті
                </p>
              </div>
              <Button onClick={openCreate} variant="outline" size="sm">
                <Plus className="size-4" /> Додати питання
              </Button>
            </div>
          ) : (
            <div className="-mx-2 overflow-x-auto px-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-52">Питання (UK)</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Відповідь (UK)
                    </TableHead>
                    <TableHead>Активне</TableHead>
                    <TableHead className="hidden lg:table-cell">Sort</TableHead>
                    <TableHead className="w-20 text-right">Дії</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <p className="max-w-80 font-medium leading-snug">{item.qUk}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <p className="max-w-80 truncate text-sm text-muted-foreground">
                          {item.aUk}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={item.isActive}
                          onCheckedChange={(v) => void toggleActive(item, v)}
                          aria-label={`Активність питання ${item.qUk}`}
                        />
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground lg:table-cell">
                        {item.sort}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => openEdit(item)}
                            aria-label={`Редагувати питання ${item.qUk}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-red-400 hover:text-red-400"
                            onClick={() => setDeleteTarget(item)}
                            aria-label={`Видалити питання ${item.qUk}`}
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

      {/* --------------------------- діалог питання --------------------------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Редагувати питання" : "Нове питання"}
            </DialogTitle>
            <DialogDescription>
              Питання зʼявиться в FAQ-акордеоні на головній сторінці.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="f-qUk">
                Питання (UK) <span className="text-red-400">*</span>
              </Label>
              <Input
                id="f-qUk"
                value={form.qUk}
                onChange={(e) => set("qUk", e.target.value)}
                placeholder="Скільки зберігається сублімат?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-qEn">Питання (EN)</Label>
              <Input
                id="f-qEn"
                value={form.qEn}
                onChange={(e) => set("qEn", e.target.value)}
                placeholder="How long does it keep?"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-aUk">
                Відповідь (UK) <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="f-aUk"
                rows={4}
                value={form.aUk}
                onChange={(e) => set("aUk", e.target.value)}
                placeholder="До 12 місяців у сухому прохолодному місці…"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-aEn">Відповідь (EN)</Label>
              <Textarea
                id="f-aEn"
                rows={4}
                value={form.aEn}
                onChange={(e) => set("aEn", e.target.value)}
                placeholder="Up to 12 months in a dry cool place…"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                <Label htmlFor="f-active" className="cursor-pointer">
                  Активне
                </Label>
                <Switch
                  id="f-active"
                  checked={form.isActive}
                  onCheckedChange={(v) => set("isActive", v)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="f-sort">Порядок (sort)</Label>
                <Input
                  id="f-sort"
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
              {saving ? "Збереження…" : editing ? "Зберегти зміни" : "Додати питання"}
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
            <AlertDialogTitle>Видалити питання?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.qUk}» буде видалено назавжди. Цю дію неможливо
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
