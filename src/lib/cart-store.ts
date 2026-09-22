"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { bulkUnitPrice, type BulkTier, type CartItem } from "@/lib/products";

interface CartState {
  items: CartItem[];
  open: boolean;
  /** Оптові рівні за id товару (з БД через ProductCard/ProductView). */
  tiers: Record<string, BulkTier[]>;
  add: (item: Omit<CartItem, "qty">, tiers?: BulkTier[]) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  /** Ціна за шт. для позиції з урахуванням її кількості та оптових рівнів. */
  unitPrice: (id: string) => number;
  clear: () => void;
  setOpen: (open: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      tiers: {},
      add: (item, tiers) =>
        set((state) => {
          const nextTiers =
            tiers && tiers.length
              ? { ...state.tiers, [item.id]: tiers }
              : state.tiers;
          const base = item.basePrice ?? item.price;
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            const qty = existing.qty + 1;
            const prevBase = existing.basePrice ?? base;
            const unit = bulkUnitPrice(prevBase, nextTiers[item.id], qty);
            return {
              tiers: nextTiers,
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, qty, price: unit, basePrice: prevBase, img: i.img || item.img, name: item.name }
                  : i
              ),
            };
          }
          return {
            tiers: nextTiers,
            items: [...state.items, { ...item, basePrice: base, qty: 1 }],
          };
        }),
      remove: (id) =>
        set((state) => {
          const nextTiers = { ...state.tiers };
          delete nextTiers[id];
          return { items: state.items.filter((i) => i.id !== id), tiers: nextTiers };
        }),
      setQty: (id, qty) =>
        set((state) => {
          if (qty <= 0) {
            const nextTiers = { ...state.tiers };
            delete nextTiers[id];
            return { items: state.items.filter((i) => i.id !== id), tiers: nextTiers };
          }
          return {
            items: state.items.map((i) =>
              i.id === id
                ? { ...i, qty, price: bulkUnitPrice(i.basePrice ?? i.price, state.tiers[id], qty) }
                : i
            ),
          };
        }),
      unitPrice: (id) => {
        const s = get();
        const item = s.items.find((i) => i.id === id);
        if (!item) return 0;
        return bulkUnitPrice(item.basePrice ?? item.price, s.tiers[id], item.qty);
      },
      clear: () => set({ items: [], tiers: {} }),
      setOpen: (open) => set({ open }),
    }),
    { name: "kharchi-cart", partialize: (s) => ({ items: s.items, tiers: s.tiers }) }
  )
);

export const cartTotal = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0);

export const cartCount = (items: CartItem[]) =>
  items.reduce((sum, i) => sum + i.qty, 0);
