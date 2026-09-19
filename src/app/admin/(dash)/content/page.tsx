"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  FileText,
  Info,
  Loader2,
  MonitorX,
  RotateCcw,
  Upload,
} from "lucide-react";
import { apiGet, apiSend, apiUpload } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import { SECTION_DEFS, type FieldDef, type SectionDef } from "@/lib/section-defs";
import { KITS, STRINGS, type Kit, type Lang } from "@/lib/i18n";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ---------------------------------- типи --------------------------------- */

interface ContentRow {
  key: string;
  data: Record<string, unknown>;
  visible: boolean;
  updatedAt?: string;
}

interface LangValues {
  uk: Record<string, string>;
  en: Record<string, string>;
}

interface StepDraft {
  title: string;
  text: string;
}

interface KitDraft {
  id: string;
  nameUk: string;
  nameEn: string;
  taglineUk: string;
  taglineEn: string;
  itemsUk: string;
  itemsEn: string;
  price: string;
  oldPrice: string;
  kcal: string;
  accent: string;
}

const ACCENTS: { value: string; label: string }[] = [
  { value: "from-emerald-400 to-teal-500", label: "Зелений" },
  { value: "from-amber-400 to-orange-600", label: "Янтарний" },
  { value: "from-orange-500 to-red-600", label: "Полумʼя" },
  { value: "from-rose-400 to-orange-500", label: "Рожевий" },
];

/** Секції, чий вміст — масив рядків (data.uk = ["…"]), без ключа items/labels. */
const ARRAY_SECTIONS = new Set(["ticker", "stats"]);

const isObj = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);

const splitLines = (v: string): string[] =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

function errText(e: unknown): string {
  const msg = e instanceof Error ? e.message : "server_error";
  if (msg === "unauthorized") return "Сесія закінчилась, увійдіть знову";
  return `Помилка: ${msg}`;
}

/* ---------------------- дефолти з STRINGS (плейсхолдери) ------------------- */

function fieldDefault(lang: Lang, sectionKey: string, f: FieldDef): string {
  const section = (STRINGS[lang] as unknown as Record<string, unknown>)[sectionKey];
  if (f.type === "list") {
    if (Array.isArray(section)) return section.join("\n");
    if (isObj(section)) {
      const v = section[f.key];
      if (Array.isArray(v)) return v.map(String).join("\n");
    }
    return "";
  }
  if (f.type === "image") return "";
  if (isObj(section)) {
    const v = section[f.key];
    if (typeof v === "string") return v;
  }
  return "";
}

function stepDefault(lang: Lang, i: number, part: "title" | "text"): string {
  return STRINGS[lang].how.steps[i]?.[part] ?? "";
}

/* ------------------------------ ініціалізація ----------------------------- */

function initFieldValues(def: SectionDef, data: Record<string, unknown>): LangValues {
  const out: LangValues = { uk: {}, en: {} };
  for (const lang of ["uk", "en"] as Lang[]) {
    const part = data[lang];
    for (const f of def.fields) {
      if (f.type === "image") continue; // спільне поле, ініціалізується окремо
      let raw: unknown;
      if (f.type === "list" && Array.isArray(part)) {
        raw = part; // ticker/stats: увесь масив = значення поля
      } else if (isObj(part)) {
        raw = part[f.key];
      }
      if (typeof raw === "string") out[lang][f.key] = raw;
      else if (typeof raw === "number") out[lang][f.key] = String(raw);
      else if (Array.isArray(raw)) out[lang][f.key] = raw.map(String).join("\n");
      else out[lang][f.key] = "";
    }
  }
  return out;
}

function initBgImage(def: SectionDef, data: Record<string, unknown>): string {
  const hasImage = def.fields.some((f) => f.type === "image");
  if (!hasImage) return "";
  const uk = data.uk;
  const en = data.en;
  const v = (isObj(uk) ? uk.bgImage : undefined) ?? (isObj(en) ? en.bgImage : undefined);
  return typeof v === "string" ? v : "";
}

function initSteps(data: Record<string, unknown>): { uk: StepDraft[]; en: StepDraft[] } {
  const out: { uk: StepDraft[]; en: StepDraft[] } = { uk: [], en: [] };
  for (const lang of ["uk", "en"] as Lang[]) {
    const part = data[lang];
    const arr = isObj(part) && Array.isArray(part.steps) ? part.steps : [];
    out[lang] = [0, 1, 2].map((i) => {
      const s = arr[i];
      const o = isObj(s) ? s : {};
      return {
        title: typeof o.title === "string" ? o.title : "",
        text: typeof o.text === "string" ? o.text : "",
      };
    });
  }
  return out;
}

