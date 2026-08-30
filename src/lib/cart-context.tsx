"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";
import { clearUserCart, getUserCart, syncCart } from "@/lib/cart-actions";

export interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image_url?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_KEY = "cart_guest";

/** Read the unsynced guest cart from localStorage (safe during SSR). */
function readGuestCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(GUEST_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as CartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Remove the guest cart plus any legacy per-user cart caches. */
function wipeCartStores() {
  if (typeof window === "undefined") return;
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith("cart_"))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // Storage can be unavailable (private mode) — nothing to wipe.
  }
}

/** Merge cart lists, summing quantities for duplicate products. */
function mergeLines(...lists: CartItem[][]): CartItem[] {
  const merged: CartItem[] = [];
  for (const list of lists) {
    for (const item of list) {
      const existing = merged.find((entry) => entry.productId === item.productId);
      if (existing) existing.quantity += item.quantity;
      else merged.push({ ...item });
    }
  }
  return merged;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Refs mirror the latest values so queued DB writes can detect identity
  // changes (sign-out / sign-in as another user) before they execute.
  const itemsRef = useRef<CartItem[]>([]);
  const userIdRef = useRef<string | null>(null);
  const flushRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  /** Queue a single DB write; a stale write is dropped if user changes. */
  // Stable across renders (refs only) so consumers can safely list these in
  // effect dependencies without triggering re-render loops.
  const queueDbWrite = useCallback((action: () => Promise<void>) => {
    const serial = flushRef.current.catch(() => undefined);
    flushRef.current = serial.then(action);
  }, []);

  /**
   * Apply new local state and mirror it to cart_items immediately for
   * signed-in users. Signed-out guests are covered by the persist effect.
   */
  const applyItems = useCallback(
    (next: CartItem[]) => {
      itemsRef.current = next;
      setItems(next);

      const uid = userIdRef.current;
      if (!uid) return;
      const snapshot = next.map((item) => ({ ...item }));

      queueDbWrite(async () => {
        if (userIdRef.current !== uid) return; // stale — identity changed
        await syncCart(uid, snapshot);
      });
    },
    [queueDbWrite],
  );

  // 1. Track the auth identity; wipe cart state/stores on sign-out.
  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const resolveUser = (id: string | null) => {
      if (!cancelled) setUserId(id);
    };

    supabase.auth.getUser().then(({ data }) => {
      resolveUser(data.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      resolveUser(session?.user?.id ?? null);

      // Sign out cleanses EVERYTHING so the next user/guest starts fresh.
      if (event === "SIGNED_OUT") {
        if (!cancelled) {
          itemsRef.current = [];
          setItems([]);
          wipeCartStores();
        }
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // 2. Load the cart for the current identity: guests read localStorage,
  // signed-in users fetch the authoritative DB cart and fold in guest items.
  useEffect(() => {
    if (userId === null) {
      const guestItems = readGuestCart();
      itemsRef.current = guestItems;
      // Deferred to a macrotask so the effect doesn't trigger a cascading
      // synchronous render (react-hooks/set-state-in-effect).
      const readyTimer = setTimeout(() => {
        setItems(guestItems);
        setReady(true);
      }, 0);
      return () => clearTimeout(readyTimer);
    }

    let cancelled = false;
    const guestItems = readGuestCart();
    // Deferred to a macrotask so the effect doesn't trigger a cascading
    // synchronous render (react-hooks/set-state-in-effect).
    const readyTimer = setTimeout(() => {
      if (!cancelled) setReady(false);
    }, 0);

    (async () => {
      const dbItems = await getUserCart(userId);
      if (cancelled) return;

      const merged = mergeLines(dbItems, guestItems);
      if (cancelled) return;

      itemsRef.current = merged;
      setItems(merged);
      setReady(true);

      // Persist the merged (DB + guest) cart, then drop the guest copy.
      if (userIdRef.current === userId) {
        await syncCart(userId, merged);
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem(GUEST_KEY);
        } catch {
          // storage unavailable — stale keys get cleaned on next sign-out
        }
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(readyTimer);
    };
  }, [userId]);

  // 3. Guests keep a live mirror in localStorage (signed-in users sync DB).
  useEffect(() => {
    if (!ready || userId !== null) return;
    try {
      localStorage.setItem(GUEST_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [ready, userId, items]);

  const addItem = useCallback(
    (item: CartItem) => {
      const current = itemsRef.current;
      const existing = current.find((entry) => entry.productId === item.productId);
      const next = existing
        ? current.map((entry) =>
            entry.productId === item.productId
              ? { ...entry, quantity: entry.quantity + item.quantity }
              : entry,
          )
        : [...current, item];
      applyItems(next);
    },
    [applyItems],
  );

  const removeItem = useCallback(
    (productId: string) => {
      applyItems(itemsRef.current.filter((entry) => entry.productId !== productId));
    },
    [applyItems],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeItem(productId);
        return;
      }
      applyItems(
        itemsRef.current.map((entry) =>
          entry.productId === productId ? { ...entry, quantity } : entry,
        ),
      );
    },
    [applyItems, removeItem],
  );

  const clearCart = useCallback(() => {
    itemsRef.current = [];
    setItems([]);

    // Immediately delete every cart_items row for this user.
    const uid = userIdRef.current;
    if (!uid) return;
    queueDbWrite(async () => {
      if (userIdRef.current !== uid) return;
      await clearUserCart(uid);
    });
  }, [queueDbWrite]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  // Memoized so consumer effects depending on actions don't re-fire each render.
  const contextValue = useMemo(
    () => ({ items, addItem, removeItem, updateQuantity, clearCart, total, count }),
    [items, addItem, removeItem, updateQuantity, clearCart, total, count],
  );

  return (
    <CartContext.Provider value={contextValue}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
