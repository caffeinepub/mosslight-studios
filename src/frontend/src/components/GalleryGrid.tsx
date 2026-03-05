import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import type { GalleryItem, Product } from "../backend";
import { CommentParentType } from "../backend";
import { useGetProducts } from "../hooks/useProducts";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";

interface GalleryGridProps {
  items: GalleryItem[];
  isLoading?: boolean;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface TaggedProductsRowProps {
  taggedProductIds: string[];
  products: Product[];
  productsLoading: boolean;
}

function TaggedProductsRow({
  taggedProductIds,
  products,
  productsLoading,
}: TaggedProductsRowProps) {
  if (taggedProductIds.length === 0) return null;

  const taggedProducts = taggedProductIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => !!p);

  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center gap-1.5">
        <ShoppingBag className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">
          Shop This Post
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {productsLoading
          ? taggedProductIds.map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 min-w-[120px]"
              >
                <Skeleton className="h-8 w-8 rounded shrink-0" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))
          : taggedProducts.map((product, idx) => {
              const imageUrl = product.images[0]?.getDirectURL();
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2 hover:border-primary/40 transition-colors"
                  data-ocid={`gallery.card.${idx + 1}`}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="h-9 w-9 rounded object-cover shrink-0"
                    />
                  ) : (
                    <div className="h-9 w-9 rounded bg-muted flex items-center justify-center shrink-0">
                      <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate max-w-[100px] leading-tight">
                      {product.name}
                    </p>
                    {!product.hasVariants && (
                      <p className="text-xs text-primary font-semibold">
                        ${Number(product.price).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Link
                    to="/products/$id"
                    params={{ id: product.id }}
                    data-ocid={`gallery.secondary_button.${idx + 1}`}
                  >
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2.5 text-xs shrink-0"
                    >
                      Shop
                    </Button>
                  </Link>
                </div>
              );
            })}
        {/* Show placeholders for tagged ids that didn't resolve (product deleted etc.) */}
        {!productsLoading &&
          taggedProductIds
            .filter((id) => !products.find((p) => p.id === id))
            .map((id) => (
              <div
                key={id}
                className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2"
              >
                <div className="h-9 w-9 rounded bg-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Product unavailable
                  </p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
}

export default function GalleryGrid({ items, isLoading }: GalleryGridProps) {
  const { data: products = [], isLoading: productsLoading } = useGetProducts();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(["a", "b", "c", "d"] as const).map((id) => (
          <Card key={`skeleton-gallery-${id}`} className="overflow-hidden">
            <Skeleton className="h-72 w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20" data-ocid="gallery.empty_state">
        <p className="text-muted-foreground text-lg">
          No gallery items yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {items.map((item, itemIdx) => (
        <Card
          key={item.id}
          className="overflow-hidden"
          data-ocid={`gallery.item.${itemIdx + 1}`}
        >
          <div className="relative overflow-hidden aspect-video bg-muted">
            <img
              src={item.image.getDirectURL()}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="p-5 space-y-3">
            <h3 className="font-serif font-semibold text-xl">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDate(item.createdAt)}
            </p>

            {/* Tagged products — "Shop This Post" */}
            {item.taggedProductIds && item.taggedProductIds.length > 0 && (
              <TaggedProductsRow
                taggedProductIds={item.taggedProductIds}
                products={products}
                productsLoading={productsLoading}
              />
            )}

            <CommentList
              parentId={item.id}
              parentType={CommentParentType.galleryItem}
            />
            <CommentForm
              parentId={item.id}
              parentType={CommentParentType.galleryItem}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
