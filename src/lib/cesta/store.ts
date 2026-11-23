import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Tab = "home" | "cats" | "favs" | "cart" | "account";
export type AddressId = "casa" | "trabalho";

export type Order = {
  id: string;
  total: number;
  slot: string;
  when: "hoje" | "amanha";
  addressId: AddressId;
  pay: string;
  at: number;
  count: number;
};

type State = {
  seen: boolean;
  tab: Tab;
  cart: Record<string, number>;
  favs: string[];
  addressId: AddressId;
  cat: string;
  orders: Order[];
  markSeen: () => void;
  setTab: (tab: Tab) => void;
  setCat: (cat: string) => void;
  setAddress: (id: AddressId) => void;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  toggleFav: (id: string) => void;
  clear: () => void;
  place: (order: Omit<Order, "id" | "at">) => void;
  resetIntro: () => void;
};

export const useCesta = create<State>()(
  persist(
    (set) => ({
      seen: false,
      tab: "home",
      cart: {},
      favs: [],
      addressId: "casa",
      cat: "todas",
      orders: [],
      markSeen: () => set({ seen: true }),
      setTab: (tab) => set({ tab }),
      setCat: (cat) => set({ cat, tab: "home" }),
      setAddress: (addressId) => set({ addressId }),
      add: (id) =>
        set((s) => ({ cart: { ...s.cart, [id]: (s.cart[id] ?? 0) + 1 } })),
      setQty: (id, qty) =>
        set((s) => {
          const cart = { ...s.cart };
          if (qty <= 0) delete cart[id];
          else cart[id] = qty;
          return { cart };
        }),
      toggleFav: (id) =>
        set((s) => ({
          favs: s.favs.includes(id) ? s.favs.filter((x) => x !== id) : [...s.favs, id],
        })),
      clear: () => set({ cart: {} }),
      place: (order) =>
        set((s) => ({
          cart: {},
          orders: [{ ...order, id: `p${Date.now()}`, at: Date.now() }, ...s.orders].slice(0, 8),
        })),
      resetIntro: () => set({ seen: false }),
    }),
    {
      name: "cesta-v1",
      skipHydration: true,
      partialize: (s) => ({
        seen: s.seen,
        cart: s.cart,
        favs: s.favs,
        addressId: s.addressId,
        orders: s.orders,
      }),
    },
  ),
);
