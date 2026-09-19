"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MessageSquarePlus, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useLang } from "@/components/kharchi/LangProvider";
import SectionTitle from "./SectionTitle";

/** Відгук про товар (контракт GET/POST /api/reviews) */
export interface UiProductReview {
  id: number;
  author: string;
  rating: number;
  text: string;
  createdAt: string; // ISO
}

const fmtDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
};

function Stars({ value, size = "size-4" }: { value: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${Math.round(value)} / 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className={`${size} ${
            i < Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
          }`}
        />
      ))}
    </div>
  );
}

/** Інтерактивні зірки 1–5 з hover-підсвіткою */
function StarPicker({
  value,
  onChange,
  ariaLabel,
}: {
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          aria-label={`${v} / 5`}
          onMouseEnter={() => setHover(v)}
          onMouseLeave={() => setHover(0)}
          onFocus={() => setHover(v)}
          onBlur={() => setHover(0)}
          onClick={() => onChange(v)}
          className="rounded-md p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60"
        >
          <Star
            className={`size-7 transition-colors ${
              v <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewSkeleton() {
  return (
    <div className="card-glass rounded-3xl p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="mt-4 h-14 w-full" />
      <Skeleton className="mt-4 h-10 w-40" />
    </div>
  );
}

/** Секція «Відгуки»: зведення + список + форма з POST /api/reviews */
export default function ProductReviews({
  slug,
  productRating,
  productReviewsCount,
  initialReviews,
}: {
  slug: string;
  productRating: number;
  productReviewsCount: number;
  initialReviews: UiProductReview[];
}) {
  const { t } = useLang();
  const [reviews, setReviews] = useState<UiProductReview[]>(initialReviews);
  const [loading, setLoading] = useState(initialReviews.length === 0);
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [thanks, setThanks] = useState(false);

  // Клієнтський рефреш свіжих відгуків; API може бути недоступним —
  // тоді граційно лишаємо server-дані (setState лише після await).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const json: unknown = await res.json();
        const list = (json as { data?: UiProductReview[] }).data;
        if (!cancelled && Array.isArray(list)) setReviews(list);
      } catch {
        // API ще не готовий — фолбек на дані з сервера
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const avg = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : productRating;
  const count = reviews.length || productReviewsCount;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t.productPage.errName);
      return;
    }
    if (!rating) {
      toast.error(t.productPage.errRating);
      return;
    }
    if (text.trim().length < 5) {
      toast.error(t.productPage.errText);
      return;
    }
    setSending(true);
    let created: UiProductReview | null = null;
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, author: name.trim(), rating, text: text.trim() }),
      });
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json: unknown = await res.json();
      created = (json as { data?: UiProductReview }).data ?? null;

      setThanks(true);
      setName("");
      setRating(0);
      setText("");
      toast.success(t.productPage.thanks, { icon: "⭐" });

      // рефреш списку; якщо refetch не вдався — додаємо новий локально
      try {
        const fresh = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`);
        if (fresh.ok) {
          const fj: unknown = await fresh.json();
          const list = (fj as { data?: UiProductReview[] }).data;
          if (Array.isArray(list)) setReviews(list);
          else if (created) setReviews((prev) => [created as UiProductReview, ...prev]);
        } else if (created) {
          setReviews((prev) => [created as UiProductReview, ...prev]);
        }
      } catch {
        if (created) setReviews((prev) => [created as UiProductReview, ...prev]);
      }
    } catch {
      toast.error(t.productPage.errConnection);
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="reviews" className="scroll-mt-24 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionTitle title={t.productPage.reviews} />

        {/* Зведення */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.08 }}
          className="card-glass mx-auto mt-8 flex max-w-md flex-col items-center gap-2 rounded-3xl px-8 py-7"
        >
          <span className="text-gradient-flame font-display text-6xl font-extrabold">
            {avg.toFixed(1)}
          </span>
          <Stars value={avg} size="size-5" />
          <span className="text-sm text-muted-foreground">
            {count} {t.productPage.reviewsCount} · {t.productPage.avgRating}
          </span>
        </motion.div>

        {/* Список відгуків */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-4 md:grid-cols-2">
          {loading ? (
            <>
              <ReviewSkeleton />
              <ReviewSkeleton />
            </>
          ) : reviews.length === 0 ? (
            <div className="card-glass col-span-full rounded-3xl p-10 text-center">
              <span className="text-4xl" aria-hidden>
                🍲
              </span>
              <p className="font-display mt-3 text-lg font-semibold">
                {t.productPage.beFirst}
              </p>
            </div>
          ) : (
            reviews.map((r, i) => (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.55, delay: (i % 4) * 0.07 }}
                className="card-glass rounded-3xl p-6 transition-colors duration-300 hover:border-amber-500/30"
              >
                <div className="flex items-center justify-between gap-3">
                  <Stars value={r.rating} />
                  <time dateTime={r.createdAt} className="text-xs text-muted-foreground/70">
                    {fmtDate(r.createdAt)}
                  </time>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground/85">«{r.text}»</p>
                <div className="mt-4 flex items-center gap-3">
                  <span
                    aria-hidden
                    className="grid size-10 place-items-center rounded-full border border-amber-500/30 bg-gradient-to-br from-amber-500/30 to-orange-600/30 font-display font-bold text-accent-strong"
                  >
                    {r.author.trim()[0]?.toUpperCase() ?? "?"}
                  </span>
                  <span className="text-sm font-semibold">{r.author}</span>
                </div>
              </motion.article>
            ))
          )}
        </div>

        {/* Форма «Залишити відгук» */}
        <motion.form
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          onSubmit={submit}
          noValidate
          className="card-glass mx-auto mt-12 max-w-2xl rounded-3xl p-6 sm:p-8"
        >
          <h3 className="font-display flex items-center gap-2 text-xl font-bold">
            <MessageSquarePlus className="size-5 text-amber-500" aria-hidden />
            {t.productPage.formTitle}
          </h3>

          {thanks && (
            <div
              role="status"
              className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-500"
            >
              🎉 {t.productPage.thanks}
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              {t.productPage.formName}
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.productPage.formNamePh}
                maxLength={40}
                autoComplete="name"
              />
            </label>
            <div className="grid gap-2 text-sm font-medium">
              {t.productPage.formRating}
              <StarPicker
                value={rating}
                onChange={setRating}
                ariaLabel={t.productPage.formRating}
              />
            </div>
          </div>

          <label className="mt-4 grid gap-2 text-sm font-medium">
            {t.productPage.formText}
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.productPage.formTextPh}
              rows={4}
              maxLength={500}
            />
          </label>

          <Button
            type="submit"
            disabled={sending}
            className="mt-5 h-12 w-full rounded-full bg-gradient-to-r from-amber-500 to-orange-600 font-bold text-stone-950 shadow-lg shadow-orange-600/30 hover:from-amber-400 hover:to-orange-500 sm:w-auto sm:px-8"
          >
            {sending ? t.productPage.sending : t.productPage.submit}
          </Button>
        </motion.form>
      </div>
    </section>
  );
}
