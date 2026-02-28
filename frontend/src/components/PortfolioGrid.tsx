import { PortfolioItem } from '../backend';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface PortfolioGridProps {
  items: PortfolioItem[];
  isLoading?: boolean;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
}

export default function PortfolioGrid({ items, isLoading }: PortfolioGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="h-64 w-full" />
            <CardContent className="p-4 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">
          No portfolio items yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
          <div className="relative overflow-hidden aspect-square bg-muted">
            <img
              src={item.image.getDirectURL()}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-serif font-semibold text-lg leading-tight">{item.title}</h3>
              <Badge variant="secondary" className="shrink-0 text-xs">
                {item.category}
              </Badge>
            </div>
            {item.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
