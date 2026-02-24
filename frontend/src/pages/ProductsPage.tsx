import { useState, useCallback, useMemo } from 'react';
import { useGetProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import ProductSearch from '../components/ProductSearch';
import ProductFilterSidebar, { type ActiveFilters, PRICE_RANGES } from '../components/ProductFilterSidebar';
import { Loader2 } from 'lucide-react';
import type { Product } from '../backend';

const EMPTY_FILTERS: ActiveFilters = {
  categories: [],
  priceRanges: [],
  colors: [],
  sizes: [],
};

export default function ProductsPage() {
  const { data: products = [], isLoading } = useGetProducts();

  // Products after text/price search (from ProductSearch)
  const [searchFiltered, setSearchFiltered] = useState<Product[]>([]);
  const [hasSearchFilter, setHasSearchFilter] = useState(false);

  // Sidebar attribute filters
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS);

  const handleSearchFilterChange = useCallback(
    (filtered: Product[]) => {
      setSearchFiltered(filtered);
      setHasSearchFilter(filtered.length !== products.length);
    },
    [products.length]
  );

  // Apply sidebar filters on top of search-filtered products
  const displayProducts = useMemo(() => {
    const base = hasSearchFilter ? searchFiltered : products;

    const { categories, priceRanges, colors, sizes } = activeFilters;
    const hasAnyFilter =
      categories.length > 0 || priceRanges.length > 0 || colors.length > 0 || sizes.length > 0;

    if (!hasAnyFilter) return base;

    return base.filter((product) => {
      // Category: OR within type
      if (categories.length > 0) {
        const productCats = product.categories || [];
        if (!categories.some((c) => productCats.includes(c))) return false;
      }

      // Price range: OR within type
      if (priceRanges.length > 0) {
        const priceUSD = Number(product.price) / 100;
        const matchesPrice = priceRanges.some((rangeId) => {
          const range = PRICE_RANGES.find((r) => r.id === rangeId);
          if (!range) return false;
          return priceUSD >= range.min && priceUSD < range.max;
        });
        if (!matchesPrice) return false;
      }

      // Color: OR within type
      if (colors.length > 0) {
        const productColors = product.colors || [];
        if (!colors.some((c) => productColors.includes(c))) return false;
      }

      // Size: OR within type
      if (sizes.length > 0) {
        const productSizes = product.sizes || [];
        if (!sizes.some((s) => productSizes.includes(s))) return false;
      }

      return true;
    });
  }, [products, searchFiltered, hasSearchFilter, activeFilters]);

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Our Collection</h1>
          <p className="text-muted-foreground text-lg">
            Discover handcrafted treasures from Mosslight Studios
          </p>
        </div>

        {products.length > 0 && (
          <ProductSearch products={products} onFilterChange={handleSearchFilterChange} />
        )}

        {/* Mobile filter toggle + count */}
        {products.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <ProductFilterSidebar
              products={products}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
            />
            <span className="text-sm text-muted-foreground lg:hidden">
              {displayProducts.length} of {products.length} products
            </span>
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No products available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="flex gap-8 items-start">
            {/* Desktop sidebar */}
            <ProductFilterSidebar
              products={products}
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
            />

            {/* Product grid */}
            <div className="flex-1 min-w-0 space-y-4">
              <div className="hidden lg:block text-sm text-muted-foreground">
                Showing {displayProducts.length} of {products.length} products
              </div>

              {displayProducts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground text-lg">
                    No products match your filters. Try adjusting your search or filters.
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {displayProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
