"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCheck,
  Copy,
  ImageIcon,
  Images,
  Trash2,
  UploadCloud,
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
import { Skeleton } from "@/components/ui/skeleton";
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

interface MediaAsset {
  id: number;
  filename: string;
  url: string;
  size: number;
  createdAt: string;
}

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "server_error";
  if (msg === "bad_file_type") return "Непідтримуваний тип файлу (png/jpg/webp/svg/gif)";
  if (msg === "file_too_large") return "Файл більший за 5 МБ";
  if (msg === "unauthorized") return "Сесія закінчилась, увійдіть знову";
  return `Помилка: ${msg}`;
}

const fmtSize = (bytes: number): string =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
    : `${Math.max(1, Math.round(bytes / 1024))} КБ`;

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml,image/gif";

/* -------------------------------- сторінка ------------------------------- */

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaAsset[] | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setItems(await apiGet<MediaAsset[]>("/api/admin/media"));
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

  const uploadFiles = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/") || /\.(png|jpe?g|webp|svg|gif)$/i.test(f.name));
    if (images.length === 0) {
      toast.error("Оберіть зображення (png/jpg/webp/svg/gif)");
      return;
    }
    setUploading(true);
    let ok = 0;
    let fail = 0;
    for (const file of images) {
      try {
        const fd = new FormData();
        fd.append("file", file);
        await apiUpload<{ url: string; filename: string; size: number }>(
          "/api/admin/upload",
          fd
        );
        ok += 1;
      } catch (e) {
        fail += 1;
        toast.error(`${file.name}: ${errText(e)}`);
      }
    }
    setUploading(false);
    if (ok > 0) {
      toast.success(
        `Завантажено ${ok} ${ok === 1 ? "файл" : ok < 5 ? "файли" : "файлів"}${
          fail > 0 ? `, помилок: ${fail}` : ""
        }`
      );
      await load();
    }
  };

  const copyUrl = async (asset: MediaAsset) => {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      toast.success("URL скопійовано в буфер обміну");
      setTimeout(() => setCopiedId((cur) => (cur === asset.id ? null : cur)), 2000);
    } catch {
      toast.error("Не вдалося скопіювати URL");
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiSend(`/api/admin/media/${deleteTarget.id}`, "DELETE");
      toast.success(`Файл «${deleteTarget.filename}» видалено назавжди`);
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
      <div>
        <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
          Медіа
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Зображення для товарів, контенту та hero — з копіюванням URL
        </p>
      </div>

      {/* ------------------------- зона завантаження ------------------------- */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Зона завантаження зображень"
        onClick={() => !uploading && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading)
            inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!uploading) void uploadFiles(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          dragOver
            ? "border-amber-500 bg-amber-500/10"
            : "border-border bg-card/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60"
        )}
      >
        <span className="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 text-stone-950 shadow-lg shadow-orange-600/20">
          <UploadCloud className="size-7" />
        </span>
        <div>
          <p className="font-medium">
            {uploading ? "Завантажуємо…" : "Перетягніть файли сюди або клікніть"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            PNG, JPG, WebP, SVG, GIF · до 5 МБ · можна кілька одразу
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            void uploadFiles(Array.from(e.target.files ?? []));
            e.target.value = "";
          }}
        />
      </div>

      {/* ------------------------------ сітка ------------------------------- */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Images className="size-4 text-accent-strong" />
            Файли
            {items && (
              <span className="text-sm font-normal text-muted-foreground">
                · {items.length}
              </span>
            )}
          </CardTitle>
          <CardDescription>
            «Копіювати URL» — щоб вставити посилання у товар або контент секції
          </CardDescription>
        </CardHeader>
        <CardContent>
          {items === null ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-muted">
                <ImageIcon className="size-7 text-muted-foreground" />
              </span>
              <div>
                <p className="font-medium">Медіа ще немає</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Завантажте перше зображення через зону вище — воно зʼявиться тут
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {items.map((a) => (
                <div
                  key={a.id}
                  className="group overflow-hidden rounded-2xl border border-border/60 bg-card"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted/40">
                    <img
                      src={a.url}
                      alt={a.filename}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="space-y-2 p-3">
                    <p
                      className="truncate text-xs font-medium"
                      title={a.filename}
                    >
                      {a.filename}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {fmtSize(a.size)}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 flex-1 text-xs"
                        onClick={() => void copyUrl(a)}
                      >
                        {copiedId === a.id ? (
                          <CheckCheck className="size-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                        {copiedId === a.id ? "Скопійовано" : "Копіювати URL"}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 shrink-0 text-red-400 hover:text-red-400"
                        onClick={() => setDeleteTarget(a)}
                        aria-label={`Видалити ${a.filename}`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------------- підтвердження видалення ---------------------- */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Видалити файл назавжди?</AlertDialogTitle>
            <AlertDialogDescription>
              «{deleteTarget?.filename}» буде видалено з сервера і з бази. Якщо
              це зображення ще використовується на сайті (товар, контент), воно
              перестане відображатися.
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
              {deleting ? "Видалення…" : "Видалити назавжди"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
