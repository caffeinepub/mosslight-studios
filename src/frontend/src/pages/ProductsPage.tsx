import { useState, useCallback } from 'react';
import { useGetProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import ProductSearch from '../components/ProductSearch';
import { Loader2 } from 'lucide-react';
import type { Product } from '../backend';

export default function ProductsPage() {
  const { data: products = [], isLoading } = useGetProducts();
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  const handleFilterChange = useCallback((filtered: Product[]) => {
    setFilteredProducts(filtered);
  }, []);

  const displayProducts = filteredProducts.length > 0 || products.length === 0 ? filteredProducts : products;
  const hasFilters = filteredProducts.length !== products.length;

  if (isLoading) {
    return (
      <div className="container py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-12">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl font-bold">Our Collection</h1>
          <p className="text-muted-foreground text-lg">
            Discover handcrafted treasures from Mosslight Studios
          </p>
        </div>

        {products.length > 0 && (
          <ProductSearch products={products} onFilterChange={handleFilterChange} />
        )}

        {products.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Showing {displayProducts.length} of {products.length} products
          </div>
        )}

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No products available at the moment. Check back soon!
            </p>
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No products match your filters. Try adjusting your search.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {displayProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
