"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Minus, Plus, ShoppingBag, Trash2, Loader2, PartyPopper } from "lucide-react";
import { useCart, cartTotal } from "@/lib/cart-store";
import { toast } from "sonner";
import { money } from "@/lib/i18n";
import { useLang } from "./LangProvider";

type Step = "cart" | "checkout" | "success";

export default function CartDrawer() {
  const { items, open, setOpen, setQty, remove, clear } = useCart();
  const { t, lang } = useLang();
  const [step, setStep] = useState<Step>("cart");
  const [submitting, setSubmitting] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    delivery: "",
    city: "",
    address: "",
    comment: "",
  });

  const total = useMemo(() => cartTotal(items), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.qty, 0), [items]);

  const closeAll = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setTimeout(() => {
        if (step === "success") {
          clear();
          setStep("cart");
          setOrderId(null);
          setForm({ name: "", phone: "", delivery: "", city: "", address: "", comment: "" });
        }
      }, 300);
    }
  };

  const submitOrder = async () => {
    if (!form.name.trim() || form.name.trim().length < 2) {
      toast.error(t.cart.errName);
      return;
    }
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 9) {
      toast.error(t.cart.errPhone);
      return;
    }
    if (!form.delivery) {
      toast.error(t.cart.errDelivery);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          delivery: form.delivery,
          city: form.city || null,
          address: form.address || null,
          comment: form.comment || null,
          items: items.map((i) => ({
            id: i.id,
            name: i.name,
            price: i.price,
            qty: i.qty,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.error || t.cart.errGeneric);
        return;
      }
      setOrderId(data.orderId);
      setStep("success");
    } catch {
      toast.error(t.cart.errConnection);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={closeAll}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-card border-border p-0 flex flex-col"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border/60">
          <SheetTitle className="font-display flex items-center gap-2.5 text-lg">
            <ShoppingBag className="size-5 text-amber-500" />
            {step === "success" ? t.cart.success : t.cart.title}
            {step !== "success" && count > 0 && (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-xs text-accent-strong">
                {count} {t.cart.count}
              </span>
            )}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground text-sm">
            {step === "cart" && t.cart.descCart}
            {step === "checkout" && t.cart.descCheckout}
            {step === "success" && t.cart.descSuccess}
          </SheetDescription>
        </SheetHeader>

        {/* ---------- CART ---------- */}
        {step === "cart" && (
          <>
            {items.length === 0 ? (
              <div className="flex-1 grid place-items-center px-6">
                <div className="text-center">
                  <div className="mx-auto grid place-items-center size-20 rounded-full bg-muted/50 border border-border">
                    <ShoppingBag className="size-9 text-muted-foreground/70" />
                  </div>
                  <p className="mt-5 font-display font-semibold">{t.cart.empty}</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {t.cart.emptyHint}
                  </p>
                  <Button
                    onClick={() => setOpen(false)}
                    className="mt-6 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-semibold hover:from-amber-400 hover:to-orange-500"
                  >
                    {t.cart.browse}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {items.map((i) => (
                      <motion.div
                        key={i.id}
                        layout
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.25 }}
                        className="card-glass flex gap-3 rounded-2xl p-3"
                      >
                        <img
                          src={i.img}
                          alt={i.name}
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[13px] font-medium leading-snug line-clamp-2">
                              {i.name}
                            </p>
                            <button
                              aria-label={t.cart.remove.replace("{name}", i.name)}
                              onClick={() => remove(i.id)}
                              className="text-muted-foreground/70 hover:text-destructive transition-colors"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-1 py-1">
                              <button
                                aria-label={t.cart.minus}
                                onClick={() => setQty(i.id, i.qty - 1)}
                                className="grid place-items-center size-6 rounded-full hover:bg-accent transition-colors"
                              >
                                <Minus className="size-3.5" />
                              </button>
                              <span className="min-w-5 text-center text-sm font-semibold">
                                {i.qty}
                              </span>
                              <button
                                aria-label={t.cart.plus}
                                onClick={() => setQty(i.id, i.qty + 1)}
                                className="grid place-items-center size-6 rounded-full hover:bg-accent transition-colors"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            </div>
                            <span className="font-display text-sm font-bold text-accent-strong">
                              {money(i.price * i.qty, lang)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="border-t border-border bg-card/90 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t.cart.total}</span>
                    <span className="font-display text-2xl font-black text-gradient-flame">
                      {money(total, lang)}
                    </span>
                  </div>
                  <Button
                    onClick={() => setStep("checkout")}
                    className="w-full h-13 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 text-base font-bold shadow-lg shadow-orange-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {t.cart.checkout}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground/70">
                    {t.cart.note}
                  </p>
                </div>
              </>
            )}
          </>
        )}

        {/* ---------- CHECKOUT ---------- */}
        {step === "checkout" && (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="c-name">{t.cart.name}</Label>
                <Input
                  id="c-name"
                  placeholder={t.cart.name.replace(" *", "")}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="bg-muted/40 border-input h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-phone">{t.cart.phone}</Label>
                <Input
                  id="c-phone"
                  type="tel"
                  placeholder="+380 __ ___ __ __"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="bg-muted/40 border-input h-11 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>{t.cart.delivery}</Label>
                <Select
                  value={form.delivery}
                  onValueChange={(v) => setForm({ ...form, delivery: v })}
                >
                  <SelectTrigger className="w-full bg-muted/40 border-input h-11 rounded-xl">
                    <SelectValue placeholder={t.cart.deliveryPlaceholder} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {t.cart.deliveryOptions.map((d) => (
                      <SelectItem key={d} value={d} className="focus:bg-accent">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.delivery !== t.cart.deliveryOptions[2] && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="c-city">{t.cart.city}</Label>
                    <Input
                      id="c-city"
                      placeholder={t.cart.cityPlaceholder}
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="bg-muted/40 border-input h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="c-address">
                      {form.delivery === t.cart.deliveryOptions[3]
                        ? t.cart.address
                        : t.cart.branch}
                    </Label>
                    <Input
                      id="c-address"
                      placeholder={
                        form.delivery === t.cart.deliveryOptions[3]
                          ? "вул. Хрещатик, 1"
                          : "№1"
                      }
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="bg-muted/40 border-input h-11 rounded-xl"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="c-comment">{t.cart.comment}</Label>
                <Textarea
                  id="c-comment"
                  placeholder={t.cart.commentPlaceholder}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="bg-muted/40 border-input rounded-xl min-h-20"
                />
              </div>
            </div>

            <div className="border-t border-border bg-card/90 p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {count} {t.cart.count} — {t.cart.total.toLowerCase()}
                </span>
                <span className="font-display text-xl font-black text-gradient-flame">
                  {money(total, lang)}
                </span>
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep("cart")}
                  className="h-13 rounded-2xl border-border bg-muted/40 hover:bg-accent"
                >
                  {t.cart.back}
                </Button>
                <Button
                  onClick={submitOrder}
                  disabled={submitting}
                  className="h-13 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-stone-950 text-base font-bold shadow-lg shadow-orange-600/30 transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 size-5 animate-spin" />
                      {t.cart.sending}
                    </>
                  ) : (
                    t.cart.confirm
                  )}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ---------- SUCCESS ---------- */}
        {step === "success" && (
          <div className="flex-1 grid place-items-center px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="text-center"
            >
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 14 }}
                className="mx-auto grid place-items-center size-24 rounded-full bg-gradient-to-br from-amber-500/25 to-orange-600/25 border border-amber-500/40 glow-warm"
              >
                <PartyPopper className="size-11 text-amber-400" />
              </motion.div>
              <h3 className="font-display mt-6 text-2xl font-bold">
                {t.cart.successTitle}
              </h3>
              {orderId && (
                <p className="mt-2 text-sm text-muted-foreground">
                  {t.cart.orderNo}{" "}
                  <span className="font-mono text-accent-strong">{orderId.slice(-8).toUpperCase()}</span>
                </p>
              )}
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {t.cart.successText}
              </p>
              <Button
                onClick={() => closeAll(false)}
                className="mt-7 h-12 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-stone-950 font-bold hover:from-amber-400 hover:to-orange-500 px-8"
              >
                {t.cart.thanks}
              </Button>
            </motion.div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