function initKits(data: Record<string, unknown>): KitDraft[] {
  const savedUnknown = data.kits;
  const saved: unknown[] = Array.isArray(savedUnknown) ? savedUnknown : [];
  return KITS.map((base, i) => {
    const s = saved[i];
    const src = (isObj(s) ? s : {}) as Partial<Kit>;
    const items = Array.isArray(src.items) && src.items.length ? src.items : base.items;
    const name = isObj(src.name) ? src.name : base.name;
    const tagline = isObj(src.tagline) ? src.tagline : base.tagline;
    return {
      id: base.id,
      nameUk: name.uk ?? base.name.uk,
      nameEn: name.en ?? base.name.en,
      taglineUk: tagline.uk ?? base.tagline.uk,
      taglineEn: tagline.en ?? base.tagline.en,
      itemsUk: items.map((it) => it.uk).join("\n"),
      itemsEn: items.map((it) => it.en).join("\n"),
      price: src.price != null ? String(src.price) : String(base.price),
      oldPrice: src.oldPrice != null ? String(src.oldPrice) : String(base.oldPrice),
      kcal: src.kcal != null ? String(src.kcal) : String(base.kcal),
      accent: typeof src.accent === "string" && src.accent ? src.accent : base.accent,
    };
  });
}

/* ---------------------------- локальні контроли ---------------------------- */

