import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="relative hidden overflow-hidden bg-amber-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-32 -top-32 size-96 rounded-full border border-amber-300/20" />
          <div className="absolute -bottom-48 -left-24 size-[30rem] rounded-full border border-amber-300/15" />
          <Link href="/" className="relative text-xl font-semibold tracking-[0.25em]">
            NBS <span className="text-amber-200">pk</span>
          </Link>
          <div className="relative max-w-sm">
            <p className="mb-5 text-xs uppercase tracking-[0.3em] text-[#d4b06a]">
              Handcrafted leather since 2015
            </p>
            <p className="font-serif text-5xl leading-[1.05] text-white">
              Pure leather footwear for every step
            </p>
            <p className="mt-6 max-w-xs text-sm leading-6 text-white/65">
              Discover premium leather shoes made in Multan.
            </p>
          </div>
          <p className="relative text-xs uppercase tracking-[0.2em] text-white/40">
            Premium leather / Multan, Pakistan
          </p>
        </aside>

        <section className="flex items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-12 block text-center text-lg font-semibold tracking-[0.25em] lg:hidden">
              NBS <span className="text-amber-600">pk</span>
            </Link>
            <div className="mb-9">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-amber-700">{eyebrow}</p>
              <h1 className="font-serif text-4xl leading-tight sm:text-5xl">{title}</h1>
              <p className="mt-4 max-w-sm text-sm leading-6 text-black/55">{description}</p>
            </div>
            {children}
            <div className="mt-8 text-center text-sm text-black/55">{footer}</div>
          </div>
        </section>
      </div>
    </main>
  );
}