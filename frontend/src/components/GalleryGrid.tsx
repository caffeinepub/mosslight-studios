import { GalleryItem } from '../backend';
import { CommentParentType } from '../backend';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import CommentList from './CommentList';
import CommentForm from './CommentForm';

interface GalleryGridProps {
  items: GalleryItem[];
  isLoading?: boolean;
}

function formatDate(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function GalleryGrid({ items, isLoading }: GalleryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
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
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">
          No gallery items yet. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {items.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="relative overflow-hidden aspect-video bg-muted">
            <img
              src={item.image.getDirectURL()}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="p-5 space-y-2">
            <h3 className="font-serif font-semibold text-xl">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-muted-foreground">{item.description}</p>
            )}
            <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>

            <CommentList parentId={item.id} parentType={CommentParentType.galleryItem} />
            <CommentForm parentId={item.id} parentType={CommentParentType.galleryItem} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
