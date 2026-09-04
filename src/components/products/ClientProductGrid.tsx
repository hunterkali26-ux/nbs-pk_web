"use client";

import { useState, useMemo, useCallback } from "react";
import { ProductCard } from "./ProductCard";
import { ProductSkeletonGrid } from "./ProductSkeleton";
import { EmptyState } from "./EmptyState";
import { FilterBar, type FilterState, defaultFilters } from "./FilterBar";
import type { Product } from "@/types/database";

interface ClientProductGridProps {
  products: Product[];
  categoryName?: string;
  loading?: boolean;
}

export function ClientProductGrid({ products, categoryName, loading = false }: ClientProductGridProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // Apply filters and sorting client-side
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Price filter
    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;
    if (min !== null) result = result.filter((p) => p.price >= min);
    if (max !== null) result = result.filter((p) => p.price <= max);

    // In-stock filter
    if (filters.inStockOnly) result = result.filter((p) => p.stock > 0);

    // Sorting
    switch (filters.sortBy) {
      case "price_asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price_desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "title":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "popular":
        // Sort by stock (lower stock = more popular assumption) then newest
        result.sort((a, b) => b.stock - a.stock || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    return result;
  }, [products, filters]);

  const clearFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = Boolean(filters.minPrice || filters.maxPrice || filters.inStockOnly || filters.sortBy !== "newest");

  if (loading) {
    return <ProductSkeletonGrid count={8} />;
  }

  return (
    <div className="flex gap-8">
      {/* Desktop Filter Sidebar */}
      <div className="hidden w-64 shrink-0 lg:block">
        <FilterBar filters={filters} onChange={setFilters} totalResults={filteredProducts.length} activeCategoryName={categoryName} />
      </div>

      {/* Product Grid */}
      <div className="min-w-0 flex-1">
        {/* Mobile filter + result count */}
        <div className="lg:hidden">
          <FilterBar filters={filters} onChange={setFilters} totalResults={filteredProducts.length} activeCategoryName={categoryName} />
        </div>

        {filteredProducts.length === 0 ? (
          <EmptyState
            hasFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            title="No products found"
            message={
              hasActiveFilters
                ? "Try adjusting your filters to see more results, or browse a different category."
                : `There are no products in this category yet. Check back soon or explore other categories.`
            }
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
