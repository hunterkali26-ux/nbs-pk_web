"use client";

import { useState, useEffect, useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";

export interface FilterState {
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
  sortBy: "newest" | "price_asc" | "price_desc" | "popular" | "title";
}

export const defaultFilters: FilterState = {
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
  sortBy: "newest",
};

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  totalResults: number;
  activeCategoryName?: string;
}

const sortOptions = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
  { value: "title", label: "A-Z" },
] as const;

interface SubComponentProps {
  filters: FilterState;
  onChange: (f: FilterState) => void;
}

interface PriceRangeProps extends SubComponentProps {
  expanded: boolean;
  onToggle: () => void;
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onLocalChange: (patch: Partial<FilterState>) => void;
  onApply: () => void;
  onReset: () => void;
}

export function FilterBar({ filters, onChange, totalResults, activeCategoryName }: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [priceExpanded, setPriceExpanded] = useState(true);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);

  useEffect(() => { setLocalFilters(filters); }, [filters]);

  const updateLocal = useCallback((patch: Partial<FilterState>) => {
    setLocalFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const applyFilters = useCallback(() => { onChange(localFilters); setMobileOpen(false); }, [localFilters, onChange]);
  const resetFilters = useCallback(() => { setLocalFilters(defaultFilters); onChange(defaultFilters); setMobileOpen(false); }, [onChange]);

  const activeFilterCount = [filters.minPrice, filters.maxPrice, filters.inStockOnly, filters.sortBy !== "newest" ? filters.sortBy : ""].filter(Boolean).length;

  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-24 space-y-6 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">Filters</h2>
            {activeFilterCount > 0 && (
              <button type="button" onClick={resetFilters} className="flex items-center gap-1 text-xs font-medium text-slate-400 transition hover:text-emerald-600 dark:hover:text-emerald-400">
                <RotateCcw className="size-3" />Reset
              </button>
            )}
          </div>
          <FilterSortSelect filters={filters} onChange={onChange} />
          <FilterPriceRange filters={filters} onChange={onChange} expanded={priceExpanded} onToggle={() => setPriceExpanded(!priceExpanded)} />
          <FilterStockToggle filters={filters} onChange={onChange} />
        </div>
      </aside>
      <div className="mb-4 flex items-center justify-between lg:hidden">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-900 dark:text-white">{totalResults}</span> {totalResults === 1 ? "product" : "products"}
          {activeCategoryName && <span className="ml-1 capitalize">in <span className="font-semibold text-emerald-700 dark:text-emerald-400">{activeCategoryName}</span></span>}
        </p>
        <button type="button" onClick={() => setMobileOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
          <SlidersHorizontal className="size-4" />Filters
          {activeFilterCount > 0 && <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-[10px] font-bold text-white">{activeFilterCount}</span>}
        </button>
      </div>
      <FilterDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} filters={localFilters} onLocalChange={updateLocal} onApply={applyFilters} onReset={resetFilters} />
    </>
  );
}

/* ─── Sub-components ──────────────────────────────────────────────── */

const FilterSortSelect: React.FC<SubComponentProps> = ({ filters, onChange }) => (
  <div>
    <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sort By</label>
    <select value={filters.sortBy} onChange={(e) => onChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 transition focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
      {sortOptions.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
    </select>
  </div>
);

const FilterPriceRange: React.FC<PriceRangeProps> = ({ filters, onChange, expanded, onToggle }) => (
  <div>
    <button type="button" onClick={onToggle} className="flex w-full items-center justify-between">
      <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price Range</span>
      {expanded ? <ChevronUp className="size-3.5 text-slate-400" /> : <ChevronDown className="size-3.5 text-slate-400" />}
    </button>
    {expanded && (
      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Rs.</span>
          <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => onChange({ ...filters, minPrice: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
        </div>
        <span className="text-xs text-slate-400">—</span>
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">Rs.</span>
          <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })} className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-8 pr-2 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
        </div>
      </div>
    )}
  </div>
);

const FilterStockToggle: React.FC<SubComponentProps> = ({ filters, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">In Stock Only</span>
    <button type="button" role="switch" aria-checked={filters.inStockOnly} onClick={() => onChange({ ...filters, inStockOnly: !filters.inStockOnly })} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${filters.inStockOnly ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"}`}>
      <span className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${filters.inStockOnly ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  </div>
);


const FilterDrawer: React.FC<DrawerProps> = ({ open, onClose, filters, onLocalChange, onApply, onReset }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-x-0 bottom-0 max-h-[85vh] rounded-t-3xl bg-white pt-4 shadow-2xl dark:bg-slate-900">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="flex items-center justify-between border-b border-slate-100 px-6 pb-4 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Filters</h2>
          <button type="button" onClick={onClose} className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"><X className="size-4" /></button>
        </div>
        <div className="space-y-6 overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(85vh - 140px)" }}>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Sort By</label>
            <div className="grid grid-cols-2 gap-2">
              {sortOptions.map((opt) => (
                <button key={opt.value} type="button" onClick={() => onLocalChange({ sortBy: opt.value as FilterState["sortBy"] })} className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${filters.sortBy === opt.value ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-400" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300"}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Price Range (PKR)</label>
            <div className="flex items-center gap-2">
              <input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => onLocalChange({ minPrice: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
              <span className="text-sm text-slate-400">—</span>
              <input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => onLocalChange({ maxPrice: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200" />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3.5 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">In Stock Only</span>
            <button type="button" role="switch" aria-checked={filters.inStockOnly} onClick={() => onLocalChange({ inStockOnly: !filters.inStockOnly })} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${filters.inStockOnly ? "bg-emerald-600" : "bg-slate-200 dark:bg-slate-700"}`}>
              <span className={`inline-block size-3.5 rounded-full bg-white shadow-sm transition-transform ${filters.inStockOnly ? "translate-x-4.5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
        <div className="border-t border-slate-100 px-6 py-4 dark:border-slate-800">
          <div className="flex gap-3">
            <button type="button" onClick={onReset} className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Reset</button>
            <button type="button" onClick={onApply} className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]">Apply Filters</button>
          </div>
        </div>
      </div>
    </div>
  );
};
