"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Heart, LogIn, UserRoundPlus, X } from "lucide-react";

/**
 * Shown when a guest taps a wishlist heart. Links preserve the page the guest
 * was on (returnTo) so auth bounces them straight back after signing in.
 */
export function SignInPromptModal({
  open,
  returnTo,
  onClose,
}: {
  open: boolean;
  returnTo: string;
  onClose: () => void;
}) {
  // Escape closes — matches the drawer/modal behaviour used elsewhere.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const loginHref =
    returnTo === "/"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(returnTo)}`;
  const signupHref =
    returnTo === "/"
      ? "/signup"
      : `/signup?redirect=${encodeURIComponent(returnTo)}`;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="wishlist-signin-title"
        aria-describedby="wishlist-signin-desc"
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl dark:bg-slate-900"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="size-5" />
        </button>

        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-full bg-rose-50 dark:bg-rose-950/40"
        >
          <Heart className="size-7 fill-rose-500 text-rose-500" />
        </span>

        <h2
          id="wishlist-signin-title"
          className="mt-4 text-xl font-black text-slate-900 dark:text-white"
        >
          Save it to your wishlist
        </h2>
        <p
          id="wishlist-signin-desc"
          className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400"
        >
          Sign in to keep your favorite watches, perfumes and shoes in one place
          — across every device.
        </p>

        <div className="mt-6 space-y-2.5">
          <Link
            href={loginHref}
            prefetch={true}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-800"
          >
            <LogIn className="size-4" />
            Sign in to continue
          </Link>
          <Link
            href={signupHref}
            prefetch={true}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-600 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-500 dark:hover:text-emerald-400"
          >
            <UserRoundPlus className="size-4" />
            Create account
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl px-5 py-2 text-xs font-semibold uppercase tracking-widest text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-300"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
