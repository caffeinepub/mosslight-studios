import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SocialMediaContent } from '../backend';

interface GalleryItemProps {
  item: SocialMediaContent;
}

export default function GalleryItem({ item }: GalleryItemProps) {
  const timestamp = new Date(Number(item.timestamp) / 1000000).toLocaleDateString();
  const hasMedia = item.media.length > 0;
  const mediaUrl = hasMedia ? item.media[0].getDirectURL() : null;

  return (
    <Card className="overflow-hidden hover:shadow-elegant transition-shadow">
      {mediaUrl && (
        <CardContent className="p-0">
          <img
            src={mediaUrl}
            alt="Gallery content"
            className="w-full h-64 object-cover"
          />
        </CardContent>
      )}
      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{hasMedia ? 'Media' : 'Text'}</Badge>
          <span className="text-sm text-muted-foreground">{timestamp}</span>
        </div>
        {item.content && (
          <p className="text-sm whitespace-pre-wrap">{item.content}</p>
        )}
      </CardFooter>
    </Card>
  );
}

