"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, LoaderCircle, PackageCheck, Search, X } from "lucide-react";

import { fetchSuggestions, type SearchSuggestion } from "@/app/search/actions";

const formatPKR = (value: number) => `PKR ${Number(value || 0).toLocaleString("en-PK")}`;

/**
 * Live search field with a real-time suggestions dropdown.
 *
 *  - debounced server action per keystroke (stale responses discarded)
 *  - thumbnail + title + price rows linking straight to product pages
 *  - keyboard support: ↑/↓ to highlight, Enter to open / go to results, Esc
 *  - Enter (or "See all results") navigates to /search?q=… — no page reload
 */
export function SearchBar({
  variant = "desktop",
  onClose,
}: {
  variant?: "desktop" | "mobile";
  onClose?: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [, startNav] = useTransition();
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const requestId = useRef(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false);
    setHighlighted(-1);
  }, []);

  // Mobile variant autofocuses as soon as it expands.
  useEffect(() => {
    if (variant === "mobile") inputRef.current?.focus();
  }, [variant]);

  // Click/tap outside closes the dropdown.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) closeDropdown();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [closeDropdown]);

  // Debounced live suggestions with a stale-response guard.
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      // Deferred to a macrotask — synchronous setState in an effect body
      // causes a cascading render (react-hooks/set-state-in-effect).
      const resetTimer = setTimeout(() => {
        setSuggestions([]);
        setLoading(false);
        closeDropdown();
      }, 0);
      return () => clearTimeout(resetTimer);
    }
    const id = ++requestId.current;
    // The spinner starts inside the debounced timer (async callback) so the
    // effect body never calls setState synchronously.
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await fetchSuggestions(trimmed);
        if (requestId.current !== id) return; // a newer keystroke won
        setSuggestions(result.products);
        setHighlighted(-1);
        setDropdownOpen(true);
      } finally {
        if (requestId.current === id) setLoading(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, closeDropdown]);

  const goToResults = useCallback(() => {
    const trimmed = query.trim();
    if (!trimmed) return;
    startNav(() => router.push(`/search?q=${encodeURIComponent(trimmed)}`));
    closeDropdown();
    onClose?.();
  }, [query, router, startNav, closeDropdown, onClose]);

  const openSuggestion = useCallback(
    (product: SearchSuggestion) => {
      startNav(() => router.push(`/products/${product.id}`));
      closeDropdown();
      onClose?.();
    },
    [router, startNav, closeDropdown, onClose],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      closeDropdown();
      onClose?.();
      inputRef.current?.blur();
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!suggestions.length) return;
      setHighlighted((current) => {
        const delta = event.key === "ArrowDown" ? 1 : -1;
        return (current + delta + suggestions.length) % suggestions.length;
      });
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const picked = highlighted >= 0 ? suggestions[highlighted] : undefined;
      if (picked) openSuggestion(picked);
      else goToResults();
    }
  };

  const showPanel =
    dropdownOpen && (loading || suggestions.length > 0 || query.trim().length > 0);

  return (
    <div ref={wrapRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          goToResults();
        }}
      >
        <label htmlFor={`${variant}-nav-search`} className="sr-only">
          Search products
        </label>
        <div
          className={`flex items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition focus-within:border-amber-600 dark:border-slate-700 dark:bg-slate-900 ${
            variant === "mobile" ? "px-3 py-3" : ""
          }`}
        >
          <Search className="ml-1 size-4 shrink-0 text-slate-400" />
          <input
            ref={inputRef}
            id={`${variant}-nav-search`}
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={
              variant === "mobile" ? "Search products…" : "Search watches, perfumes, shoes…"
            }
            className={`min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100 ${
              variant === "mobile" ? "px-2.5" : "px-3 py-2.5"
            }`}
          />
          {loading ? (
            <LoaderCircle className="mr-3 size-4 shrink-0 animate-spin text-amber-600 dark:text-amber-400" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="mr-2 rounded p-1 text-slate-400 transition hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Suggestions dropdown ------------------------------------------- */}
      {showPanel ? (
        <div
          className="absolute inset-x-0 top-full z-[110] mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
          role="listbox"
          aria-label="Search suggestions"
        >
          {loading && suggestions.length === 0 ? (
            <p className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
              <LoaderCircle className="size-4 animate-spin" /> Searching…
            </p>
          ) : null}

          {!loading && suggestions.length === 0 ? (
            <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
              No matches for “{query.trim()}” — press Enter to search everything.
            </p>
          ) : null}

          <ul>
            {suggestions.map((product, index) => (
              <li key={product.id}>
                <Link
                  href={`/products/${product.id}`}
                  role="option"
                  aria-selected={highlighted === index}
                  onClick={() => openSuggestion(product)}
                  onMouseEnter={() => setHighlighted(index)}
                  className={`flex items-center gap-3 px-3 py-2.5 transition ${
                    highlighted === index
                      ? "bg-amber-50 dark:bg-amber-950/50"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                    {product.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={product.image_url} alt="" className="size-full object-cover" />
                    ) : (
                      <PackageCheck
                        className="mx-auto size-5 text-slate-300 dark:text-slate-600"
                        strokeWidth={1}
                      />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold capitalize text-slate-900 dark:text-white">
                      {product.title}
                    </span>
                    <span className="mt-0.5 block text-xs font-bold text-amber-700 dark:text-amber-400">
                      {formatPKR(product.price)}
                    </span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-slate-300 dark:text-slate-600" />
                </Link>
              </li>
            ))}
          </ul>

          {query.trim() ? (
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={goToResults}
              className="flex w-full items-center justify-center gap-2 border-t border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-amber-700 transition hover:bg-amber-50 dark:border-slate-800 dark:text-amber-400 dark:hover:bg-amber-950/40"
            >
              See all results for “{query.trim()}”
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}