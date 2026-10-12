"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useLocale } from "next-intl";
import { mergeWishlistAction, toggleWishlistAction } from "@/app/actions/wishlist";

export type CartLine = { variantId: string; quantity: number };
export type CartDetail = {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  colorName: string;
  size: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  stock: number;
  available: boolean;
};

type Toast = { id: number; message: string; action?: { label: string; href?: string; onClick?: () => void } };

type StoreContext = {
  // cart
  lines: CartLine[];
  details: Record<string, CartDetail>;
  detailsLoaded: boolean;
  count: number;
  subtotal: number;
  addItem: (variantId: string, quantity: number, stock: number) => "added" | "limited" | "none";
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  // wishlist
  wishlist: string[];
  isWished: (productId: string) => boolean;
  toggleWish: (productId: string) => Promise<boolean>;
  // ui
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  quickView: string | null;
  setQuickView: (slug: string | null) => void;
  toasts: Toast[];
  toast: (message: string, action?: Toast["action"]) => void;
  dismissToast: (id: number) => void;
  signedIn: boolean;
};

const Ctx = createContext<StoreContext | null>(null);

const CART_KEY = "celestia_cart_v1";
const CODE_KEY = "celestia_discount_v1";
const WISH_KEY = "celestia_wishlist_v1";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable (private mode) — state stays in memory */
  }
}

export function StoreProvider({
  children,
  signedIn,
  initialWishlist,
}: {
  children: ReactNode;
  signedIn: boolean;
  initialWishlist: string[];
}) {
  const locale = useLocale();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [details, setDetails] = useState<Record<string, CartDetail>>({});
  const [detailsLoaded, setDetailsLoaded] = useState(false);
  const [discountCode, setDiscountCodeState] = useState("");
  const [wishlist, setWishlist] = useState<string[]>(initialWishlist);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickView, setQuickView] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  // Restore persisted state after mount (avoids hydration mismatches).
  useEffect(() => {
    setLines(read<CartLine[]>(CART_KEY, []).filter((l) => l && typeof l.variantId === "string" && l.quantity > 0));
    setDiscountCodeState(read<string>(CODE_KEY, ""));
    if (!signedIn) setWishlist(read<string[]>(WISH_KEY, []));
    setHydrated(true);
  }, [signedIn]);

  // After sign-in, fold the guest wishlist into the account.
  useEffect(() => {
    if (!signedIn) return;
    const local = read<string[]>(WISH_KEY, []);
    if (!local.length) {
      setWishlist(initialWishlist);
      return;
    }
    mergeWishlistAction(local).then((merged) => {
      setWishlist(merged);
      write(WISH_KEY, []);
    });
  }, [signedIn, initialWishlist]);

  // Keep the bag in sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_KEY) setLines(read<CartLine[]>(CART_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) write(CART_KEY, lines);
  }, [lines, hydrated]);

  // Load current names, prices and stock for the bag from the server.
  const idsKey = lines.map((l) => l.variantId).sort().join(",");
  useEffect(() => {
    if (!hydrated) return;
    if (!idsKey) {
      setDetails({});
      setDetailsLoaded(true);
      return;
    }
    let cancelled = false;
    fetch(`/api/cart?locale=${locale}&ids=${encodeURIComponent(idsKey)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { items: CartDetail[] }) => {
        if (cancelled) return;
        setDetails(Object.fromEntries(data.items.map((d) => [d.variantId, d])));
        setDetailsLoaded(true);
      })
      .catch(() => !cancelled && setDetailsLoaded(true));
    return () => {
      cancelled = true;
    };
  }, [idsKey, locale, hydrated]);

  const toast = useCallback((message: string, action?: Toast["action"]) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, action }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const addItem = useCallback(
    (variantId: string, quantity: number, stock: number): "added" | "limited" | "none" => {
      const current = lines.find((l) => l.variantId === variantId)?.quantity ?? 0;
      const target = Math.min(current + quantity, stock);
      if (target <= current) return "none";
      setLines((prev) => {
        const rest = prev.filter((l) => l.variantId !== variantId);
        return [...rest, { variantId, quantity: target }];
      });
      return target < current + quantity ? "limited" : "added";
    },
    [lines],
  );

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, quantity } : l)),
    );
  }, []);
  const removeItem = useCallback((variantId: string) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)), []);
  const clearCart = useCallback(() => {
    setLines([]);
    setDiscountCodeState("");
    write(CODE_KEY, "");
  }, []);
  const setDiscountCode = useCallback((code: string) => {
    setDiscountCodeState(code);
    write(CODE_KEY, code);
  }, []);

  const isWished = useCallback((id: string) => wishlist.includes(id), [wishlist]);
  const toggleWish = useCallback(
    async (productId: string) => {
      const willSave = !wishlist.includes(productId);
      const next = willSave ? [...wishlist, productId] : wishlist.filter((x) => x !== productId);
      setWishlist(next);
      if (signedIn) {
        const res = await toggleWishlistAction(productId);
        if (!res.ok) setWishlist(wishlist); // roll back
        return res.ok ? Boolean(res.saved) : !willSave;
      }
      write(WISH_KEY, next);
      return willSave;
    },
    [wishlist, signedIn],
  );

  const count = lines.reduce((s, l) => s + l.quantity, 0);
  const subtotal = lines.reduce((s, l) => s + (details[l.variantId]?.price ?? 0) * l.quantity, 0);

  const value = useMemo<StoreContext>(
    () => ({
      lines, details, detailsLoaded, count, subtotal, addItem, setQuantity, removeItem, clearCart,
      discountCode, setDiscountCode, wishlist, isWished, toggleWish, cartOpen, setCartOpen,
      searchOpen, setSearchOpen, quickView, setQuickView, toasts, toast, dismissToast, signedIn,
    }),
    [lines, details, detailsLoaded, count, subtotal, addItem, setQuantity, removeItem, clearCart, discountCode,
      setDiscountCode, wishlist, isWished, toggleWish, cartOpen, searchOpen, quickView, toasts, toast, dismissToast, signedIn],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
