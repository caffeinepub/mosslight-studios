import { useGetProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import { Loader2 } from 'lucide-react';

export default function ProductsPage() {
  const { data: products = [], isLoading } = useGetProducts();

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

        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No products available at the moment. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

