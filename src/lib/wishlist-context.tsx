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

import { SignInPromptModal } from "@/components/wishlist/SignInPromptModal";
import { createClient } from "@/lib/supabase/client";
import type { WishlistInsert } from "@/types/database";

interface WishlistContextType {
  /** Saved product ids, newest first. */
  ids: readonly string[];
  /** True once the initial (guest or signed-in) load has settled. */
  ready: boolean;
  /** Ids with an in-flight DB write (for subtle busy state on hearts). */
  pendingIds: ReadonlySet<string>;
  isWishlisted: (productId: string) => boolean;
  /** Toggle a product; guests trigger the sign-in prompt modal instead. */
  toggle: (product: { id: string }) => void;
  /** Remove without toggling back on if the row is already gone. */
  remove: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(
  undefined,
);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [promptOpen, setPromptOpen] = useState(false);
  const [returnTo, setReturnTo] = useState("/");

  // Refs mirror latest values for use inside stable callbacks.
  const idsRef = useRef<string[]>([]);
  const userIdRef = useRef<string | null>(null);
  const pendingRef = useRef<ReadonlySet<string>>(new Set());
  const promptOpenRef = useRef(false);

  useEffect(() => {
    idsRef.current = ids;
  }, [ids]);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  useEffect(() => {
    pendingRef.current = pendingIds;
  }, [pendingIds]);
  useEffect(() => {
    promptOpenRef.current = promptOpen;
  }, [promptOpen]);

  // Track auth identity live so hearts stay correct across sign-in/out.
  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      if (session) {
        // A signed-in user should never be staring at the guest prompt (this
        // can flash on production when the session resolves after a heart tap).
        if (promptOpenRef.current) setPromptOpen(false);
      } else {
        setPromptOpen(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load this user's saved ids whenever identity changes.
  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      idsRef.current = [];
      // Deferred to a macrotask so the effect doesn't trigger a cascading
      // synchronous render (react-hooks/set-state-in-effect).
      const readyTimer = setTimeout(() => {
        setIds([]);
        setReady(true);
      }, 0);
      return () => clearTimeout(readyTimer);
    }

    const readyTimer = setTimeout(() => {
      if (!cancelled) setReady(false);
    }, 0);
    void (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("wishlist")
          .select("product_id")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (cancelled) return;
        if (error) {
          console.warn("[wishlist] load failed:", error.message);
          idsRef.current = [];
          setIds([]);
        } else {
          // Fold in optimistic writes that are still in flight so a heart the
          // user just tapped is never clobbered by the list fetch racing the
          // insert (the row may not be visible to the SELECT yet).
          const rows = (data ?? []) as { product_id: string }[];
          const inFlight = idsRef.current.filter((id) => pendingRef.current.has(id));
          const list = Array.from(
            new Set([...rows.map((row) => row.product_id), ...inFlight]),
          );
          idsRef.current = list;
          setIds(list);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(readyTimer);
    };
  }, [userId]);

  const runWrite = useCallback(
    (productId: string, saving: boolean) => {
      const uid = userIdRef.current;
      if (!uid) return;

      setPendingIds((prev) => new Set(prev).add(productId));
      void (async () => {
        try {
          const supabase = createClient();
          // Hand-written Database types make postgrest insert generics resolve
          // to never[] — cast per the convention used across this codebase.
          const payload = {
            user_id: uid,
            product_id: productId,
          } satisfies WishlistInsert;
          const { error } = saving
            ? await supabase.from("wishlist").insert(payload as never)
            : await supabase
                .from("wishlist")
                .delete()
                .eq("user_id", uid)
                .eq("product_id", productId);

          if (error) throw new Error(error.message);
        } catch (error) {
          console.error("[wishlist] sync failed:", error);
          // Roll back the optimistic change so UI matches the database.
          setIds((prev) =>
            saving
              ? prev.filter((id) => id !== productId)
              : [productId, ...prev],
          );
        } finally {
          setPendingIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }
      })();
    },
    [],
  );

  /** Guest tap → remember where they were and ask them to sign in. */
  const promptSignIn = useCallback(() => {
    if (typeof window !== "undefined") {
      setReturnTo(window.location.pathname + window.location.search || "/");
    }
    setPromptOpen(true);
  }, []);

  const toggle = useCallback(
    (product: { id: string }) => {
      if (!userIdRef.current) {
        // Identity may still be resolving on a fresh page load (Supabase
        // restores the session asynchronously), even for signed-in users.
        // Verify authoritatively with getUser() before showing the guest
        // prompt so a logged-in user never sees the "sign in" modal.
        void (async () => {
          let resolvedUserId: string | null = null;
          try {
            const supabase = createClient();
            const { data, error } = await supabase.auth.getUser();
            if (!error && data.user) resolvedUserId = data.user.id;
          } catch {
            // Network/auth client failure — treat as guest below.
          }

          if (resolvedUserId) {
            userIdRef.current = resolvedUserId;
            setUserId(resolvedUserId); // triggers the saved-list loader
            const saving = !idsRef.current.includes(product.id);
            setIds((prev) =>
              saving
                ? [product.id, ...prev.filter((id) => id !== product.id)]
                : prev.filter((id) => id !== product.id),
            );
            runWrite(product.id, saving);
            return;
          }

          promptSignIn();
        })();
        return;
      }
      const saving = !idsRef.current.includes(product.id);
      setIds((prev) =>
        saving
          ? [product.id, ...prev.filter((id) => id !== product.id)]
          : prev.filter((id) => id !== product.id),
      );
      runWrite(product.id, saving);
    },
    [promptSignIn, runWrite],
  );

  const remove = useCallback(
    (productId: string) => {
      if (!idsRef.current.includes(productId)) return;
      setIds((prev) => prev.filter((id) => id !== productId));
      runWrite(productId, false);
    },
    [runWrite],
  );

  const isWishlisted = useCallback(
    (productId: string) => idsRef.current.includes(productId),
    [],
  );

  const value = useMemo<WishlistContextType>(
    () => ({ ids, ready, pendingIds, isWishlisted, toggle, remove }),
    [ids, ready, pendingIds, isWishlisted, toggle, remove],
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
      <SignInPromptModal
        open={promptOpen}
        returnTo={returnTo}
        onClose={() => setPromptOpen(false)}
      />
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider");
  }
  return context;
}
