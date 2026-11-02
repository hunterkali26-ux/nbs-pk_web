"use client";

import Link from "next/link";
import { useRef, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Category } from "@/types/database";

interface CategoryPillsProps {
  categories: Category[];
  activeSlug?: string;
  /** Optional subcategory chips rendered below the active category */
  subcategories?: string[];
  activeSubcategory?: string;
  onSubcategoryChange?: (sub: string | null) => void;
}

export function CategoryPills({ categories, activeSlug, subcategories, activeSubcategory, onSubcategoryChange }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  // Auto-scroll to active pill
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !activeSlug) return;
    const activeBtn = el.querySelector("[data-active=\"true\"]") as HTMLElement | null;
    if (activeBtn) {
      activeBtn.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }
  }, [activeSlug]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  return (
    <div className="space-y-3">
      {/* Category pills carousel */}
      <div className="relative">
        {/* Left fade + arrow */}
        {canScrollLeft && (
          <button type="button" onClick={() => scroll("left")} className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur transition hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900" aria-label="Scroll left">
            <ChevronLeft className="size-4 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        {/* Right fade + arrow */}
        {canScrollRight && (
          <button type="button" onClick={() => scroll("right")} className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1.5 shadow-md backdrop-blur transition hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900" aria-label="Scroll right">
            <ChevronRight className="size-4 text-slate-600 dark:text-slate-300" />
          </button>
        )}
        {/* Scrollable pills */}
        <div ref={scrollRef} className="scrollbar-hide flex gap-2 overflow-x-auto px-1 py-1" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          <Link
            href="/shop"
            data-active={!activeSlug ? "true" : "false"}
            className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              !activeSlug
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                : "border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-600 dark:hover:text-amber-400"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              data-active={activeSlug === cat.slug ? "true" : "false"}
              className={`inline-flex shrink-0 items-center rounded-full px-4 py-2 text-sm font-semibold capitalize transition-all duration-200 ${
                activeSlug === cat.slug
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/25"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-amber-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-amber-600 dark:hover:text-amber-400"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Subcategory chips */}
      {subcategories && subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSubcategoryChange?.(null)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              !activeSubcategory
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            }`}
          >
            All
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => onSubcategoryChange?.(sub)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                activeSubcategory === sub
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