function ImageInput({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const upload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const res = await apiUpload<{ url: string; filename: string }>(
        "/api/admin/upload",
        fd
      );
      onChange(res.url);
      toast.success(`Файл завантажено: ${res.filename}`);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-start gap-3">
      {value ? (
        <img
          src={value}
          alt="Превʼю"
          className="size-16 shrink-0 rounded-lg border border-border/60 object-cover"
        />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-lg border border-dashed border-border bg-muted/50">
          <Upload className="size-5 text-muted-foreground" />
        </span>
      )}
      <div className="flex-1 space-y-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="/uploads/hero.png або https://…"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void upload(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? "Завантаження…" : "Завантажити файл"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------ редактор секції ---------------------------- */

function SectionEditor({
  def,
  row,
  onSaved,
  onToggleVisible,
}: {
  def: SectionDef;
  row: ContentRow;
  onSaved: (row: ContentRow) => void;
  onToggleVisible: (row: ContentRow, v: boolean) => void;
}) {
  const [langTab, setLangTab] = useState<Lang>("uk");
  const [values, setValues] = useState<LangValues>(() => initFieldValues(def, row.data));
  const [bgImage, setBgImage] = useState<string>(() => initBgImage(def, row.data));
  const [steps, setSteps] = useState<{ uk: StepDraft[]; en: StepDraft[] }>(() =>
    initSteps(row.data)
  );
  const [kits, setKits] = useState<KitDraft[]>(() => initKits(row.data));
  const [saving, setSaving] = useState(false);

  const setVal = (lang: Lang, key: string, v: string) =>
    setValues((prev) => ({ ...prev, [lang]: { ...prev[lang], [key]: v } }));

  const setStep = (lang: Lang, i: number, part: keyof StepDraft, v: string) =>
    setSteps((prev) => ({
      ...prev,
      [lang]: prev[lang].map((s, j) => (j === i ? { ...s, [part]: v } : s)),
    }));

  const setKit = (i: number, patch: Partial<KitDraft>) =>
    setKits((prev) => prev.map((k, j) => (j === i ? { ...k, ...patch } : k)));

  /* ------------------------- збірка payload при збереженні ------------------------ */

  const buildData = (): Record<string, unknown> => {
    const data: Record<string, unknown> = {};
    const imageFields = def.fields.filter((f) => f.type === "image");
    const bg = imageFields.length ? bgImage.trim() : "";

    for (const lang of ["uk", "en"] as Lang[]) {
      if (ARRAY_SECTIONS.has(def.key)) {
        // ticker/stats: data.uk = ["фраза1", ...] — верхньо-рівневий масив
        const listField = def.fields.find((f) => f.type === "list");
        const lines = listField ? splitLines(values[lang][listField.key] ?? "") : [];
        if (lines.length > 0) data[lang] = lines;
        continue;
      }
      const obj: Record<string, unknown> = {};
      for (const f of def.fields) {
        if (f.type === "image") continue;
        const v = (values[lang][f.key] ?? "").trim();
        if (!v) continue; // порожнє поле → не пишемо → дефолт
        obj[f.key] = f.type === "list" ? splitLines(v) : v;
      }
      if (def.special === "steps3") {
        const drafts = steps[lang];
        const touched = drafts.some((s) => s.title.trim() || s.text.trim());
        if (touched) {
          obj.steps = drafts.map((s, i) => ({
            title: s.title.trim() || stepDefault(lang, i, "title"),
            text: s.text.trim() || stepDefault(lang, i, "text"),
          }));
        }
      }
      if (bg) obj.bgImage = bg; // одне значення → обидві мови
      if (Object.keys(obj).length > 0) data[lang] = obj;
    }

    if (def.special === "kits") {
      const num = (v: string, fallback: number) => {
        const n = Number(v.trim());
        return v.trim() !== "" && !Number.isNaN(n) ? n : fallback; // порожнє → не міняти
      };
      data.kits = kits.map((k, i) => {
        const base = KITS[i];
        const itemsUk = splitLines(k.itemsUk);
        const itemsEn = splitLines(k.itemsEn);
        const count = Math.max(itemsUk.length, itemsEn.length);
        return {
          id: k.id,
          name: {
            uk: k.nameUk.trim() || base.name.uk,
            en: k.nameEn.trim() || base.name.en,
          },
          tagline: {
            uk: k.taglineUk.trim() || base.tagline.uk,
            en: k.taglineEn.trim() || base.tagline.en,
          },
          items: Array.from({ length: count }, (_, j) => ({
            uk: itemsUk[j] ?? "",
            en: itemsEn[j] ?? "",
            productId: `item-${j + 1}`,
          })),
          price: num(k.price, base.price),
          oldPrice: num(k.oldPrice, base.oldPrice),
          kcal: num(k.kcal, base.kcal),
          accent: k.accent || base.accent,
        };
      });
    }

    return data;
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        key: def.key,
        data: buildData(),
        visible: row.visible,
      };
      const updated = await apiSend<ContentRow>("/api/admin/content", "PUT", payload);
      toast.success(`Секцію «${def.label}» збережено`);
      onSaved(updated);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async () => {
    setSaving(true);
    try {
      const updated = await apiSend<ContentRow>("/api/admin/content", "PUT", {
        key: def.key,
        data: {},
        visible: row.visible,
      });
      toast.success(`Секцію «${def.label}» скинуто до дефолту`);
      onSaved(updated);
    } catch (e) {
      toast.error(errText(e));
    } finally {
      setSaving(false);
    }
  };

  /* --------------------------------- рендер -------------------------------- */

  const renderField = (lang: Lang, f: FieldDef) => {
    if (f.type === "image") return null;
    const id = `f-${lang}-${f.key}`;
    const value = values[lang][f.key] ?? "";
    const placeholder = fieldDefault(lang, def.key, f);
    return (
      <div key={f.key} className="space-y-1.5">
        <Label htmlFor={id}>{f.label}</Label>
        {f.type === "text" ? (
          <Input
            id={id}
            value={value}
            onChange={(e) => setVal(lang, f.key, e.target.value)}
            placeholder={placeholder}
          />
        ) : (
          <Textarea
            id={id}
            rows={f.type === "list" ? 5 : 3}
            value={value}
            onChange={(e) => setVal(lang, f.key, e.target.value)}
            placeholder={placeholder}
          />
        )}
        <p className="text-[11px] text-muted-foreground">
          {f.hint ??
            (f.type === "list"
              ? "Один пункт = один рядок. Порожньо = дефолтні значення."
              : "Порожньо = дефолтне значення." )}
        </p>
      </div>
    );
  };

  const imageFields = def.fields.filter((f) => f.type === "image");

  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-accent-strong" />
              {def.label}
            </CardTitle>
            <CardDescription className="mt-1">{def.desc}</CardDescription>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2">
            <Switch
              id="sec-visible"
              checked={row.visible}
              onCheckedChange={(v) => onToggleVisible(row, v)}
              aria-label="Показувати секцію на сайті"
            />
            <Label htmlFor="sec-visible" className="cursor-pointer text-xs">
              Секція видима
            </Label>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <Tabs
          value={langTab}
          onValueChange={(v) => setLangTab(v as Lang)}
          className="gap-4"
        >
          <TabsList className="grid w-full max-w-xs grid-cols-2">
            <TabsTrigger value="uk">Українська</TabsTrigger>
            <TabsTrigger value="en">English</TabsTrigger>
          </TabsList>

          {(["uk", "en"] as Lang[]).map((lang) => (
            <TabsContent key={lang} value={lang} className="mt-0 space-y-4">
              {def.fields.filter((f) => f.type !== "image").map((f) => renderField(lang, f))}

              {def.special === "steps3" && (
                <div className="space-y-4 rounded-2xl border border-border/60 p-4">
                  <p className="text-sm font-semibold">Кроки приготування</p>
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-3 rounded-xl bg-muted/40 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-accent-strong">
                        Крок {i + 1}
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor={`step-${lang}-${i}-title`}>
                          Крок {i + 1} — заголовок
                        </Label>
                        <Input
                          id={`step-${lang}-${i}-title`}
                          value={steps[lang][i]?.title ?? ""}
                          onChange={(e) => setStep(lang, i, "title", e.target.value)}
                          placeholder={stepDefault(lang, i, "title")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor={`step-${lang}-${i}-text`}>
                          Крок {i + 1} — текст
                        </Label>
                        <Textarea
                          id={`step-${lang}-${i}-text`}
                          rows={2}
                          value={steps[lang][i]?.text ?? ""}
                          onChange={(e) => setStep(lang, i, "text", e.target.value)}
                          placeholder={stepDefault(lang, i, "text")}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {imageFields.length > 0 && (
          <div className="space-y-1.5 rounded-2xl border border-border/60 p-4">
            {imageFields.map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label htmlFor={`img-${f.key}`}>
                  {f.label}{" "}
                  <span className="text-[11px] font-normal text-muted-foreground">
                    (спільне для UK і EN)
                  </span>
                </Label>
                <ImageInput
                  id={`img-${f.key}`}
                  value={bgImage}
                  onChange={setBgImage}
                />
                {f.hint && (
                  <p className="text-[11px] text-muted-foreground">{f.hint}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {def.special === "kits" && (
          <div className="space-y-4">
            <p className="text-sm font-semibold">Комплекти (3 шт.)</p>
            {kits.map((k, i) => (
              <div key={k.id} className="space-y-4 rounded-2xl border border-border/60 p-4">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "h-6 w-12 shrink-0 rounded-full bg-gradient-to-r shadow-sm",
                      k.accent
                    )}
                  />
                  <p className="text-sm font-bold">{k.id}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-nameUk`}>Назва (UK)</Label>
                    <Input
                      id={`kit-${i}-nameUk`}
                      value={k.nameUk}
                      onChange={(e) => setKit(i, { nameUk: e.target.value })}
                      placeholder={KITS[i].name.uk}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-nameEn`}>Назва (EN)</Label>
                    <Input
                      id={`kit-${i}-nameEn`}
                      value={k.nameEn}
                      onChange={(e) => setKit(i, { nameEn: e.target.value })}
                      placeholder={KITS[i].name.en}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-tagUk`}>Слоган (UK)</Label>
                    <Input
                      id={`kit-${i}-tagUk`}
                      value={k.taglineUk}
                      onChange={(e) => setKit(i, { taglineUk: e.target.value })}
                      placeholder={KITS[i].tagline.uk}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-tagEn`}>Слоган (EN)</Label>
                    <Input
                      id={`kit-${i}-tagEn`}
                      value={k.taglineEn}
                      onChange={(e) => setKit(i, { taglineEn: e.target.value })}
                      placeholder={KITS[i].tagline.en}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-itemsUk`}>Позиції (UK)</Label>
                    <Textarea
                      id={`kit-${i}-itemsUk`}
                      rows={5}
                      value={k.itemsUk}
                      onChange={(e) => setKit(i, { itemsUk: e.target.value })}
                      placeholder={KITS[i].items.map((it) => it.uk).join("\n")}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Одна позиція = один рядок
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-itemsEn`}>Позиції (EN)</Label>
                    <Textarea
                      id={`kit-${i}-itemsEn`}
                      rows={5}
                      value={k.itemsEn}
                      onChange={(e) => setKit(i, { itemsEn: e.target.value })}
                      placeholder={KITS[i].items.map((it) => it.en).join("\n")}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Порядок рядків відповідає UK
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-price`}>Ціна, грн</Label>
                    <Input
                      id={`kit-${i}-price`}
                      type="number"
                      min="0"
                      value={k.price}
                      onChange={(e) => setKit(i, { price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-oldPrice`}>Стара ціна</Label>
                    <Input
                      id={`kit-${i}-oldPrice`}
                      type="number"
                      min="0"
                      value={k.oldPrice}
                      onChange={(e) => setKit(i, { oldPrice: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`kit-${i}-kcal`}>ккал</Label>
                    <Input
                      id={`kit-${i}-kcal`}
                      type="number"
                      min="0"
                      value={k.kcal}
                      onChange={(e) => setKit(i, { kcal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Акцент</Label>
                    <Select
                      value={k.accent}
                      onValueChange={(v) => setKit(i, { accent: v })}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Градієнт" />
                      </SelectTrigger>
                      <SelectContent>
                        {ACCENTS.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            <span className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "inline-block h-3 w-6 rounded-full bg-gradient-to-r",
                                  a.value
                                )}
                              />
                              {a.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  Порожні ціни/назви не змінюють дефолтні значення комплекту.
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
          <p className="mr-auto hidden text-xs text-muted-foreground sm:block">
            Порожні поля = залишити дефолт
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={saving || Object.keys(row.data).length === 0}>
                <RotateCcw className="size-4" />
                Скинути
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Скинути секцію до дефолту?</AlertDialogTitle>
                <AlertDialogDescription>
                  Усі збережені зміни секції «{def.label}» буде видалено — на сайті знову з’являться стандартні тексти.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Скасувати</AlertDialogCancel>
                <AlertDialogAction onClick={() => void resetToDefault()}>
                  Так, скинути
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={() => void save()} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Зберегти секцію
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------- сторінка -------------------------------- */

export default function AdminContentPage() {
  const [rows, setRows] = useState<ContentRow[] | null>(null);
  const [selectedKey, setSelectedKey] = useState<string>(SECTION_DEFS[0].key);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<ContentRow[]>("/api/admin/content");
        setRows(data);
      } catch (e) {
        setRows([]);
        toast.error(errText(e));
      }
    })();
  }, []);

  const rowFor = (key: string): ContentRow =>
    rows?.find((r) => r.key === key) ?? { key, data: {}, visible: true };

  const onSaved = (updated: ContentRow) =>
    setRows((prev) => {
      const list = prev ?? [];
      const idx = list.findIndex((r) => r.key === updated.key);
      if (idx === -1) return [...list, updated];
      const next = [...list];
      next[idx] = { ...next[idx], ...updated };
      return next;
    });

  const toggleVisible = async (row: ContentRow, v: boolean) => {
    try {
      const updated = await apiSend<ContentRow>("/api/admin/content", "PUT", {
        key: row.key,
        data: row.data,
        visible: v,
      });
      onSaved(updated);
      toast.success(
        v
          ? `Секцію «${SECTION_DEFS.find((s) => s.key === row.key)?.label ?? row.key}» показано`
          : `Секцію «${SECTION_DEFS.find((s) => s.key === row.key)?.label ?? row.key}» приховано`
      );
    } catch (e) {
      toast.error(errText(e));
    }
  };

  const def = SECTION_DEFS.find((s) => s.key === selectedKey) ?? SECTION_DEFS[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            Контент секцій
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Тексти головної сторінки: оберіть секцію та відредагуйте
          </p>
        </div>
        <p className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-accent-strong">
          <Info className="size-4 shrink-0" />
          Зміни зʼявляються на сайті одразу (Ctrl+Shift+R)
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[300px_1fr]">
        {/* список секцій */}
        <Card className="rounded-2xl lg:sticky lg:top-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Секції сайту</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 p-2">
            {rows === null
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-xl" />
                ))
              : SECTION_DEFS.map((s) => {
                  const r = rowFor(s.key);
                  const active = s.key === selectedKey;
                  return (
                    <div
                      key={s.key}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedKey(s.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") setSelectedKey(s.key);
                      }}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                        active
                          ? "bg-amber-500/15 text-foreground ring-1 ring-amber-500/40"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.label}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {s.desc}
                        </p>
                      </div>
                      <span onClick={(e) => e.stopPropagation()}>
                        <Switch
                          checked={r.visible}
                          onCheckedChange={(v) => void toggleVisible(r, v)}
                          aria-label={`Видимість секції ${s.label}`}
                        />
                      </span>
                    </div>
                  );
                })}
          </CardContent>
        </Card>

        {/* редактор */}
        {rows === null ? (
          <Card className="rounded-2xl">
            <CardContent className="space-y-4 py-8">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full max-w-xs" />
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </CardContent>
          </Card>
        ) : (
          <SectionEditor
            key={`${def.key}:${rowFor(def.key).updatedAt ?? ""}`}
            def={def}
            row={rowFor(def.key)}
            onSaved={onSaved}
            onToggleVisible={(r, v) => void toggleVisible(r, v)}
          />
        )}
      </div>

      {rows !== null && rows.length === 0 && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center gap-2 py-8 text-center">
            <MonitorX className="size-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              У базі ще немає збережених секцій — усі значення підсвічені як
              дефолтні плейсхолдери. Збережіть секцію, щоб створити override.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
